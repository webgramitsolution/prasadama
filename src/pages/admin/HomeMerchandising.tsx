import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AdminCategories from "./Categories";
import AdminOffers from "./Offers";
import AdminPromoBanners from "./PromoBanners";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const allowedTabs = new Set(["categories", "offers", "banners"]);
const DEFAULT_SHOP_ALL_IMAGE = "https://ik.imagekit.io/Prasadam/Status-scaled.jpg?updatedAt=1787405014112";

export default function HomeMerchandising() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [shopAllImage, setShopAllImage] = useState(DEFAULT_SHOP_ALL_IMAGE);
  const [shopAllLabel, setShopAllLabel] = useState("Shop All");
  const [isSavingShopAll, setIsSavingShopAll] = useState(false);
  const { toast } = useToast();
  const requestedTab = searchParams.get("tab") || "categories";
  const tab = allowedTabs.has(requestedTab) ? requestedTab : "categories";

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "shop_all_category")
      .maybeSingle()
      .then(({ data }) => {
        const value = data?.value as { image_url?: string; ribbon_label?: string } | null;
        if (value?.image_url) setShopAllImage(value.image_url);
        if (value?.ribbon_label) setShopAllLabel(value.ribbon_label);
      });
  }, []);

  const saveShopAll = async () => {
    setIsSavingShopAll(true);
    const { error } = await supabase.from("site_settings").upsert({
      key: "shop_all_category",
      value: {
        image_url: shopAllImage.trim() || DEFAULT_SHOP_ALL_IMAGE,
        ribbon_label: shopAllLabel.trim() || "Shop All",
      },
    }, { onConflict: "key" });
    setIsSavingShopAll(false);
    toast(error
      ? { title: "Save failed", description: error.message, variant: "destructive" }
      : { title: "Shop All updated", description: "The homepage category circle now uses these details." });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Homepage Merchandising</h1>
        <p className="text-sm text-muted-foreground">Manage category ribbons, offers, and homepage banners.</p>
      </div>
      <Tabs value={tab} onValueChange={(value) => setSearchParams({ tab: value })}>
        <TabsList className="grid h-auto w-full grid-cols-3">
          <TabsTrigger value="categories">Shop By Category</TabsTrigger>
          <TabsTrigger value="offers">Offers & Deals</TabsTrigger>
          <TabsTrigger value="banners">Promo Banners</TabsTrigger>
        </TabsList>
        <TabsContent value="categories" className="space-y-4 pt-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Shop All Circle</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <div className="space-y-2">
                <Label htmlFor="shop-all-image">Image URL</Label>
                <Input id="shop-all-image" value={shopAllImage} onChange={(event) => setShopAllImage(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shop-all-label">Ribbon Label</Label>
                <Input id="shop-all-label" value={shopAllLabel} onChange={(event) => setShopAllLabel(event.target.value)} />
              </div>
              <Button onClick={saveShopAll} disabled={isSavingShopAll}>
                {isSavingShopAll && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </CardContent>
          </Card>
          <AdminCategories />
        </TabsContent>
        <TabsContent value="offers" className="pt-3"><AdminOffers /></TabsContent>
        <TabsContent value="banners" className="pt-3"><AdminPromoBanners /></TabsContent>
      </Tabs>
    </div>
  );
}