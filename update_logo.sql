UPDATE site_settings 
SET value = jsonb_set(value, '{logoUrl}', '"https://ik.imagekit.io/houskase/home%20(1).webp?updatedAt=1783150262496"') 
WHERE key = 'store';
