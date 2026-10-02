import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminCategories from "./Categories";
import AdminOffers from "./Offers";
import AdminPromoBanners from "./PromoBanners";

const allowedTabs = new Set(["categories", "offers", "banners"]);

export default function HomeMerchandising() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab") || "categories";
  const tab = allowedTabs.has(requestedTab) ? requestedTab : "categories";

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
        <TabsContent value="categories" className="pt-3"><AdminCategories /></TabsContent>
        <TabsContent value="offers" className="pt-3"><AdminOffers /></TabsContent>
        <TabsContent value="banners" className="pt-3"><AdminPromoBanners /></TabsContent>
      </Tabs>
    </div>
  );
}