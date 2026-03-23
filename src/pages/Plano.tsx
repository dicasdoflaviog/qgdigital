import { PlanoFaturamentoTab } from "@/components/subscription/PlanoFaturamentoTab";

export default function Plano() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-medium text-foreground">Plano e faturamento</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie sua assinatura e recursos disponíveis
        </p>
      </div>
      <div className="px-4">
        <PlanoFaturamentoTab />
      </div>
    </div>
  );
}
