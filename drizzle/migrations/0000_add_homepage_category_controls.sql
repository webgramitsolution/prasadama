ALTER TABLE public.categories
  ADD COLUMN ribbon_label text,
  ADD COLUMN show_on_home boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.categories.ribbon_label IS 'Optional short label displayed on the homepage fish-tail ribbon.';
COMMENT ON COLUMN public.categories.show_on_home IS 'Controls whether an active top-level category appears in the homepage category rail.';

CREATE INDEX categories_homepage_order_idx
  ON public.categories (sort_order, created_at)
  WHERE is_active = true AND show_on_home = true AND parent_id IS NULL;