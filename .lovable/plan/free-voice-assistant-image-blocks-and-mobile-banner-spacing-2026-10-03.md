# Free Voice Assistant, Image Blocks, and Mobile Banner Spacing

## User-facing changes
- Replace the paid/external AI response call with a free in-browser assistant that uses the existing product and category records.
- Keep browser microphone input and spoken replies, with no API key or paid AI request.
- Show matching products as compact cards: 2–3 visible in one horizontal row, with the remaining matches swipeable.
- Change admin “Description blocks” to image-only blocks with a per-image choice of full-width banner or two-column grid.
- Render those product-detail images in the selected layout while keeping older saved records compatible.
- On phones, remove the extra top and bottom gap around the product banner directly below “Frequently Bought Together.”

## Technical details
- Handle navigation, common support questions, categories, and product matching locally inside the voice assistant; remove its call to the `assistant-chat` function.
- Extend description block JSON with a `layout` value (`full` or `half`), while safely defaulting older blocks.
- Update only phone spacing for the product promotional banner; tablet and desktop spacing remain unchanged.
- Verify voice text search, horizontal product cards, admin image layouts, and product-detail spacing on phone and desktop.
