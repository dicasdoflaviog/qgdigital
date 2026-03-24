import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Rocket, Star, Code2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Feedback {
  id: string;
  content: string;
  status: string;
  created_at: string;
}

const highlightStatuses = ["interessante", "em_desenvolvimento", "implementado"];

const statusMessages: Record<string, { emoji: string; message: string; color: string }> = {
  interessante: {
    emoji: "⭐",
    message: "Sua sugestão foi marcada como INTERESSANTE e entrou no roteiro de atualizações!",
    color: "border-primary/40 bg-gradient-to-br from-primary/5 to-violet-500/5",
  },
  em_desenvolvimento: {
    emoji: "🛠️",
    message: "Sua sugestão está EM DESENVOLVIMENTO! Estamos trabalhando nela agora.",
    color: "border-violet-500/40 bg-gradient-to-br from-violet-500/5 to-primary/5",
  },
  implementado: {
    emoji: "🚀",
    message: "Sua sugestão foi IMPLEMENTADA! Atualize o app para ver a novidade.",
    color: "border-emerald-500/40 bg-gradient-to-br from-emerald-500/5 to-primary/5",
  },
};

export function MinhasSugestoes({ firstName }: { firstName: string }) {
  const { user } = useAuth();

  const { data: feedbacks = [] } = useQuery({
    queryKey: ["my-feedbacks", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("feedbacks")
        .select("id, content, status, created_at")
        .eq("user_id", user.id)
        .in("status", highlightStatuses)
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) return [];
      return data as Feedback[];
    },
    enabled: !!user,
  });

  if (feedbacks.length === 0) return null;

  return (
    <div className="animate-fade-in">
      <h2 className="label-ui flex items-center gap-1.5 mb-2">
        <Star className="h-3.5 w-3.5" /> Status das Minhas Sugestões
      </h2>
      <div className="space-y-2">
        {feedbacks.map((fb) => {
          const config = statusMessages[fb.status];
          if (!config) return null;
          return (
            <Card key={fb.id} className={`transition-all duration-300 ${config.color}`}>
              <CardContent className="p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{config.emoji}</span>
                  <p className="text-xs font-medium text-foreground leading-snug">
                    Parabéns, {firstName}!
                  </p>
                  <Badge
                    variant="outline"
                    className="text-[9px] font-medium ml-auto shrink-0"
                  >
                    {fb.status === "interessante" && <Star className="h-2.5 w-2.5 mr-0.5 fill-current" />}
                    {fb.status === "em_desenvolvimento" && <Code2 className="h-2.5 w-2.5 mr-0.5" />}
                    {fb.status === "implementado" && <Rocket className="h-2.5 w-2.5 mr-0.5" />}
                    {fb.status.replace("_", " ")}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {config.message}
                </p>
                <p className="text-[10px] text-foreground/70 italic truncate">
                  "{fb.content.slice(0, 80)}{fb.content.length > 80 ? "..." : ""}"
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}