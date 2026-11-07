import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ShoppingCart,
  Search,
  MoreHorizontal,
  Eye,
  Clock,
  CheckCircle,
  Package,
  Truck,
  XCircle,
  Loader2,
  Building2,
  Store,
  ArrowLeft,
  Download,
  Phone,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { generateGSTInvoice } from "@/lib/generateInvoice";
import { fetchStoreSettings } from "@/lib/storeSettings";
import { buildInvoiceItems, calculateOrderDiscount, getInvoicePartyData } from "@/lib/invoiceHelpers";
import { format } from "date-fns";

type Order = Tables<"orders">;
type OrderItem = Tables<"order_items">;

interface OrderWithProfile extends Order {
  profile?: {
    full_name: string | null;
    email: string;
    company_name: string | null;
    phone: string | null;
    gst_number: string | null;
  };
}

type PaymentKind = "paid" | "cod" | "pending";
function paymentKind(order: { payment_status?: string | null }): PaymentKind {
  const p = (order.payment_status || "").toLowerCase();
  if (p === "paid" || p === "captured") return "paid";
  if (p === "cod") return "cod";
  return "pending";
}
const paymentBadge: Record<PaymentKind, { label: string; className: string }> = {
  paid: { label: "Paid", className: "bg-success/10 text-success border-success/20" },
  cod: { label: "COD", className: "bg-accent/10 text-accent border-accent/20" },
  pending: { label: "Payment pending", className: "bg-warning/10 text-warning border-warning/20" },
};
function shipmentLabel(order: { ekart_sync_status?: string | null; tracking_number?: string | null; status?: string | null }) {
  if (order.status === "delivered") return { label: "Delivered", className: "bg-success/10 text-success" };
  if (order.status === "cancelled") return { label: "Cancelled", className: "bg-destructive/10 text-destructive" };
  if (order.tracking_number) return { label: `Shipped · ${order.tracking_number}`, className: "bg-primary/10 text-primary" };
  if (order.ekart_sync_status === "synced") return { label: "Shipment created", className: "bg-primary/10 text-primary" };
  if (order.ekart_sync_status === "failed") return { label: "Shipment failed", className: "bg-destructive/10 text-destructive" };
  return { label: "Not shipped", className: "bg-muted text-muted-foreground" };
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Clock, color: "bg-warning/10 text-warning", label: "Pending" },
  confirmed: { icon: CheckCircle, color: "bg-primary/10 text-primary", label: "Confirmed" },
  processing: { icon: Package, color: "bg-accent/10 text-accent", label: "Processing" },
  shipped: { icon: Truck, color: "bg-info/10 text-info", label: "Shipped" },
  delivered: { icon: CheckCircle, color: "bg-success/10 text-success", label: "Delivered" },
  cancelled: { icon: XCircle, color: "bg-destructive/10 text-destructive", label: "Cancelled" },
};

const orderStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

export default function AdminOrders() {
  const [orders, setOrders] = useState<OrderWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "cod" | "pending">("all");
  const [selectedOrder, setSelectedOrder] = useState<OrderWithProfile | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [ekartLogs, setEkartLogs] = useState<any[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();


  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data: ordersData, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const userIds = [...new Set(ordersData?.map(o => o.user_id).filter(Boolean))];
      let profiles: any[] = [];

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, full_name, email, company_name, phone, gst_number")
          .in("user_id", userIds);
        profiles = profilesData || [];
      }

      const ordersWithProfiles: OrderWithProfile[] = (ordersData || []).map(order => ({
        ...order,
        profile: profiles.find(p => p.user_id === order.user_id),
      }));

      setOrders(ordersWithProfiles);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({ title: "Error", description: "Failed to load orders", variant: "destructive" });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchOrders();

    // Subscribe to realtime changes for automatic updates
    const channel = supabase
      .channel('admin-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          // If the selected order was updated, update its local state too
          if (selectedOrder && payload.new && (payload.new as any).id === selectedOrder.id) {
            const updatedOrder = payload.new as OrderWithProfile;
            setSelectedOrder(prev => ({ ...prev!, ...updatedOrder }));
            
            // Notify the admin if the status changed in the background
            if (payload.old && (payload.old as any).status !== updatedOrder.status) {
              toast({
                title: `Order #${updatedOrder.order_number} Updated`,
                description: `Status changed to ${updatedOrder.status} by shipping provider.`,
              });
            }
          }
          
          // Refresh the list when any order changes
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedOrder?.id]);

  const handleViewOrder = async (order: OrderWithProfile) => {
    setSelectedOrder(order);
    try {
      const { data } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", order.id);
      setOrderItems(data || []);
      
      // Fetch Ekart logs
      const { data: logs } = await supabase
        .from("ekart_integration_logs")
        .select("*")
        .eq("order_id", order.id)
        .order("created_at", { ascending: false });
      setEkartLogs(logs || []);
    } catch (error) {
      console.error("Error fetching order items:", error);
    }
  };


  const handleDownloadInvoice = async (order: OrderWithProfile) => {
    try {
      const [invoiceResult, storeSettings, fallbackItemsResult] = await Promise.all([
        supabase.from("invoices").select("*").eq("order_id", order.id).maybeSingle(),
        fetchStoreSettings(),
        orderItems.length === 0
          ? supabase.from("order_items").select("*").eq("order_id", order.id)
          : Promise.resolve({ data: orderItems, error: null } as any),
      ]);

      const invoice = invoiceResult.data;
      const invoiceNumber = invoice?.invoice_number || `INV-${(order.order_number || "TEMP").replace("ORD-", "")}`;
      const shipping = order.shipping_address as any;
      const billing = order.billing_address as any;
      const itemsForInvoice = (fallbackItemsResult.data || orderItems) as any[];

      const productIds = [...new Set(itemsForInvoice.map((item: any) => item.product_id).filter(Boolean))] as string[];
      const { data: productsData } = productIds.length > 0
        ? await supabase.from("products").select("id, hsn_code").in("id", productIds)
        : { data: [] as any[] };

      const productHsnMap = new Map<string, string>();
      (productsData || []).forEach((product: any) => {
        if (product?.id && product?.hsn_code) {
          productHsnMap.set(product.id, product.hsn_code);
        }
      });

      const partyData = getInvoicePartyData({
        shippingAddress: shipping,
        billingAddress: billing,
        profile: order.profile,
        userEmail: order.profile?.email || null,
      });

      const discountTotal = calculateOrderDiscount({
        subtotal: Number(order.subtotal || 0),
        tax: Number(order.tax || 0),
        shipping: Number(order.shipping || 0),
        total: Number(order.total || 0),
      });

      const doc = generateGSTInvoice({
        invoice_number: invoiceNumber,
        order_number: order.order_number || "ORD-TEMP",
        date: format(new Date(order.created_at), "dd MMM yyyy"),
        buyer_name: partyData.buyerName,
        bill_to_name: partyData.billToName,
        ship_to_name: partyData.shipToName,
        buyer_email: partyData.buyerEmail,
        buyer_phone: partyData.buyerPhone,
        company_name: partyData.companyName,
        gst_number: partyData.gstNumber,
        billing_address: partyData.billingAddress,
        shipping_address: partyData.shippingAddress,
        items: buildInvoiceItems(itemsForInvoice, productHsnMap, Number(order.subtotal), discountTotal) as any,
        subtotal: Number(order.subtotal),
        tax: Number(order.tax || 0),
        gst_percentage: 18,
        shipping: Number(order.shipping || 0),
        total: Number(order.total),
        discount_total: discountTotal,
        ...storeSettings,
      });

      (await doc).save(`Invoice-${order.order_number}.pdf`);
      toast({ title: "Invoice Downloaded", description: `PDF saved as Invoice-${order.order_number}.pdf` });
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast({ title: "Error", description: "Failed to download invoice", variant: "destructive" });
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      const { data, error } = await supabase.functions.invoke("update-order-status", { body: { order_id: orderId, status: newStatus } });
      if (error || !data?.success) throw new Error(data?.error || error?.message || "Failed to update order");

      toast({ title: "Order Updated", description: `Order status changed to ${newStatus}` });
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus as any } : null);
      }
    } catch (error: any) {
      console.error("Error updating order:", error);
      // Enhanced logging for diagnosis
      if (error.context) console.error("Error context:", error.context);
      
      toast({ 
        title: "Error", 
        description: error?.message || "Failed to update order. Check console for details.", 
        variant: "destructive" 
      });
    }
    setIsUpdating(false);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = (order.order_number || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order as any).profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order as any).profile?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesPayment = paymentFilter === "all" || paymentKind(order) === paymentFilter;
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const paymentCounts = {
    all: orders.length,
    paid: orders.filter(o => paymentKind(o) === "paid").length,
    cod: orders.filter(o => paymentKind(o) === "cod").length,
    pending: orders.filter(o => paymentKind(o) === "pending").length,
  };

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    processing: orders.filter(o => ["confirmed", "processing", "shipped"].includes(o.status || "")).length,
    completed: orders.filter(o => o.status === "delivered").length,
  };

  // If an order is selected, show inline detail view
  if (selectedOrder) {
    const status = statusConfig[selectedOrder.status || "pending"];
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Update */}
            <Card className="shadow-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={paymentBadge[paymentKind(selectedOrder)].className}>
                      {paymentBadge[paymentKind(selectedOrder)].label}
                    </Badge>
                    <Badge className={cn("gap-1", status?.color)}>
                      {status?.label}
                    </Badge>
                    <span className="text-sm text-muted-foreground">Current Status</span>
                  </div>
                  <Select
                    value={selectedOrder.status || "pending"}
                    onValueChange={(v) => handleUpdateStatus(selectedOrder.id, v)}
                    disabled={isUpdating}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {orderStatuses.map(s => (
                        <SelectItem key={s} value={s}>{statusConfig[s]?.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="mt-4 pt-4 border-t flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                      EKART SYNC STATUS
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn(
                        "text-[10px] px-1.5 h-5",
                        selectedOrder.ekart_sync_status === 'synced' ? "bg-green-50 text-green-700 border-green-200" :
                        selectedOrder.ekart_sync_status === 'failed' ? "bg-red-50 text-red-700 border-red-200" :
                        "bg-gray-50 text-gray-700 border-gray-200"
                      )}>
                        {selectedOrder.ekart_sync_status?.toUpperCase() || 'NOT SYNCED'}
                      </Badge>
                      {selectedOrder.ekart_last_attempt_at && (
                        <span className="text-[10px] text-muted-foreground">
                          Last: {new Date(selectedOrder.ekart_last_attempt_at).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    {selectedOrder.ekart_last_error && (
                      <p className="text-[10px] text-destructive mt-1 max-w-[200px] truncate" title={selectedOrder.ekart_last_error}>
                        Error: {selectedOrder.ekart_last_error}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                      disabled={isUpdating}
                      onClick={async () => {
                        setIsUpdating(true);
                        try {
                          const { data, error } = await supabase.functions.invoke("ekart-create-shipment", {
                            body: { order_id: selectedOrder.id },
                          });
                          if (error) throw error;
                          if (data.error) throw new Error(data.error);
                          
                          toast({ 
                            title: data.already ? "Already Synced" : "Ekart Sync Success", 
                            description: `Tracking ID: ${data.tracking_id}` 
                          });
                          fetchOrders();
                          handleViewOrder(selectedOrder);
                        } catch (err: any) {
                          toast({ title: "Sync Failed", description: err.message || "Ekart error", variant: "destructive" });
                        } finally {
                          setIsUpdating(false);
                        }
                      }}
                    >
                      <Truck className="h-4 w-4" />
                      Sync to Ekart
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-2"
                      onClick={async () => {
                        try {
                          let notificationType = selectedOrder.status === 'pending' ? 'new_order' : `order_${selectedOrder.status || 'processing'}`;
                          if (notificationType === 'confirmed') notificationType = 'order_confirmed';
                          if (notificationType === 'shipped') notificationType = 'order_shipped';
                          if (notificationType === 'delivered') notificationType = 'order_delivered';
                          if (notificationType === 'cancelled') notificationType = 'order_cancelled';

                          const { data, error } = await supabase.functions.invoke("send-order-notification", {
                            body: {
                              type: notificationType,
                              order_id: selectedOrder.id,
                            },
                          });
                          if (error) throw error;
                          if (data?.success !== true) throw new Error(data?.error || 'Email delivery failed');
                          
                          toast({ title: "Email Resent", description: `Notification (${notificationType}) has been sent.` });
                        } catch (err) {
                          toast({ title: "Failed to resend", description: "Check SMTP configuration.", variant: "destructive" });
                        }
                      }}
                    >
                      <Mail className="h-4 w-4" />
                      Resend Email
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card className="shadow-card">
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-4">Items</h4>
                <div className="space-y-3">
                  {orderItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        {item.variation_details && (
                          <p className="text-sm text-muted-foreground">{item.variation_details}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold">₹{Number(item.total_price).toLocaleString("en-IN")}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} × ₹{Number(item.unit_price).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card className="shadow-card">
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-4">Order Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{Number(selectedOrder.subtotal).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>₹{Number(selectedOrder.tax || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>₹{Number(selectedOrder.shipping || 0).toLocaleString("en-IN")}</span>
                  </div>
                  {Number(selectedOrder.discount_amount || 0) > 0 && (
                    <div className="flex justify-between text-success">
                      <span>Discount{selectedOrder.coupon_id ? ` (${selectedOrder.coupon_id.slice(0, 8)})` : ""}</span>
                      <span>-₹{Number(selectedOrder.discount_amount).toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t font-bold text-base">
                    <span>Total</span>
                    <span>₹{Number(selectedOrder.total).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Customer Info */}
          <div className="space-y-6">
            {/* Ekart Sync Timeline */}
            <Card className="shadow-card overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Ekart Sync Timeline
                  </h4>
                  {selectedOrder.ekart_sync_status && (
                    <Badge className={selectedOrder.ekart_sync_status === 'synced' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}>
                      {selectedOrder.ekart_sync_status}
                    </Badge>
                  )}

                </div>
                <div className="space-y-4">
                  {ekartLogs.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic text-center py-4">No sync attempts recorded.</p>
                  ) : (
                    ekartLogs.map((log, idx) => (
                      <div key={log.id} className="relative pl-6 pb-4 border-l last:pb-0 last:border-l-transparent">
                        <div className={`absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full ${log.success ? 'bg-success' : 'bg-destructive'}`} />
                        <div className="text-xs text-muted-foreground mb-1">
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                        <div className="text-sm font-medium flex items-center justify-between">
                          <span>{log.action}</span>
                          {log.status_code && <span className="text-[10px] px-1 bg-secondary rounded">{log.status_code}</span>}
                        </div>
                        {log.error_message && (
                          <div className="text-xs text-destructive mt-1 bg-destructive/5 p-2 rounded border border-destructive/10 break-words">
                            {log.error_message}
                          </div>
                        )}
                        {!log.success && log.request_payload && (
                          <details className="mt-2">
                            <summary className="text-[10px] text-muted-foreground cursor-pointer hover:underline">View Payload</summary>
                            <pre className="text-[9px] mt-1 p-2 bg-secondary/50 rounded overflow-x-auto whitespace-pre-wrap">
                              {JSON.stringify(log.request_payload, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>


            <Card className="shadow-card">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Customer</h4>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleDownloadInvoice(selectedOrder)}>
                    <Download className="h-3.5 w-3.5" />
                    Invoice
                  </Button>
                </div>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-medium">{(selectedOrder.billing_address as any)?.full_name || (selectedOrder.shipping_address as any)?.full_name || selectedOrder.profile?.full_name || "Guest"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{(selectedOrder.billing_address as any)?.email || selectedOrder.profile?.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{(selectedOrder.billing_address as any)?.phone || (selectedOrder.shipping_address as any)?.phone || selectedOrder.profile?.phone || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Company</p>
                    <p className="font-medium">{(selectedOrder.billing_address as any)?.company || selectedOrder.profile?.company_name || "N/A"}</p>
                  </div>
                  {((selectedOrder.billing_address as any)?.gst_number || selectedOrder.profile?.gst_number) && (
                    <div>
                      <p className="text-muted-foreground">GST Number</p>
                      <p className="font-medium">{(selectedOrder.billing_address as any)?.gst_number || selectedOrder.profile?.gst_number}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">Buyer Type</p>
                    <Badge className="bg-primary/10 text-primary">Buyer</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {selectedOrder.shipping_address && (
              <Card className="shadow-card">
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-4">Shipping Address</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {typeof selectedOrder.shipping_address === 'object'
                      ? Object.values(selectedOrder.shipping_address as Record<string, string>).filter(Boolean).join(', ')
                      : String(selectedOrder.shipping_address)}
                  </p>
                </CardContent>
              </Card>
            )}

            {(selectedOrder as any).notes && (
              <Card className="shadow-card">
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-4">Notes</h4>
                  <p className="text-sm text-muted-foreground">{(selectedOrder as any).notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: stats.total, icon: ShoppingCart, color: "bg-primary/10 text-primary" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "bg-warning/10 text-warning" },
          { label: "In Progress", value: stats.processing, icon: Truck, color: "bg-accent/10 text-accent" },
          { label: "Delivered", value: stats.completed, icon: CheckCircle, color: "bg-success/10 text-success" },
        ].map(s => (
          <Card key={s.label} className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", s.color.split(" ")[0])}>
                  <s.icon className={cn("h-6 w-6", s.color.split(" ")[1])} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by payment">
            {([["all", "All orders"], ["paid", "Paid"], ["cod", "Cash on delivery"], ["pending", "Pending payment"]] as const).map(([key, label]) => (
              <Button
                key={key}
                type="button"
                role="tab"
                aria-selected={paymentFilter === key}
                size="sm"
                variant={paymentFilter === key ? "default" : "outline"}
                onClick={() => setPaymentFilter(key)}
              >
                {label} <span className="ml-1.5 rounded-full bg-background/20 px-1.5 text-xs">{paymentCounts[key]}</span>
              </Button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order number or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {orderStatuses.map(status => (
                  <SelectItem key={status} value={status}>
                    {statusConfig[status]?.label || status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="shadow-card">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No orders found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Order status</TableHead>
                  <TableHead>Shipment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map(order => {
                  const st = statusConfig[order.status || "pending"] || { icon: Package, color: "bg-gray-100", label: "Pending" };
                  const StatusIcon = (st.icon as any) || Package;
                  return (
                    <TableRow key={order.id} className="cursor-pointer" onClick={() => handleViewOrder(order)}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.profile?.full_name || "Guest"}</p>
                          <p className="text-sm text-muted-foreground">{order.profile?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold">₹{Number(order.total).toLocaleString("en-IN")}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={paymentBadge[paymentKind(order)].className}>{paymentBadge[paymentKind(order)].label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("gap-1", st.color)}>
                          <StatusIcon className="h-3 w-3" />
                          {st.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("border-transparent", shipmentLabel(order).className)}>{shipmentLabel(order).label}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewOrder(order); }}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {orderStatuses
                              .filter(s => s !== order.status)
                              .map(s => (
                                <DropdownMenuItem key={s} onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, s); }}>
                                  Mark as {statusConfig[s]?.label}
                                </DropdownMenuItem>
                              ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
