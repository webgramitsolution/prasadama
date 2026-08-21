import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  IndianRupee, ShoppingCart, Users, Package, FileText, Loader2, Ticket, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { LiveOrders } from "@/components/admin/LiveOrders";

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  activeUsers: number;
  totalProducts: number;
  activeCoupons: number;
  pendingOrders: number;
}


interface RecentOrder {
  id: string;
  order_number: string;
  total: number;
  status: string;
  user_id: string | null;
  profile?: { full_name: string | null; company_name: string | null } | null;
}

interface PendingRFQ {
  id: string;
  rfq_number: string | null;
  full_name: string | null;
  product_name: string | null;
  quantity: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [pendingRFQs, setPendingRFQs] = useState<PendingRFQ[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    const [ordersRes, productsRes, usersRes, rfqRes, recentRes, couponsRes] = await Promise.all([
      supabase.from("orders").select("total, total_amount, status, payment_status"),
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("rfq_requests").select("id, rfq_number, full_name, product_name, quantity").eq("status", "pending").order("created_at", { ascending: false }).limit(5),
      supabase.from("orders").select("id, order_number, total, status, user_id").order("created_at", { ascending: false }).limit(5),
      supabase.rpc("list_all_coupons"),
    ]);

    const orders = ordersRes.data || [];
    const earned = orders.filter(o => o.payment_status === "paid" || o.status === "delivered");
    const totalRevenue = earned.reduce((sum, o) => sum + Number(o.total ?? o.total_amount ?? 0), 0);
    const pendingOrders = orders.filter(o => !o.status || ["pending", "processing", "confirmed"].includes(o.status)).length;

    const now = Date.now();
    const activeCoupons = ((couponsRes.data as any[]) || []).filter(c =>
      c.is_active &&
      (!c.expires_at || new Date(c.expires_at).getTime() >= now) &&
      (!c.starts_at || new Date(c.starts_at).getTime() <= now) &&
      (!c.usage_limit || Number(c.usage_count ?? c.used_count ?? 0) < Number(c.usage_limit))
    ).length;

    setStats({
      totalRevenue,
      totalOrders: orders.length,
      activeUsers: usersRes.count || 0,
      totalProducts: productsRes.count || 0,
      activeCoupons,
      pendingOrders,
    });


    const recent = recentRes.data || [];
    if (recent.length > 0) {
      const userIds = [...new Set(recent.map(o => o.user_id).filter(Boolean))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, company_name").in("user_id", userIds as string[]);
        const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
        setRecentOrders((recent as any[]).map(o => ({ ...o, profile: o.user_id ? profileMap.get(o.user_id) : null })));
      } else {
        setRecentOrders(recent as any[]);
      }
    }
    setPendingRFQs(rfqRes.data || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statCards = [
    { title: "Total Revenue", value: `₹${(stats?.totalRevenue || 0).toLocaleString("en-IN")}`, icon: IndianRupee, color: "text-success", bgColor: "bg-success/10" },
    { title: "Total Orders", value: (stats?.totalOrders || 0).toLocaleString(), icon: ShoppingCart, color: "text-accent", bgColor: "bg-accent/10" },
    { title: "Customers", value: (stats?.activeUsers || 0).toLocaleString(), icon: Users, color: "text-primary", bgColor: "bg-primary/10" },
    { title: "Products", value: (stats?.totalProducts || 0).toLocaleString(), icon: Package, color: "text-warning", bgColor: "bg-warning/10" },
    { title: "Active Coupons", value: (stats?.activeCoupons || 0).toLocaleString(), icon: Ticket, color: "text-accent", bgColor: "bg-accent/10" },
    { title: "Pending Orders", value: (stats?.pendingOrders || 0).toLocaleString(), icon: Clock, color: "text-warning", bgColor: "bg-warning/10" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">

        {statCards.map((stat, index) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.1 }}>
            <Card className="shadow-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                  </div>
                  <div className={cn("p-3 rounded-xl", stat.bgColor)}>
                    <stat.icon className={cn("h-6 w-6", stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.35 }}>
        <LiveOrders />
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.4 }}>
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" /> Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No orders yet</p>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="font-medium text-sm text-foreground">{order.profile?.full_name || order.profile?.company_name || "Guest"}</p>
                        <p className="text-xs text-muted-foreground">{order.order_number}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">₹{Number(order.total).toLocaleString("en-IN")}</p>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          order.status === "delivered" && "bg-success/10 text-success",
                          order.status === "processing" && "bg-warning/10 text-warning",
                          order.status === "pending" && "bg-muted text-muted-foreground",
                          order.status === "confirmed" && "bg-primary/10 text-primary",
                          order.status === "shipped" && "bg-accent/10 text-accent",
                        )}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.5 }}>
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" /> Pending RFQ Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingRFQs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No pending RFQs</p>
              ) : (
                <div className="space-y-4">
                  {pendingRFQs.map((rfq) => (
                    <div key={rfq.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="font-medium text-sm text-foreground">{rfq.full_name}</p>
                        <p className="text-xs text-muted-foreground">{rfq.product_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">{rfq.quantity.toLocaleString()} units</p>
                        <span className="text-xs text-accent">{rfq.rfq_number}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
