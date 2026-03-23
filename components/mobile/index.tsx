"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { 
  Home, 
  Map, 
  Users, 
  Calendar, 
  Menu,
  Plus,
  X,
  ChevronLeft,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// 📱 Bottom Navigation
// ============================================

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  badge?: number;
}

function NavItem({ icon, label, href, active, badge }: NavItemProps) {
  return (
    <a
      href={href}
      className={cn(
        "flex flex-col items-center justify-center",
        "w-16 h-full gap-0.5",
        "touch-manipulation tap-highlight-none",
        "transition-colors duration-150",
        active ? "text-qg-blue-600" : "text-slate-500 active:text-slate-700"
      )}
    >
      <div className="relative">
        {icon}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 bg-qg-red-600 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </a>
  );
}

interface BottomNavProps {
  activeTab?: string;
  badges?: {
    eleitores?: number;
    agenda?: number;
  };
}

export function BottomNav({ activeTab = "home", badges }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      <NavItem
        icon={<Home className="w-5 h-5" />}
        label="Início"
        href="/"
        active={activeTab === "home"}
      />
      <NavItem
        icon={<Map className="w-5 h-5" />}
        label="Mapa"
        href="/mapa"
        active={activeTab === "mapa"}
      />
      <NavItem
        icon={<Users className="w-5 h-5" />}
        label="Eleitores"
        href="/eleitores"
        active={activeTab === "eleitores"}
        badge={badges?.eleitores}
      />
      <NavItem
        icon={<Calendar className="w-5 h-5" />}
        label="Agenda"
        href="/agenda"
        active={activeTab === "agenda"}
        badge={badges?.agenda}
      />
      <NavItem
        icon={<Menu className="w-5 h-5" />}
        label="Mais"
        href="/mais"
        active={activeTab === "mais"}
      />
    </nav>
  );
}

// ============================================
// 🔘 FAB - Floating Action Button
// ============================================

interface FABProps {
  icon?: React.ReactNode;
  onClick?: () => void;
  label?: string;
  variant?: "primary" | "secondary";
  className?: string;
}

export function FAB({ 
  icon = <Plus className="w-6 h-6" />, 
  onClick, 
  label,
  variant = "primary",
  className 
}: FABProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label || "Ação principal"}
      className={cn(
        "fab",
        variant === "secondary" && "bg-white text-qg-blue-600 border-2 border-qg-blue-600",
        className
      )}
    >
      {icon}
    </button>
  );
}

// ============================================
// 📄 Bottom Sheet
// ============================================

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  snapPoints?: ("full" | "half" | "auto")[];
  initialSnap?: number;
}

export function BottomSheet({ 
  isOpen, 
  onClose, 
  children, 
  title,
  snapPoints = ["auto"],
}: BottomSheetProps) {
  const [mounted, setMounted] = React.useState(false);
  const sheetRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!mounted) return null;

  const getSnapHeight = () => {
    const snap = snapPoints[0];
    switch (snap) {
      case "full":
        return "calc(100vh - 3rem)";
      case "half":
        return "50vh";
      default:
        return "auto";
    }
  };

  const content = (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-sheet bg-black/50 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "bottom-sheet",
          "transform transition-transform duration-300 ease-out-expo",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
        style={{ maxHeight: getSnapHeight() }}
      >
        {/* Handle */}
        <div className="bottom-sheet-handle" />

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 pb-4 border-b border-slate-200">
            <h2 className="text-lg font-medium text-slate-900">{title}</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full active:bg-slate-100"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto overscroll-contain" style={{ maxHeight: "calc(100% - 3rem)" }}>
          {children}
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
}

// ============================================
// 📱 Mobile Header
// ============================================

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  transparent?: boolean;
}

export function MobileHeader({
  title,
  subtitle,
  showBack,
  onBack,
  rightAction,
  transparent,
}: MobileHeaderProps) {
  return (
    <header
      className={cn(
        "mobile-header",
        transparent && "bg-transparent border-transparent"
      )}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={onBack}
            className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full active:bg-slate-100"
          >
            <ChevronLeft className="w-6 h-6 text-slate-700" />
          </button>
        )}
        <div>
          <h1 className="text-lg font-medium text-slate-900 leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-slate-500">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right */}
      {rightAction && (
        <div className="flex items-center gap-2">
          {rightAction}
        </div>
      )}
    </header>
  );
}

// ============================================
// 🔍 Mobile Search Header
// ============================================

interface SearchHeaderProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  autoFocus?: boolean;
}

export function SearchHeader({
  placeholder = "Buscar...",
  value,
  onChange,
  onFocus,
  onBlur,
  autoFocus,
}: SearchHeaderProps) {
  return (
    <div className="sticky top-0 z-header bg-white border-b border-slate-200 pt-safe">
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="search"
            inputMode="search"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            autoFocus={autoFocus}
            className="input-touch pl-12"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================
// 📝 Pull to Refresh
// ============================================

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [pullDistance, setPullDistance] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const startY = React.useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY.current === 0) return;
    
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.current;
    
    if (distance > 0 && containerRef.current?.scrollTop === 0) {
      setPullDistance(Math.min(distance * 0.4, 80));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 60 && !isRefreshing) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
    setPullDistance(0);
    startY.current = 0;
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-y-auto overscroll-contain"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Refresh indicator */}
      <div
        className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center transition-all duration-200"
        style={{
          top: pullDistance > 0 ? pullDistance - 40 : -40,
          opacity: pullDistance > 30 ? 1 : 0,
        }}
      >
        <div className={cn("pull-indicator", isRefreshing && "animate-spin")}>
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: pullDistance === 0 ? "transform 0.2s ease-out" : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ============================================
// 🏷️ Filter Chips
// ============================================

interface FilterChipProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

export function FilterChip({ children, active, onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={active ? "filter-chip-active" : "filter-chip"}
    >
      {children}
    </button>
  );
}

interface FilterChipsProps {
  children: React.ReactNode;
  className?: string;
}

export function FilterChips({ children, className }: FilterChipsProps) {
  return (
    <div
      className={cn(
        "flex gap-2 overflow-x-auto scrollbar-hide",
        "-mx-4 px-4 pb-1",
        className
      )}
    >
      {children}
    </div>
  );
}

// ============================================
// 📭 Empty State
// ============================================

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-text">{description}</p>}
      {action && (
        <button onClick={action.onClick} className="btn-primary mt-6">
          {action.label}
        </button>
      )}
    </div>
  );
}

// ============================================
// 💀 Skeleton Loading
// ============================================

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("skeleton", className)} />;
}

export function EleitorSkeleton() {
  return (
    <div className="list-item-touch">
      <Skeleton className="w-12 h-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

export function EleitorListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: count }).map((_, i) => (
        <EleitorSkeleton key={i} />
      ))}
    </div>
  );
}
