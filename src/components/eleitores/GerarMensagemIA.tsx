import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  nome: string;
  situacao: string;
}

const templates: Record<string, string> = {
  "Apoiador Confirmado": "Olá, {nome}! Obrigado pelo apoio. Contamos com você para fortalecer nossa comunidade. Qualquer necessidade, estamos à disposição! 🤝",
  "Indeciso": "Olá, {nome}! Gostaria de conversar sobre como nosso trabalho tem impactado positivamente a nossa cidade. Podemos marcar um café? ☕",
  "Necessita Visita": "Olá, {nome}! Nosso assessor gostaria de agendar uma visita para entender melhor sua situação e como podemos ajudar. Qual o melhor horário para você? 📋",
  "Demanda Específica": "Olá, {nome}! Recebemos sua demanda e já estamos trabalhando para encontrar uma solução. Em breve entraremos em contato com novidades. 💪",
  "Novo Cadastro": "Olá, {nome}! Seja bem-vindo(a)! Estamos aqui para ouvir suas necessidades e trabalhar juntos por melhorias na nossa comunidade. 🎉",
};

export function GerarMensagemIA({ nome, situacao }: Props) {
  const [open, setOpen] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(false);

  const gerar = () => {
    setLoading(true);
    setTimeout(() => {
      const tpl = templates[situacao] || templates["Novo Cadastro"];
      setMensagem(tpl.replace("{nome}", nome.split(" ")[0]));
      setLoading(false);
    }, 800);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-[hsl(var(--primary-end))] hover:text-primary"
        onClick={() => { setOpen(true); gerar(); }}
        title="Gerar Mensagem IA"
      >
        <Sparkles className="h-3.5 w-3.5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Mensagem Gerada por IA
            </DialogTitle>
          </DialogHeader>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl bg-muted p-4 text-sm leading-relaxed">
                {mensagem}
              </div>
              <Button
                variant="ai"
                className="w-full"
                onClick={() => { navigator.clipboard.writeText(mensagem); }}
              >
                Copiar Mensagem
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
