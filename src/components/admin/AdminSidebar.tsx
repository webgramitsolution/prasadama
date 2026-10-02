import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  Layers,
  Users,
  ShoppingCart,
  FileText,
  Bell,
  Settings,
  MessageSquare,
  ChevronLeft,
  LogOut,
  Tag,
  Star,
  PanelTop,
  Image,
  Megaphone,
  Ticket,
  MapPin,
  ChevronDown,
  SlidersHorizontal,
  Video,
  ShieldAlert,
  Activity,
  Mail,
  Bot,
  Inbox,
  Newspaper,
  HeartHandshake,
  Receipt,
  Truck,
  UserCog,
  Webhook,
  Store,

} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";


const productSubItems = [
  { icon: Package, label: "All Products", href: "/admin/products" },
  { icon: Layers, label: "Categories", href: "/admin/categories" },
  { icon: Tag, label: "Brands", href: "/admin/brands" },
];

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Users, label: "Users", href: "/admin/users" },
  { icon: ShoppingCart, label: "Orders", href: "/admin/orders" },
  { icon: FileText, label: "RFQ Requests", href: "/admin/rfq" },

  { icon: Image, label: "Hero Slides & Banners", href: "/admin/hero-slides" },
  { icon: Store, label: "Homepage Merchandising", href: "/admin/home-merchandising" },
  { icon: Video, label: "Product Reels", href: "/admin/reels" },
  { icon: Ticket, label: "Coupons", href: "/admin/coupons" },
  { icon: MapPin, label: "Delivery Pincodes", href: "/admin/pincodes" },
  { icon: Star, label: "Reviews", href: "/admin/reviews" },
  { icon: Newspaper, label: "Blog", href: "/admin/blog" },
  { icon: HeartHandshake, label: "Trusted by Families", href: "/admin/family-testimonials" },
  { icon: PanelTop, label: "Custom Tabs", href: "/admin/custom-tabs" },
  { icon: MessageSquare, label: "Chat", href: "/admin/chat" },
  { icon: Inbox, label: "Contact Inquiries", href: "/admin/contact-inquiries" },
    
    { icon: Mail, label: "OTP Logs", href: "/admin/otp-logs" },
    { icon: Mail, label: "Email & SMTP", href: "/admin/email-settings" },
    { icon: MessageSquare, label: "SMS Logs", href: "/admin/sms-logs" },
    { icon: ShieldAlert, label: "Security Logs", href: "/admin/security-logs" },
   { icon: Bell, label: "Notifications", href: "/admin/notifications" },
  { icon: UserCog, label: "Roles", href: "/admin/roles" },
  { icon: Truck, label: "Ekart Settings", href: "/admin/ekart-settings" },
  { icon: Activity, label: "Ekart Logs", href: "/admin/ekart-logs" },
  { icon: Webhook, label: "Webhook Logs", href: "/admin/webhook-logs" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },

];

// Dev-only: warn if duplicate hrefs or labels sneak in, and dedupe by href defensively.
const seenHrefs = new Set<string>();
const seenLabels = new Set<string>();
const dedupedMenuItems = menuItems.filter((item) => {
  if (seenHrefs.has(item.href)) {
    if (import.meta.env.DEV) {
      console.warn(`[AdminSidebar] Duplicate href removed: ${item.href} (${item.label})`);
    }
    return false;
  }
  if (seenLabels.has(item.label) && import.meta.env.DEV) {
    console.warn(`[AdminSidebar] Duplicate label detected: ${item.label} → ${item.href}`);
  }
  seenHrefs.add(item.href);
  seenLabels.add(item.label);
  return true;
});


interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  const location = useLocation();
  const { signOut } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      const { count } = await supabase
        .from("chat_conversations")
        .select("*", { count: 'exact', head: true })
        .eq("is_read", false);
      setUnreadCount(count || 0);
    };

    fetchUnread();

    const channel = supabase
      .channel("admin-sidebar-chat")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_conversations" }, () => {
        fetchUnread();
      });
      
    channel.subscribe();

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, []);
  const isProductSection = location.pathname === "/admin/products" || location.pathname === "/admin/categories" || location.pathname === "/admin/brands";
  const [productsOpen, setProductsOpen] = useState(isProductSection);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar flex flex-col transition-all duration-300 z-50",
        collapsed ? "w-[56px]" : "w-52"
      )}
    >
      {/* Logo Area */}
      <div className={cn(
        "h-12 flex items-center border-b border-sidebar-border bg-white",
        collapsed ? "justify-center px-1.5 gap-1" : "justify-between px-3"
      )}>
        {!collapsed ? (
          <Link to="/" className="flex items-center">
            <img
              src="/__l5e/assets-v1/d790c6ca-3f3e-4a9a-a2eb-aa297ef27f6b/prasadam-logo-transparent.png"
              alt="Prasadam"
              className="h-8 w-auto object-contain"
            />
          </Link>
        ) : (
          <>
            <Link to="/" className="flex items-center">
              <img
                src="/favicon.png"
                alt="Prasadam"
                className="h-10 w-10 object-contain"
              />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="text-sidebar-foreground hover:bg-sidebar-accent h-10 w-10"
            >
              <ChevronLeft className="h-5 w-5 rotate-180" />
            </Button>
          </>
        )}
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="text-sidebar-foreground hover:bg-sidebar-accent h-7 w-7"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>


      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-1.5">
        <ul className="space-y-0.5">
          {/* Dashboard */}
          <li>
            <Link
              to="/admin"
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors text-xs",
                location.pathname === "/admin"
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <LayoutDashboard className={cn("h-4 w-4 flex-shrink-0", collapsed && "mx-auto")} />
              {!collapsed && <span className="font-medium">Dashboard</span>}
            </Link>
          </li>

          {/* Products Dropdown */}
          <li>
            <button
              onClick={() => !collapsed && setProductsOpen(!productsOpen)}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors text-xs",
                isProductSection
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Package className={cn("h-4 w-4 flex-shrink-0", collapsed && "mx-auto")} />
              {!collapsed && (
                <>
                  <span className="font-medium flex-1 text-left">Products</span>
                  <ChevronDown className={cn("h-3 w-3 transition-transform", productsOpen && "rotate-180")} />
                </>
              )}
            </button>
            {!collapsed && productsOpen && (
              <ul className="ml-5 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-2">
                {productSubItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        to={item.href}
                        className={cn(
                          "flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] transition-colors",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <item.icon className="h-3.5 w-3.5 flex-shrink-0" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>

          {/* Rest of menu items */}
          {dedupedMenuItems.slice(1).map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== "/admin" && location.pathname.startsWith(item.href));
            
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors text-xs",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <div className="relative">
                    <item.icon className={cn("h-4 w-4 flex-shrink-0", collapsed && "mx-auto")} />
                    {item.label === "Chat" && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-shop text-[8px] font-bold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  {!collapsed && <span className="font-medium">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-sidebar-border">
        <button
          type="button"
          onClick={signOut}
          className={cn(
            "flex w-full items-center gap-2 px-2 py-1.5 rounded-md text-xs text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          )}
        >
          <LogOut className={cn("h-4 w-4 flex-shrink-0", collapsed && "mx-auto")} />
          {!collapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
