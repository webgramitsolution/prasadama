import { useState, useEffect } from "react";
import {
  FileText,
  User,
  ShoppingCart,
  FileQuestion,
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
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BuyerSidebar({ activeTab, onTabChange }: BuyerSidebarProps) {
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
    <aside aria-label="My account" className="h-full w-full flex flex-col bg-accent text-accent-foreground">
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-2">
        <div>
            <p className="px-3 mb-2 text-xs font-semibold text-accent-foreground/60 uppercase tracking-wider">
              My Account
            </p>
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isActive = "tab" in item && activeTab === item.tab;
              const baseClass = cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left",
                isActive
                  ? "bg-card text-card-foreground font-semibold hover:bg-card hover:text-card-foreground"
                  : "text-accent-foreground/85 hover:bg-accent-foreground/10 hover:text-accent-foreground"
              );
              const inner = (
                <>
                  <div className="relative">
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {item.tab === 'chat' && unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-card text-[10px] font-bold text-accent">
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
      <div className="p-4 border-t border-accent-foreground/15">
        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full justify-start gap-3 text-accent-foreground/90 hover:bg-accent-foreground/10 hover:text-accent-foreground"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm font-medium">Logout</span>
        </Button>
      </div>
    </aside>
  );
}
