CREATE POLICY "Admins can read chat customer profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  AND EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.buyer_id = profiles.user_id
  )
);