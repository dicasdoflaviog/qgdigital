import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Copy, Check, Link2, Send, Info } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  callerRoleLevel?: number;
}

const ALL_ROLES = [
  { value: "assessor", label: "Assessor de Campo", minLevel: 3 },
  { value: "secretaria", label: "Gestor de Gabinete", minLevel: 3 },
  { value: "admin", label: "Vereador / Admin", minLevel: 4 },
] as const;

export default function InviteMemberModal({ open, onOpenChange, callerRoleLevel = 3 }: Props) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<{ email: string; tempPassword: string } | null>(null);

  const availableRoles = useMemo(
    () => ALL_ROLES.filter((r) => callerRoleLevel >= r.minLevel),
    [callerRoleLevel]
  );

  const [form, setForm] = useState({
    email: "",
    full_name: "",
    role: "assessor",
    whatsapp: "",
  });

  const handleSubmit = async () => {
    if (!form.email || !form.full_name || !form.role) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("invite-member", {
        body: form,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult({ email: form.email, tempPassword: data.temp_password });
      toast({ title: "Membro criado!", description: "Informe a senha provisória." });
    } catch (err: any) {
      toast({ title: "Erro ao convidar", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(
      `📋 Acesso ao QG Digital\n\nEmail: ${result.email}\nSenha temporária: ${result.tempPassword}\n\n⚠️ Troque sua senha no primeiro acesso.`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setResult(null);
      setForm({ email: "", full_name: "", role: "assessor", whatsapp: "" });
      setCopied(false);
    }
    onOpenChange(open);
  };

  const inviteTitle = callerRoleLevel >= 4 ? "Adicionar Membro" : "Convidar Assessor";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-black uppercase tracking-tight flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            {inviteTitle}
          </DialogTitle>
          <DialogDescription>
            Crie credenciais de acesso para um novo membro.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-success/20 bg-success/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-success" />
                <p className="text-sm font-bold text-success">Credenciais criadas!</p>
              </div>
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Email:</span> <strong>{result.email}</strong></p>
                <p><span className="text-muted-foreground">Senha temporária:</span> <strong className="font-mono">{result.tempPassword}</strong></p>
              </div>
            </div>

            <div className="rounded-xl bg-muted/50 border border-border p-3 flex items-start gap-2">
              <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Envie estas credenciais ao membro. O registo precisará da sua <strong>aprovação final</strong> na lista de equipa.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2 h-12 font-bold uppercase tracking-wider text-sm rounded-full"
                onClick={handleCopy}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copiado!" : "Copiar Credenciais"}
              </Button>
              <Button
                className="flex-1 h-12 font-bold uppercase tracking-wider text-sm rounded-full"
                onClick={() => handleClose(false)}
              >
                Fechar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl bg-muted/50 border border-border p-3 flex items-start gap-2">
              <Link2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Crie credenciais para um novo membro. O registo precisará da sua <strong>aprovação final</strong>.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name" className="label-ui">Nome Completo *</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                placeholder="Ex: João Silva"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="label-ui">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="joao@email.com"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="label-ui">Cargo *</Label>
              <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp" className="label-ui">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={form.whatsapp}
                onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
                placeholder="5573999001122"
                className="rounded-xl"
              />
            </div>
            <Button
              className="w-full h-12 font-bold uppercase tracking-wider text-sm rounded-full"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Acesso & Convidar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
