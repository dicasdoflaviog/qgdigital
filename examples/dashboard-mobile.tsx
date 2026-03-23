"use client";

import * as React from "react";
import {
  Globe,
  Users,
  AlertTriangle,
  Building2,
  ChevronRight,
  Bell,
  TrendingUp,
  TrendingDown,
  MapPin,
  Clock,
} from "lucide-react";
import { BottomNav, FAB } from "@/components/mobile";
import { cn } from "@/lib/utils";

// ============================================
// 📱 Dashboard Mobile - QG Digital
// ============================================

export default function DashboardMobile() {
  return (
    <div className="min-h-screen bg-slate-50 pb-bottom-nav">
      {/* Header */}
      <header className="bg-qg-blue-600 pt-safe">
        <div className="px-4 py-4">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-white font-medium">F</span>
              </div>
              <div>
                <p className="text-white/80 text-sm">Olá,</p>
                <p className="text-white font-medium">Flávio</p>
              </div>
            </div>
            <button className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center relative">
              <Bell className="w-5 h-5 text-white" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-qg-red-500 rounded-full" />
            </button>
          </div>

          {/* Quick stats */}
          <div className="bg-white/10 rounded-2xl p-4">
            <p className="text-white/70 text-sm mb-1">Total de eleitores</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-medium text-white">12.847</span>
              <span className="text-qg-green-400 text-sm flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                +127 esta semana
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 -mt-2">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <KPICard
            icon={<Globe className="w-5 h-5" />}
            iconBg="bg-qg-blue-100"
            iconColor="text-qg-blue-600"
            value="5"
            label="Cidades"
          />
          <KPICard
            icon={<Users className="w-5 h-5" />}
            iconBg="bg-qg-green-100"
            iconColor="text-qg-green-600"
            value="550"
            label="Ativos"
            trend="+12%"
            trendUp
          />
          <KPICard
            icon={<AlertTriangle className="w-5 h-5" />}
            iconBg="bg-qg-red-100"
            iconColor="text-qg-red-600"
            value="3"
            label="Alertas"
            highlight
          />
          <KPICard
            icon={<Building2 className="w-5 h-5" />}
            iconBg="bg-qg-amber-100"
            iconColor="text-qg-amber-600"
            value="8"
            label="Gabinetes"
          />
        </div>

        {/* Alertas de Crise */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-medium text-slate-900">Alertas de crise</h2>
            <button className="text-sm text-qg-blue-600 font-medium">Ver todos</button>
          </div>

          <div className="space-y-2">
            <AlertCard
              title="Falta de água - Bairro Norte"
              location="Cidade A"
              priority="alta"
              time="Há 2 horas"
            />
            <AlertCard
              title="Queda de energia recorrente"
              location="Centro, Cidade B"
              priority="media"
              time="Há 5 horas"
            />
            <AlertCard
              title="Alagamento após chuvas"
              location="Vila Sul, Cidade C"
              priority="alta"
              time="Há 1 dia"
            />
          </div>
        </section>

        {/* Atividades Recentes */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-medium text-slate-900">Atividade recente</h2>
            <button className="text-sm text-qg-blue-600 font-medium">Ver todas</button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
            <ActivityItem
              avatar="AS"
              avatarBg="bg-qg-green-100"
              avatarColor="text-qg-green-700"
              title="Ana Silva foi cadastrada"
              subtitle="Por você • Nova Esperança"
              time="Há 10 min"
            />
            <ActivityItem
              avatar="JC"
              avatarBg="bg-qg-blue-100"
              avatarColor="text-qg-blue-700"
              title="João Costa atualizou dados"
              subtitle="Telefone alterado"
              time="Há 25 min"
            />
            <ActivityItem
              avatar="ML"
              avatarBg="bg-qg-amber-100"
              avatarColor="text-qg-amber-700"
              title="Maria Lima - pendente"
              subtitle="Aguardando confirmação"
              time="Há 1 hora"
            />
          </div>
        </section>

        {/* Próximos Compromissos */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-medium text-slate-900">Hoje</h2>
            <button className="text-sm text-qg-blue-600 font-medium">Agenda</button>
          </div>

          <div className="space-y-2">
            <EventCard
              time="14:00"
              title="Reunião com Assoc. de Moradores"
              location="Nova Esperança"
              color="bg-qg-blue-600"
            />
            <EventCard
              time="16:30"
              title="Visita ao Posto de Saúde"
              location="Centro"
              color="bg-qg-green-600"
            />
          </div>
        </section>
      </div>

      {/* FAB */}
      <FAB onClick={() => console.log("Novo eleitor")} />

      {/* Bottom Nav */}
      <BottomNav activeTab="home" badges={{ eleitores: 5 }} />
    </div>
  );
}

// ============================================
// 📦 Sub-componentes
// ============================================

interface KPICardProps {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  value: string;
  label: string;
  trend?: string;
  trendUp?: boolean;
  highlight?: boolean;
}

function KPICard({
  icon,
  iconBg,
  iconColor,
  value,
  label,
  trend,
  trendUp,
  highlight,
}: KPICardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border p-4",
        highlight ? "border-qg-red-200 bg-qg-red-50" : "border-slate-200"
      )}
    >
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", iconBg)}>
        <span className={iconColor}>{icon}</span>
      </div>
      <p className={cn("text-2xl font-medium", highlight ? "text-qg-red-600" : "text-slate-900")}>
        {value}
      </p>
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium flex items-center gap-0.5",
              trendUp ? "text-qg-green-600" : "text-qg-red-600"
            )}
          >
            {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

interface AlertCardProps {
  title: string;
  location: string;
  priority: "alta" | "media" | "baixa";
  time: string;
}

function AlertCard({ title, location, priority, time }: AlertCardProps) {
  const priorityStyles = {
    alta: "bg-qg-red-100 text-qg-red-700 border-qg-red-200",
    media: "bg-qg-amber-100 text-qg-amber-700 border-qg-amber-200",
    baixa: "bg-qg-blue-100 text-qg-blue-700 border-qg-blue-200",
  };

  const priorityLabels = {
    alta: "Alta",
    media: "Média",
    baixa: "Baixa",
  };

  return (
    <a
      href="#"
      className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 active:bg-slate-50"
    >
      <div className="flex-1 min-w-0">
        <p className="text-base font-medium text-slate-900 truncate">{title}</p>
        <div className="flex items-center gap-2 mt-1">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-sm text-slate-500">{location}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <span
          className={cn(
            "px-2 py-0.5 text-xs font-medium rounded-full border",
            priorityStyles[priority]
          )}
        >
          {priorityLabels[priority]}
        </span>
        <span className="text-xs text-slate-400">{time}</span>
      </div>
    </a>
  );
}

interface ActivityItemProps {
  avatar: string;
  avatarBg: string;
  avatarColor: string;
  title: string;
  subtitle: string;
  time: string;
}

function ActivityItem({ avatar, avatarBg, avatarColor, title, subtitle, time }: ActivityItemProps) {
  return (
    <a href="#" className="flex items-center gap-3 p-4 active:bg-slate-50">
      <div
        className={cn("w-10 h-10 rounded-full flex items-center justify-center", avatarBg)}
      >
        <span className={cn("text-sm font-medium", avatarColor)}>{avatar}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">{title}</p>
        <p className="text-xs text-slate-500 truncate">{subtitle}</p>
      </div>
      <div className="flex items-center gap-1 text-xs text-slate-400">
        <Clock className="w-3 h-3" />
        {time}
      </div>
    </a>
  );
}

interface EventCardProps {
  time: string;
  title: string;
  location: string;
  color: string;
}

function EventCard({ time, title, location, color }: EventCardProps) {
  return (
    <a
      href="#"
      className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 active:bg-slate-50"
    >
      <div
        className={cn("w-1 h-12 rounded-full", color)}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <div className="flex items-center gap-2 mt-1">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-sm text-slate-500">{location}</span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-lg font-medium text-slate-900">{time}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-slate-400" />
    </a>
  );
}
