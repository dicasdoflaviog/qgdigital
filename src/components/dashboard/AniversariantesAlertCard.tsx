import { Link } from "react-router-dom";
import { Cake, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAniversariantesAmanha } from "@/hooks/useAniversariantesRede";
import type { AniversarianteRede } from "@/hooks/useAniversariantesRede";

function gerarMensagem(p: AniversarianteRede, vereadorNome: string = "seu vereador"): string {
  const primeiro = p.full_name.split(" ")[0];
  if (p.genero === "F") {
    return `Olá ${primeiro}! 🎉 Parabéns pelo seu aniversário! O vereador ${vereadorNome} manda um carinhoso abraço e deseja um dia lindo!`;
  }
  return `Olá ${primeiro}! 🎉 Parabéns pelo seu aniversário! O vereador ${vereadorNome} manda um forte abraço e deseja um dia especial!`;
}

export function AniversariantesAlertCard({ vereadorNome = "seu vereador" }: { vereadorNome?: string }) {
  const { data = [], isLoading } = useAniversariantesAmanha();

  if (isLoading || data.length === 0) return null;

  return (
    <Card className="border-amber-200 bg-amber-50 rounded-2xl shadow-none">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
            <Cake className="w-4 h-4 text-amber-700" />
          </div>
          <p className="text-sm font-medium text-amber-900">
            {data.length === 1 ? "1 aniversariante amanhã" : `${data.length} aniversariantes amanhã`}
          </p>
        </div>
        <div className="space-y-2">
          {data.slice(0, 3).map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-2">
              <p className="text-xs text-amber-800 truncate">{p.full_name}</p>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-amber-700 shrink-0"
                asChild
              >
                <a
                  href={`https://wa.me/${p.whatsapp?.replace(/\D/g, "")}?text=${encodeURIComponent(gerarMensagem(p, vereadorNome))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="w-3 h-3 mr-1" />
                  Parabenizar
                </a>
              </Button>
            </div>
          ))}
        </div>
        {data.length > 3 && (
          <Link
            to="/aniversariantes-rede"
            className="text-xs text-amber-700 font-medium mt-2 block"
          >
            Ver todos ({data.length}) →
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
