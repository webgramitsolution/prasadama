CREATE POLICY "Users can create their own rfq requests"
ON public.rfq_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own rfq requests"
ON public.rfq_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create items for their own rfq requests"
ON public.rfq_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.rfq_requests r
    WHERE r.id = rfq_id
      AND r.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view items for their own rfq requests"
ON public.rfq_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.rfq_requests r
    WHERE r.id = rfq_id
      AND r.user_id = auth.uid()
  )
);