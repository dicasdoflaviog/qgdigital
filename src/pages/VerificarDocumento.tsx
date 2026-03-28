import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Shield, Clock, User, MapPin, FileText, Hash, Loader2, AlertTriangle } from "lucide-react";

interface DocumentoVerificado {
  protocolo: string;
  tipo_doc: string;
  nome_vereador: string | null;
  cidade_estado: string | null;
  hash_sha256: string;
  dados_resumo: Record<string, unknown>;
  gerado_em: string;
  valido: boolean;
  motivo_invalido: string | null;
}

const TIPO_LABELS: Record<string, string> = {
  oficio: "Ofício Oficial",
  relatorio_transparencia: "Relatório de Transparência",
  relatorio_estrategico: "Relatório Estratégico",
  prestacao_contas: "Prestação de Contas Pública",
  relatorio_inteligencia: "Relatório de Inteligência",
  relatorio_cidade: "Relatório de Cidade",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ valido }: { valido: boolean }) {
  if (valido) {
    return (
      <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-6 py-4">
        <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
        <div>
          <p className="text-green-800 font-medium text-lg">Documento autêntico</p>
          <p className="text-green-600 text-sm">Emitido e registrado pelo QG Digital</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-6 py-4">
      <XCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
      <div>
        <p className="text-red-800 font-medium text-lg">Documento inválido</p>
        <p className="text-red-600 text-sm">Este documento foi marcado como inválido pelo gabinete</p>
      </div>
    </div>
  );
}

export default function VerificarDocumento() {
  const { protocolo } = useParams<{ protocolo: string }>();
  const [doc, setDoc] = useState<DocumentoVerificado | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!protocolo) return;
    setLoading(true);

    supabase
      .from("documentos_emitidos" as any)
      .select("protocolo, tipo_doc, nome_vereador, cidade_estado, hash_sha256, dados_resumo, gerado_em, valido, motivo_invalido")
      .eq("protocolo", protocolo.toUpperCase())
      .single()
      .then(({ data, error }) => {
        setLoading(false);
        if (error || !data) {
          setNotFound(true);
        } else {
          setDoc(data as DocumentoVerificado);
        }
      });
  }, [protocolo]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-slate-900 font-medium text-sm">QG Digital</p>
            <p className="text-slate-500 text-xs">Verificação de autenticidade</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-8 max-w-xl mx-auto w-full">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="text-slate-500 text-sm">Verificando documento...</p>
          </div>
        )}

        {!loading && notFound && (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
            <div>
              <p className="text-slate-900 font-medium text-xl">Protocolo não encontrado</p>
              <p className="text-slate-500 text-sm mt-1 max-w-sm">
                O protocolo <span className="font-mono font-medium text-slate-700">"{protocolo}"</span> não existe
                nos registros do QG Digital. O documento pode ser inválido ou falsificado.
              </p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm font-medium">Não é possível confirmar a autenticidade</p>
            </div>
          </div>
        )}

        {!loading && doc && (
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-slate-500 text-sm mb-1">Protocolo</p>
              <p className="font-mono text-2xl font-medium text-slate-900">{doc.protocolo}</p>
            </div>

            <StatusBadge valido={doc.valido} />

            {doc.motivo_invalido && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-amber-800 text-sm">
                  <span className="font-medium">Motivo: </span>{doc.motivo_invalido}
                </p>
              </div>
            )}

            {/* Document info */}
            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3.5">
                <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Tipo de documento</p>
                  <p className="text-sm font-medium text-slate-900">
                    {TIPO_LABELS[doc.tipo_doc] ?? doc.tipo_doc}
                  </p>
                </div>
              </div>

              {doc.nome_vereador && (
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">Emitido pelo gabinete</p>
                    <p className="text-sm font-medium text-slate-900">Vereador(a) {doc.nome_vereador}</p>
                  </div>
                </div>
              )}

              {doc.cidade_estado && (
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">Cidade</p>
                    <p className="text-sm font-medium text-slate-900">{doc.cidade_estado}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 px-4 py-3.5">
                <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Data de emissão</p>
                  <p className="text-sm font-medium text-slate-900">{formatDate(doc.gerado_em)}</p>
                </div>
              </div>
            </div>

            {/* Hash */}
            <div className="bg-slate-900 rounded-2xl px-4 py-4">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="w-4 h-4 text-slate-400" />
                <p className="text-slate-400 text-xs font-medium">Hash SHA-256 (integridade criptográfica)</p>
              </div>
              <p className="font-mono text-xs text-green-400 break-all leading-relaxed">
                {doc.hash_sha256}
              </p>
            </div>

            {/* Footer note */}
            <p className="text-center text-xs text-slate-400 leading-relaxed">
              Este documento foi gerado e registrado pelo sistema QG Digital.
              A presença deste protocolo nos registros confirma sua autenticidade.
              Para dúvidas, entre em contato com o gabinete emitente.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-4 py-4 text-center">
        <p className="text-xs text-slate-400">
          Verificação de autenticidade · <span className="font-medium">QG Digital</span> · Sistema CRM Eleitoral
        </p>
      </footer>
    </div>
  );
}
