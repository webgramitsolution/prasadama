
UPDATE public.site_settings 
SET value = jsonb_set(value, '{logoUrl}', '"/__l5e/assets-v1/d790c6ca-3f3e-4a9a-a2eb-aa297ef27f6b/prasadam-logo-transparent.png"') 
WHERE key = 'store';
