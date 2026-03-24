import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export function DeleteAccountModal() {
  const { user, signOut, role } = useAuth();
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const canDelete = confirmation === "EXCLUIR";

  const handleDelete = async () => {
    if (!canDelete || !user) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("deactivate-account", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });

      if (res.error) {
        throw new Error(res.error.message || "Erro ao desativar conta");
      }

      toast({ title: "Conta desativada", description: "Sua conta foi desativada com sucesso." });
      await signOut();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const roleLabel = role === "admin" ? "Vereador/Admin" : "Assessor";

  return (
    <AlertDialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setConfirmation(""); }}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full gap-2 font-medium text-xs">
          <AlertTriangle className="h-4 w-4" /> Excluir Minha Conta
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" /> Excluir Conta ({roleLabel})
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Esta ação irá <strong>desativar permanentemente</strong> seu acesso ao QG Digital.
              Você não poderá mais fazer login.
            </p>
            {role === "admin" && (
              <p className="text-amber-600 dark:text-amber-400 font-medium">
                ⚠️ Como Vereador/Admin, todos os dados do seu gabinete serão marcados como
                &quot;arquivados&quot; e não estarão mais visíveis no app.
              </p>
            )}
            <p className="text-muted-foreground text-xs border-l-2 border-primary pl-3 italic">
              Nota: Suas atividades registradas permanecerão como parte do histórico do gabinete
              para fins de prestação de contas.
            </p>
            <div className="pt-2">
              <p className="text-sm font-medium mb-1">
                Digite <strong>EXCLUIR</strong> para confirmar:
              </p>
              <Input
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder="EXCLUIR"
                className="font-mono"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={!canDelete || loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "Processando..." : "Confirmar Exclusão"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
