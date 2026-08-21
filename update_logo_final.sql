
UPDATE public.site_settings 
SET value = jsonb_set(value, '{logoUrl}', '"https://ik.imagekit.io/houskaseseepika/home%20(1)%20(1).png?updatedAt=1787220696428"') 
WHERE key = 'store';
