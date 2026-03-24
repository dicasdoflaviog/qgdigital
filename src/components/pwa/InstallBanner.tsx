import { useState, useEffect } from "react";
import { X, Download, Share, MoreVertical } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

export function InstallBanner() {
  const isMobile = useIsMobile();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const wasDismissed = localStorage.getItem("pwa-install-dismissed");
    if (wasDismissed) {
      const dismissedAt = parseInt(wasDismissed, 10);
      if (Date.now() - dismissedAt < 3 * 24 * 60 * 60 * 1000) {
        setDismissed(true);
      }
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    const installedHandler = () => setIsInstalled(true);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowInstructions(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  if (!isMobile || isInstalled || dismissed) return null;

  const ios = isIOS();

  return (
    <>
      <div className="relative z-30 animate-fade-in">
        <div className="mx-3 mt-2 flex items-center gap-3 rounded-xl bg-primary text-primary-foreground p-3 shadow-sm">
          {ios ? (
            <>
              <Share className="h-5 w-5 shrink-0" />
              <button
                onClick={() => setShowInstructions(true)}
                className="flex-1 text-left text-sm font-medium"
              >
                📲 Toque em <Share className="h-3.5 w-3.5 inline mx-0.5" /> e depois em "Adicionar à Tela de Início"
              </button>
            </>
          ) : (
            <>
              <Download className="h-5 w-5 shrink-0" />
              <button
                onClick={handleInstall}
                className="flex-1 text-left text-sm font-medium"
              >
                📲 Instale o App do Mandato para acesso rápido
              </button>
            </>
          )}
          <button
            onClick={handleDismiss}
            className="shrink-0 p-1 hover:bg-primary-foreground/20 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium">
              Instalar QG Digital
            </DialogTitle>
          </DialogHeader>

          {ios ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                No iPhone/iPad, siga estes passos:
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium shrink-0">1</div>
                  <div>
                    <p className="text-sm font-medium">Toque no botão Compartilhar</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      É o ícone <Share className="h-3.5 w-3.5 inline" /> na barra do Safari
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium shrink-0">2</div>
                  <div>
                    <p className="text-sm font-medium">Role para baixo e toque em</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      "Adicionar à Tela de Início" (Add to Home Screen)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium shrink-0">3</div>
                  <div>
                    <p className="text-sm font-medium">Toque em "Adicionar"</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      O app vai aparecer na sua tela inicial como qualquer outro app!
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                ⚠️ Certifique-se de estar usando o Safari (navegador padrão do iPhone)
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                No Android (Chrome), siga estes passos:
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium shrink-0">1</div>
                  <div>
                    <p className="text-sm font-medium">Toque no menu ⋮</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      Os 3 pontos <MoreVertical className="h-3.5 w-3.5 inline" /> no canto superior direito do Chrome
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium shrink-0">2</div>
                  <div>
                    <p className="text-sm font-medium">Toque em "Instalar app"</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Ou "Adicionar à tela inicial"
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium shrink-0">3</div>
                  <div>
                    <p className="text-sm font-medium">Confirme a instalação</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      O app vai aparecer na sua tela inicial!
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                💡 Acesse pelo link publicado: <span className="font-medium">qgdigital.lovable.app</span>
              </p>
            </div>
          )}

          <Button onClick={() => setShowInstructions(false)} className="w-full mt-2">
            Entendi!
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
