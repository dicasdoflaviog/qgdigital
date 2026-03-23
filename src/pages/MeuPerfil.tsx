import { useState } from "react";
import { User, Lock, Camera, Eye, EyeOff, Save, Phone, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { DeleteAccountModal } from "@/components/account/DeleteAccountModal";
import { cn } from "@/lib/utils";

type TabKey = "dados" | "senha";

const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "dados", label: "Dados Pessoais", icon: User },
  { key: "senha", label: "Mudar Senha", icon: Lock },
];

/** Mask phone as (XX) XXXXX-XXXX */
function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function MeuPerfil() {
  const { user, profile, signOut, roleLevel } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("dados");

  // Dados Pessoais state
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [telefone, setTelefone] = useState((profile as any)?.telefone || "");
  const [endereco, setEndereco] = useState((profile as any)?.endereco || "");
  const [meta, setMeta] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Senha state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Avatar upload
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const isAssessor = roleLevel === 1;

  const initials = (profile?.full_name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSaveProfile = async () => {
    if (!user) return;
    const trimmed = fullName.trim();
    if (!trimmed) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }
    if (trimmed.length > 100) {
      toast({ title: "Nome muito longo (máx 100 caracteres)", variant: "destructive" });
      return;
    }
    if (endereco.length > 300) {
      toast({ title: "Endereço muito longo (máx 300 caracteres)", variant: "destructive" });
      return;
    }
    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: trimmed,
        telefone: telefone.replace(/\D/g, "").slice(0, 11) || null,
        endereco: endereco.trim() || null,
      } as any)
      .eq("id", user.id);
    setSavingProfile(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Perfil atualizado com sucesso!" });
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Senha deve ter no mínimo 6 caracteres", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      toast({ title: "Erro ao alterar senha", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Senha alterada com sucesso!" });
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Imagem muito grande (máx 2MB)", variant: "destructive" });
      return;
    }
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("demandas-fotos")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Erro no upload", description: uploadError.message, variant: "destructive" });
      setUploadingAvatar(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("demandas-fotos").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("id", user.id);
    setUploadingAvatar(false);
    toast({ title: "Avatar atualizado!" });
    window.location.reload();
  };

  return (
    <div className="p-4 md:p-6 pb-28 md:pb-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-medium tracking-[-0.03em] md:text-3xl flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center bg-primary text-primary-foreground rounded-lg">
            <User className="h-4 w-4" />
          </div>
          Meu Perfil
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie seus dados pessoais e configurações</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Navigation */}
        <Card className="md:w-56 shrink-0">
          <CardContent className="p-2">
            <nav className="flex md:flex-col gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left",
                    activeTab === tab.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <tab.icon className="h-4 w-4 shrink-0" />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Content Area */}
        <Card className="flex-1">
          <CardContent className="p-6 space-y-6">
            {/* ====== DADOS PESSOAIS ====== */}
            {activeTab === "dados" && (
              <>
                <h2 className="text-lg font-bold">Dados Pessoais</h2>
                <Separator />

                {/* Avatar */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative group">
                    <Avatar className="h-24 w-24 border-2 border-primary/20">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="h-6 w-6 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={uploadingAvatar}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {uploadingAvatar ? "Enviando..." : "Clique para alterar"}
                  </p>
                </div>

                {/* Name & Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-muted-foreground" /> Nome
                    </Label>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      maxLength={100}
                      placeholder="Seu nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">Email</Label>
                    <Input value={user?.email || ""} disabled className="opacity-60" />
                  </div>
                </div>

                {/* Telefone & Endereço */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Telefone
                    </Label>
                    <Input
                      value={maskPhone(telefone)}
                      onChange={(e) => setTelefone(e.target.value.replace(/\D/g, ""))}
                      maxLength={16}
                      placeholder="(99) 99999-9999"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Endereço
                    </Label>
                    <Input
                      value={endereco}
                      onChange={(e) => setEndereco(e.target.value)}
                      maxLength={300}
                      placeholder="Rua, número, bairro, cidade"
                    />
                  </div>
                </div>

                {/* Meta — ONLY for L1 (Assessor) */}
                {isAssessor && (
                  <div className="space-y-2">
                    <Label>Meta (cadastros/mês)</Label>
                    <Input
                      type="number"
                      value={meta}
                      onChange={(e) => setMeta(e.target.value)}
                      placeholder="Ex: 100"
                      min={0}
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 sticky bottom-0 bg-card pb-2">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {savingProfile ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                  <DeleteAccountModal />
                </div>
              </>
            )}

            {/* ====== MUDAR SENHA ====== */}
            {activeTab === "senha" && (
              <>
                <h2 className="text-lg font-bold">Mudar Senha</h2>
                <Separator />
                <div className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label>Nova senha</Label>
                    <div className="relative">
                      <Input
                        type={showNew ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        maxLength={72}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowNew(!showNew)}
                      >
                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Repita a nova senha</Label>
                    <div className="relative">
                      <Input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repita a senha"
                        maxLength={72}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowConfirm(!showConfirm)}
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button onClick={handleChangePassword} disabled={savingPassword} className="gap-2">
                    <Lock className="h-4 w-4" />
                    {savingPassword ? "Salvando..." : "Alterar Senha"}
                  </Button>
                </div>
              </>
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  );
}