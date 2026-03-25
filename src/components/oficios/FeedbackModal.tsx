import { useState } from "react";
import { ArrowRight, Check, MessageSquare, Phone, Save, Sparkles, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Oficio, OFICIO_STATUS_CONFIG, OficioStatus } from "@/data/oficiosData";
import { eleitores } from "@/data/mockData";

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  oficio: Oficio;
  fromStatus: OficioStatus;
  toStatus: OficioStatus;
  onConfirmSend: (message: string) => void;
  onSaveOnly: () => void;
}

function gerarMensagemMock(oficio: Oficio, toStatus: OficioStatus): string {
  const vereador = "Vereador Silva";
  const statusLabel = OFICIO_STATUS_CONFIG[toStatus].label;

  if (toStatus === "resolvido") {
    return `Olá! Boas notícias do gabinete do ${vereador}! 🎉\n\nO pedido sobre "${oficio.titulo}" no bairro ${oficio.bairro} foi *RESOLVIDO*!\n\n${oficio.resposta ? `Resultado: ${oficio.resposta}\n\n` : ""}Protocolo: ${oficio.protocolo || oficio.numero}\n\nSeguimos trabalhando pelo nosso bairro! Um abraço. 🤝`;
  }

  if (toStatus === "respondido") {
    return `Olá! Aqui é do gabinete do ${vereador}. 📋\n\nTemos uma atualização sobre o pedido "${oficio.titulo}" no bairro ${oficio.bairro}.\n\nStatus atual: *${statusLabel}*\n${oficio.resposta ? `\nResposta da Prefeitura: ${oficio.resposta}\n` : ""}\nProtocolo: ${oficio.protocolo || oficio.numero}\n\nContinuaremos acompanhando até a solução final! 💪`;
  }

  return `Olá! Informamos que o pedido "${oficio.titulo}" (${oficio.bairro}) avançou para: *${statusLabel}*.\n\nProtocolo: ${oficio.protocolo || oficio.numero}\n\nGabinete do ${vereador}. 🏛️`;
}

function getEleitoresVinculados(oficio: Oficio) {
  return eleitores.filter((e) => e.bairro === oficio.bairro).slice(0, 3);
}

function formatWhatsAppNumber(num: string) {
  const clean = num.replace(/\D/g, "");
  if (clean.length === 13) return `+${clean.slice(0, 2)} (${clean.slice(2, 4)}) ${clean.slice(4, 9)}-${clean.slice(9)}`;
  return num;
}

export function FeedbackModal({
  open,
  onOpenChange,
  oficio,
  fromStatus,
  toStatus,
  onConfirmSend,
  onSaveOnly,
}: FeedbackModalProps) {
  const [message, setMessage] = useState(() => gerarMensagemMock(oficio, toStatus));
  const [isGenerating, setIsGenerating] = useState(false);
  const eleitoresVinculados = getEleitoresVinculados(oficio);

  const fromCfg = OFICIO_STATUS_CONFIG[fromStatus];
  const toCfg = OFICIO_STATUS_CONFIG[toStatus];

  const handleRegenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setMessage(gerarMensagemMock(oficio, toStatus));
      setIsGenerating(false);
    }, 800);
  };

  const handleWhatsAppSend = (whatsapp: string) => {
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encoded}`;
    window.open(url, "_blank");
    onConfirmSend(message);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto pb-safe">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-5 w-5 text-primary" />
            Notificar Eleitor sobre Avanço
          </SheetTitle>
          <SheetDescription className="text-xs">
            O ofício avançou de status. Deseja notificar os eleitores vinculados?
          </SheetDescription>
        </SheetHeader>

        {/* Status Change Summary */}
        <div className="flex items-center justify-center gap-3 py-3 bg-muted/50 rounded-2xl">
          <Badge style={{ backgroundColor: fromCfg.color, color: "#fff" }} className="text-xs">
            {fromCfg.label}
          </Badge>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <Badge style={{ backgroundColor: toCfg.color, color: "#fff" }} className="text-xs">
            {toCfg.label}
          </Badge>
        </div>

        {/* Ofício Info */}
        <div className="text-xs space-y-1 px-1">
          <p>
            <span className="font-medium text-foreground">Ofício:</span>{" "}
            <span className="text-muted-foreground">Nº {oficio.numero} — {oficio.titulo}</span>
          </p>
          <p>
            <span className="font-medium text-foreground">Bairro:</span>{" "}
            <span className="text-muted-foreground">{oficio.bairro}</span>
          </p>
          {oficio.protocolo && (
            <p>
              <span className="font-medium text-foreground">Protocolo:</span>{" "}
              <span className="font-mono text-muted-foreground">{oficio.protocolo}</span>
            </p>
          )}
        </div>

        {/* AI Generated Message */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-warning" />
              Mensagem Gerada (IA)
            </label>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-[10px] gap-1"
              onClick={handleRegenerate}
              disabled={isGenerating}
            >
              <Sparkles className="h-3 w-3" />
              {isGenerating ? "Gerando..." : "Regenerar"}
            </Button>
          </div>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            className="text-xs resize-none"
          />
        </div>

        {/* WhatsApp Preview */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground">📱 Preview WhatsApp</label>
          <div className="bg-[hsl(142,71%,92%)] rounded-xl p-3 max-w-[85%] ml-auto shadow-sm">
            <p className="text-xs text-[hsl(142,50%,20%)] whitespace-pre-line leading-relaxed">
              {message}
            </p>
            <span className="text-[10px] text-[hsl(142,30%,50%)] float-right mt-1">
              {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} ✓✓
            </span>
          </div>
        </div>

        {/* Linked Electors */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground">
            Eleitores vinculados ({oficio.bairro})
          </label>
          <div className="space-y-1.5">
            {eleitoresVinculados.map((el) => (
              <div
                key={el.id}
                className="flex items-center justify-between bg-card border rounded-2xl p-2.5"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{el.nome}</p>
                  <p className="text-[11px] font-mono font-medium text-muted-foreground">
                    {formatWhatsAppNumber(el.whatsapp)}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1 bg-[#21c45d] hover:bg-[#1ba94e] text-white shrink-0"
                  onClick={() => handleWhatsAppSend(el.whatsapp)}
                >
                  <Phone className="h-3 w-3" />
                  WhatsApp
                </Button>
              </div>
            ))}
            {eleitoresVinculados.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                Nenhum eleitor vinculado a este bairro.
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            className="flex-1 gap-1.5 bg-[#21c45d] hover:bg-[#1ba94e] text-white"
            onClick={() => {
              if (eleitoresVinculados[0]) handleWhatsAppSend(eleitoresVinculados[0].whatsapp);
            }}
          >
            <Phone className="h-4 w-4" />
            Enviar via WhatsApp
          </Button>
          <Button variant="outline" className="flex-1 gap-1.5" onClick={onSaveOnly}>
            <Save className="h-4 w-4" />
            Salvar sem Notificar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
