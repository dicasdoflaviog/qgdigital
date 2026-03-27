# SPEC — Multitenancy Individual & RLS

> **Baseado em:** PRD-multitenancy-rls.md | **Data:** 2026-03-27

---

## Ordem de Implementação

```
MULTI-01  →  MULTI-02  →  MULTI-03  →  MULTI-04  →  MULTI-05
(created_by)  (RLS update)  (VIEW N4)  (hooks)   (frontend guard)
```

---

## MULTI-01 — Migration: adicionar `created_by` + trigger + backfill

**Arquivo:** `supabase/migrations/20260327200000_multitenancy_created_by.sql`

```sql
-- 1. Adiciona coluna created_by
ALTER TABLE public.eleitores
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Backfill: registros que têm assessor_id → mapear para user_id
UPDATE public.eleitores e
SET created_by = a.user_id
FROM public.assessores a
WHERE e.assessor_id = a.id
  AND e.created_by IS NULL;

-- 3. Trigger: preenche created_by automaticamente em novos INSERTs
CREATE OR REPLACE FUNCTION public.set_created_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_created_by ON public.eleitores;
CREATE TRIGGER trg_set_created_by
  BEFORE INSERT ON public.eleitores
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

-- 4. Índice para performance nas queries RLS
CREATE INDEX IF NOT EXISTS idx_eleitores_created_by ON public.eleitores(created_by);
CREATE INDEX IF NOT EXISTS idx_eleitores_gabinete_created ON public.eleitores(gabinete_id, created_by);
```

---

## MULTI-02 — Migration: atualizar políticas RLS da tabela `eleitores`

**Arquivo:** `supabase/migrations/20260327200001_rls_eleitores_individual.sql`

```sql
-- Remove políticas antigas de N1 e N2
DROP POLICY IF EXISTS "Assessores can read their own eleitores" ON public.eleitores;
DROP POLICY IF EXISTS "Assessores can insert eleitores" ON public.eleitores;
DROP POLICY IF EXISTS "Assessores can update their own eleitores" ON public.eleitores;
DROP POLICY IF EXISTS "Secretaria can read gabinete eleitores" ON public.eleitores;
DROP POLICY IF EXISTS "lider_politico can read all eleitores" ON public.eleitores;

-- N1 (assessor): vê apenas o que ele cadastrou
CREATE POLICY "N1 - assessor vê apenas own eleitores"
  ON public.eleitores FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'assessor'::app_role)
    AND created_by = auth.uid()
  );

CREATE POLICY "N1 - assessor pode inserir eleitores"
  ON public.eleitores FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'assessor'::app_role)
    AND gabinete_id = get_user_gabinete_id()
  );

CREATE POLICY "N1 - assessor pode atualizar own eleitores"
  ON public.eleitores FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'assessor'::app_role)
    AND created_by = auth.uid()
  );

-- N2 (secretaria): vê apenas o que ela cadastrou
CREATE POLICY "N2 - secretaria vê apenas own eleitores"
  ON public.eleitores FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'secretaria'::app_role)
    AND created_by = auth.uid()
  );

CREATE POLICY "N2 - secretaria pode inserir eleitores"
  ON public.eleitores FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'secretaria'::app_role)
    AND gabinete_id = get_user_gabinete_id()
  );

CREATE POLICY "N2 - secretaria pode atualizar own eleitores"
  ON public.eleitores FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'secretaria'::app_role)
    AND created_by = auth.uid()
  );

-- N3 (admin/vereador): vê todos do gabinete (sem alteração no comportamento)
-- Políticas existentes de admin já cobrem isso — verificar e manter

-- N4 (lider_politico): acesso a linhas, mas SEM dados sensíveis (via VIEW, MULTI-03)
-- Bloquear acesso à tabela base para N4 — N4 usará apenas a view mascarada
DROP POLICY IF EXISTS "lider_politico can read all" ON public.eleitores;
-- N4 NÃO terá política SELECT na tabela base → acesso apenas via view

-- N5 (super_admin): mantém acesso total irrestrito (política existente — manter)
```

---

## MULTI-03 — Migration: VIEW mascarada para N4

**Arquivo:** `supabase/migrations/20260327200002_eleitores_n4_view.sql`

```sql
-- View de segurança: mascara campos sensíveis para N4
-- N4 vê: id, nome, bairro_masked, cidade_masked, situacao, gabinete_id,
--         sexo, created_at, latitude, longitude
-- N4 NÃO vê: whatsapp, data_nascimento, bairro real, cidade real

CREATE OR REPLACE VIEW public.eleitores_n4_view
WITH (security_barrier = true)
AS
SELECT
  id,
  nome,
  '***'::text                    AS whatsapp,        -- mascarado
  NULL::date                     AS data_nascimento,  -- mascarado
  situacao,
  gabinete_id,
  is_leader,
  excluido,
  sexo,
  created_at,
  updated_at,
  latitude,
  longitude,
  image_urls,
  -- endereço mascarado
  CASE WHEN LENGTH(bairro) > 0
    THEN SUBSTRING(bairro, 1, 2) || '***'
    ELSE ''
  END                            AS bairro,          -- parcialmente mascarado
  NULL::text                     AS cidade           -- mascarado
FROM public.eleitores
WHERE excluido = false
  AND get_user_role_level() = 4;  -- só retorna dados quando é N4

-- Permissão para usuários autenticados acessarem a view
GRANT SELECT ON public.eleitores_n4_view TO authenticated;

-- RLS na view (segurança extra — security_barrier já garante)
-- N4 acessa via esta view no frontend (useVoterDemographics para N4)
```

---

## MULTI-04 — Atualizar hooks do frontend

**Arquivos afetados:**
- `src/hooks/useVoterDemographics.ts`
- `src/hooks/useVoters.ts` (ou similar)
- `src/hooks/useVotersForMap.ts`

### `useVoterDemographics.ts` — quando N4, não selecionar campos sensíveis

```typescript
// Adicionar parâmetro roleLevel
export function useVoterDemographics({ gabineteId, sexo, faixaEtaria, situacao, roleLevel }) {
  const query = useQuery({
    queryFn: async () => {
      // N4 usa view mascarada — não seleciona campos sensíveis
      if (roleLevel === 4) {
        // Para N4, buscar apenas agregados — sem selecionar campos sensíveis individualmente
        // A view n4_view já mascara, mas para demographics basta contar
        let q = supabase
          .from("eleitores")
          .select("id, sexo, situacao, gabinete_id, created_at")  // sem data_nascimento, bairro, cidade
          .eq("excluido", false);
        // N4 vê todos os gabinetes
        return q;
      }

      // N1/N2/N3/N5: comportamento atual (RLS cuida do filtro)
      let q = supabase
        .from("eleitores")
        .select("id, sexo, data_nascimento, bairro, situacao, gabinete_id, cidade, created_at")
        .eq("excluido", false);

      if (gabineteId) q = q.eq("gabinete_id", gabineteId);
      return q;
    }
  });
}
```

### `useVoters.ts` / `useVotersPaginated.ts` — N4 não deve listar eleitores individuais

```typescript
// Se roleLevel === 4, retornar lista vazia (N4 usa perfil eleitoral agregado, não lista)
if (roleLevel === 4) {
  return { voters: [], total: 0, isLoading: false };
}
```

---

## MULTI-05 — Guard no frontend: bloquear N4 em páginas de listagem

**Arquivo:** `src/pages/Eleitores.tsx` (ou similar)

```typescript
const { roleLevel } = useAuth();

// N4 não tem acesso à lista individual de eleitores
if (roleLevel === 4) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center px-6">
      <ShieldIcon className="w-10 h-10 text-slate-300" />
      <p className="text-sm font-medium text-slate-600">Acesso restrito</p>
      <p className="text-xs text-slate-400">
        Como líder político, você tem acesso apenas às métricas agregadas dos gabinetes.
      </p>
    </div>
  );
}
```

---

## Validação e Testes

- [ ] N1 logado: vê apenas seus eleitores cadastrados
- [ ] N2 logado: vê apenas seus eleitores cadastrados  
- [ ] N3 logado: vê todos do gabinete
- [ ] N4 logado: não acessa lista de eleitores, vê métricas no Perfil Eleitoral (sem campos sensíveis)
- [ ] N5 logado: acesso total irrestrito
- [ ] Registro novo: `created_by` preenchido automaticamente
- [ ] Backfill: registros antigos com `assessor_id` têm `created_by` preenchido
- [ ] Registros órfãos: N1/N2 não veem, N3 vê (marcados como "sem responsável")

---

## Impacto em outras telas

| Tela | N1/N2 | N3 | N4 |
|------|-------|----|----|
| Lista de eleitores | Vê apenas os seus | Vê todos do gabinete | Bloqueado |
| Mapa de calor | Pontos dos seus eleitores | Todos do gabinete | Todos (sem dados sensíveis) |
| Perfil eleitoral (demographics) | Stats dos seus | Stats do gabinete | Stats agregados de todos |
| Dashboard | Seus KPIs | KPIs do gabinete | inalterado |

---

## Arquivos a criar/modificar

| Arquivo | Ação |
|---------|------|
| `supabase/migrations/20260327200000_multitenancy_created_by.sql` | CRIAR |
| `supabase/migrations/20260327200001_rls_eleitores_individual.sql` | CRIAR |
| `supabase/migrations/20260327200002_eleitores_n4_view.sql` | CRIAR |
| `src/hooks/useVoterDemographics.ts` | MODIFICAR |
| `src/hooks/useVoters.ts` | MODIFICAR |
| `src/hooks/useVotersForMap.ts` | MODIFICAR |
| `src/pages/Eleitores.tsx` | MODIFICAR (guard N4) |
