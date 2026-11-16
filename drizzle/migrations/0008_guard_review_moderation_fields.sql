CREATE OR REPLACE FUNCTION public.guard_review_moderation_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.role() = 'service_role' OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  -- Customers cannot change moderation or verification state; edits go back to review.
  NEW.is_approved := false;
  NEW.is_verified := OLD.is_verified;
  NEW.user_id := OLD.user_id;
  NEW.product_id := OLD.product_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_review_moderation_fields ON public.product_reviews;
CREATE TRIGGER guard_review_moderation_fields
BEFORE UPDATE ON public.product_reviews
FOR EACH ROW EXECUTE FUNCTION public.guard_review_moderation_fields();

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.product_reviews;
CREATE POLICY "Users can update their own reviews" ON public.product_reviews
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND is_approved = false);