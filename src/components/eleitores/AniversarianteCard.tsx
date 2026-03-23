import { useState } from "react";
import { Sparkles, MessageCircle, Copy, Check, Cake } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Eleitor } from "@/data/mockData";
import { toast } from "@/hooks/use-toast";

interface Props {
  eleitor: Eleitor;
  nomeVereador?: string;
}

function gerarScript(eleitor: Eleitor, nomeVereador: string): string {
  const primeiro = eleitor.nome.split(" ")[0];
  const sit = eleitor.situacao.toLowerCase();

  const contextos: Record<string, string> = {
    "apoiador confirmado": `quero agradecer por toda a parceria e confiança que você tem depositado no nosso trabalho no bairro ${eleitor.bairro}. Conte sempre comigo`,
    "indeciso": `lembrei da nossa conversa sobre as melhorias que você gostaria de ver no bairro ${eleitor.bairro}. Quero que saiba que sigo trabalhando nisso`,
    "necessita visita": `sei que temos uma conversa pendente sobre suas demandas no bairro ${eleitor.bairro}. Vou pedir para meu assessor te procurar essa semana`,
    "demanda específica": `não esqueci da situação que você me trouxe lá no ${eleitor.bairro}. Estou acompanhando de perto e em breve terei novidades`,
    "novo cadastro": `fico feliz em ter você conosco! O bairro ${eleitor.bairro} merece toda atenção, e estou aqui para ouvir suas necessidades`,
  };

  const contexto = contextos[sit] || `lembrei que recentemente conversamos sobre ${eleitor.situacao} no bairro ${eleitor.bairro}, e quero dizer que sigo acompanhando de perto`;

  return `Olá ${primeiro}! 🎂🎉\n\nAqui é o Vereador ${nomeVereador}. Passei para te desejar um FELIZ ANIVERSÁRIO!\n\n${primeiro}, ${contexto}.\n\nMuita saúde, paz e realizações! Um grande abraço! 🤝`;
}

export function AniversarianteCard({ eleitor, nomeVereador = "João" }: Props) {
  const [mensagem, setMensagem] = useState("");
  const [gerado, setGerado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const handleGerar = () => {
    setLoading(true);
    setTimeout(() => {
      setMensagem(gerarScript(eleitor, nomeVereador));
      setGerado(true);
      setLoading(false);
    }, 600);
  };

  const handleCopiar = () => {
    navigator.clipboard.writeText(mensagem);
    setCopiado(true);
    toast({ title: "Mensagem copiada!" });
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleWhatsApp = () => {
    const encoded = encodeURIComponent(mensagem);
    window.open(`https://wa.me/${eleitor.whatsapp}?text=${encoded}`, "_blank");
  };

  return (
    <Card className="relative overflow-hidden border-warning/40 bg-gradient-to-br from-warning/5 via-card to-warning/5">
      {/* Faixa decorativa dourada */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-warning/60 via-warning to-warning/60" />

      <CardContent className="pt-5 pb-4 space-y-3">
        {/* Header do card */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning">
            <Cake className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{eleitor.nome}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-muted-foreground">{eleitor.bairro}</span>
              <span className="text-[10px] rounded-full bg-warning/15 px-2 py-0.5 font-medium text-warning">
                {eleitor.situacao}
              </span>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ai"
            className="flex-1 gap-1.5 text-xs min-w-0"
            onClick={handleGerar}
            disabled={loading}
          >
            {loading ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
            )}
            <span className="truncate">{gerado ? "Regenerar" : "Msg Parabéns"}</span>
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="shrink-0 gap-1.5 text-xs !bg-[#21c45d] hover:!bg-[#1ba94e] !text-white"
            disabled={!gerado}
            onClick={handleWhatsApp}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            WhatsApp
          </Button>
        </div>

        {/* Textarea com mensagem gerada */}
        {gerado && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <Textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              rows={6}
              className="text-xs leading-relaxed resize-none bg-muted/50"
            />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-xs" onClick={handleCopiar}>
                {copiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiado ? "Copiado!" : "Copiar"}
              </Button>
              <Button size="sm" variant="secondary" className="flex-1 gap-1.5 text-xs !bg-[#21c45d] hover:!bg-[#1ba94e] !text-white" onClick={handleWhatsApp}>
                <MessageCircle className="h-3.5 w-3.5" />
                Abrir WhatsApp
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
