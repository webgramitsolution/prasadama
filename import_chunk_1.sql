BEGIN;
INSERT INTO public.product_attribute_values (id, attribute_id, value, created_at) VALUES ('3e4c000f-66ed-4c9f-af29-e62b88da35b5', 'bcdd2659-3b06-407b-a396-0dba8a56c48a', 'Compressed Tablet', '2026-07-04 01:03:42.41778+00') ON CONFLICT (id) DO UPDATE SET attribute_id = EXCLUDED.attribute_id, value = EXCLUDED.value, created_at = EXCLUDED.created_at;

INSERT INTO public.product_attribute_values (id, attribute_id, value, created_at) VALUES ('68012007-d04c-4e6a-a45f-4907f67c3c3c', '788bbabd-3799-43b7-8324-5d0305e77a5d', 'Suitable for All Skin Types', '2026-07-04 01:03:43.258135+00') ON CONFLICT (id) DO UPDATE SET attribute_id = EXCLUDED.attribute_id, value = EXCLUDED.value, created_at = EXCLUDED.created_at;

INSERT INTO public.product_attribute_values (id, attribute_id, value, created_at) VALUES ('7e366066-2774-4d45-9e8b-905247ce896b', '7eda9335-6760-4a3b-9aa0-d89716fe0223', 'Add Water to Expand', '2026-07-04 01:03:43.697422+00') ON CONFLICT (id) DO UPDATE SET attribute_id = EXCLUDED.attribute_id, value = EXCLUDED.value, created_at = EXCLUDED.created_at;

INSERT INTO public.product_attribute_values (id, attribute_id, value, created_at) VALUES ('92490536-f8a7-46ce-bd8d-6f3f1ffef175', 'fedc2fbb-5018-471b-90ca-3c3e7dbe61ad', 'Single Use', '2026-07-04 01:03:44.124357+00') ON CONFLICT (id) DO UPDATE SET attribute_id = EXCLUDED.attribute_id, value = EXCLUDED.value, created_at = EXCLUDED.created_at;

INSERT INTO public.product_attribute_values (id, attribute_id, value, created_at) VALUES ('9de5127b-4592-4039-85b6-7f56f681057f', 'bf9633bc-49c7-4ff5-88ab-0f92bb665bb2', 'Yes', '2026-07-04 01:03:44.56334+00') ON CONFLICT (id) DO UPDATE SET attribute_id = EXCLUDED.attribute_id, value = EXCLUDED.value, created_at = EXCLUDED.created_at;

INSERT INTO public.product_attribute_values (id, attribute_id, value, created_at) VALUES ('4ae32428-3788-4e2e-a894-3a67e44b8c83', '16b6c05b-f664-4ce0-809c-e890c3d58de9', 'Microfiber Cleaning Cloth', '2026-07-04 01:10:16.684197+00') ON CONFLICT (id) DO UPDATE SET attribute_id = EXCLUDED.attribute_id, value = EXCLUDED.value, created_at = EXCLUDED.created_at;

INSERT INTO public.product_attribute_values (id, attribute_id, value, created_at) VALUES ('93b98442-e57f-42cf-abd3-b63b1b6706c7', '5bbe9607-2279-4669-950b-1109d8aab0d1', 'Up to 500 Washes', '2026-07-04 01:10:17.685953+00') ON CONFLICT (id) DO UPDATE SET attribute_id = EXCLUDED.attribute_id, value = EXCLUDED.value, created_at = EXCLUDED.created_at;

INSERT INTO public.product_attribute_values (id, attribute_id, value, created_at) VALUES ('7c11207a-7242-4793-a263-47172a0c03af', '15eb3232-ea11-4bdd-8fda-6d1d0e2f1772', 'Yes', '2026-07-04 01:10:19.279768+00') ON CONFLICT (id) DO UPDATE SET attribute_id = EXCLUDED.attribute_id, value = EXCLUDED.value, created_at = EXCLUDED.created_at;

INSERT INTO public.product_attribute_values (id, attribute_id, value, created_at) VALUES ('76e48ea7-4582-4017-8252-7e57d270aefb', 'bc0d4931-ceab-4b97-aef7-1b673b661304', 'Yes', '2026-07-04 01:10:19.999514+00') ON CONFLICT (id) DO UPDATE SET attribute_id = EXCLUDED.attribute_id, value = EXCLUDED.value, created_at = EXCLUDED.created_at;

INSERT INTO public.product_attribute_values (id, attribute_id, value, created_at) VALUES ('36849059-5d90-4497-ba2a-e2358a8c60cf', '68338322-338a-44d3-bff1-a098c1887436', 'Pack of 5 Magic Cleaning Cloths', '2026-07-04 01:10:20.414274+00') ON CONFLICT (id) DO UPDATE SET attribute_id = EXCLUDED.attribute_id, value = EXCLUDED.value, created_at = EXCLUDED.created_at;

INSERT INTO public.product_attribute_values (id, attribute_id, value, created_at) VALUES ('20f5bf80-8429-4d4f-a459-18e359406336', 'ad6d4130-068f-4033-ab37-4f3c0ebc7ae7', 'Pack of 5', '2026-07-04 01:33:59.051263+00') ON CONFLICT (id) DO UPDATE SET attribute_id = EXCLUDED.attribute_id, value = EXCLUDED.value, created_at = EXCLUDED.created_at;

INSERT INTO public.product_attribute_values (id, attribute_id, value, created_at) VALUES ('18d4f23f-b133-4ac2-ad9b-7473a1a93bf2', 'ad6d4130-068f-4033-ab37-4f3c0ebc7ae7', 'Pack of 10', '2026-07-04 01:33:59.511053+00') ON CONFLICT (id) DO UPDATE SET attribute_id = EXCLUDED.attribute_id, value = EXCLUDED.value, created_at = EXCLUDED.created_at;

INSERT INTO public.product_attribute_values (id, attribute_id, value, created_at) VALUES ('ef7c7e1e-31aa-4b5d-a25a-8bcfe08196db', 'ad6d4130-068f-4033-ab37-4f3c0ebc7ae7', 'Pack of 15', '2026-07-04 01:33:59.94704+00') ON CONFLICT (id) DO UPDATE SET attribute_id = EXCLUDED.attribute_id, value = EXCLUDED.value, created_at = EXCLUDED.created_at;

INSERT INTO public.product_attribute_values (id, attribute_id, value, created_at) VALUES ('5a0516f0-1cb4-4095-ad01-ef97d6e8b8da', '9695135f-cf2e-4fec-8f87-efd3ecc70685', '250ml', '2026-07-29 06:58:21.869419+00') ON CONFLICT (id) DO UPDATE SET attribute_id = EXCLUDED.attribute_id, value = EXCLUDED.value, created_at = EXCLUDED.created_at;

INSERT INTO public.product_attribute_values (id, attribute_id, value, created_at) VALUES ('46ce7a7a-3f69-4ca9-a439-be6f71ec9abe', '9695135f-cf2e-4fec-8f87-efd3ecc70685', '500ml', '2026-07-29 06:58:22.967344+00') ON CONFLICT (id) DO UPDATE SET attribute_id = EXCLUDED.attribute_id, value = EXCLUDED.value, created_at = EXCLUDED.created_at;

INSERT INTO public.product_attribute_values (id, attribute_id, value, created_at) VALUES ('9c826fd5-42d7-46b3-bfd6-940deee12e51', '9695135f-cf2e-4fec-8f87-efd3ecc70685', '750ml', '2026-07-29 06:58:24.087543+00') ON CONFLICT (id) DO UPDATE SET attribute_id = EXCLUDED.attribute_id, value = EXCLUDED.value, created_at = EXCLUDED.created_at;

INSERT INTO public.product_attribute_values (id, attribute_id, value, created_at) VALUES ('46758a1b-fa91-41b1-9302-710ce6c22322', '9695135f-cf2e-4fec-8f87-efd3ecc70685', '300ml', '2026-08-03 04:50:01.380009+00') ON CONFLICT (id) DO UPDATE SET attribute_id = EXCLUDED.attribute_id, value = EXCLUDED.value, created_at = EXCLUDED.created_at;

INSERT INTO public.product_attribute_values (id, attribute_id, value, created_at) VALUES ('4b509a69-cd5c-40ec-8b0f-735878a7c8e9', '9695135f-cf2e-4fec-8f87-efd3ecc70685', '150ml', '2026-08-03 04:50:02.157664+00') ON CONFLICT (id) DO UPDATE SET attribute_id = EXCLUDED.attribute_id, value = EXCLUDED.value, created_at = EXCLUDED.created_at;

INSERT INTO public.product_attribute_assignments (id, product_id, attribute_id, attribute_value_id, used_for_variations, visible_on_product, created_at) VALUES ('0c8f2373-ae17-44b7-bcec-0980714b775f', 'fbead78c-8dfb-4c5c-98a7-0953cce4761c', '16b6c05b-f664-4ce0-809c-e890c3d58de9', 'eb39e26c-f974-4dcf-a2c1-b846e44dba08', false, true, '2026-08-03 03:38:00.445021+00') ON CONFLICT (id) DO UPDATE SET product_id = EXCLUDED.product_id, attribute_id = EXCLUDED.attribute_id, attribute_value_id = EXCLUDED.attribute_value_id, used_for_variations = EXCLUDED.used_for_variations, visible_on_product = EXCLUDED.visible_on_product, created_at = EXCLUDED.created_at;

INSERT INTO public.product_attribute_assignments (id, product_id, attribute_id, attribute_value_id, used_for_variations, visible_on_product, created_at) VALUES ('732de92d-8aa6-4dfe-9b6c-4cb2dd523b18', 'fbead78c-8dfb-4c5c-98a7-0953cce4761c', '788bbabd-3799-43b7-8324-5d0305e77a5d', '68012007-d04c-4e6a-a45f-4907f67c3c3c', false, true, '2026-08-03 03:38:00.745018+00') ON CONFLICT (id) DO UPDATE SET product_id = EXCLUDED.product_id, attribute_id = EXCLUDED.attribute_id, attribute_value_id = EXCLUDED.attribute_value_id, used_for_variations = EXCLUDED.used_for_variations, visible_on_product = EXCLUDED.visible_on_product, created_at = EXCLUDED.created_at;

COMMIT;