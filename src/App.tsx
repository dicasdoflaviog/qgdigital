import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { OfflineProvider } from "@/contexts/OfflineContext";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Eleitores from "./pages/Eleitores";
import PerfilEleitor from "./pages/PerfilEleitor";
import MapaCalor from "./pages/MapaCalor";
import Equipe from "./pages/Equipe";
import Agenda from "./pages/Agenda";
import Calendario from "./pages/Calendario";
import Configuracoes from "./pages/Configuracoes";
import Oficios from "./pages/Oficios";
import GuiaSolucoes from "./pages/GuiaSolucoes";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Setup from "./pages/Setup";
// Register removed — access is invite-only
import GestaoBase from "./pages/GestaoBase";
import LogSugestoes from "./pages/LogSugestoes";
import Instituicoes from "./pages/Instituicoes";
import Emendas from "./pages/Emendas";
import MeuPerfil from "./pages/MeuPerfil";
import CentralRecuperacao from "./pages/CentralRecuperacao";
import Sistema from "./pages/Sistema";
import ObservatorioLegislativo from "./pages/ObservatorioLegislativo";
import SystemMaster from "./pages/SystemMaster";
import ObservatorioBi from "./pages/ObservatorioBi";
import ConfiguracaoGabinete from "./pages/ConfiguracaoGabinete";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <OfflineProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/setup" element={<Setup />} />
              <Route path="/signup" element={<Navigate to="/login" replace />} />
              <Route path="/register" element={<Navigate to="/login" replace />} />

              {/* Protected routes */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/eleitores" element={<Eleitores />} />
                        <Route path="/eleitores/:id" element={<PerfilEleitor />} />
                        <Route path="/mapa" element={<MapaCalor />} />
                        <Route path="/equipe" element={<Equipe />} />
                        <Route path="/agenda" element={<Agenda />} />
                        <Route path="/calendario" element={<Calendario />} />
                        <Route path="/oficios" element={<Oficios />} />
                        <Route path="/guia" element={<GuiaSolucoes />} />
                        <Route path="/configuracoes" element={<Configuracoes />} />
                        <Route path="/configuracao-gabinete" element={<ConfiguracaoGabinete />} />
                        <Route path="/gestao-base" element={<GestaoBase />} />
                        <Route path="/sugestoes" element={<LogSugestoes />} />
                        <Route path="/instituicoes" element={<Instituicoes />} />
                        <Route path="/emendas" element={<Emendas />} />
                        <Route path="/meu-perfil" element={<MeuPerfil />} />
                        <Route path="/central-recuperacao" element={<CentralRecuperacao />} />
                        <Route path="/observatorio" element={<ObservatorioLegislativo />} />
                        <Route path="/observatorio-bi" element={<ObservatorioBi />} />
                        <Route path="/admin/system-master" element={<SystemMaster />} />
                        <Route path="/master/admin" element={<SystemMaster />} />
                        <Route path="/sistema" element={<Sistema />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </OfflineProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
