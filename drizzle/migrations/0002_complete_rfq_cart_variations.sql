ALTER TABLE public.rfq_cart_items
  ADD COLUMN IF NOT EXISTS variation_id uuid REFERENCES public.product_variations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes text;

CREATE INDEX IF NOT EXISTS rfq_cart_items_variation_id_idx
  ON public.rfq_cart_items (variation_id);