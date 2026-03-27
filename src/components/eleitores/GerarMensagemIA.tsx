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
  "Novo Cadastro": "Olá, {nome}! Seja bem-vindo(a)! Estamos aqui para ouvir suas necessidades e trabalhar juntos por melhorias na nossa comunidade. 🎉",
  "Atendido": "Olá, {nome}! Que bom ter você conosco! Seu atendimento foi registrado e continuamos trabalhando para servir ainda melhor. Qualquer necessidade, estamos à disposição! 🤝",
  "Líder Comunitário": "Olá, {nome}! Sua liderança é fundamental para o nosso trabalho. Contamos com você para fortalecer nossa comunidade e levar as demandas do bairro adiante. 💪",
  "Apoiador Forte": "Olá, {nome}! Seu apoio faz toda a diferença! Juntos construímos uma Teixeira de Freitas melhor para todos. Obrigado pela confiança! 🌟",
  "Eleitor Potencial": "Olá, {nome}! Gostaria de conversar sobre como nosso trabalho tem impactado positivamente a nossa cidade. Podemos marcar um café? ☕",
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
