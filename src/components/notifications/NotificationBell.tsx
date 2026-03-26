import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, CheckCheck, Calendar, FileText, Megaphone, X, UserPlus, AlertTriangle, Shield, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { useGabineteConfig } from "@/hooks/useGabineteConfig";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const typeIcons: Record<string, React.ReactNode> = {
  agenda: <Calendar className="h-4 w-4 text-primary" />,
  oficio: <FileText className="h-4 w-4 text-amber-500" />,
  acao_coletiva: <Megaphone className="h-4 w-4 text-violet-500" />,
  alerta_exclusao: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  alerta_critico: <Shield className="h-4 w-4 text-red-500" />,
  cadastro_eleitor: <UserPlus className="h-4 w-4 text-emerald-500" />,
  status_demanda: <TrendingUp className="h-4 w-4 text-primary" />,
  oficio_assinado: <FileText className="h-4 w-4 text-emerald-500" />,
  geral: <Bell className="h-4 w-4 text-muted-foreground" />,
};

function NotificationItem({
  notification,
  onRead,
  onClick,
}: {
  notification: Notification;
  onRead: (id: string) => void;
  onClick: (n: Notification) => void;
}) {
  const icon = typeIcons[notification.type] || typeIcons.geral;
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <div
      className={`flex items-start gap-3 p-3 border-b border-border last:border-0 transition-colors duration-200 cursor-pointer hover:bg-accent/50 ${
        notification.is_read ? "opacity-60" : "bg-primary/5"
      }`}
      onClick={() => onClick(notification)}
    >
      <div className="flex h-8 w-8 items-center justify-center bg-muted rounded-full shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground leading-snug">{notification.title}</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
          {notification.message}
        </p>
        <p className="text-[10px] text-muted-foreground/70 mt-1">{timeAgo}</p>
      </div>
      {!notification.is_read && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={(e) => { e.stopPropagation(); onRead(notification.id); }}
          title="Marcar como lida"
        >
          <Check className="h-3.5 w-3.5 text-primary" />
        </Button>
      )}
    </div>
  );
}

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { config: gabConfig } = useGabineteConfig();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const partyColor = gabConfig?.cor_primaria || undefined;

  const handleNotificationClick = useCallback((n: Notification) => {
    if (!n.is_read) markAsRead(n.id);
    setOpen(false);
    const meta = n.metadata as any;
    if (meta?.demanda_id) {
      navigate(`/?demanda=${meta.demanda_id}`);
    } else if (meta?.eleitor_id) {
      navigate(`/eleitores?id=${meta.eleitor_id}`);
    }
  }, [markAsRead, navigate]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative flex h-9 w-9 items-center justify-center hover:bg-accent rounded-full transition-colors"
          aria-label="Notificações"
        >
          <Bell className="h-4.5 w-4.5" style={partyColor ? { color: partyColor } : undefined} />
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full text-white text-[9px] font-medium px-1 animate-scale-in"
              style={{ backgroundColor: partyColor || 'hsl(var(--destructive))' }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[340px] p-0 max-h-[70vh] flex flex-col"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-medium">Notificações</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-[10px] font-medium text-muted-foreground h-7 px-2"
              onClick={() => markAllAsRead()}
            >
              <CheckCheck className="h-3 w-3" /> Marcar todas
            </Button>
          )}
        </div>

        {/* List */}
        <ScrollArea className="flex-1 max-h-[50vh]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4">
              <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">Nenhuma notificação</p>
            </div>
          ) : (
            notifications.map((n) => (
              <NotificationItem key={n.id} notification={n} onRead={markAsRead} onClick={handleNotificationClick} />
            ))
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-border px-4 py-2">
            <p className="text-[10px] text-muted-foreground text-center font-medium">
              {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}` : "Tudo lido ✓"}
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}