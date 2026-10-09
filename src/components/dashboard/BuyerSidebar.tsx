import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  User,
  ShoppingCart,
  FileQuestion,
  ChevronLeft,
  LogOut,
  LayoutDashboard,
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", tab: "overview" },
  { icon: ShoppingCart, label: "Orders", tab: "orders" },
  
  { icon: FileQuestion, label: "RFQ Requests", tab: "rfq" },
  { icon: FileText, label: "Invoices", tab: "invoices" },
  { icon: MessageSquare, label: "Chat Support", tab: "chat" },
  { icon: User, label: "Profile", tab: "profile" },
];


interface BuyerSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BuyerSidebar({ collapsed, onToggle, activeTab, onTabChange }: BuyerSidebarProps) {
  const { user, signOut } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchUnread = async () => {
      const { count } = await supabase
        .from("chat_conversations")
        .select("*", { count: 'exact', head: true })
        .eq("buyer_id", user.id)
        .eq("is_read", false);
      setUnreadCount(count || 0);
    };

    fetchUnread();

    const channel = supabase
      .channel("buyer-sidebar-chat")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_conversations", filter: `buyer_id=eq.${user.id}` }, () => {
        fetchUnread();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen flex flex-col transition-all duration-300 z-50",
        collapsed ? "w-[70px]" : "w-64"
      )}
      style={{ backgroundColor: "hsl(var(--accent))" }}
    >
      {/* Logo Area */}
      <div className={cn(
        "h-16 flex items-center border-b border-white/15 bg-white",
        collapsed ? "justify-center px-2 gap-1" : "justify-between px-4"
      )}>
        {!collapsed ? (
          <Link to="/" className="flex items-center">
            <img
              src="/cdn/prasadam-logo-transparent.png"
              alt="Prasadam"
              className="h-10 w-auto object-contain"
            />
          </Link>
        ) : (
          <>
            <Link to="/" className="flex items-center">
              <img
                src="/favicon.png"
                alt="Prasadam"
                className="h-12 w-12 object-contain"
                onError={(e) => {
                  e.currentTarget.src = "/favicon.ico";
                }}
              />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="text-black hover:bg-black/5 hover:text-black h-12 w-12"
            >
              <ChevronLeft className="h-6 w-6 rotate-180" />
            </Button>
          </>
        )}
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="text-black hover:bg-black/5 hover:text-black"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
      </div>


      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-2">
        <div>
          {!collapsed && (
            <p className="px-3 mb-2 text-xs font-semibold text-white/60 uppercase tracking-wider">
              My Account
            </p>
          )}
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isActive = "tab" in item && activeTab === item.tab;
              const baseClass = cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left",
                isActive
                  ? "bg-white text-black font-semibold"
                  : "text-white/85 hover:bg-white/10 hover:text-white"
              );
              const inner = (
                <>
                  <div className="relative">
                    <item.icon className={cn("h-5 w-5 flex-shrink-0", collapsed && "mx-auto")} />
                    {item.tab === 'chat' && unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-shop">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                </>
              );
              return (
                <li key={item.tab}>
                  <button onClick={() => onTabChange(item.tab)} className={baseClass}>
                    {inner}
                  </button>
                </li>
              );
            })}
          </ul>

        </div>
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-white/15">
        <Button
          variant="ghost"
          onClick={signOut}
          className={cn(
            "w-full justify-start gap-3 text-white/90 hover:bg-white/10 hover:text-white",
            collapsed && "justify-center"
          )}
        >
          <LogOut className={cn("h-5 w-5 flex-shrink-0", collapsed && "mx-auto")} />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </Button>
      </div>
    </aside>
  );
}
