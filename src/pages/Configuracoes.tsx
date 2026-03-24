import { useState } from "react";
import { useTheme } from "next-themes";
import { Upload, Download, ShieldAlert, FileSpreadsheet, Sun, Moon, Monitor, Settings, Bell, Activity, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

import { LimitesPanel } from "@/components/admin/LimitesPanel";
import { StatusSistema } from "@/components/admin/StatusSistema";
import { DeleteAccountModal } from "@/components/account/DeleteAccountModal";

export default function Configuracoes() {
  const { role } = useAuth();
  const { theme, setTheme } = useTheme();
  const applyTheme = (value: string) => setTheme(value);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    toast({ title: "Arquivo recebido!", description: "Processando importação..." });
  };

  const generalSettings = (
    <>
      {/* Theme Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Sun className="h-4 w-4 text-primary" /> Aparência
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {[
              { value: "light", label: "Claro", icon: Sun },
              { value: "dark", label: "Escuro", icon: Moon },
              { value: "system", label: "Sistema", icon: Monitor },
            ].map((opt) => (
              <Button
                key={opt.value}
                variant={theme === opt.value ? "default" : "outline"}
                size="sm"
                className="flex-1 gap-1.5 font-medium"
                onClick={() => applyTheme(opt.value)}
              >
                <opt.icon className="h-4 w-4" />
                {opt.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" /> Notificações de campo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Receba alertas de novos ofícios e cadastros diretamente no seu dispositivo.
          </p>
          <Button
            className="w-full gap-2 font-medium"
            onClick={async () => {
              if (!("Notification" in window)) {
                toast({ title: "Não suportado", description: "Seu navegador não suporta notificações.", variant: "destructive" });
                return;
              }
              const permission = await Notification.requestPermission();
              if (permission === "granted") {
                new Notification("QG Digital", {
                  body: "Notificações Ativadas! Receberá alertas de novos ofícios aqui.",
                  icon: "/pwa-192x192.png",
                });
                toast({ title: "✅ Notificações ativadas!", description: "Você receberá alertas de campo." });
              } else {
                toast({ title: "Permissão negada", description: "Ative nas configurações do navegador.", variant: "destructive" });
              }
            }}
          >
            <Bell className="h-4 w-4" /> Ativar Notificações de Campo
          </Button>
        </CardContent>
      </Card>

      {/* Import */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary" /> Importar dados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed p-8 transition-colors duration-300 ${
              dragOver ? "border-primary bg-primary/5" : "border-border"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium">Arraste seu arquivo CSV ou Excel aqui</p>
              <p className="label-ui mt-1">Ou clique para selecionar</p>
            </div>
            <Button variant="outline" size="sm" className="font-medium" onClick={() => toast({ title: "Selecionar arquivo" })}>
              Escolher Arquivo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" /> Exportar dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {role === "admin" || role === "super_admin" ? (
            <Button
              className="w-full gap-2 font-medium"
              onClick={() => toast({ title: "Exportação iniciada", description: "Preparando arquivo..." })}
            >
              <Download className="h-4 w-4" /> Exportar Base Completa
            </Button>
          ) : (
            <div className="flex items-center gap-2 border border-destructive/30 bg-destructive/5 p-4">
              <ShieldAlert className="h-5 w-5 text-destructive shrink-0" />
              <div>
                <p className="text-sm font-medium">Acesso Restrito</p>
                <p className="label-ui">Apenas administradores podem exportar a base completa.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Níveis de acesso */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-primary" /> Níveis de acesso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { role: "Vereador / Admin", perms: ["Dashboard completo", "Gráfico de equipe", "Exportar base", "Gestão de acessos"] },
            { role: "Assessor", perms: ["Cadastro de eleitores", "Visualizar próprios cadastros", "WhatsApp direto"] },
            { role: "Secretária", perms: ["Aniversariantes em destaque", "Cadastro de eleitores", "Agenda de contatos"] },
          ].map((item) => (
            <div key={item.role} className="border border-border p-3">
              <p className="text-sm font-medium mb-2">{item.role}</p>
              <div className="flex flex-wrap gap-1.5">
                {item.perms.map((p) => (
                  <Badge key={p} variant="secondary" className="text-[10px] font-medium">{p}</Badge>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Zona de Perigo */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
            <Trash2 className="h-4 w-4" /> Zona de perigo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Ao excluir sua conta, seu acesso será desativado permanentemente.
            Os dados vinculados ao gabinete serão preservados para auditoria.
          </p>
          <DeleteAccountModal />
        </CardContent>
      </Card>

    </>
  );

  return (
    <div className="p-4 md:p-6 space-y-6 pb-28 md:pb-6">
      <div>
        <h1 className="text-2xl font-medium tracking-[-0.03em] md:text-3xl flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center bg-primary text-primary-foreground">
            <Settings className="h-4 w-4" />
          </div>
          Configurações
        </h1>
        <p className="label-ui mt-1">Importação, exportação e níveis de acesso</p>
      </div>

      <div className="border-t border-border" />

      {role === "super_admin" ? (
        <Tabs defaultValue="geral" className="space-y-4">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="geral" className="text-xs font-medium">Geral</TabsTrigger>
            <TabsTrigger value="limites" className="text-xs font-medium">Limites</TabsTrigger>
            <TabsTrigger value="status" className="text-xs font-medium gap-1">
              <Activity className="h-3 w-3" /> Status
            </TabsTrigger>
          </TabsList>
          <TabsContent value="geral" className="space-y-6">{generalSettings}</TabsContent>
          <TabsContent value="limites"><LimitesPanel /></TabsContent>
          <TabsContent value="status"><StatusSistema /></TabsContent>
        </Tabs>
      ) : (
        <div className="space-y-6">{generalSettings}</div>
      )}
    </div>
  );
}
