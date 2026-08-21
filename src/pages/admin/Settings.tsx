import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Store, Bell, Truck, Palette, Save, Loader2, LayoutDashboard, Plus, Trash2, GripVertical, FileText, Smartphone,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ImageUpload } from "@/components/admin/ImageUpload";


interface Category {
  id: string;
  name: string;
  slug?: string;
  parent_id?: string | null;
}



export default function AdminSettings() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Store Settings
  const [storeSettings, setStoreSettings] = useState({
    storeName: "VendorHub Commerce",
    storeEmail: "sales@houskase.com",
    storePhone: "+91 92661 29195",
    storeAddress: "123 Business Street, City, Country",
    storeGSTIN: "",
    ekartClientId: "",
    ekartUsername: "",
    ekartPassword: "",
    ekartPickupAlias: "",
    ekartCategory: "Home & Kitchen",
    ekartWeight: "500",
    ekartGstin: "",
    currency: "INR",
    taxRate: "18",
    gstEnabled: false,
    gstPricingMode: "exclusive",
    logoUrl: "",
    socialFacebook: "",
    socialInstagram: "",
    socialTwitter: "",
    socialYoutube: "",
    socialLinkedin: "",
    socialWhatsapp: "",
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    orderNotifications: true,
    rfqNotifications: true,
    chatNotifications: true,
    lowStockAlerts: true,
    emailNotifications: true,
  });

  // Shipping Settings
  const [shippingSettings, setShippingSettings] = useState({
    enableShipping: true,
    freeShippingThreshold: "500",
    defaultShippingRate: "10",
    weightMultiplier: "0.5",
  });

  const [announcementSettings, setAnnouncementSettings] = useState({
    enabled: true,
    items: [
      { id: "a1", text: "Free Shipping on Orders Above ₹499", code: "" },
      { id: "a2", text: "Flat 10% OFF on Prepaid Orders", code: "HYP15" },
    ],
  });

  const [heroMarqueeSettings, setHeroMarqueeSettings] = useState({
    enabled: true,
    items: [
      { id: "hm1", text: "🌿 100% Bamboo — Ultra-absorbent & lint-free" },
      { id: "hm2", text: "🚚 Free shipping across India on orders above ₹499" },
      { id: "hm3", text: "🏆 Trusted by 25,000+ homes & businesses" },
      { id: "hm4", text: "♻️ Reusable, washable & eco-friendly essentials" },
    ],
  });

  // CMS Pages
  const [pages, setPages] = useState({
    privacy_policy: "",
    terms_of_service: "",
    payment_terms: "",
    shipping_delivery: "",
  });

  // Bottom Menu
  interface BottomMenuItem {
    type: "page" | "category";
    id: string;
    label: string;
    icon: string;
    path: string;
    enabled: boolean;
  }
  const defaultPageItems: BottomMenuItem[] = [
    { type: "page", id: "home", label: "Home", icon: "Home", path: "/", enabled: true },
    { type: "page", id: "shop", label: "Shop", icon: "Grid3X3", path: "/products", enabled: true },
    { type: "page", id: "cart", label: "Cart", icon: "ShoppingCart", path: "/checkout", enabled: true },
    { type: "page", id: "account", label: "Account", icon: "User", path: "/dashboard", enabled: true },
  ];
  const [bottomMenuItems, setBottomMenuItems] = useState<BottomMenuItem[]>(defaultPageItems);
  const [categories, setCategories] = useState<Category[]>([]);



  useEffect(() => {
    fetchAllSettings();
  }, []);

  const fetchAllSettings = async () => {
    const [storeRes, catsRes, bottomMenuRes, ...pageResults] = await Promise.all([
      supabase.from("site_settings").select("*").eq("key", "store").maybeSingle(),
      supabase.from("categories").select("id, name, slug, parent_id").eq("is_active", true).order("name"),
      supabase.from("site_settings").select("value").eq("key", "bottom_menu").maybeSingle(),
      supabase.from("site_settings").select("value").eq("key", "announcement_bar").maybeSingle(),
      supabase.from("site_settings").select("value").eq("key", "page_privacy_policy").maybeSingle(),
      supabase.from("site_settings").select("value").eq("key", "page_terms_of_service").maybeSingle(),
      supabase.from("site_settings").select("value").eq("key", "page_payment_terms").maybeSingle(),
      supabase.from("site_settings").select("value").eq("key", "page_shipping_delivery").maybeSingle(),
      supabase.from("site_settings").select("value").eq("key", "shipping_settings").maybeSingle(),
    ]);

    // Ekart integration credentials live in a separate admin-only settings row
    const { data: ekartRes } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "ekart_settings")
      .maybeSingle();
    const ek = (ekartRes?.value ?? {}) as any;

    if (storeRes.data?.value) {
      const v = { ...(storeRes.data.value as any), ...ek } as any;
      setStoreSettings({
        storeName: v.storeName || "VendorHub Commerce",
        storeEmail: v.storeEmail || "sales@houskase.com",
        storePhone: v.storePhone || "+91 92661 29195",
        storeAddress: v.storeAddress || "",
        storeGSTIN: v.storeGSTIN || "",
        ekartClientId: v.ekartClientId || "",
        ekartUsername: v.ekartUsername || "",
        ekartPassword: v.ekartPassword || "",
        ekartPickupAlias: v.ekartPickupAlias || "",
        ekartCategory: v.ekartCategory || "Home & Kitchen",
        ekartWeight: v.ekartWeight || "500",
        ekartGstin: v.ekartGstin || "",
        currency: v.currency || "INR",
        taxRate: v.taxRate || "18",
        gstEnabled: v.gstEnabled ?? false,
        gstPricingMode: v.gstPricingMode || "exclusive",
        logoUrl: v.logoUrl || "",
        socialFacebook: v.socialFacebook || "",
        socialInstagram: v.socialInstagram || "",
        socialTwitter: v.socialTwitter || "",
        socialYoutube: v.socialYoutube || "",
        socialLinkedin: v.socialLinkedin || "",
        socialWhatsapp: v.socialWhatsapp || "",
      });
    }

    if (pageResults[0]?.data?.value) {
      const v = pageResults[0].data.value as any;
      setAnnouncementSettings({
        enabled: v.enabled !== false,
        items: Array.isArray(v.items) && v.items.length ? v.items : announcementSettings.items,
      });
    }

    const { data: hmData } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "hero_marquee")
      .maybeSingle();
    if (hmData?.value) {
      const v = hmData.value as any;
      setHeroMarqueeSettings({
        enabled: v.enabled !== false,
        items: Array.isArray(v.items) && v.items.length ? v.items : heroMarqueeSettings.items,
      });
    }


    const loadedCats = catsRes.data || [];
    setCategories(loadedCats);

    // Load bottom menu - merge saved items with defaults + parent categories
    const parentCats = loadedCats.filter((c: Category) => !c.parent_id);
    if (bottomMenuRes.data?.value) {
      const saved = (bottomMenuRes.data.value as any).items as BottomMenuItem[];
      if (saved && Array.isArray(saved)) {
        // Merge: keep saved state, add any new page defaults or new parent categories
        const savedIds = new Set(saved.map((i: BottomMenuItem) => i.id));
        const merged = [...saved];
        defaultPageItems.forEach(p => { if (!savedIds.has(p.id)) merged.push(p); });
        setBottomMenuItems(merged);
      }
    } else {
      // First time: build from defaults
      setBottomMenuItems([...defaultPageItems]);
    }

    // Load CMS pages
    setPages({
      privacy_policy: (pageResults[1]?.data?.value as any)?.content || "",
      terms_of_service: (pageResults[2]?.data?.value as any)?.content || "",
      payment_terms: (pageResults[3]?.data?.value as any)?.content || "",
      shipping_delivery: (pageResults[4]?.data?.value as any)?.content || "",
    });
    
    if (pageResults[5]?.data?.value) {
      const v = pageResults[5].data.value as any;
      setShippingSettings({
        enableShipping: v.enableShipping ?? true,
        freeShippingThreshold: v.freeShippingThreshold || "500",
        defaultShippingRate: v.defaultShippingRate || "10",
        weightMultiplier: v.weightMultiplier || "0.5",
      });
    }
    
    
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    // Keep courier credentials out of the publicly readable "store" settings row
    const {
      ekartClientId, ekartUsername, ekartPassword, ekartPickupAlias,
      ekartCategory, ekartWeight, ekartGstin, ...publicStoreSettings
    } = storeSettings;
    const ekartSettings = {
      ekartClientId, ekartUsername, ekartPassword, ekartPickupAlias,
      ekartCategory, ekartWeight, ekartGstin,
    };
    await Promise.all([
      supabase.from("site_settings").upsert({ key: "store", value: publicStoreSettings as any }, { onConflict: "key" }),
      supabase.from("site_settings").upsert({ key: "ekart_settings", value: ekartSettings as any }, { onConflict: "key" }),
      supabase.from("site_settings").upsert({ key: "bottom_menu", value: { items: bottomMenuItems } as any }, { onConflict: "key" }),
      supabase.from("site_settings").upsert({ key: "announcement_bar", value: announcementSettings as any }, { onConflict: "key" }),
      supabase.from("site_settings").upsert({ key: "hero_marquee", value: heroMarqueeSettings as any }, { onConflict: "key" }),
      supabase.from("site_settings").upsert({ key: "page_privacy_policy", value: { content: pages.privacy_policy } as any }, { onConflict: "key" }),
      supabase.from("site_settings").upsert({ key: "page_terms_of_service", value: { content: pages.terms_of_service } as any }, { onConflict: "key" }),
      supabase.from("site_settings").upsert({ key: "page_payment_terms", value: { content: pages.payment_terms } as any }, { onConflict: "key" }),
      supabase.from("site_settings").upsert({ key: "page_shipping_delivery", value: { content: pages.shipping_delivery } as any }, { onConflict: "key" }),
      supabase.from("site_settings").upsert({ key: "shipping_settings", value: shippingSettings as any }, { onConflict: "key" }),
    ]);
    toast({ title: "Settings Saved", description: "Your settings have been updated successfully." });
    setIsSaving(false);
  };


  const currencySymbol = storeSettings.currency === "INR" ? "₹" : "$";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
        </div>
        <Button onClick={handleSaveSettings} className="bg-gradient-accent gap-2" disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="store" className="space-y-6">
        <TabsList className="flex flex-wrap gap-1 h-auto p-1 bg-secondary/50 rounded-lg">
          <TabsTrigger value="store" className="gap-2 flex-1 min-w-[100px]">
            <Store className="h-4 w-4" />
            Store
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 flex-1 min-w-[100px]">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="shipping" className="gap-2 flex-1 min-w-[100px]">
            <Truck className="h-4 w-4" />
            Shipping
          </TabsTrigger>
          <TabsTrigger value="pages" className="gap-2 flex-1 min-w-[100px]">
            <FileText className="h-4 w-4" />
            Pages
          </TabsTrigger>
          <TabsTrigger value="bottom-menu" className="gap-2 flex-1 min-w-[100px]">
            <Smartphone className="h-4 w-4" />
            Bottom Menu
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2 flex-1 min-w-[100px]">
            <Truck className="h-4 w-4" />
            Integrations
          </TabsTrigger>
        </TabsList>


        {/* Store Settings */}
        <TabsContent value="store">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Store Information
              </CardTitle>
              
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Store Logo</Label>
                <p className="text-sm text-muted-foreground">Upload your store logo. It will appear on Header, Footer, Login, and Invoices.</p>
                <ImageUpload value={storeSettings.logoUrl} onChange={(url) => setStoreSettings(prev => ({ ...prev, logoUrl: url }))} bucket="product-images" />
              </div>
              <Separator />
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input id="storeName" value={storeSettings.storeName} onChange={(e) => setStoreSettings(prev => ({ ...prev, storeName: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeEmail">Contact Email</Label>
                  <Input id="storeEmail" type="email" value={storeSettings.storeEmail} onChange={(e) => setStoreSettings(prev => ({ ...prev, storeEmail: e.target.value }))} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="storePhone">Phone Number</Label>
                  <Input id="storePhone" value={storeSettings.storePhone} onChange={(e) => setStoreSettings(prev => ({ ...prev, storePhone: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={storeSettings.currency} onValueChange={(v) => setStoreSettings(prev => ({ ...prev, currency: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeAddress">Store Address</Label>
                <Textarea id="storeAddress" value={storeSettings.storeAddress} onChange={(e) => setStoreSettings(prev => ({ ...prev, storeAddress: e.target.value }))} rows={2} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                  <Input id="taxRate" type="number" value={storeSettings.taxRate} onChange={(e) => setStoreSettings(prev => ({ ...prev, taxRate: e.target.value }))} className="w-32" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeGSTIN">GSTIN Number</Label>
                  <Input id="storeGSTIN" placeholder="e.g. 23AAAAA0000A1Z5" value={storeSettings.storeGSTIN} onChange={(e) => setStoreSettings(prev => ({ ...prev, storeGSTIN: e.target.value }))} />
                  <p className="text-xs text-muted-foreground">Displayed on invoices and website footer</p>
                </div>
              </div>
              
              <Separator />
              <div className="grid sm:grid-cols-2 gap-4 rounded-lg border p-4">
                <div className="flex items-center justify-between gap-4">
                  <div><Label>Default GST Enabled</Label><p className="text-xs text-muted-foreground">Default setting for new GST display/calculation.</p></div>
                  <Switch checked={storeSettings.gstEnabled} onCheckedChange={(checked) => setStoreSettings(prev => ({ ...prev, gstEnabled: checked }))} />
                </div>
                <div className="space-y-2">
                  <Label>Default GST Mode</Label>
                  <Select value={storeSettings.gstPricingMode} onValueChange={(v) => setStoreSettings(prev => ({ ...prev, gstPricingMode: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inclusive">GST Inclusive</SelectItem>
                      <SelectItem value="exclusive">GST Exclusive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div><Label>Top Announcement Header</Label><p className="text-sm text-muted-foreground">Manually edit the moving top header offers.</p></div>
                  <Switch checked={announcementSettings.enabled} onCheckedChange={(checked) => setAnnouncementSettings(prev => ({ ...prev, enabled: checked }))} />
                </div>
                {announcementSettings.items.map((item, idx) => (
                  <div key={item.id || idx} className="grid sm:grid-cols-[1fr_180px_auto] gap-2">
                    <Input value={item.text} placeholder="Announcement text" onChange={(e) => setAnnouncementSettings(prev => ({ ...prev, items: prev.items.map((x, i) => i === idx ? { ...x, text: e.target.value } : x) }))} />
                    <Input value={item.code || ""} placeholder="Code optional" onChange={(e) => setAnnouncementSettings(prev => ({ ...prev, items: prev.items.map((x, i) => i === idx ? { ...x, code: e.target.value } : x) }))} />
                    <Button type="button" variant="outline" size="icon" onClick={() => setAnnouncementSettings(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }))}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setAnnouncementSettings(prev => ({ ...prev, items: [...prev.items, { id: `a-${Date.now()}`, text: "", code: "" }] }))}><Plus className="h-4 w-4 mr-1" /> Add Announcement</Button>
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div><Label>Hero Marquee (below hero slider)</Label><p className="text-sm text-muted-foreground">Running text ribbon that appears just below the hero slider on the homepage.</p></div>
                  <Switch checked={heroMarqueeSettings.enabled} onCheckedChange={(checked) => setHeroMarqueeSettings(prev => ({ ...prev, enabled: checked }))} />
                </div>
                {heroMarqueeSettings.items.map((item, idx) => (
                  <div key={item.id || idx} className="grid grid-cols-[1fr_auto] gap-2">
                    <Input value={item.text} placeholder="Marquee text (emoji supported)" onChange={(e) => setHeroMarqueeSettings(prev => ({ ...prev, items: prev.items.map((x, i) => i === idx ? { ...x, text: e.target.value } : x) }))} />
                    <Button type="button" variant="outline" size="icon" onClick={() => setHeroMarqueeSettings(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }))}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setHeroMarqueeSettings(prev => ({ ...prev, items: [...prev.items, { id: `hm-${Date.now()}`, text: "" }] }))}><Plus className="h-4 w-4 mr-1" /> Add Marquee Item</Button>
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold text-sm mb-3">Social Media Links</h3>
                <p className="text-sm text-muted-foreground mb-4">Add your social media URLs to display in the footer.</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Facebook</Label>
                    <Input placeholder="https://facebook.com/yourpage" value={storeSettings.socialFacebook} onChange={(e) => setStoreSettings(prev => ({ ...prev, socialFacebook: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Instagram</Label>
                    <Input placeholder="https://instagram.com/yourpage" value={storeSettings.socialInstagram} onChange={(e) => setStoreSettings(prev => ({ ...prev, socialInstagram: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Twitter / X</Label>
                    <Input placeholder="https://twitter.com/yourpage" value={storeSettings.socialTwitter} onChange={(e) => setStoreSettings(prev => ({ ...prev, socialTwitter: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>YouTube</Label>
                    <Input placeholder="https://youtube.com/yourchannel" value={storeSettings.socialYoutube} onChange={(e) => setStoreSettings(prev => ({ ...prev, socialYoutube: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>LinkedIn</Label>
                    <Input placeholder="https://linkedin.com/company/yourpage" value={storeSettings.socialLinkedin} onChange={(e) => setStoreSettings(prev => ({ ...prev, socialLinkedin: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp</Label>
                    <Input placeholder="https://wa.me/919999999999" value={storeSettings.socialWhatsapp} onChange={(e) => setStoreSettings(prev => ({ ...prev, socialWhatsapp: e.target.value }))} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Notification Preferences</CardTitle>
              
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { key: "orderNotifications", label: "New Order Notifications", desc: "Get notified when new orders are placed" },
                { key: "rfqNotifications", label: "RFQ Notifications", desc: "Get notified when new RFQ requests arrive" },
                { key: "chatNotifications", label: "Chat Notifications", desc: "Get notified when customers send messages" },
                { key: "lowStockAlerts", label: "Low Stock Alerts", desc: "Get alerts when product stock is low" },
                { key: "emailNotifications", label: "Email Notifications", desc: "Receive notifications via email" },
              ].map((item, idx) => (
                <div key={item.key}>
                  {idx > 0 && <Separator className="mb-4" />}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{item.label}</Label>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch
                      checked={(notificationSettings as any)[item.key]}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, [item.key]: checked }))}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipping Settings */}
        <TabsContent value="shipping">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5" /> Shipping Configuration</CardTitle>
              
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div><Label>Enable Shipping</Label><p className="text-sm text-muted-foreground">Calculate shipping for orders</p></div>
                <Switch checked={shippingSettings.enableShipping} onCheckedChange={(checked) => setShippingSettings(prev => ({ ...prev, enableShipping: checked }))} />
              </div>
              <Separator />
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Free Shipping Threshold ({currencySymbol})</Label>
                  <Input type="number" value={shippingSettings.freeShippingThreshold} onChange={(e) => setShippingSettings(prev => ({ ...prev, freeShippingThreshold: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Default Shipping Rate ({currencySymbol})</Label>
                  <Input type="number" value={shippingSettings.defaultShippingRate} onChange={(e) => setShippingSettings(prev => ({ ...prev, defaultShippingRate: e.target.value }))} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        {/* Pages / CMS */}
        <TabsContent value="pages">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Content Pages</CardTitle>
              
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { key: "payment_terms", label: "Payment Terms", path: "/payment-terms" },
                { key: "shipping_delivery", label: "Shipping & Delivery", path: "/shipping-delivery" },
                { key: "privacy_policy", label: "Privacy Policy", path: "/privacy-policy" },
                { key: "terms_of_service", label: "Terms of Service", path: "/terms-of-service" },
              ].map((page, idx) => (
                <div key={page.key}>
                  {idx > 0 && <Separator className="mb-4" />}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">{page.label}</Label>
                      <a href={page.path} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">Preview →</a>
                    </div>
                    <Textarea
                      value={(pages as any)[page.key]}
                      onChange={(e) => setPages(prev => ({ ...prev, [page.key]: e.target.value }))}
                      rows={8}
                      placeholder={`Enter ${page.label} content (HTML supported)...`}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bottom Menu */}
        <TabsContent value="bottom-menu">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Mobile Bottom Navigation
              </CardTitle>
              <CardDescription>Select which pages to show in the mobile bottom navigation menu.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-sm mb-3">Pages</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

                  {bottomMenuItems.filter(i => i.type === "page").map(item => (
                    <label key={item.id} className="flex items-center gap-2 p-2 border rounded-md cursor-pointer hover:bg-secondary/50">
                      <Checkbox
                        checked={item.enabled}
                        onCheckedChange={(checked) => {
                          setBottomMenuItems(prev => prev.map(i => i.id === item.id ? { ...i, enabled: !!checked } : i));
                        }}
                      />
                      <span className="text-sm">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold text-sm mb-3">Custom Labels</h3>
                <p className="text-xs text-muted-foreground mb-3">Edit display labels for enabled items.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {bottomMenuItems.filter(i => i.enabled).map(item => (
                    <div key={item.id} className="space-y-1">
                      <Label className="text-xs">{item.type === "page" ? item.id : item.label}</Label>
                      <Input
                        value={item.label}
                        onChange={(e) => setBottomMenuItems(prev => prev.map(i => i.id === item.id ? { ...i, label: e.target.value } : i))}
                        className="h-8 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Ekart Logistics Integration
              </CardTitle>
              <CardDescription>
                Test your Ekart credentials and manage webhook settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-secondary/20">
                  <div>
                    <h3 className="font-semibold">Credentials Tester</h3>
                    <p className="text-sm text-muted-foreground">Verify your Client Id, Username, and Password are correct.</p>
                  </div>
                  <Button 
                    onClick={async () => {
                      setIsSaving(true);
                      try {
                        const { data, error } = await supabase.functions.invoke("ekart-test-credentials", { body: { action: "test" } });
                        if (error) throw error;
                        if (data.success) {
                          toast({ title: "Connection Successful", description: data.message });
                        } else {
                          toast({ 
                            title: "Connection Failed", 
                            description: data.error || "Authentication failed", 
                            variant: "destructive" 
                          });
                        }
                      } catch (err: any) {
                        toast({ 
                          title: "Test Failed", 
                          description: err.message || "Could not connect to Ekart", 
                          variant: "destructive" 
                        });
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                    disabled={isSaving}
                    className="gap-2"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
                    Test Connection
                  </Button>
                </div>

                <div className="space-y-3">
                  <Label>Webhook Endpoint</Label>
                  <p className="text-sm text-muted-foreground">
                    Copy this URL to your Ekart developer portal to receive real-time order updates.
                  </p>
                  <div className="flex gap-2">
                    <Input 
                      readOnly 
                      value="https://cxyfwxbirzskvoesgtia.supabase.co/functions/v1/ekart-webhook" 
                      className="bg-secondary/30 font-mono text-xs"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        navigator.clipboard.writeText("https://cxyfwxbirzskvoesgtia.supabase.co/functions/v1/ekart-webhook");
                        toast({ title: "Copied", description: "Webhook URL copied to clipboard" });
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg bg-info/10 p-4 border border-info/20 text-sm text-info-foreground">
                  <p className="font-semibold mb-1">Integration Info:</p>
                  <ul className="list-disc list-inside space-y-1 opacity-90">
                    <li>COD orders are synced immediately upon checkout.</li>
                    <li>Prepaid orders are synced after successful payment.</li>
                    <li>Sync failures generate an email notification to admin.</li>
                    <li>Tracking IDs are automatically updated in the order details.</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

