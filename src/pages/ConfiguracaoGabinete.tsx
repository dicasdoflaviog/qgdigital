import { useState, useEffect } from "react";
import { Upload, Save, Loader2, Palette, Building2, Users, Image, Camera, Brain, Handshake, Swords, Shield, Mic } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useGabineteConfig } from "@/hooks/useGabineteConfig";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import InviteMemberModal from "@/components/equipe/InviteMemberModal";

const PERFIL_OPTIONS = [
  { value: "diplomata", label: "Diplomata", desc: "Polido, formal e cauteloso", icon: Handshake, color: "text-blue-400" },
  { value: "direto", label: "Direto ao Ponto", desc: "Sem rodeios, focado em números", icon: Swords, color: "text-amber-500" },
  { value: "antifragil", label: "Antifrágil", desc: "Questiona, aponta falhas e desafia", icon: Shield, color: "text-red-400" },
];

const RIGOR_OPTIONS = [
  { value: "formal", label: "Formal", desc: "Tom profissional e institucional" },
  { value: "sincero", label: "Sincero ao Extremo", desc: "Sem papas na língua" },
];

const LINGUAGEM_OPTIONS = [
  { value: "institucional", label: "Institucional", desc: "Norma culta" },
  { value: "informal", label: "Informal", desc: "Linguagem acessível" },
];

const PARTY_COLORS = [
  { label: "Azul", value: "#1E40AF" },
  { label: "Vermelho", value: "#DC2626" },
  { label: "Verde", value: "#16A34A" },
  { label: "Laranja", value: "#EA580C" },
  { label: "Roxo", value: "#7C3AED" },
  { label: "Amarelo", value: "#CA8A04" },
  { label: "Rosa", value: "#DB2777" },
  { label: "Ciano", value: "#0891B2" },
];

export default function ConfiguracaoGabinete() {
  const { profile, roleLevel, user } = useAuth();
  const { config, isLoading, upsert } = useGabineteConfig();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"logo" | "foto" | null>(null);
  const [memoryCount, setMemoryCount] = useState<number | null>(null);
  const [isClearingMemory, setIsClearingMemory] = useState(false);

  // Voice IA state
  const [voiceForm, setVoiceForm] = useState({
    voice_clone_id: "",
    voice_provider: "elevenlabs",
  });
  const [savingVoice, setSavingVoice] = useState(false);
  const [uploadingVoice, setUploadingVoice] = useState(false);

  const [form, setForm] = useState({
    cor_primaria: "#1E40AF",
    nome_mandato: "",
    cidade_estado: "",
    endereco_sede: "",
    telefone_contato: "",
    logo_url: "" as string | null,
    foto_oficial_url: "" as string | null,
    ia_perfil: "diplomata",
    ia_rigor: "formal",
    ia_linguagem: "institucional",
  });

  useEffect(() => {
    const gabId = profile?.gabinete_id ?? user?.id;
    if (!gabId) return;
    supabase
      .from("ai_memories")
      .select("*", { count: "exact", head: true })
      .eq("gabinete_id", gabId)
      .then(({ count }) => setMemoryCount(count ?? 0));
  }, [profile?.gabinete_id, user?.id]);

  useEffect(() => {
    if (config) {
      setForm({
        cor_primaria: config.cor_primaria || "#1E40AF",
        nome_mandato: config.nome_mandato || "",
        cidade_estado: config.cidade_estado || "",
        endereco_sede: config.endereco_sede || "",
        telefone_contato: config.telefone_contato || "",
        logo_url: config.logo_url,
        foto_oficial_url: config.foto_oficial_url,
        ia_perfil: (config as any).ia_perfil || "diplomata",
        ia_rigor: (config as any).ia_rigor || "formal",
        ia_linguagem: (config as any).ia_linguagem || "institucional",
      });
      setVoiceForm({
        voice_clone_id: (config as any).voice_clone_id || "",
        voice_provider: (config as any).voice_provider || "elevenlabs",
      });
    }
  }, [config]);

  const handleUpload = async (type: "logo" | "foto", file: File) => {
    if (!profile?.gabinete_id) return;
    setUploading(type);
    try {
      const ext = file.name.split(".").pop();
      const path = `${profile.gabinete_id}/${type}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("demandas-fotos").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("demandas-fotos").getPublicUrl(path);
      setForm((f) => ({ ...f, [type === "logo" ? "logo_url" : "foto_oficial_url"]: urlData.publicUrl }));
      toast({ title: `${type === "logo" ? "Logo" : "Foto oficial"} atualizada!` });
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    } finally {
      setUploading(null);
    }
  };

  const handleClearMemory = async () => {
    const gabId = profile?.gabinete_id ?? user?.id;
    if (!gabId) return;
    setIsClearingMemory(true);
    try {
      await supabase.from("ai_memories").delete().eq("gabinete_id", gabId);
      setMemoryCount(0);
      toast({ title: "Memória da IA apagada com sucesso" });
    } catch {
      toast({ title: "Erro ao apagar memória", variant: "destructive" });
    } finally {
      setIsClearingMemory(false);
    }
  };

  const handleVoiceSampleUpload = async (file: File) => {
    const gabId = profile?.gabinete_id ?? user?.id;
    if (!gabId) return;
    setUploadingVoice(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${gabId}/sample-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("voice-samples").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("voice-samples").getPublicUrl(path);
      await (supabase.from("gabinete_config") as any)
        .update({ voice_sample_url: urlData.publicUrl })
        .eq("gabinete_id", gabId);
      toast({ title: "Sample de voz enviado!", description: "Agora configure o voice_clone_id." });
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    } finally {
      setUploadingVoice(false);
    }
  };

  const handleSaveVoice = async () => {
    const gabId = profile?.gabinete_id ?? user?.id;
    if (!gabId) {
      toast({ title: "Usuário não identificado", variant: "destructive" });
      return;
    }
    setSavingVoice(true);
    try {
      const { error } = await (supabase.from("gabinete_config") as any)
        .update({
          voice_clone_id: voiceForm.voice_clone_id || null,
          voice_provider: voiceForm.voice_provider,
          voice_configured_at: new Date().toISOString(),
        })
        .eq("gabinete_id", gabId);
      if (error) throw error;
      toast({ title: "✅ Voz IA salva!", description: "Configuração de voz atualizada com sucesso." });
    } catch (err: any) {
      toast({ title: "Erro ao salvar voz", description: err.message, variant: "destructive" });
    } finally {
      setSavingVoice(false);
    }
  };

  const handleSave = async () => {
    const gabId = profile?.gabinete_id ?? user?.id;
    if (!gabId) {
      toast({ title: "Usuário não identificado", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await upsert.mutateAsync({ gabinete_id: gabId, ...form });
      toast({ title: "✅ Configurações salvas!", description: "Seus dados institucionais foram atualizados." });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (roleLevel < 3) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Acesso restrito ao Vereador (Nível 3+).</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 pb-28 md:pb-6">
      <div>
        <h1 className="text-2xl font-medium tracking-[-0.03em] md:text-3xl flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center bg-primary text-primary-foreground">
            <Building2 className="h-4 w-4" />
          </div>
          Configurações do Gabinete
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie a identidade e equipe do seu mandato</p>
      </div>

      <Tabs defaultValue="identidade" className="w-full">
        <TabsList className="w-full grid grid-cols-2 h-11">
          <TabsTrigger value="identidade" className="gap-1.5 text-xs font-medium min-h-[44px]">
            <Building2 className="h-3.5 w-3.5" /> Identidade
          </TabsTrigger>
          <TabsTrigger value="voz-ia" className="gap-1.5 text-xs font-medium min-h-[44px]">
            <Mic className="h-3.5 w-3.5" /> Voz IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="identidade" className="space-y-6 mt-4">

      <div className="grid gap-6 md:grid-cols-2">
        {/* Logo Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium uppercase tracking-wider flex items-center gap-2">
              <Image className="h-4 w-4 text-primary" /> Logo / Brasão
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 rounded-lg border-2 border-border">
                <AvatarImage src={form.logo_url || undefined} className="object-cover" />
                <AvatarFallback className="rounded-lg bg-muted text-muted-foreground text-xs">LOGO</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-2">Será usado nos ofícios PDF gerados pelo sistema.</p>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleUpload("logo", e.target.files[0])}
                  />
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs font-medium uppercase" asChild>
                    <span>
                      {uploading === "logo" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                      Enviar Logo
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Foto Oficial */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium uppercase tracking-wider flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary" /> Foto Oficial
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-2 border-border">
                <AvatarImage src={form.foto_oficial_url || profile?.avatar_url || undefined} className="object-cover" />
                <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                  {(profile?.full_name || "V").charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-2">Aparece no Raio-X do Gabinete e relatórios.</p>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleUpload("foto", e.target.files[0])}
                  />
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs font-medium uppercase" asChild>
                    <span>
                      {uploading === "foto" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                      Enviar Foto
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cores do Partido */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium uppercase tracking-wider flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" /> Cores do Partido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">A cor selecionada será aplicada em detalhes sutis da interface.</p>
            <div className="grid grid-cols-4 gap-2">
              {PARTY_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setForm((f) => ({ ...f, cor_primaria: c.value }))}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all ${
                    form.cor_primaria === c.value
                      ? "border-foreground bg-accent"
                      : "border-transparent hover:border-border"
                  }`}
                >
                  <div
                    className="h-8 w-8 rounded-full border border-border shadow-sm"
                    style={{ backgroundColor: c.value }}
                  />
                  <span className="text-[10px] font-medium text-muted-foreground">{c.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dados Institucionais */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium uppercase tracking-wider flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> Dados Institucionais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nome do Mandato</Label>
              <Input
                value={form.nome_mandato}
                onChange={(e) => setForm((f) => ({ ...f, nome_mandato: e.target.value }))}
                placeholder="Ex: Gabinete do Vereador João Silva"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Cidade / Estado</Label>
              <Input
                value={form.cidade_estado}
                onChange={(e) => setForm((f) => ({ ...f, cidade_estado: e.target.value }))}
                placeholder="Ex: Salvador - BA"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Endereço da Sede</Label>
              <Input
                value={form.endereco_sede}
                onChange={(e) => setForm((f) => ({ ...f, endereco_sede: e.target.value }))}
                placeholder="Rua da Câmara, 123"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Telefone de Contato</Label>
              <Input
                value={form.telefone_contato}
                onChange={(e) => setForm((f) => ({ ...f, telefone_contato: e.target.value }))}
                placeholder="(73) 3281-1234"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DNA do Assistente IA */}
      {config?.ia_nome && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium uppercase tracking-wider flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" /> DNA do Assistente ({config.ia_nome})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Altere a personalidade da IA a qualquer momento. As mudanças serão aplicadas na próxima conversa.
            </p>

            {/* Postura */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Postura Estratégica</Label>
              <div className="grid grid-cols-3 gap-2">
                {PERFIL_OPTIONS.map(opt => {
                  const selected = form.ia_perfil === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setForm(f => ({ ...f, ia_perfil: opt.value }))}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all ${
                        selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                      }`}
                    >
                      <opt.icon className={`h-5 w-5 ${opt.color}`} />
                      <span className={`text-xs font-medium ${selected ? "text-foreground" : "text-muted-foreground"}`}>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rigor */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Nível de Rigor</Label>
              <div className="grid grid-cols-2 gap-2">
                {RIGOR_OPTIONS.map(opt => {
                  const selected = form.ia_rigor === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setForm(f => ({ ...f, ia_rigor: opt.value }))}
                      className={`p-3 rounded-lg border transition-all text-left ${
                        selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                      }`}
                    >
                      <p className={`text-xs font-medium ${selected ? "text-foreground" : "text-muted-foreground"}`}>{opt.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Linguagem */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Linguagem</Label>
              <div className="grid grid-cols-2 gap-2">
                {LINGUAGEM_OPTIONS.map(opt => {
                  const selected = form.ia_linguagem === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setForm(f => ({ ...f, ia_linguagem: opt.value }))}
                      className={`p-3 rounded-lg border transition-all text-left ${
                        selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                      }`}
                    >
                      <p className={`text-xs font-medium ${selected ? "text-foreground" : "text-muted-foreground"}`}>{opt.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Gerenciamento de Memória */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-foreground">Memória da IA</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {memoryCount === null
                    ? "Carregando..."
                    : `${memoryCount} bloco${memoryCount !== 1 ? "s" : ""} armazenado${memoryCount !== 1 ? "s" : ""}`}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearMemory}
                disabled={isClearingMemory || memoryCount === 0}
                className="text-xs text-destructive border-destructive/30 hover:bg-destructive/5"
              >
                {isClearingMemory ? <Loader2 className="h-3 w-3 animate-spin" /> : "Apagar Memória"}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground -mt-2">
              Apaga o histórico de contexto aprendido. O perfil de personalidade é mantido.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Gestão de Convites */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase tracking-wider flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Gestão de Equipe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            Convide novos membros definindo o nível de acesso: Assessor (Nível 1) ou Secretária (Nível 2).
          </p>
          <Button onClick={() => setInviteOpen(true)} className="gap-2 font-medium uppercase tracking-wider text-xs">
            <Users className="h-4 w-4" /> Convidar Membro
          </Button>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving || isLoading}
          className="gap-2 h-12 px-8 font-medium uppercase tracking-wider text-sm"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar Configurações
        </Button>
      </div>

        </TabsContent>

        {/* ── Voz IA tab ── */}
        <TabsContent value="voz-ia" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Mic className="h-4 w-4 text-primary" /> Voz IA
                </CardTitle>
                {voiceForm.voice_clone_id ? (
                  <Badge className="bg-green-100 text-green-800 border-green-200 text-xs font-medium">
                    ✓ Voz configurada
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-slate-500 text-xs font-medium">
                    Voz não configurada
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Configure a voz clonada do vereador para envio automático de mensagens personalizadas.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Step 1 */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-foreground">
                  Passo 1 — Sample de voz (min. 30 segundos)
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Grave ou envie um áudio limpo do vereador para uso na clonagem de voz.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 gap-2 text-xs font-medium relative overflow-hidden"
                    disabled={uploadingVoice}
                    asChild
                  >
                    <label>
                      {uploadingVoice ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5" />
                      )}
                      {uploadingVoice ? "Enviando..." : "Selecionar áudio"}
                      <input
                        type="file"
                        accept="audio/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleVoiceSampleUpload(file);
                        }}
                      />
                    </label>
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Step 2 */}
              <div className="space-y-3">
                <Label className="text-xs font-medium text-foreground">
                  Passo 2 — ID da voz clonada
                </Label>
                <Input
                  className="font-mono text-xs h-10"
                  placeholder="ex: pNInz6obpgDQGcFmaJgB"
                  value={voiceForm.voice_clone_id}
                  onChange={(e) => setVoiceForm((f) => ({ ...f, voice_clone_id: e.target.value }))}
                />
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Provedor de voz</Label>
                  <Select
                    value={voiceForm.voice_provider}
                    onValueChange={(v) => setVoiceForm((f) => ({ ...f, voice_provider: v }))}
                  >
                    <SelectTrigger className="h-10 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                      <SelectItem value="playht">PlayHT</SelectItem>
                      <SelectItem value="cartesia">Cartesia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleSaveVoice}
                disabled={savingVoice}
                className="w-full min-h-[44px] gap-2 font-medium"
              >
                {savingVoice ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar configuração de voz
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <InviteMemberModal open={inviteOpen} onOpenChange={setInviteOpen} callerRoleLevel={roleLevel} />
    </div>
  );
}
