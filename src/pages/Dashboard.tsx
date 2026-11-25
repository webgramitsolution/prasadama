import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  FileText, 
  Download, 
  ShoppingCart,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Loader2,
  Menu,
  Home, LayoutGrid, Search,
  Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link, Navigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { RFQTab } from "@/components/dashboard/RFQTab";
import { AccountAddresses, AccountReviews, AccountSettings, AccountSupport, OrderProgress } from "@/components/dashboard/AccountSections";
import { BuyerSidebar } from "@/components/dashboard/BuyerSidebar";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { RelatedProducts } from "@/components/products/RelatedProducts";
import { useCart } from "@/contexts/CartContext";

type Order = Tables<"orders">;
type Invoice = Tables<"invoices">;
 
interface ExtendedProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  gst_number: string | null;
  avatar_url: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

const statusIcons: Record<string, React.ElementType> = {
  pending: Clock,
  confirmed: CheckCircle,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
};

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  confirmed: "bg-primary/10 text-primary",
  processing: "bg-accent/10 text-accent",
  shipped: "bg-info/10 text-info",
  delivered: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

export default function Dashboard() {
  const { user, profile, role, isLoading: authLoading, refreshProfile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [filter, setFilter] = useState("All Orders");
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState("all");
  const [itemsByOrder, setItemsByOrder] = useState<Record<string, Tables<"order_items">[]>>({});
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<Tables<"order_items">[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const { toast } = useToast();
  const { addToCart } = useCart();
  const [reordering, setReordering] = useState(false);
  const orderDetailsRequest = useRef(0);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    company_name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
    gst_number: "",
  });

  const updateProfileField = (field: keyof typeof profileForm, value: string) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  // Cast profile to extended type with all fields
  const extendedProfile = profile as unknown as ExtendedProfile | null;

  useEffect(() => {
    if (extendedProfile) {
      setProfileForm(prev => {
        // Only set if form is empty (initial load), don't override user edits
        if (prev.full_name || prev.phone || prev.address) return prev;
        return {
          full_name: extendedProfile.full_name || "",
          company_name: extendedProfile.company_name || "",
          phone: extendedProfile.phone || "",
          address: extendedProfile.address || "",
          city: extendedProfile.city || "",
          state: extendedProfile.state || "",
          country: extendedProfile.country || "",
          postal_code: extendedProfile.postal_code || "",
          gst_number: extendedProfile.gst_number || "",
        };
      });
    }
  }, [extendedProfile?.user_id]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`buyer-orders-${user.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [ordersRes, invoicesRes] = await Promise.all([
        supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("invoices")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      if (ordersRes.data) {
        setOrders(ordersRes.data);
        const ids = ordersRes.data.map(order => order.id);
        const { data } = ids.length ? await supabase.from("order_items").select("*").in("order_id", ids) : { data: [] };
        const grouped: Record<string, Tables<"order_items">[]> = {};
        for (const item of data ?? []) {
          if (item.order_id) (grouped[item.order_id] ??= []).push(item);
        }
        setItemsByOrder(grouped);
      }
      if (invoicesRes.data) setInvoices(invoicesRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
    setIsLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update(profileForm)
        .eq("user_id", user.id);

      if (error) throw error;

      await refreshProfile();
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive",
      });
    }
    setIsSaving(false);
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      const [{ generateGSTInvoice }, { fetchStoreSettings }, invoiceHelpers] = await Promise.all([
        import("@/lib/generateInvoice"),
        import("@/lib/storeSettings"),
        import("@/lib/invoiceHelpers"),
      ]);
      
      const [orderRes, itemsRes, storeSettings] = await Promise.all([
        supabase.from("orders").select("*").eq("id", invoice.order_id || "").single(),
        supabase.from("order_items").select("*").eq("order_id", invoice.order_id || ""),
        fetchStoreSettings(),
      ]);
      
      if (orderRes.error || !orderRes.data) throw new Error("Order not found");
      const order = orderRes.data;
      const items = (itemsRes.data || []) as any[];

      const productIds = [...new Set(items.map((item: any) => item.product_id).filter(Boolean))] as string[];
      const { data: productsData } = productIds.length > 0
        ? await supabase.from("products").select("id, hsn_code").in("id", productIds)
        : { data: [] as any[] };

      const productHsnMap = new Map<string, string>();
      (productsData || []).forEach((product: any) => {
        if (product?.id && product?.hsn_code) {
          productHsnMap.set(product.id, product.hsn_code);
        }
      });

      const shipping = order.shipping_address as any;
      const billing = order.billing_address as any;
      const partyData = invoiceHelpers.getInvoicePartyData({
        shippingAddress: shipping,
        billingAddress: billing,
        profile: extendedProfile,
        userEmail: extendedProfile?.email || null,
      });

      const discountTotal = invoiceHelpers.calculateOrderDiscount({
        subtotal: Number(order.subtotal || 0),
        tax: Number(order.tax || 0),
        shipping: Number(order.shipping || 0),
        total: Number(order.total || 0),
      });

      const doc = generateGSTInvoice({
        invoice_number: invoice.invoice_number || "INV-TEMP",
        order_number: order.order_number || "ORD-TEMP",
        date: new Date(invoice.created_at).toLocaleDateString("en-IN"),
        buyer_name: partyData.buyerName,
        bill_to_name: partyData.billToName,
        ship_to_name: partyData.shipToName,
        buyer_email: partyData.buyerEmail,
        buyer_phone: partyData.buyerPhone,
        company_name: partyData.companyName,
        gst_number: partyData.gstNumber,
        billing_address: partyData.billingAddress,
        shipping_address: partyData.shippingAddress,
        items: invoiceHelpers.buildInvoiceItems(items, productHsnMap, Number(order.subtotal), discountTotal) as any,
        subtotal: Number(order.subtotal),
        tax: Number(order.tax || 0),
        shipping: Number(order.shipping || 0),
        total: Number(order.total),
        discount_total: discountTotal,
        ...storeSettings,
      });
      
      (await doc).save(`${invoice.invoice_number}.pdf`);

      toast({
        title: "Invoice Downloaded",
        description: `Invoice ${invoice.invoice_number} has been downloaded as PDF.`,
      });
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast({
        title: "Error",
        description: "Failed to download invoice",
        variant: "destructive",
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  const viewOrder = async (order: Order) => {
    const request = ++orderDetailsRequest.current;
    setSelectedOrder(order);
    setOrderItems([]);
    setLoadingItems(true);
    const { data } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id);
    if (request !== orderDetailsRequest.current) return;
    setOrderItems(data || []);
    setLoadingItems(false);
  };

  const cancelOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", orderId);
      if (error) throw error;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "cancelled" as const } : o));
      if (selectedOrder?.id === orderId) setSelectedOrder(prev => prev ? { ...prev, status: "cancelled" as const } : null);
      toast({ title: "Order Cancelled", description: "Your order has been cancelled." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to cancel order", variant: "destructive" });
    }
  };

  const downloadOrderInvoice = async (order: Order) => {
    try {
      const [{ generateGSTInvoice }, { fetchStoreSettings }, invoiceHelpers] = await Promise.all([
        import("@/lib/generateInvoice"),
        import("@/lib/storeSettings"),
        import("@/lib/invoiceHelpers"),
      ]);
      
      const [{ data: items }, storeSettings] = await Promise.all([
        supabase.from("order_items").select("*").eq("order_id", order.id),
        fetchStoreSettings(),
      ]);

      const normalizedItems = (items || []) as any[];
      const productIds = [...new Set(normalizedItems.map((item: any) => item.product_id).filter(Boolean))] as string[];
      const { data: productsData } = productIds.length > 0
        ? await supabase.from("products").select("id, hsn_code").in("id", productIds)
        : { data: [] as any[] };

      const productHsnMap = new Map<string, string>();
      (productsData || []).forEach((product: any) => {
        if (product?.id && product?.hsn_code) {
          productHsnMap.set(product.id, product.hsn_code);
        }
      });

      const shipping = order.shipping_address as any;
      const billing = order.billing_address as any;
      const partyData = invoiceHelpers.getInvoicePartyData({
        shippingAddress: shipping,
        billingAddress: billing,
        profile: extendedProfile,
        userEmail: extendedProfile?.email || null,
      });

      const discountTotal = invoiceHelpers.calculateOrderDiscount({
        subtotal: Number(order.subtotal || 0),
        tax: Number(order.tax || 0),
        shipping: Number(order.shipping || 0),
        total: Number(order.total || 0),
      });

      const doc = generateGSTInvoice({
        invoice_number: `INV-${order.order_number || "TEMP"}`,
        order_number: order.order_number || "TEMP",
        date: new Date(order.created_at).toLocaleDateString("en-IN"),
        buyer_name: partyData.buyerName,
        bill_to_name: partyData.billToName,
        ship_to_name: partyData.shipToName,
        buyer_email: partyData.buyerEmail,
        buyer_phone: partyData.buyerPhone,
        company_name: partyData.companyName,
        gst_number: partyData.gstNumber,
        billing_address: partyData.billingAddress,
        shipping_address: partyData.shippingAddress,
        items: invoiceHelpers.buildInvoiceItems(normalizedItems, productHsnMap, Number(order.subtotal), discountTotal) as any,
        subtotal: Number(order.subtotal),
        tax: Number(order.tax || 0),
        shipping: Number(order.shipping || 0),
        total: Number(order.total),
        discount_total: discountTotal,
        ...storeSettings,
      });
      
      (await doc).save(`Invoice-${order.order_number}.pdf`);
      toast({ title: "Invoice Downloaded" });
    } catch {
      toast({ title: "Error", description: "Failed to download invoice", variant: "destructive" });
    }
  };

  const selectTab = (tab: string) => {
    orderDetailsRequest.current += 1;
    setSelectedOrder(null);
    setActiveTab(tab);
  };

  const reorder = async (items: Tables<"order_items">[]) => {
    setReordering(true);
    let added = 0;
    try {
      for (const item of items) {
        if (item.product_id && await addToCart(item.product_id, item.quantity, item.variation_id)) added += 1;
      }
    } finally {
      setReordering(false);
    }
    toast({ title: added ? "Items added to your cart" : "No items were added", description: `${added} of ${items.length} order lines added. Check your cart for current prices and availability.` });
  };

  const renderOrderCard = (order: Order) => {
    const items = itemsByOrder[order.id] ?? [];
    const status = String(order.status || "pending");
    const image = items.find(item => item.product_image)?.product_image;
    return (
      <article key={order.id} className="rounded-xl border border-[#eee4dd] bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold">Order #{order.order_number || order.id}</h3>
            <p className="text-sm text-muted-foreground">
              {new Date(order.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
              {" · "}{items.reduce((sum, item) => sum + item.quantity, 0)} items
              {" · ₹"}{Number(order.total).toLocaleString("en-IN")}
            </p>
          </div>
          <Badge className={cn("capitalize", statusColors[status] || "bg-emerald-50 text-emerald-800")}>
            {status.replaceAll("_", " ")}
          </Badge>
        </div>
        <div className="mt-4 flex gap-4">
          {image ? <img src={image} alt={items[0]?.product_name || ""} className="h-20 w-20 shrink-0 rounded-lg object-cover" loading="lazy" />
            : <div className="grid h-20 w-20 shrink-0 place-items-center rounded-lg bg-[#fbefe1] text-[#860d13]"><Package /></div>}
          <OrderProgress status={status} />
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          {status !== "cancelled" && status !== "delivered" && <Button asChild size="sm" className="bg-[#850d12] text-white hover:bg-[#6c090e]"><Link to={`/track-order/${encodeURIComponent(order.order_number || order.id)}`}>Track Order</Link></Button>}
          <Button variant="outline" size="sm" onClick={() => { setActiveTab("orders"); void viewOrder(order); }}>View Details</Button>
          {items.some(item => item.product_id) && <Button variant="outline" size="sm" disabled={reordering} onClick={() => reorder(items)}>{status === "delivered" ? "Buy Again" : "Reorder"}</Button>}
          {status === "delivered" && <Button variant="outline" size="sm" onClick={() => downloadOrderInvoice(order)}>Download Invoice</Button>}
        </div>
      </article>
    );
  };

  const lastPurchasedProduct = orders.flatMap(order => itemsByOrder[order.id] ?? []).find(item => item.product_id)?.product_id;
  const OverviewContent = () => (
    <div className="space-y-4">
      <section className="rounded-xl border border-[#eedac4] bg-gradient-to-r from-[#fff5e7] to-[#f4d3a9] p-5 sm:p-8">
        <p className="text-sm font-medium text-[#800b12]">My Account</p>
        <h1 className="mt-1 max-w-xl font-display text-3xl font-bold text-[#800b12] sm:text-4xl">Welcome back, {profile?.full_name || "Buyer"}!</h1>
      </section>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { name: "Track Order", icon: Truck, tab: "orders" },
          { name: "My Addresses", icon: MapPin, tab: "addresses" },
          { name: "My Reviews", icon: CheckCircle, tab: "reviews" },
          { name: "Account Settings", icon: User, tab: "profile" },
        ].map(({ name, icon: Icon, tab }) => (
          <button type="button" key={tab} onClick={() => selectTab(tab)} className="flex min-h-16 items-center gap-2 rounded-lg border border-[#eee4dd] bg-white p-3 text-left text-sm font-medium hover:border-[#b84d53]">
            <span className="rounded-full bg-[#fff0dd] p-2 text-[#840e14]"><Icon size={18} /></span>{name}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-[#800b12]">Recent Orders</h2>
        <Button variant="link" onClick={() => selectTab("orders")}>View All Orders</Button>
      </div>
      {isLoading ? <Loader2 className="animate-spin" aria-label="Loading orders" /> : orders.length ? orders.slice(0, 2).map(renderOrderCard) : (
        <Card><CardContent className="space-y-3 p-5"><p>You haven’t placed an order yet.</p><Button asChild><Link to="/products">Start Shopping</Link></Button></CardContent></Card>
      )}
      {lastPurchasedProduct && <RelatedProducts currentProductId={lastPurchasedProduct} compactTopOnMobile />}
    </div>
  );

  // Orders Tab Content
  const OrdersContent = () => {
    if (selectedOrder) {
      const StatusIcon = statusIcons[selectedOrder.status || "pending"];
      return (
        <div className="space-y-4">
          <Button variant="outline" size="sm" onClick={() => setSelectedOrder(null)}>
            ← Back to Orders
          </Button>
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle>{selectedOrder.order_number}</CardTitle>
                  <CardDescription>
                    Placed on {new Date(selectedOrder.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={cn("text-xs", statusColors[selectedOrder.status || "pending"])}>
                          {StatusIcon && <StatusIcon className="h-3 w-3 mr-1" />}
                    {selectedOrder.status}
                  </Badge>
                  {(selectedOrder.status === "pending" || selectedOrder.status === "confirmed") && (
                    <Button variant="destructive" size="sm" onClick={() => cancelOrder(selectedOrder.id)}>
                      <XCircle className="h-4 w-4 mr-1" /> Cancel Order
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => downloadOrderInvoice(selectedOrder)}>
                    <Download className="h-4 w-4 mr-1" /> Invoice PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingItems ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-semibold">Order Items</h3>
                  <div className="divide-y">
                    {orderItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between py-3">
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity} × ₹{Number(item.unit_price).toLocaleString()}</p>
                        </div>
                        <p className="font-semibold">₹{Number(item.total_price).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-4 space-y-1 text-sm">
                    <div className="flex justify-between"><span>Subtotal</span><span>₹{Number(selectedOrder.subtotal).toLocaleString()}</span></div>
                    {selectedOrder.tax && <div className="flex justify-between"><span>Tax (GST)</span><span>₹{Number(selectedOrder.tax).toLocaleString()}</span></div>}
                    {selectedOrder.shipping && <div className="flex justify-between"><span>Shipping</span><span>₹{Number(selectedOrder.shipping).toLocaleString()}</span></div>}
                    {selectedOrder.discount_amount && Number(selectedOrder.discount_amount) > 0 && (
                      <div className="flex justify-between text-success">
                        <span>Discount</span>
                        <span>-₹{Number(selectedOrder.discount_amount).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base pt-2 border-t text-accent"><span>Total</span><span>₹{Number(selectedOrder.total).toLocaleString()}</span></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - Number(period));
    const recent = orders.filter(order => period === "all" || new Date(order.created_at) >= cutoff);
    const tabs: Record<string, string[]> = {
      "All Orders": [], Processing: ["pending", "confirmed", "processing", "packed"],
      Shipped: ["shipped"], "Out for Delivery": ["out_for_delivery"], Delivered: ["delivered"], Cancelled: ["cancelled"],
    };
    const matches = (order: Order, statuses: string[]) => !statuses.length || statuses.includes(String(order.status || "pending"));
    const search = query.trim().toLowerCase();
    const visible = recent.filter(order => matches(order, tabs[filter] ?? []) && [
      order.order_number, order.id, ...(itemsByOrder[order.id] ?? []).map(item => item.product_name),
    ].some(value => value?.toLowerCase().includes(search)));

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><h1 className="font-display text-3xl font-bold text-[#800b12]">My Orders</h1>
          <p className="text-sm text-muted-foreground">View, track and manage your orders.</p></div>
          <div className="flex w-full gap-2 sm:w-auto">
            <label className="relative min-w-0 flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input aria-label="Search orders" value={query} onChange={event => setQuery(event.target.value)} placeholder="Order ID or product" className="bg-white pl-9" />
            </label>
            <select aria-label="Order date range" value={period} onChange={event => setPeriod(event.target.value)} className="rounded-md border bg-white px-2 text-sm">
              <option value="all">All dates</option><option value="6">Last 6 months</option><option value="12">Last year</option>
            </select>
          </div>
        </div>
        <div aria-label="Filter orders by status" className="flex gap-1 overflow-x-auto rounded-lg border bg-white p-1">
          {Object.entries(tabs).map(([label, statuses]) => <Button key={label} type="button" variant="ghost" aria-pressed={label === filter}
            className={cn("shrink-0 rounded-none border-b-2 border-transparent", label === filter && "border-[#870d15] text-[#870d15]")}
            onClick={() => setFilter(label)}>{label} ({recent.filter(order => matches(order, statuses)).length})</Button>)}
        </div>
        {isLoading ? <Loader2 className="animate-spin" aria-label="Loading orders" /> :
          visible.length ? visible.map(renderOrderCard) :
          <Card><CardContent className="p-5 text-sm">No orders match the selected filters.</CardContent></Card>}
      </div>
    );
  };

  // Invoices Tab Content
  const InvoicesContent = () => (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Invoices</CardTitle>
        <CardDescription>Download and manage your invoices</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No invoices yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 rounded-xl border bg-card hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{invoice.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(invoice.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-foreground">₹{Number(invoice.total).toLocaleString("en-IN")}</p>
                    <Badge
                      className={cn(
                        "text-xs",
                        invoice.status === "paid"
                          ? "bg-success/10 text-success"
                          : "bg-warning/10 text-warning"
                      )}
                    >
                      {invoice.status || "unpaid"}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDownloadInvoice(invoice)}
                    title="Download Invoice"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Profile Tab Content
  const ProfileContent = () => (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Profile Summary */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4">
              {extendedProfile?.avatar_url ? (
                <img src={extendedProfile.avatar_url} alt="Avatar" className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <div
                  className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center",
                    role === "shop" ? "bg-gradient-shop" : role === "retail" ? "bg-gradient-retail" : "bg-gradient-primary"
                  )}
                >
                  <User className="h-10 w-10 text-white" />
                </div>
              )}
              <label className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-accent flex items-center justify-center cursor-pointer hover:bg-accent-hover transition-colors">
                <Camera className="h-3.5 w-3.5 text-accent-foreground" />
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !user) return;
                    if (!["image/jpeg", "image/png"].includes(file.type) || file.size > 2 * 1024 * 1024) {
                      toast({ title: "Choose a JPG or PNG up to 2 MB", variant: "destructive" });
                      return;
                    }
                    const ext = file.type === "image/png" ? "png" : "jpg";
                    // Store avatars in the private "avatars" bucket, scoped to the
                    // owner's user id so RLS prevents cross-user access.
                    const path = `${user.id}/avatar_${Date.now()}.${ext}`;
                    const { error: uploadError } = await supabase.storage
                      .from('avatars')
                      .upload(path, file, { upsert: true });
                    if (uploadError) {
                      console.error(uploadError);
                      toast({ title: "Upload Failed", description: uploadError.message, variant: "destructive" });
                      return;
                    }
                    // Private bucket → use a long-lived signed URL for display.
                    const { data: signed, error: signError } = await supabase.storage
                      .from('avatars')
                      .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
                    if (signError || !signed?.signedUrl) {
                      console.error(signError);
                      toast({ title: "Upload Failed", description: signError?.message || "Could not sign avatar URL", variant: "destructive" });
                      return;
                    }
                    await supabase.from('profiles').update({ avatar_url: signed.signedUrl }).eq('user_id', user.id);
                    await refreshProfile();
                    toast({ title: "Avatar Updated", description: "Your profile image has been updated." });
                  }}
                />
              </label>
            </div>
            <h3 className="text-xl font-semibold text-foreground">
              {extendedProfile?.full_name || "User"}
            </h3>
            {extendedProfile?.company_name && (
              <p className="text-muted-foreground">{extendedProfile.company_name}</p>
            )}
            <Badge className="mt-2 bg-primary">
              Buyer
            </Badge>
            <div className="mt-4 w-full space-y-2 text-left text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{user?.email}</span>
              </div>
              {extendedProfile?.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{extendedProfile.phone}</span>
                </div>
              )}
              {extendedProfile?.city && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {extendedProfile.city}, {extendedProfile.state}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Form */}
      <Card className="shadow-card lg:col-span-2">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={profileForm.full_name}
                onChange={(e) => updateProfileField("full_name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={profileForm.company_name}
                onChange={(e) => updateProfileField("company_name", e.target.value)}
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={profileForm.phone}
                onChange={(e) => updateProfileField("phone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gst_number">GST Number</Label>
              <Input
                id="gst_number"
                value={profileForm.gst_number}
                onChange={(e) => updateProfileField("gst_number", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={profileForm.address}
              onChange={(e) => updateProfileField("address", e.target.value)}
            />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={profileForm.city}
                onChange={(e) => updateProfileField("city", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={profileForm.state}
                onChange={(e) => updateProfileField("state", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                value={profileForm.postal_code}
                onChange={(e) => updateProfileField("postal_code", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={profileForm.country}
                onChange={(e) => updateProfileField("country", e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-gradient-accent">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "orders":
        return OrdersContent();
      case "rfq":
        return <RFQTab />;
      case "invoices":
        return InvoicesContent();
      case "addresses":
        return <AccountAddresses user={user} profile={extendedProfile} />;
      case "reviews":
        return <AccountReviews userId={user.id} />;
      case "support":
        return <AccountSupport openChat={() => selectTab("chat")} />;
      case "chat":
        return (
          <div className="h-[calc(100vh-180px)] min-h-[500px]">
            <ChatInterface />
          </div>
        );
      case "profile":
        return <AccountSettings user={user} profileContent={ProfileContent()} openAddresses={() => selectTab("addresses")} openSupport={() => selectTab("chat")} />;
      default:
        return OverviewContent();
    }
  };

  return (
    <div className="h-dvh flex flex-col bg-[#fcf7f0] overflow-x-clip">
      <div className="shrink-0">
        <Header />
      </div>
      <div className="flex flex-1 min-h-0">
      {/* Desktop Sidebar */}
      <div className="hidden h-full w-56 shrink-0 overflow-y-auto p-3 md:block xl:w-64">
        <BuyerSidebar
          activeTab={activeTab}
          onTabChange={selectTab}
        />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">My Account</SheetTitle>
          <BuyerSidebar
            activeTab={activeTab}
            onTabChange={(tab) => {
              selectTab(tab);
              setMobileOpen(false);
            }}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
       <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Main Content Area */}
         <main className="flex-1 min-h-0 overflow-y-auto p-3 lg:p-5">
          {/* Mobile Sidebar Toggle */}
          <div className="md:hidden mb-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-4 w-4" />
               My Account
            </Button>
          </div>
          
          <div className="mx-auto w-full max-w-7xl text-[15px]">
            {renderContent()}
          </div>
        </main>
        <nav aria-label="Store shortcuts" className="grid shrink-0 grid-cols-4 border-t bg-white pb-[env(safe-area-inset-bottom)] text-xs md:hidden">
          <Link to="/" className="flex flex-col items-center gap-1 p-2"><Home size={19} />Home</Link>
          <Link to="/products" className="flex flex-col items-center gap-1 p-2"><LayoutGrid size={19} />Categories</Link>
          <button onClick={() => selectTab("orders")} aria-current={activeTab === "orders" ? "page" : undefined} className="flex flex-col items-center gap-1 p-2 aria-[current=page]:text-[#870d15]"><ShoppingCart size={19} />Orders</button>
          <button onClick={() => selectTab("overview")} aria-current={activeTab !== "orders" ? "page" : undefined} className="flex flex-col items-center gap-1 p-2 aria-[current=page]:text-[#870d15]"><User size={19} />Account</button>
        </nav>
      </div>
      </div>
    </div>
  );
}
