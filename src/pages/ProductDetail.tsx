import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, Truck, Shield, Minus, Plus, Check, 
  Package, Clock, Phone, MessageCircle, Factory, 
  Award, ChevronRight, ShoppingCart, Star, Zap, CheckCircle2, MapPin, X, ChevronLeft, Loader2,
  Droplets, Leaf, Heart, ListChecks, RotateCcw, BadgeCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useRFQCart } from "@/hooks/useRFQCart";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { RelatedProducts } from "@/components/products/RelatedProducts";
import { ReviewsSummary } from "@/components/products/ReviewsSummary";
import { ReelsSection } from "@/components/reels/ReelsSection";
import { ProductCoupons } from "@/components/products/ProductCoupons";
import { CustomerReviews, type ReviewStats } from "@/components/products/CustomerReviews";
import { Input } from "@/components/ui/input";
import { SEOHead, SchemaGenerators } from "@/components/SEOHead";
import { SignedImage } from "@/components/common/SignedImage";
import { FormattedProductText } from "@/components/products/FormattedProductText";
import { FrequentlyBoughtTogether } from "@/components/products/FrequentlyBoughtTogether";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


interface Attribute {
  name: string;
  values: string[];
  usedForVariations: boolean;
  visibleOnProduct: boolean;
  existingAttributeId?: string;
}

interface ProductVariation {
  id: string;
  product_id: string;
  sku: string | null;
  size: string | null;
  color: string | null;
  color_image: string | null;
  gallery_images: string[] | null;
  shop_price: number;
  shop_regular_price: number | null;
  retail_price: number;
  retail_regular_price: number | null;
  guest_price: number;
  regular_price: number | null;
  shop_moq: number | null;
  retail_moq: number | null;
  stock_quantity: number | null;
  weight: number | null;
}

interface ProductAttribute {
  name: string;
  value: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  images: string[] | null;
  guest_price: number;
  shop_price: number;
  retail_price: number;
  regular_price: number;
  shop_moq: number;
  retail_moq: number;
  gst_percentage: number | null;
  gst_enabled?: boolean | null;
  gst_pricing_mode?: string | null;
  stock_quantity: number | null;
  features: string[] | null;
  has_variations: boolean | null;
  weight: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  category_id: string | null;
  category: { name: string } | null;
  brand: { name: string } | null;
  sku: string | null;
  banner_image?: string | null;
}

function DeliveryChecker() {
  const [pincode, setPincode] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{
    delivery_days: number;
    delivery_days_max?: number;
    city: string | null;
    state: string | null;
    is_cod_available: boolean | null;
    fallback?: boolean;
  } | null>(null);
  const [invalid, setInvalid] = useState(false);

  const isValidIndianPincode = (p: string) => /^[1-8][0-9]{5}$/.test(p);

  const getDefaultDeliveryResult = () => ({
    delivery_days: 3,
    delivery_days_max: 4,
    city: null,
    state: null,
    is_cod_available: true,
    fallback: true,
  });

  const handleCheck = async () => {
    setResult(null);
    setInvalid(false);
    if (!isValidIndianPincode(pincode)) {
      setInvalid(true);
      return;
    }
    // Every valid Indian pincode should show standard delivery availability immediately.
    // The database entry only enriches city/state/custom timeline when available.
    setResult(getDefaultDeliveryResult());
    setChecking(true);
    try {
      const { data } = await supabase
        .from("delivery_pincodes")
        .select("delivery_days, city, state, is_cod_available")
        .eq("pincode", pincode)
        .eq("is_active", true)
        .maybeSingle();
      if (data) {
        setResult({
          city: data.city,
          state: data.state,
          delivery_days: data.delivery_days || 5,
          is_cod_available: data.is_cod_available,
          fallback: false
        });
      }
    } catch {
      setResult(getDefaultDeliveryResult());
    } finally {
      setChecking(false);
    }
  };

  const minDate = result ? new Date(Date.now() + (result.delivery_days || 0) * 86400000) : null;
  const maxDate = result
    ? new Date(Date.now() + ((result as any).delivery_days_max ?? result.delivery_days ?? 0) * 86400000)
    : null;
  const fmt = (d: Date) => d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

  return (
    <div className="pt-3 border-t border-border">
      <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
        <MapPin className="h-3.5 w-3.5 text-destructive" />
        Check Delivery Details
      </p>
      <div className="flex gap-2">
        <Input
          placeholder="Enter 6-digit Pincode"
          inputMode="numeric"
          value={pincode}
          onChange={(e) => {
            setPincode(e.target.value.replace(/\D/g, "").slice(0, 6));
            setInvalid(false);
          }}
          className="h-9 text-xs flex-1"
          onKeyDown={(e) => e.key === "Enter" && handleCheck()}
        />
        <Button size="sm" className="h-9 text-xs px-4 bg-accent hover:bg-accent-hover" onClick={handleCheck} disabled={checking}>
          {checking ? "..." : "Check"}
        </Button>
      </div>
      {result && (
        <div className="mt-2 p-2.5 rounded-lg bg-success/5 border border-success/20 space-y-1">
          <p className="text-xs font-medium text-success flex items-center gap-1">
            <Check className="h-3.5 w-3.5" /> Delivery available
            {result.city && (
              <span className="text-muted-foreground font-normal">
                to {result.city}{result.state ? `, ${result.state}` : ""}
              </span>
            )}
          </p>
          <p className="text-xs text-foreground">
            {result.delivery_days_max && result.delivery_days_max !== result.delivery_days ? (
              <>
                Estimated delivery between{" "}
                <span className="font-semibold">{minDate && fmt(minDate)}</span> –{" "}
                <span className="font-semibold">{maxDate && fmt(maxDate)}</span>
                <span className="text-muted-foreground"> ({result.delivery_days}-{result.delivery_days_max} days)</span>
              </>
            ) : (
              <>
                Estimated delivery by <span className="font-semibold">{minDate && fmt(minDate)}</span>
                <span className="text-muted-foreground"> ({result.delivery_days} days)</span>
              </>
            )}
          </p>
          {result.is_cod_available && <p className="text-[10px] text-success">✓ Cash on Delivery available</p>}
            <p className="text-[10px] text-muted-foreground">
              {result.fallback
                ? "Standard shipping across India via trusted courier partners."
                : "Delivery timeline is based on your serviceable pincode."}
            </p>
        </div>
      )}
      {invalid && (
        <p className="mt-2 text-xs text-destructive">Please enter a valid 6-digit Indian pincode.</p>
      )}
    </div>
  );
}


export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [productAttributes, setProductAttributes] = useState<ProductAttribute[]>([]);
  const [variationAttributes, setVariationAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedVariationId, setSelectedVariationId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addToRFQCart } = useRFQCart();
  const { user, role } = useAuth();
  const { addToCart } = useCart();
  const [isAddingToRFQ, setIsAddingToRFQ] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const handleReviewStats = useCallback((s: ReviewStats) => setReviewStats(s), []);
  const [selectedOtherValues, setSelectedOtherValues] = useState<Record<string, string>>({});
  const [zoomIndex, setZoomIndex] = useState(0);
  const galleryRef = useRef<string[]>([]);
  const [galleryPaused, setGalleryPaused] = useState(false);

  // Auto-slide the main feature image
  useEffect(() => {
    if (galleryPaused) return;
    const timer = window.setInterval(() => {
      const imgs = galleryRef.current || [];
      if (!imgs || imgs.length <= 1) return;
      setSelectedImage((prev) => {
        const i = imgs.indexOf(prev || (imgs[0] as string));
        return imgs[(i + 1) % imgs.length] as string;
      });
    }, 3000);
    return () => window.clearInterval(timer);
  }, [galleryPaused]);

  const getRolePrice = (p: Product | null, v: ProductVariation | null | undefined) => {
    const guestPrice = v?.guest_price ?? p?.guest_price ?? 0;
    return guestPrice > 0 ? guestPrice : (v?.retail_price ?? p?.retail_price ?? 0);
  };

  const getRoleMoq = (p: Product | null, v: ProductVariation | null | undefined) => {
    const moq = v?.retail_moq ?? p?.retail_moq ?? 1;
    return moq && moq > 1 ? moq : 1;
  };

  const getMrp = (p: Product | null, v: ProductVariation | null | undefined) => {
    // For variations, prioritize the regular_price field, then fall back to others
    const varRegular = v?.regular_price ?? v?.shop_regular_price ?? v?.retail_regular_price ?? 0;
    if (varRegular > 0) return varRegular;
    const productRegular = p?.regular_price ?? 0;
    if (productRegular > 0) return productRegular;
    // Fallback to highest available price field to avoid 0 MRP
    return Math.max(v?.guest_price ?? 0, v?.retail_price ?? 0, p?.guest_price ?? 0, p?.retail_price ?? 0, 0);
  };

  const getPriceLabel = () => null;

  const fetchProductAttributes = async (productId: string) => {
    const { data } = await supabase
      .from("product_attribute_assignments")
      .select("*, attribute:product_attributes(name), attribute_value:product_attribute_values(value)")
      .eq("product_id", productId)
      .eq("visible_on_product", true);
    if (data) {
      setProductAttributes(data.map((a: any) => ({
        name: a.attribute?.name || "",
        value: a.attribute_value?.value || "",
      })));
    }
  };

  // Reset selection state when product changes
  useEffect(() => {
    setSelectedSize(null);
    setSelectedColor(null);
    setSelectedVariationId(null);
    setSelectedImage("");
    setQuantity(1);
    setVariations([]);
    setProductAttributes([]);
  }, [id]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      setLoading(true);
      // Sequential lookup: slug -> ID -> UUID filter
      let { data: productData, error: productError } = await supabase
        .from("products")
        .select(`*, category:categories(name), brand:brands(name)`)
        .eq("slug", id)
        .maybeSingle();

      if (!productData && !productError && id) {
        const { data: idData } = await supabase
          .from("products")
          .select(`*, category:categories(name), brand:brands(name)`)
          .eq("id", id)
          .maybeSingle();
        
        if (idData) {
          productData = idData;
        } else {
          const isUuid = id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
          const { data: orData, error: orError } = await supabase
            .from("products")
            .select(`*, category:categories(name), brand:brands(name)`)
            .or(isUuid ? `id.eq."${id}"` : `id.filter.(eq."${id}")`)
            .maybeSingle();
          productData = orData;
          productError = orError;
        }
      }

      if (productError || !productData) {
        setLoading(false);
        return;
      }
      
      setProduct(productData as unknown as Product);
      if (productData.images?.[0]) setSelectedImage(productData.images[0]);
      setQuantity(1);
      
      if (productData.has_variations) {
        const { data: vars } = await supabase
          .from("product_variations")
          .select("*")
          .eq("product_id", productData.id)
          .eq("is_active", true)
          .order("sort_order", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: true });
        setVariations(vars || []);

        const { data: assignments } = await supabase
          .from("product_attribute_assignments")
          .select("*, attribute:product_attributes(id, name), attribute_value:product_attribute_values(value)")
          .eq("product_id", productData.id)
          .eq("used_for_variations", true);
        
        if (assignments) {
          const grouped: Record<string, Attribute> = {};
          assignments.forEach((a: any) => {
            const name = a.attribute?.name || "";
            if (!grouped[name]) {
              grouped[name] = { name, values: [], usedForVariations: true, visibleOnProduct: true };
            }
            if (a.attribute_value?.value && !grouped[name].values.includes(a.attribute_value.value)) {
              grouped[name].values.push(a.attribute_value.value);
            }
          });
          setVariationAttributes(Object.values(grouped));
        }
      }
      await fetchProductAttributes(productData.id);
      setLoading(false);
    };

    fetchProduct();
  }, [id]);

  const { uniqueSizes, uniqueColors, colorImageMap, otherAttributes } = useMemo(() => {
    // Natural, unit-aware ordering: 500g < 1kg < 2kg < 5kg
    const sizeRank = (raw: string) => {
      const s = (raw || "").toLowerCase().trim();
      const m = s.match(/([\d.]+)\s*(kg|g|gm|gram|l|ltr|litre|ml|pcs|piece|pc)?/);
      if (!m) return Number.MAX_SAFE_INTEGER;
      const n = parseFloat(m[1] ?? "");
      if (isNaN(n)) return Number.MAX_SAFE_INTEGER;
      const unit = m[2] || "";
      const mult = unit === "kg" || unit === "l" || unit === "ltr" || unit === "litre" ? 1000 : 1;
      return n * mult;
    };
    const naturalSort = (a: string, b: string) => {
      const ra = sizeRank(a);
      const rb = sizeRank(b);
      if (ra !== rb) return ra - rb;
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
    };

    // Customer-facing variation order is always natural, even when an admin
    // accidentally saves an incorrect sort_order value.
    const orderValues = (vals: string[]) => [...vals].sort(naturalSort);

    // 1. Get all attributes used for variations from variationAttributes (fetched from assignments)
    // We strictly filter for standard naming conventions
    const others = variationAttributes
      .filter(a => {
        const n = a.name.toLowerCase().trim();
        return n !== "size" && n !== "color" && n !== "colour";
      })
      .map(a => ({ ...a, values: orderValues(a.values) }));

    // 2. Identify if ANY variations actually use standard size/color fields
    // This handles how the database structure maps variation values
    const sizes = orderValues([...new Set(variations.map(v => v.size).filter(Boolean))] as string[]);
    const colors = [...new Set(variations.map(v => v.color).filter(Boolean))] as string[];
    const imageMap: Record<string, string> = {};
    
    variations.forEach(v => {
      if (v.color && v.color_image) {
        imageMap[v.color] = v.color_image;
      }
    });
    
    return { uniqueSizes: sizes, uniqueColors: colors, colorImageMap: imageMap, otherAttributes: others };
  }, [variations, variationAttributes]);

  // Unified, always natural-ordered variation list used by the card selector
  const sortedVariations = useMemo(() => {
    const rank = (raw: string) => {
      const s = (raw || "").toLowerCase().trim();
      const m = s.match(/([\d.]+)\s*(kg|g|gm|gram|l|ltr|litre|ml|pcs|piece|pc)?/);
      if (!m) return Number.MAX_SAFE_INTEGER;
      const n = parseFloat(m[1] ?? "");
      if (isNaN(n)) return Number.MAX_SAFE_INTEGER;
      const unit = m[2] || "";
      const mult = unit === "kg" || unit === "l" || unit === "ltr" || unit === "litre" ? 1000 : 1;
      return n * mult;
    };
    const label = (v: any) => [v.size, v.color].filter(Boolean).join(" ") || v.sku || "";
    return [...variations].sort((a, b) => {
      const la = label(a);
      const lb = label(b);
      const d = rank(la) - rank(lb);
      if (d) return d;
      return la.localeCompare(lb, undefined, { numeric: true, sensitivity: "base" });
    });
  }, [variations]);

  const variationAttributeLabel = useMemo(() => {
    const names = variationAttributes.map((attribute) => attribute.name.trim()).filter(Boolean);
    if (names.length === 0) return "Option";
    if (names.length === 1) return names[0] as string;
    return names.join(" / ");
  }, [variationAttributes]);

  const mobileBenefits = useMemo(() => {
    const icons = [Droplets, Leaf, BadgeCheck, Heart, Award, Star];
    const configured = (product?.features || []).filter(Boolean).slice(0, 6).map((feature, index) => {
      const [title, ...detailParts] = feature.split(/[:–—-]/);
      return { title: title?.trim() || feature, detail: detailParts.join(" ").trim(), Icon: icons[index % icons.length] ?? BadgeCheck };
    });
    if (configured.length > 0) return configured;
    return [
      { title: "Authentic Quality", detail: "Carefully selected", Icon: BadgeCheck },
      { title: "Fresh & Pure", detail: "Prepared with care", Icon: Leaf },
      { title: "Made in India", detail: "Traditional quality", Icon: Award },
      { title: "Trusted Choice", detail: "Loved by families", Icon: Heart },
    ];
  }, [product?.features]);


  const selectedVariation = useMemo(() => {
    if (!product?.has_variations || variations.length === 0) return null;
    if (selectedVariationId) {
      return variations.find(v => v.id === selectedVariationId);
    }
    // Only filter by size/color if they actually exist in variations
    const hasSizeVariants = variations.some(v => v.size);
    const hasColorVariants = variations.some(v => v.color);
    return variations.find(v => 
      (!hasSizeVariants || !selectedSize || v.size?.toLowerCase().trim() === selectedSize.toLowerCase().trim()) && 
      (!hasColorVariants || !selectedColor || v.color?.toLowerCase().trim() === selectedColor.toLowerCase().trim())
    );
  }, [variations, selectedSize, selectedColor, selectedVariationId, product]);

  const currentMoq = getRoleMoq(product, selectedVariation);
  const hasExplicitMoq = Boolean(
    (selectedVariation?.shop_moq && selectedVariation.shop_moq > 1) ||
    (selectedVariation?.retail_moq && selectedVariation.retail_moq > 1) ||
    (product?.shop_moq && product.shop_moq > 1) ||
    (product?.retail_moq && product.retail_moq > 1)
  );
  const selectedVariationLabel = useMemo(() => {
    if (!selectedVariation) return "Select";
    return [selectedVariation.size, selectedVariation.color].filter(Boolean).join(" ") || selectedVariation.sku || "Select";
  }, [selectedVariation]);

  const specificationRows = useMemo(() => {
    const grouped: Record<string, string[]> = {};
    productAttributes.forEach((attribute) => {
      if (!attribute.name || !attribute.value) return;
      if (!grouped[attribute.name]) grouped[attribute.name] = [];
      if (!grouped[attribute.name]?.includes(attribute.value)) grouped[attribute.name]?.push(attribute.value);
    });
    const rows = Object.entries(grouped).map(([label, values]) => {
      const normalized = label.toLowerCase();
      const displayValues = normalized === "size" && selectedSize
        ? [selectedSize]
        : (normalized === "color" || normalized === "colour") && selectedColor
          ? [selectedColor]
          : values;
      return { label, value: displayValues.join(", ") };
    });
    if (product?.category) rows.push({ label: "Category", value: product.category.name });
    if (hasExplicitMoq) rows.push({ label: "MOQ", value: `${currentMoq} units` });
    return rows;
  }, [productAttributes, selectedSize, selectedColor, product?.category, hasExplicitMoq, currentMoq]);
  const currentPrice = getRolePrice(product, selectedVariation);
  const currentMrp = getMrp(product, selectedVariation);
  const gstPercent = Number(product?.gst_percentage ?? 0);
  const gstEnabled = product?.gst_enabled !== false && gstPercent > 0;
  const gstInclusive = gstEnabled && product?.gst_pricing_mode === "inclusive";
  const displayInclPrice = gstInclusive ? currentPrice : Math.round(currentPrice * (1 + gstPercent / 100));
  const currentStock = selectedVariation?.stock_quantity ?? product?.stock_quantity ?? 0;
  const moqValid = quantity >= currentMoq;

  const handleAddToRFQ = async () => {
    if (!product) return;
    setIsAddingToRFQ(true);
    try {
      await addToRFQCart(product.id, quantity, selectedVariation?.id);
    } finally {
      setIsAddingToRFQ(false);
    }
  };

  const [isBuyingNow, setIsBuyingNow] = useState(false);

  const handleAddToCartClick = async () => {
    if (!product || !moqValid) return;
    setIsAddingToCart(true);
    try {
      const success = await addToCart(product.id, quantity, selectedVariation?.id);
      return success;
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product || !moqValid || isBuyingNow) return;
    setIsBuyingNow(true);
    try {
      const success = await handleAddToCartClick();
      if (success) navigate("/checkout");
    } finally {
      setIsBuyingNow(false);
    }
  };

  useEffect(() => {
    if (selectedColor && colorImageMap[selectedColor]) {
      setSelectedImage(colorImageMap[selectedColor]);
    }
  }, [selectedColor, colorImageMap]);

  useEffect(() => {
    if (uniqueSizes.length > 0 && !selectedSize) {
      setSelectedSize(uniqueSizes[0] || null);
    }
    if (uniqueColors.length > 0 && !selectedColor) {
      setSelectedColor(uniqueColors[0] || null);
    }
    otherAttributes.forEach(attr => {
      if (!selectedOtherValues[attr.name] && attr.values.length > 0) {
        setSelectedOtherValues(prev => ({ ...prev, [attr.name]: attr.values[0] || "" }));
      }
    });
  }, [uniqueSizes, uniqueColors, selectedSize, selectedColor, otherAttributes, selectedOtherValues]);

  // Default to the first variation in natural order
  useEffect(() => {
    if (sortedVariations.length > 0 && !selectedVariationId) {
      setSelectedVariationId(sortedVariations[0]?.id ?? null);
    }
  }, [sortedVariations, selectedVariationId]);



  // Update quantity when buyerType or MOQ changes (e.g., after auth loads)
  useEffect(() => {
    if (product && currentMoq > 0) {
      setQuantity(prev => Math.max(prev, currentMoq));
    }
  }, [currentMoq, product]);

  const handleQuantityChange = (delta: number) => {
    const newQty = quantity + delta;
    if (newQty >= currentMoq && newQty <= Math.max(currentStock, 9999)) {
      setQuantity(newQty);
    }
  };

  const handleWhatsAppClick = () => {
    if (!product) return;
    const url = `${window.location.origin}/product/${product.slug}`;
    const message = encodeURIComponent(
      `Hi, I'm interested in:\n\n*${product.name}*\nQuantity: ${quantity}\n${selectedVariation ? `Variation: ${selectedSize || ""} ${selectedColor || ""}` : ""}\n\n${url}\n\nPlease provide pricing and availability.`
    );
    window.open(`https://wa.me/919851295129?text=${message}`, "_blank");
  };

  const handleVariantSelect = (variantId: string) => {
    setSelectedVariationId(variantId);
    const variant = variations.find(v => v.id === variantId);
    if (variant) {
      if (variant.size) setSelectedSize(variant.size);
      if (variant.color) setSelectedColor(variant.color);
      // Show variation's feature image, or first gallery image, or keep current
      if (variant.color_image) {
        setSelectedImage(variant.color_image);
      } else if (variant.gallery_images?.length) {
        setSelectedImage(variant.gallery_images[0] as string);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-4 pb-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-12 gap-6">
              <div className="md:col-span-5">
                <Skeleton className="aspect-square rounded-lg" />
              </div>
              <div className="md:col-span-7 space-y-4">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Product not found</h1>
            <Link to="/products">
              <Button>Back to Products</Button>
            </Link>
          </div>
        </main>
      <Footer />
    </div>
    );
  }

  // Merge product images with selected variation's gallery images
  const baseImages = product.images?.length ? product.images : ["/placeholder.svg"];
  const variationGallery = selectedVariation?.gallery_images?.length ? selectedVariation.gallery_images : [];
  const variationFeatureImage = selectedVariation?.color_image ? [selectedVariation.color_image] : [];
  const productImages = [
    ...variationFeatureImage,
    ...variationGallery.filter(img => !variationFeatureImage.includes(img)),
    ...baseImages.filter(img => !variationFeatureImage.includes(img) && !variationGallery.includes(img)),
  ];
  galleryRef.current = productImages;

  return (
    <div className="min-h-screen bg-card md:bg-background">
      <SEOHead
        title={`${product.name}${product.category?.name ? ` — ${product.category.name}` : ""} | Prasadam`}
        description={product.short_description?.slice(0, 160) || product.description?.replace(/<[^>]*>/g, "").substring(0, 160) || `Buy ${product.name} at Prasadam. Premium quality, ₹${currentPrice} only. Fast shipping across India.`}
        keywords={`${product.name}, buy ${product.name} online, ${product.category?.name || "Prasadam"}, ${product.brand?.name || ""}, India`}
        ogType="product"
        ogImage={productImages[0] !== "/placeholder.svg" ? (productImages[0] as string) : ""}
        jsonLd={[
          {
            ...SchemaGenerators.product({
              name: product.name,
              description: product.short_description || (product.description ? product.description.substring(0, 300) : ""),
              image: productImages[0] !== "/placeholder.svg" ? (productImages[0] as string) : "",
              price: currentPrice,
              sku: product.sku || "",
              brand: product.brand?.name || "",
              category: product.category?.name || "",
              url: `https://houskase.com/product/${product.slug}`,
              inStock: (currentStock ?? 0) > 0,
            }),
            "@id": `https://houskase.com/product/${product.slug}#product`,
            ...(reviewStats && reviewStats.total > 0
              ? {
                  aggregateRating: {
                    "@type": "AggregateRating",
                    ratingValue: Number(reviewStats.avg.toFixed(2)),
                    reviewCount: reviewStats.total,
                    bestRating: 5,
                    worstRating: 1,
                  },
                  review: reviewStats.items.map((r) => ({
                    "@type": "Review",
                    author: { "@type": "Person", name: r.author },
                    datePublished: r.date,
                    ...(r.title ? { name: r.title } : {}),
                    ...(r.body ? { reviewBody: r.body } : {}),
                    reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 },
                  })),
                }
              : {}),
          },
          SchemaGenerators.breadcrumb([
            { name: "Home", url: "https://houskase.com/" },
            { name: "Products", url: "https://houskase.com/products" },
            ...(product.category ? [{ name: product.category.name, url: `https://houskase.com/products?category=${product.category.name.toLowerCase()}` }] : []),
            { name: product.name, url: `https://houskase.com/product/${product.slug}` },
          ]),
        ]}
      />
      <Header />

      <main className="bg-card pt-0 pb-24 md:bg-transparent lg:pb-0">
        <div className="container mx-auto px-3 sm:px-4 py-2 max-w-full">


          {/* Main Product Section - modern 2-column layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] gap-5 lg:gap-10 items-start min-w-0">
            {/* Left: Image Gallery - STICKY */}
            <div className="md:sticky md:top-24 min-w-0">
              <div className="space-y-3">
                {/* Main Image */}
                <div
                  className="relative bg-card rounded-lg overflow-hidden border border-border cursor-zoom-in aspect-square shadow-sm"
                  onMouseEnter={() => setGalleryPaused(true)}
                  onMouseLeave={() => setGalleryPaused(false)}
                  onClick={() => {
                    const currentImg = (selectedImage || productImages[0]) as string;
                    const idx = productImages.indexOf(currentImg);
                    setZoomIndex(idx >= 0 ? idx : 0);
                    setZoomOpen(true);
                  }}
                >
                  <SignedImage
                    src={(selectedImage || productImages[0]) as string}
                    alt={product.name}
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                </div>

                {/* Thumbnail Gallery - max 6 visible, scrollable */}
                <div className="relative group">
                  {productImages.length > 6 && (
                    <button
                      type="button"
                      aria-label="Previous image"
                      onClick={() => {
                        const el = document.getElementById('thumb-scroll');
                        if (el) el.scrollBy({ left: -200, behavior: 'smooth' });
                      }}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 border border-border rounded-full w-6 h-6 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >

                      <ChevronRight className="h-3 w-3 rotate-180" />
                    </button>
                  )}
                  <div
                    id="thumb-scroll"
                    className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide max-w-full"
                  >
                    {productImages.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        data-gallery-thumb
                        aria-label={`View image ${idx + 1}`}
                        aria-current={selectedImage === img}
                        onClick={() => setSelectedImage(img)}
                        className={cn(
                          "flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all bg-card",
                          selectedImage === img 
                            ? "border-accent" 
                            : "border-border hover:border-accent/50"
                        )}
                      >
                        <SignedImage src={img} alt="" className="w-full h-full object-contain bg-card" />
                      </button>
                    ))}
                  </div>
                  {productImages.length > 6 && (
                    <button
                      type="button"
                      aria-label="Next image"
                      onClick={() => {
                        const el = document.getElementById('thumb-scroll');
                        if (el) el.scrollBy({ left: 200, behavior: 'smooth' });
                      }}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 border border-border rounded-full w-6 h-6 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >

                      <ChevronRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Product Info + Buy Box in one white card */}
            <div className="min-w-0 space-y-4 bg-card rounded-xl border border-border p-4 sm:p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              {/* Title & Meta */}
              <div>
                <h1 className="text-lg sm:text-xl md:text-lg lg:text-xl md:font-semibold font-bold text-foreground leading-tight md:leading-none mb-1 md:mb-0.5">
                  {product.name}
                </h1>

                <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                  {product.sku && <span>SKU: {product.sku}</span>}
                  {product.brand && (
                    <>
                      <span>•</span>
                      <span>Brand: <span className="text-foreground font-medium">{product.brand.name}</span></span>
                    </>
                  )}
                </div>

                {/* Price & Review Summary Inline */}
                <div className="mt-3">
                  {getPriceLabel() && (
                    <span className="text-[10px] font-medium text-accent bg-accent/10 px-1.5 py-0.5 rounded mb-1.5 inline-block">
                      {getPriceLabel()}
                    </span>
                  )}
                  <div className="flex items-center flex-wrap gap-x-3 gap-y-2 lg:flex-nowrap">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl sm:text-3xl font-extrabold text-foreground">₹{currentPrice.toLocaleString("en-IN")}</span>
                      {currentMrp > 0 && currentMrp !== currentPrice && (
                        <div className="flex items-center gap-2">
                          <span className="text-xl sm:text-xl text-muted-foreground line-through">₹{currentMrp.toLocaleString("en-IN")}</span>
                          {currentMrp > currentPrice && (
                            <span className="text-xl sm:text-xl font-semibold text-success">
                              {Math.round(((currentMrp - currentPrice) / currentMrp) * 100)}% OFF
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center lg:ml-auto">
                      <div className="hidden sm:block">
                        <ReviewsSummary productId={product.id} />
                      </div>
                      <div className="block sm:hidden">
                        <ReviewsSummary productId={product.id} variant="compact" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {gstEnabled && (
                      <p className="text-xs text-muted-foreground">
                        ₹{displayInclPrice.toLocaleString("en-IN")} (Incl. of all taxes) ·{" "}
                        <span className="text-success font-medium">
                          {gstInclusive ? `GST included (${gstPercent}%)` : `+${gstPercent}% GST`}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Variant Selection — unified card grid */}
              {sortedVariations.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-foreground mb-2.5">
                    Select {variationAttributeLabel}:{" "}
                    <span className="font-bold">
                      {selectedVariationLabel}
                    </span>
                  </p>
                  <div className="-mx-3 flex snap-x snap-mandatory gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:gap-3 md:px-0">
                    {sortedVariations.map((v: any, vi: number) => {
                      const label = [v.size, v.color].filter(Boolean).join(" ") || v.sku || "Variant";
                      const vPrice = getRolePrice(product, v);
                      const vMrp = getMrp(product, v);
                      const img = v.color_image || v.gallery_images?.[0] || product.images?.[0] || "/placeholder.svg";
                      const isSelected = selectedVariation?.id === v.id;
                      const total = sortedVariations.length;
                      const badge =
                        total >= 4 && vi === 1 ? { text: "★ Most Popular", tone: "var-badge--red" }
                        : total >= 4 && vi === 2 ? { text: "Best Deal", tone: "var-badge--green" }
                        : total >= 4 && vi === total - 1 ? { text: "Max Savings", tone: "var-badge--amber" }
                        : total === 3 && vi === 1 ? { text: "★ Most Popular", tone: "var-badge--red" }
                        : total === 3 && vi === 2 ? { text: "Best Deal", tone: "var-badge--green" }
                        : total === 2 && vi === 1 ? { text: "Best Deal", tone: "var-badge--green" }
                        : null;
                      return (
                        <button
                          key={v.id}
                          onClick={() => handleVariantSelect(v.id)}
                          className={cn(
                            "relative shrink-0 basis-[calc((100%_-_1rem)/3)] snap-start rounded-[10px] border-2 bg-card overflow-hidden transition-all text-center min-w-0 md:basis-[calc((100%_-_1.5rem)/3)] lg:basis-[calc((100%_-_2.25rem)/4)]",
                            isSelected
                              ? "border-[#e8a33d] shadow-md"
                              : "border-border hover:border-[#e8a33d]/60 hover:shadow-sm"
                          )}
                        >
                          {badge && (
                            <span className={`var-badge ${badge.tone}`}>{badge.text}</span>
                          )}
                          {isSelected && (
                            <span className="absolute top-1.5 right-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-[#e8a33d] text-white">
                              <Check className="h-3 w-3" strokeWidth={3} />
                            </span>
                          )}
                          <span className="block overflow-hidden rounded-t-[8px]">
                            <SignedImage
                              src={img}
                              alt={label}
                              className="w-full aspect-square object-contain bg-card"
                            />
                          </span>
                          <div className="px-1 pb-1.5 pt-2.5">
                            <p className="text-[11px] sm:text-[12px] font-bold text-foreground leading-snug truncate">
                              {label}
                            </p>
                            <div className="flex items-baseline justify-center gap-1 flex-wrap">
                              <span className="text-[12px] sm:text-[14px] font-extrabold text-foreground">
                                ₹{(vPrice || 0).toLocaleString("en-IN")}
                              </span>
                              {vMrp > 0 && vMrp > vPrice && (
                                <span className="text-[10px] sm:text-[11px] font-normal text-muted-foreground line-through">
                                  ₹{vMrp.toLocaleString("en-IN")}
                                </span>
                              )}
                            </div>
                          </div>

                        </button>
                      );
                    })}
                  </div>
                </div>
              )}


              {/* Available Coupons */}
              <ProductCoupons categoryId={product.category_id} />

              {/* Buy Box */}
              <div className="!mt-1 space-y-3 pt-0">
                {hasExplicitMoq && (
                  <p className="text-xs text-muted-foreground">Minimum Order Quantity- {currentMoq}</p>
                )}

                {hasExplicitMoq && !moqValid && (
                  <p className="text-xs text-destructive font-medium">
                    Minimum order quantity for this product is {currentMoq} units
                  </p>
                )}

                {/* Mobile: Quantity + Add to cart */}
                <div className="flex items-stretch gap-2 md:hidden">
                  <div className="flex items-center border border-border rounded-lg shrink-0 h-11">
                    <button
                      aria-label="Decrease quantity"
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= currentMoq}
                      className="px-2.5 h-full rounded-l-lg disabled:opacity-40"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
                    <button
                      aria-label="Increase quantity"
                      onClick={() => handleQuantityChange(1)}
                      className="px-2.5 h-full rounded-r-lg"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <Button
                    className="btn-gold-frame flex-1 min-w-0 h-11 rounded-[5px] text-xs font-bold uppercase inline-flex items-center justify-center gap-1.5"
                    onClick={handleAddToCartClick}
                    disabled={isAddingToCart || isBuyingNow || !moqValid}
                  >
                    {isAddingToCart ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                    {isAddingToCart ? "Adding..." : "Add to cart"}
                  </Button>
                </div>

                {/* Quantity + CTA Buttons in one row */}
                <div className="hidden items-stretch gap-2.5 md:flex">
                  <div className="flex items-center border border-border rounded-lg shrink-0 h-11">
                    <button
                      aria-label="Decrease quantity"
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= currentMoq}
                      className="px-2.5 h-full hover:bg-secondary rounded-l-lg transition-colors disabled:opacity-40"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
                    <button
                      aria-label="Increase quantity"
                      onClick={() => handleQuantityChange(1)}
                      className="px-2.5 h-full hover:bg-secondary rounded-r-lg transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <Button
                    className="btn-gold-frame flex-1 min-w-0 text-[11px] sm:text-sm font-bold h-11 uppercase tracking-tight sm:tracking-wide rounded-[5px] px-2 inline-flex items-center justify-center gap-1 sm:gap-1.5"
                    onClick={handleAddToCartClick}
                    disabled={isAddingToCart || isBuyingNow || !moqValid}
                  >
                    {isAddingToCart ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                    {isAddingToCart ? "Adding..." : "ADD TO CART"}
                  </Button>
                  <Button
                    className="btn-gold-frame btn-premium-shine hidden lg:inline-flex flex-1 min-w-0 text-[11px] sm:text-sm font-bold h-11 uppercase tracking-tight sm:tracking-wide rounded-[5px] px-2 items-center justify-center gap-1 sm:gap-1.5"
                    onClick={handleBuyNow}
                    disabled={isAddingToCart || isBuyingNow || !moqValid}
                  >
                    {isBuyingNow ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                    {isBuyingNow ? "PROCESSING..." : "BUY NOW"}
                  </Button>
                </div>

                {/* Payment methods + secure payment badges */}
                <div className="space-y-2">
                  <img
                    src="https://ik.imagekit.io/houskaseseepika/PAYMENT-GETWAY-2%20(1).avif?updatedAt=1787223477133"
                    alt="100% secure payment methods"
                    loading="lazy"
                    className="w-full h-auto rounded-lg"
                  />
                  <img
                    src="https://ik.imagekit.io/houskaseseepika/Secure-Payment%20(2).avif"
                    alt="100% secure payment"
                    loading="lazy"
                    className="w-full h-auto rounded-lg"
                  />
                </div>

                {/* Quick Actions Row */}
                <div className="grid grid-cols-3 divide-x divide-border border border-border rounded-lg">
                  <button
                    onClick={() => window.open("tel:+919851295129")}
                    className="flex flex-col items-center gap-1.5 py-3 hover:bg-secondary/50 transition-colors"
                  >
                    <Phone className="h-5 w-5 text-primary" />
                    <span className="text-[10px] text-center text-muted-foreground leading-tight">
                      Call us at<br />+91 98512 95129
                    </span>
                  </button>
                  <button
                    onClick={handleWhatsAppClick}
                    className="flex flex-col items-center gap-1.5 py-3 hover:bg-secondary/50 transition-colors"
                  >
                    <MessageCircle className="h-5 w-5 text-success" />
                    <span className="text-[10px] text-center text-muted-foreground leading-tight">
                      Buy on<br />Chat
                    </span>
                  </button>
                  <button
                    onClick={handleAddToRFQ}
                    className="flex flex-col items-center gap-1.5 py-3 hover:bg-secondary/50 transition-colors"
                  >
                    <FileText className="h-5 w-5 text-accent" />
                    <span className="text-[10px] text-center text-muted-foreground leading-tight">
                      Ask for Bulk<br />Qty Quote
                    </span>
                  </button>
                </div>

                {/* Delivery Pincode Check */}
                <DeliveryChecker />

                {/* Returns + Shipping */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border">
                  <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border bg-secondary/20">
                    <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                      <Shield className="h-4 w-4 text-success" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground leading-tight">Returns</p>
                      <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">As per Brand / 7 days</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border bg-secondary/20">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Truck className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground leading-tight">Shipping</p>
                      <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">Free for bulk orders</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Specifications Table */}
              {(productAttributes.length > 0 || product.category || hasExplicitMoq) && (
                <div className="hidden md:block">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-foreground uppercase tracking-wider">SPECIFICATIONS</p>
                  </div>
                  <div className="rounded-lg overflow-hidden text-xs">
                    {(() => {
                      return specificationRows.map((row, idx) => (
                        <div
                          key={`${row.label}-${idx}`}
                          className={cn(
                            "grid grid-cols-2",
                            idx % 2 !== 0 ? "bg-[#f8f9fa]" : "bg-white"
                          )}
                        >
                          <div className="p-2.5 font-medium text-muted-foreground">
                            {row.label}
                          </div>
                          <div className="p-2.5 text-foreground">
                            {row.value}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* Overview */}
              {(product.short_description || product.description) && (
                <div className="hidden md:block">
                  <p className="text-sm font-semibold text-foreground mb-2">OVERVIEW</p>
                  <div 
                    className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap
                      [&_h1]:text-sm [&_h1]:font-bold [&_h1]:text-foreground [&_h1]:mb-2
                      [&_h2]:text-xs [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mt-3 [&_h2]:mb-1
                      [&_p]:mb-2 [&_p]:leading-relaxed
                      [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:mb-2 [&_ul]:space-y-0.5
                      [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:mb-2
                      [&_strong]:text-foreground [&_strong]:font-semibold
                      [&_em]:italic [&_br]:block"
                  >
                    <FormattedProductText text={product.short_description || product.description} />
                  </div>
                </div>
              )}
            </div>

          </div>

          <section className="mt-3 border-y border-border bg-card px-1 py-4 md:hidden" aria-label="Product benefits">
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              {mobileBenefits.map(({ title, detail, Icon }) => (
                <div key={`${title}-${detail}`} className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <strong className="block text-xs font-bold leading-tight text-foreground">{title}</strong>
                    {detail && <span className="mt-0.5 block text-[11px] leading-tight text-muted-foreground">{detail}</span>}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="md:hidden" aria-label="Product information">
            <Accordion type="single" collapsible defaultValue="details" className="space-y-1.5 py-3">
              <AccordionItem value="details" className="rounded-md border-0 bg-[#fdf3e8] px-3">
                <AccordionTrigger className="py-3 text-sm font-bold hover:no-underline"><span className="flex items-center gap-3"><FileText className="h-5 w-5 text-accent" />Product Details</span></AccordionTrigger>
                <AccordionContent className="space-y-2 text-xs text-foreground">
                  {specificationRows.map((row) => <p key={row.label}><strong>{row.label}:</strong> {row.value}</p>)}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="made-of" className="rounded-md border-0 bg-[#fdf3e8] px-3">
                <AccordionTrigger className="py-3 text-sm hover:no-underline"><span className="flex items-center gap-3"><ListChecks className="h-5 w-5 text-accent" />What Is It Made Of?</span></AccordionTrigger>
                <AccordionContent className="text-xs leading-relaxed text-muted-foreground">
                  <FormattedProductText text={product.short_description || product.description || "Product composition details are listed in the specifications above."} />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="shipping" className="rounded-md border-0 bg-[#fdf3e8] px-3">
                <AccordionTrigger className="py-3 text-sm hover:no-underline"><span className="flex items-center gap-3"><Truck className="h-5 w-5 text-accent" />Shipping Information</span></AccordionTrigger>
                <AccordionContent className="text-xs leading-relaxed text-muted-foreground">Secure delivery across India through trusted courier partners. Enter your pincode above for an estimated delivery date.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="returns" className="rounded-md border-0 bg-[#fdf3e8] px-3">
                <AccordionTrigger className="py-3 text-sm hover:no-underline"><span className="flex items-center gap-3"><RotateCcw className="h-5 w-5 text-accent" />Returns &amp; Warranty</span></AccordionTrigger>
                <AccordionContent className="text-xs leading-relaxed text-muted-foreground">Returns are accepted as per the product and brand policy. Contact support within 7 days if your order arrives damaged or incorrect.</AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="grid grid-cols-4 divide-x divide-border border-y border-border py-4">
              {[
                { label: "100%", detail: "Satisfaction", Icon: Award },
                { label: "Certified", detail: "Product", Icon: BadgeCheck },
                { label: "Natural", detail: "Ingredients", Icon: Leaf },
                { label: "Trusted", detail: "By Families", Icon: Heart },
              ].map(({ label, detail, Icon }) => (
                <div key={label} className="flex min-w-0 flex-col items-center px-1 text-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-accent/50 text-accent"><Icon className="h-5 w-5" /></span>
                  <strong className="mt-1.5 text-[11px] text-foreground">{label}</strong>
                  <span className="text-[10px] leading-tight text-muted-foreground">{detail}</span>
                </div>
              ))}
            </div>
          </section>

          <FrequentlyBoughtTogether
            currentProduct={product}
            categoryId={product.category_id}
            onAdd={(productId) => addToCart(productId, 1, null)}
          />


          {/* Promotional banner (admin-uploadable per product) */}
          {product.banner_image && (
            <div className="mt-6 rounded-xl overflow-hidden border border-border">
              <SignedImage
                src={product.banner_image}
                alt={`${product.name} promotional banner`}
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {/* Related products → Description blocks → Reviews → Trending reels */}
          <RelatedProducts currentProductId={product.id} categoryId={product.category_id} />

          {Array.isArray((product as any).description_blocks) &&
            (product as any).description_blocks.length > 0 && (
              <section className="mt-10 space-y-8" aria-label="Product details">
                {((product as any).description_blocks as Array<{ image?: string; text?: string }>).map(
                  (block, idx) => (
                    <div
                      key={idx}
                      className={`grid gap-4 sm:gap-8 items-center md:grid-cols-2 ${idx % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""}`}
                    >
                      {block.image && (
                        <div className="rounded-xl overflow-hidden border border-border bg-white">
                          <SignedImage
                            src={block.image}
                            alt={`${product.name} detail ${idx + 1}`}
                            className="w-full h-auto object-contain"
                          />
                        </div>
                      )}
                      {block.text && (
                        <div className="text-sm text-muted-foreground leading-relaxed">
                          <FormattedProductText text={block.text} />
                        </div>
                      )}
                    </div>
                  )
                )}
              </section>
            )}

          <CustomerReviews
            productId={product.id}
            productName={product.name}
            onStats={handleReviewStats}
          />
          <div className="mt-3">
            <ReelsSection title="Trending Reels" placement="product" />
          </div>
          
        </div>
      </main>

      <Footer />

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-lg lg:hidden">
        <Button
          className="btn-gold-frame btn-premium-shine h-12 w-full rounded-[5px] text-sm font-bold"
          onClick={handleBuyNow}
          disabled={isAddingToCart || isBuyingNow || !moqValid}
        >
          {isBuyingNow ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-5 w-5" />}
          {isBuyingNow ? "Processing..." : "Buy it now"}
        </Button>
      </div>


      {/* Image Zoom Modal - Amazon Style */}
      {zoomOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setZoomOpen(false)}>
          <div
            className="relative bg-background rounded-xl shadow-2xl w-[95vw] h-[90vh] md:w-[85vw] md:h-[85vh] flex flex-col md:flex-row overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setZoomOpen(false)}
              className="absolute top-3 right-3 z-20 bg-background/80 border border-border rounded-full w-8 h-8 flex items-center justify-center shadow-sm hover:bg-secondary transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Main Image Area with hover zoom */}
            <div className="flex-1 flex items-center justify-center relative min-h-0 overflow-hidden">
              {/* Mobile swipe area */}
              <div
                className="w-full h-full flex items-center justify-center p-4 md:p-6 cursor-zoom-in group"
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  if (touch) (e.currentTarget as any)._touchStartX = touch.clientX;
                }}
                onTouchEnd={(e) => {
                  const startX = (e.currentTarget as any)._touchStartX;
                  if (startX === undefined) return;
                  const endX = e.changedTouches[0]?.clientX;
                  if (endX === undefined) return;
                  const diff = startX - endX;
                  if (Math.abs(diff) > 50) {
                    if (diff > 0 && zoomIndex < productImages.length - 1) {
                      setZoomIndex(zoomIndex + 1);
                    } else if (diff < 0 && zoomIndex > 0) {
                      setZoomIndex(zoomIndex - 1);
                    }
                  }
                }}
                onMouseMove={(e) => {
                  const img = e.currentTarget.querySelector('img');
                  if (!img) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  img.style.transformOrigin = `${x}% ${y}%`;
                  img.style.transform = 'scale(2)';
                }}
                onMouseLeave={(e) => {
                  const img = e.currentTarget.querySelector('img');
                  if (img) {
                    img.style.transform = 'scale(1)';
                    img.style.transformOrigin = 'center center';
                  }
                }}
              >
                <SignedImage
                  src={productImages[zoomIndex] as string}
                  alt={product.name}
                  className="max-w-full max-h-full object-contain select-none transition-transform duration-150 ease-out"
                  draggable={false}
                />
              </div>

              {/* Desktop navigation arrows */}
              {zoomIndex > 0 && (
                <button
                  onClick={() => setZoomIndex(zoomIndex - 1)}
                  className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 bg-background/90 border border-border rounded-full w-9 h-9 items-center justify-center shadow-sm hover:bg-secondary transition-colors z-10"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
              {zoomIndex < productImages.length - 1 && (
                <button
                  onClick={() => setZoomIndex(zoomIndex + 1)}
                  className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 bg-background/90 border border-border rounded-full w-9 h-9 items-center justify-center shadow-sm hover:bg-secondary transition-colors z-10"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Right side panel - product info + thumbnails (desktop) / bottom strip (mobile) */}
            <div className="flex flex-row md:flex-col gap-2 p-3 md:p-4 overflow-x-auto md:overflow-y-auto md:w-[280px] border-t md:border-t-0 md:border-l border-border bg-secondary/10 scrollbar-hide">
              {/* Product info - desktop only */}
              <div className="hidden md:block mb-2">
                <h3 className="text-sm font-semibold text-foreground leading-tight line-clamp-3 mb-1.5">{product.name}</h3>
                {selectedSize && (
                  <p className="text-xs text-muted-foreground">Size: <span className="font-medium text-foreground">{selectedSize}</span></p>
                )}
                {selectedColor && (
                  <p className="text-xs text-muted-foreground">Colour: <span className="font-medium text-foreground">{selectedColor}</span></p>
                )}
              </div>

              {/* Thumbnail grid - wrapping on desktop, horizontal on mobile */}
              <div className="flex md:flex-wrap gap-2">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setZoomIndex(idx)}
                    className={cn(
                      "flex-shrink-0 w-14 h-14 md:w-[60px] md:h-[60px] rounded-lg overflow-hidden border-2 transition-all",
                      zoomIndex === idx
                        ? "border-accent shadow-sm"
                        : "border-border hover:border-accent/50"
                    )}
                  >
                    <SignedImage src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile image counter */}
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 md:hidden bg-black/60 text-white text-xs px-3 py-1 rounded-full">
              {zoomIndex + 1} / {productImages.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
