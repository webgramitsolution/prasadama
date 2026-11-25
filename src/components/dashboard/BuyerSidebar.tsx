import { useState, useEffect } from "react";
import {
  FileText,
  ShoppingCart,
  FileQuestion,
  LogOut,
  LayoutDashboard,
  MessageSquare,
  MapPin, Star, Settings, CircleHelp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", tab: "overview" },
  { icon: ShoppingCart, label: "My Orders", tab: "orders" },
  { icon: MapPin, label: "My Addresses", tab: "addresses" },
  { icon: Star, label: "My Reviews", tab: "reviews" },
  { icon: FileQuestion, label: "RFQ Requests", tab: "rfq" },
  { icon: FileText, label: "My Invoices", tab: "invoices" },
  { icon: Settings, label: "Account Settings", tab: "profile" },
  { icon: CircleHelp, label: "Support", tab: "support" },
  { icon: MessageSquare, label: "Support Chat", tab: "chat" },
];

interface BuyerSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BuyerSidebar({ activeTab, onTabChange }: BuyerSidebarProps) {
  const { user, profile, signOut } = useAuth();
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

  const name = profile?.full_name || "My Account";
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join("").toUpperCase();

  return (
    <aside aria-label="My account" className="flex max-h-full w-full flex-col rounded-xl border border-[#eee4dd] bg-white shadow-sm text-foreground">
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-2">
        <div>
          <div className="flex items-center gap-3 p-3 pb-5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#d59a58] font-semibold text-white">{initials}</span>
            <div className="min-w-0"><p className="truncate text-sm font-semibold">{name}</p><p className="truncate text-xs text-muted-foreground">{user?.email}</p></div>
          </div>
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isActive = "tab" in item && activeTab === item.tab;
              const baseClass = cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left",
                isActive
                  ? "bg-[#fbe8e6] font-semibold text-[#850d12] hover:bg-[#fbe8e6] hover:text-[#850d12]"
                  : "text-slate-700 hover:bg-[#fcf4ee] hover:text-[#850d12]"
              );
              const inner = (
                <>
                  <div className="relative">
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {item.tab === 'chat' && unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#850d12] text-[10px] font-bold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium">{item.label}</span>
                </>
              );
              return (
                <li key={item.tab}>
                  <Button variant="ghost" aria-current={isActive ? "page" : undefined} onClick={() => onTabChange(item.tab)} className={cn(baseClass, "h-auto justify-start")}>
                    {inner}
                  </Button>
                </li>
              );
            })}
          </ul>

        </div>
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-[#eee4dd]">
        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full justify-start gap-3 text-[#850d12] hover:bg-[#fcf4ee] hover:text-[#850d12]"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm font-medium">Logout</span>
        </Button>
      </div>
    </aside>
  );
}
