-- Assign admin role to sheepikagupta@gmail.com
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Get the user ID from auth.users
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'sheepikagupta@gmail.com';

    IF target_user_id IS NOT NULL THEN
        -- Insert into user_roles if not already present
        INSERT INTO public.user_roles (user_id, role)
        VALUES (target_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END $$;
