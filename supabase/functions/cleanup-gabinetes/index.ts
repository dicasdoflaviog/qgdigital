/**
 * cleanup-gabinetes — Remove gabinetes duplicados do banco.
 *
 * Lógica:
 * 1. Agrupa gabinetes por (nome_base, cidade) onde nome_base ignora:
 *    - Prefixos "Gabinete " / "Vereador "
 *    - Sufixos " - PARTIDO"
 * 2. Dentro de cada grupo, mantém o gabinete_id que tem foto (avatar_url / foto_oficial_url)
 * 3. Deleta os demais usuários de auth (cascade apaga profiles, gabinete_config, etc.)
 * 4. Recria a view resumo_gabinetes_por_cidade com nome limpo (split_part)
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function normalizeName(n: string): string {
  return n
    .split(" - ")[0]
    .replace(/^gabinete\s+/i, "")
    .replace(/^vereador\s+/i, "")
    .trim()
    .toLowerCase();
}

Deno.serve(async () => {
  try {
    // 1. Buscar todos os gabinetes com info de foto
    const { data: configs, error: cfgErr } = await supabase
      .from("gabinete_config")
      .select("gabinete_id, nome_mandato, cidade_estado, foto_oficial_url");
    if (cfgErr) throw cfgErr;

    const { data: profiles, error: profErr } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url");
    if (profErr) throw profErr;

    const profileMap = new Map(profiles!.map((p) => [p.id, p]));

    // 2. Montar lista completa com nome normalizado
    type GabItem = {
      gabinete_id: string;
      nomeBase: string;
      cidade: string;
      temFoto: boolean;
    };

    const items: GabItem[] = configs!.map((c) => {
      const prof = profileMap.get(c.gabinete_id);
      const rawName = c.nome_mandato
        ? c.nome_mandato.split(" - ")[0]
        : (prof?.full_name ?? "");
      return {
        gabinete_id: c.gabinete_id,
        nomeBase: normalizeName(rawName),
        cidade: (c.cidade_estado ?? "").split(" - ")[0].trim(),
        temFoto: !!(prof?.avatar_url || c.foto_oficial_url),
      };
    });

    // 3. Agrupar por (nomeBase, cidade)
    const groups = new Map<string, GabItem[]>();
    items.forEach((item) => {
      const key = `${item.nomeBase}::${item.cidade}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    });

    // 4. Identificar IDs a deletar (grupos com > 1 membro)
    const toDelete: string[] = [];
    let groupsWithDups = 0;

    groups.forEach((members) => {
      if (members.length <= 1) return;
      groupsWithDups++;

      // Ordenar: com foto primeiro, depois por id (estabilidade)
      members.sort((a, b) => {
        if (a.temFoto && !b.temFoto) return -1;
        if (!a.temFoto && b.temFoto) return 1;
        return a.gabinete_id.localeCompare(b.gabinete_id);
      });

      // Manter o primeiro (com foto), deletar os demais
      members.slice(1).forEach((m) => toDelete.push(m.gabinete_id));
    });

    // 5. Deletar duplicatas (cascade via RLS/FK apaga profiles, gabinete_config, etc.)
    let deletedCount = 0;
    for (const userId of toDelete) {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) {
        console.error(`Erro ao deletar user ${userId}:`, error.message);
      } else {
        deletedCount++;
      }
    }

    // 6. Aplicar a migration da view (nome sem partido)
    const viewSQL = `
      CREATE OR REPLACE VIEW public.resumo_gabinetes_por_cidade AS
      SELECT
        gc.gabinete_id,
        COALESCE(
          NULLIF(split_part(gc.nome_mandato, ' - ', 1), ''),
          p.full_name
        ) AS nome_vereador,
        CASE
          WHEN gc.nome_mandato LIKE '% - %'
          THEN split_part(gc.nome_mandato, ' - ', 2)
          ELSE NULL
        END AS partido,
        COALESCE(
          NULLIF(split_part(gc.cidade_estado, ' - ', 1), ''),
          gc.cidade_estado,
          ''
        ) AS cidade,
        COUNT(DISTINCT e.id) AS total_eleitores,
        COUNT(DISTINCT CASE WHEN LOWER(d.status) IN ('pendente', 'em andamento', 'em_andamento') THEN d.id END) AS demandas_pendentes,
        COUNT(DISTINCT CASE WHEN LOWER(d.status) IN ('resolvida', 'ofício gerado', 'oficio gerado') THEN d.id END) AS demandas_resolvidas,
        COUNT(DISTINCT d.id) AS total_demandas
      FROM public.gabinete_config gc
      JOIN public.profiles p ON p.id = gc.gabinete_id
      LEFT JOIN public.eleitores e ON e.gabinete_id = gc.gabinete_id AND e.excluido = false
      LEFT JOIN public.demandas d ON d.gabinete_id = gc.gabinete_id
      GROUP BY gc.gabinete_id, gc.nome_mandato, gc.cidade_estado, p.full_name;

      GRANT SELECT ON public.resumo_gabinetes_por_cidade TO authenticated;
    `;

    const { error: viewErr } = await supabase.rpc("exec_sql" as any, { sql: viewSQL });
    const viewResult = viewErr
      ? `View não recriada via RPC (${viewErr.message}) — aplicar manualmente no SQL Editor`
      : "View recriada com sucesso";

    return new Response(
      JSON.stringify({
        ok: true,
        groupsWithDups,
        toDeleteCount: toDelete.length,
        deletedCount,
        viewResult,
        deletedIds: toDelete,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
