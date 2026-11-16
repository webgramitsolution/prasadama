CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- Callers may only ask about their own roles; trusted server code may ask about anyone.
  SELECT (
    _user_id = auth.uid()
    OR coalesce(auth.role(), '') = 'service_role'
  )
  AND EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;