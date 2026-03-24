import { MessageCircle, User, MapPin, Clock, Calendar, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose,
} from "@/components/ui/drawer";
import { useNavigate } from "react-router-dom";

interface EleitorItem {
  id: string;
  nome: string;
  whatsapp?: string;
  bairro?: string;
  situacao?: string;
  data_nascimento?: string | null;
  dataNascimento?: string;
  created_at?: string;
  criadoEm?: string;
  assessor_nome?: string;
  is_leader?: boolean;
}

interface Props {
  eleitor: EleitorItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const situacaoVariant = (s: string) => {
  switch (s) {
    case "Apoiador Confirmado": return "default";
    case "Indeciso": return "secondary";
    case "Demanda Específica": return "destructive";
    default: return "outline";
  }
};

export function EleitorDetailDrawer({ eleitor, open, onOpenChange }: Props) {
  const navigate = useNavigate();

  if (!eleitor) return null;

  const whatsapp = (eleitor.whatsapp || "").replace(/\D/g, "");
  const whatsappUrl = whatsapp ? `https://wa.me/${whatsapp}` : null;
  const birthDate = eleitor.data_nascimento || eleitor.dataNascimento;
  const createdDate = eleitor.created_at || (eleitor.criadoEm ? `${eleitor.criadoEm}T12:00:00Z` : null);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85dvh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-base flex items-center gap-2">
            {eleitor.nome}
            {eleitor.is_leader && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
          </DrawerTitle>
          <DrawerDescription className="text-xs">
            {eleitor.situacao ?? "Novo Cadastro"} • {eleitor.bairro || "—"}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-4 overflow-y-auto">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium">{eleitor.nome}</span>
            </div>
            {eleitor.bairro && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>{eleitor.bairro}</span>
              </div>
            )}
            {birthDate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>{new Date(birthDate + "T12:00:00").toLocaleDateString("pt-BR")}</span>
              </div>
            )}
            {createdDate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0" />
                <span>Cadastrado em {new Date(createdDate).toLocaleDateString("pt-BR")}</span>
              </div>
            )}
            {eleitor.assessor_nome && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4 shrink-0" />
                <span>Resp: {eleitor.assessor_nome}</span>
              </div>
            )}
          </div>

          <Separator />

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Situação</p>
            <Badge variant={situacaoVariant(eleitor.situacao || "") as any} className="text-xs">
              {eleitor.situacao || "Novo Cadastro"}
            </Badge>
          </div>

          <Separator />

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Linha do Tempo</p>
            <div className="space-y-3">
              {createdDate && (
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Cadastro realizado</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(createdDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <DrawerFooter className="flex-row gap-2">
          {whatsappUrl && (
            <Button size="sm" className="flex-1 gap-1.5 !bg-[#21c45d] hover:!bg-[#1ba94e] !text-white" asChild>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </Button>
          )}
          <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => {
            onOpenChange(false);
            navigate(`/eleitores/${eleitor.id}`);
          }}>
            <User className="h-4 w-4" /> Ver Perfil
          </Button>
          <DrawerClose asChild>
            <Button size="sm" variant="ghost">Fechar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
