BEGIN;
INSERT INTO public.product_attribute_values (id, attribute_id, value, created_at) VALUES ('eb39e26c-f974-4dcf-a2c1-b846e44dba08', '16b6c05b-f664-4ce0-809c-e890c3d58de9', 'Premium Non-Woven Fabric', '2026-07-03 07:33:17.013335+00') ON CONFLICT (id) DO UPDATE SET attribute_id = EXCLUDED.attribute_id, value = EXCLUDED.value, created_at = EXCLUDED.created_at;

INSERT INTO public.product_attribute_values (id, attribute_id, value, created_at) VALUES ('b030599b-de4b-4eb3-9ca9-d3c7a619d129', 'd8196340-cd64-4263-88f2-b8d8d6a540b3', 'Blue', '2026-07-03 07:33:17.654256+00') ON CONFLICT (id) DO UPDATE SET attribute_id = EXCLUDED.attribute_id, value = EXCLUDED.value, created_at = EXCLUDED.created_at;

INSERT INTO public.product_attribute_values (id, attribute_id, value, created_at) VALUES ('a56c03e0-6b9c-4e23-a7ac-f6613ee3efb5', '0af854b4-0e49-4702-9872-116ece602928', 'Cleaning Cloth Roll', '2026-07-03 07:33:18.143341+00') ON CONFLICT (id) DO UPDATE SET attribute_id = EXCLUDED.attribute_id, value = EXCLUDED.value, created_at = EXCLUDED.created_at;

INSERT INTO public.product_attribute_values (id, attribute_id, value, created_at) VALUES ('b1f2f12e-4fad-43c3-80df-71284b759009', '5bbe9607-2279-4669-950b-1109d8aab0d1', 'Up to 100 Washes', '2026-07-03 07:33:18.614042+00') ON CONFLICT (id) DO UPDATE SET attribute_id = EXCLUDED.attribute_id, value = EXCLUDED.value, created_at = EXCLUDED.created_at;

INSERT INTO public.product_attribute_values (id, attribute_id, value, created_at) VALUES ('9a1df0de-4bd9-4355-a32e-0b7b7d86d6e2', 'fedc2fbb-5018-471b-90ca-3c3e7dbe61ad', 'Yes', '2026-07-03 07:33:19.082875+00') ON CONFLICT (id) DO UPDATE SET attribute_id = EXCLUDED.attribute_id, value = EXCLUDED.value, created_at = EXCLUDED.created_at;

INSERT INTO public.product_attribute_values (id, attribute_id, value, created_at) VALUES ('48d031d1-b972-4630-8874-6400af3c67f1', '65d5cd58-8741-4778-9568-653cf67aa005', 'Super Absorbent', '2026-07-03 07:33:19.561706+00') ON CONFLICT (id) DO UPDATE SET attribute_id = EXCLUDED.attribute_id, value = EXCLUDED.value, created_at = EXCLUDED.created_at;

INSERT INTO public.product_attribute_values (id, attribute_id, value, created_at) VALUES ('a94aa575-084a-4a64-a233-434ea7e093fb', 'c1e8490a-e2ea-49bb-a7d8-a15e1bfebfe1', 'Wet & Dry', '2026-07-03 07:33:20.051655+00') ON CONFLICT (id) DO UPDATE SET attribute_id = EXCLUDED.attribute_id, value = EXCLUDED.value, created_at = EXCLUDED.created_at;

INSERT INTO public.product_attribute_values (id, attribute_id, value, created_at) VALUES ('91c69bce-1a5d-4ae1-9de7-5b2ed4a90943', '68338322-338a-44d3-bff1-a098c1887436', '2 × Blue Cleaning Cloth Rolls', '2026-07-03 07:33:20.51906+00') ON CONFLICT (id) DO UPDATE SET attribute_id = EXCLUDED.attribute_id, value = EXCLUDED.value, created_at = EXCLUDED.created_at;

INSERT INTO public.product_attribute_values (id, attribute_id, value, created_at) VALUES ('7adfe7ba-6570-43e5-97cc-cc620b4da9d4', 'd8196340-cd64-4263-88f2-b8d8d6a540b3', 'Grey', '2026-07-04 00:36:57.116662+00') ON CONFLICT (id) DO UPDATE SET attribute_id = EXCLUDED.attribute_id, value = EXCLUDED.value, created_at = EXCLUDED.created_at;

INSERT INTO public.product_attribute_values (id, attribute_id, value, created_at) VALUES ('0eb7f04a-5c16-450e-8802-8060aa0ccd86', '65d5cd58-8741-4778-9568-653cf67aa005', 'High', '2026-07-04 00:36:58.713359+00') ON CONFLICT (id) DO UPDATE SET attribute_id = EXCLUDED.attribute_id, value = EXCLUDED.value, created_at = EXCLUDED.created_at;

INSERT INTO public.product_attribute_values (id, attribute_id, value, created_at) VALUES ('7d9df231-30ca-4736-aaff-f18f4b3b5c51', 'd8196340-cd64-4263-88f2-b8d8d6a540b3', 'White', '2026-07-04 00:43:49.133511+00') ON CONFLICT (id) DO UPDATE SET attribute_id = EXCLUDED.attribute_id, value = EXCLUDED.value, created_at = EXCLUDED.created_at;

INSERT INTO public.product_attribute_values (id, attribute_id, value, created_at) VALUES ('456998ea-b74c-4316-aee0-329cbb128cee', '68338322-338a-44d3-bff1-a098c1887436', '2 × White Cleaning Cloth Rolls', '2026-07-04 00:43:50.905827+00') ON CONFLICT (id) DO UPDATE SET attribute_id = EXCLUDED.attribute_id, value = EXCLUDED.value, created_at = EXCLUDED.created_at;

INSERT INTO public.product_attribute_values (id, attribute_id, value, created_at) VALUES ('d4acbf60-2e34-4a03-912a-40c5a3ddcb3c', 'a508635d-409e-4768-80f3-c1c6d7a479b3', 'Liquid Dishwash Gel', '2026-07-04 00:56:37.560582+00') ON CONFLICT (id) DO UPDATE SET attribute_id = EXCLUDED.attribute_id, value = EXCLUDED.value, created_at = EXCLUDED.created_at;

INSERT INTO public.product_attribute_values (id, attribute_id, value, created_at) VALUES ('7b6f7495-d126-47ab-895e-b3e07a0d7df1', 'a87cf386-3ccd-4ad3-a2a3-454f33c690a8', 'Lemon Fresh', '2026-07-04 00:56:37.999301+00') ON CONFLICT (id) DO UPDATE SET attribute_id = EXCLUDED.attribute_id, value = EXCLUDED.value, created_at = EXCLUDED.created_at;

INSERT INTO public.product_attribute_values (id, attribute_id, value, created_at) VALUES ('4ca95bd9-53ae-42ff-a661-ff81cbfa3631', '714e024b-f945-4e01-ad91-6e02fb9d23ed', '500ml Each', '2026-07-04 00:56:38.427143+00') ON CONFLICT (id) DO UPDATE SET attribute_id = EXCLUDED.attribute_id, value = EXCLUDED.value, created_at = EXCLUDED.created_at;

INSERT INTO public.product_attribute_values (id, attribute_id, value, created_at) VALUES ('557e2a34-7e3d-4deb-8dc6-efddfc08eec1', '8d0d3db9-8780-44bd-b438-78fef80d5498', 'Pack of 2', '2026-07-04 00:56:38.861383+00') ON CONFLICT (id) DO UPDATE SET attribute_id = EXCLUDED.attribute_id, value = EXCLUDED.value, created_at = EXCLUDED.created_at;

INSERT INTO public.product_attribute_values (id, attribute_id, value, created_at) VALUES ('9bf6346b-3860-4694-9558-53710f0c39c7', '8df94d8a-898a-4cca-ba0d-1b360541fbe7', 'Liquid', '2026-07-04 00:56:39.301457+00') ON CONFLICT (id) DO UPDATE SET attribute_id = EXCLUDED.attribute_id, value = EXCLUDED.value, created_at = EXCLUDED.created_at;

INSERT INTO public.product_attribute_values (id, attribute_id, value, created_at) VALUES ('c2c862cc-c006-4a8b-9b3e-57c084876510', 'aad02a95-d870-4a42-8495-e4532cef27a0', 'All Types of Kitchen Utensils', '2026-07-04 00:56:39.748155+00') ON CONFLICT (id) DO UPDATE SET attribute_id = EXCLUDED.attribute_id, value = EXCLUDED.value, created_at = EXCLUDED.created_at;

INSERT INTO public.product_attribute_values (id, attribute_id, value, created_at) VALUES ('806fe314-537f-47ad-b8ea-e4a5f775bd77', '7eda9335-6760-4a3b-9aa0-d89716fe0223', 'Daily Dish Cleaning', '2026-07-04 00:56:40.166526+00') ON CONFLICT (id) DO UPDATE SET attribute_id = EXCLUDED.attribute_id, value = EXCLUDED.value, created_at = EXCLUDED.created_at;

INSERT INTO public.product_attribute_values (id, attribute_id, value, created_at) VALUES ('a6a1a470-3532-4d0b-88b8-01a558772dff', 'a508635d-409e-4768-80f3-c1c6d7a479b3', 'Compressed Pearl Tissue Tablets', '2026-07-04 01:03:41.158709+00') ON CONFLICT (id) DO UPDATE SET attribute_id = EXCLUDED.attribute_id, value = EXCLUDED.value, created_at = EXCLUDED.created_at;

COMMIT;