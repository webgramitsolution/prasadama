CREATE OR REPLACE FUNCTION public.list_all_coupons()
 RETURNS SETOF coupons
 LANGUAGE plpgsql
 STABLE
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY SELECT * FROM public.coupons ORDER BY created_at DESC;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.list_all_coupons() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_all_coupons() TO authenticated, service_role;