import { useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer, X } from "lucide-react";

interface PDFPreviewModalProps {
  open: boolean;
  onClose: () => void;
  blobUrl: string | null;
  title: string;
  fileName: string;
}

function PDFViewer({ blobUrl }: { blobUrl: string }) {
  return (
    <div className="flex-1 min-h-0 bg-slate-100 rounded-lg overflow-hidden">
      <iframe
        src={blobUrl}
        className="w-full h-full border-0 rounded-lg"
        title="Visualização do PDF"
      />
    </div>
  );
}

function ActionBar({ blobUrl, fileName, onPrint }: { blobUrl: string; fileName: string; onPrint: () => void }) {
  return (
    <div className="flex gap-3 pt-3 border-t border-slate-200">
      <a href={blobUrl} download={fileName} className="flex-1">
        <Button className="w-full h-11 gap-2">
          <Download className="w-4 h-4" />
          Baixar PDF
        </Button>
      </a>
      <Button
        variant="outline"
        className="flex-1 h-11 gap-2 border-slate-300"
        onClick={onPrint}
      >
        <Printer className="w-4 h-4" />
        Imprimir
      </Button>
    </div>
  );
}

export function PDFPreviewModal({ open, onClose, blobUrl, title, fileName }: PDFPreviewModalProps) {
  const isMobile = useIsMobile();

  // Revoke blobUrl when modal closes to free memory
  useEffect(() => {
    if (!open && blobUrl) {
      // Delay revoke so download still works after close
      const timer = setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
      return () => clearTimeout(timer);
    }
  }, [open, blobUrl]);

  const handlePrint = () => {
    if (!blobUrl) return;
    const win = window.open(blobUrl);
    if (win) {
      win.onload = () => win.print();
    }
  };

  if (!blobUrl) return null;

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent
          side="bottom"
          className="h-[90vh] flex flex-col p-4 gap-3 rounded-t-2xl"
        >
          <SheetHeader className="flex-row items-center justify-between pb-0">
            <SheetTitle className="text-base font-medium text-slate-900">{title}</SheetTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </SheetHeader>
          <PDFViewer blobUrl={blobUrl} />
          <ActionBar blobUrl={blobUrl} fileName={fileName} onPrint={handlePrint} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl w-[90vw] h-[90vh] flex flex-col p-6 gap-4">
        <DialogHeader className="flex-row items-center justify-between pb-0 space-y-0">
          <DialogTitle className="text-lg font-medium text-slate-900">{title}</DialogTitle>
        </DialogHeader>
        <PDFViewer blobUrl={blobUrl} />
        <ActionBar blobUrl={blobUrl} fileName={fileName} onPrint={handlePrint} />
      </DialogContent>
    </Dialog>
  );
}
