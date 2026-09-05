GRANT SELECT ON public.product_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_reviews TO authenticated;
GRANT ALL ON public.product_reviews TO service_role;

CREATE POLICY "Users can create their own reviews"
ON public.product_reviews FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND is_approved = false);

CREATE POLICY "Users can update their own reviews"
ON public.product_reviews FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
ON public.product_reviews FOR DELETE TO authenticated
USING (auth.uid() = user_id);