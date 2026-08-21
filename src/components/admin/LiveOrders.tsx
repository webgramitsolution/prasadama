import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Radio, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface LiveOrder {
  id: string;
  order_number: string | null;
  total: number | null;
  total_amount: number | null;
  discount_amount: number | null;
  status: string | null;
  payment_status: string | null;
  created_at: string;
  shipping_address: any;
  billing_address: any;
}

const statusClass = (status?: string | null) =>
  cn(
    "text-[10px] px-2 py-0.5 rounded-full capitalize",
    status === "delivered" && "bg-success/10 text-success",
    status === "processing" && "bg-warning/10 text-warning",
    status === "pending" && "bg-muted text-muted-foreground",
    status === "confirmed" && "bg-primary/10 text-primary",
    status === "shipped" && "bg-accent/10 text-accent"
  );

const customerName = (o: LiveOrder) =>
  o.billing_address?.full_name ||
  o.billing_address?.name ||
  o.shipping_address?.full_name ||
  o.shipping_address?.name ||
  "Guest";

export function LiveOrders() {
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const flashRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let active = true;

    const load = async () => {
      const { data } = await supabase
        .from("orders")
        .select(
          "id, order_number, total, total_amount, discount_amount, status, payment_status, created_at, shipping_address, billing_address"
        )
        .order("created_at", { ascending: false })
        .limit(10);
      if (active) {
        setOrders((data as LiveOrder[]) || []);
        setLoading(false);
      }
    };
    load();

    const channel = supabase
      .channel("admin-live-orders")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const row = payload.new as LiveOrder;
          flashRef.current.add(row.id);
          setOrders((prev) => [row, ...prev.filter((o) => o.id !== row.id)].slice(0, 10));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          const row = payload.new as LiveOrder;
          setOrders((prev) => prev.map((o) => (o.id === row.id ? { ...o, ...row } : o)));
        }
      )
      .subscribe((status) => setLive(status === "SUBSCRIBED"));

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Radio className={cn("h-5 w-5", live && "text-success animate-pulse")} /> Live Orders
        </CardTitle>
        <Badge variant={live ? "default" : "outline"} className="text-[10px]">
          {live ? "Live" : "Connecting"}
        </Badge>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : orders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No orders yet</p>
        ) : (
          <div className="divide-y divide-border">
            {orders.map((o) => (
              <Link
                key={o.id}
                to="/admin/orders"
                className={cn(
                  "flex items-center justify-between py-2.5 gap-3 hover:bg-muted/40 rounded-md px-1 transition-colors",
                  flashRef.current.has(o.id) && "bg-success/5"
                )}
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{customerName(o)}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {o.order_number} · {new Date(o.created_at).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-sm text-foreground">
                    ₹{Number(o.total ?? o.total_amount ?? 0).toLocaleString("en-IN")}
                  </p>
                  <div className="flex items-center gap-1 justify-end mt-0.5">
                    {Number(o.discount_amount) > 0 && (
                      <span className="text-[10px] text-success">
                        -₹{Number(o.discount_amount).toLocaleString("en-IN")}
                      </span>
                    )}
                    <span className={statusClass(o.status)}>{o.status}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
