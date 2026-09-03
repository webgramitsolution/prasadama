# Mobile Product Detail Redesign

## Goal
Rebuild the phone product-detail experience to follow the supplied reference while preserving the existing desktop/tablet design and current product/cart logic.

## What will change

### 1. Dynamic product attributes and variation cards
- Remove the hard-coded “Select Variant” label.
- Use the exact admin-created variation attribute name, such as “Select Size”, “Select Fragrance”, or the appropriate combined labels for products with multiple attributes.
- Map each generated variation back to its attribute values, including custom attributes stored through the existing admin variation workflow.
- Keep variation cards in natural order regardless of admin ordering, with product image, attribute value, sale price, crossed regular price, and selected-state checkmark.

### 2. Phone-only product-detail layout
- Add a compact mobile product header with back navigation and Product Details title.
- Reorganize product information into the reference-style mobile hierarchy without changing the desktop layout.
- Add a product-specific benefits grid using the product’s configured features and suitable icons; show only real available product content and use sensible commerce defaults for missing items.
- Replace the long mobile specification/overview blocks with reference-style expandable rows for Product Details, What Is It Made Of, Shipping Information, and Returns & Warranty.
- Add the four trust indicators below the expandable rows using Prasadam’s existing maroon/gold visual language.

### 3. Frequently Bought Together
- Add a phone-friendly “Frequently Bought Together” list based on related products.
- Keep the current product selected, allow optional related items to be selected, show product image/name/price/MRP, and support adding selected related items individually to the cart.
- Leave the existing Related Products section available further down the page.

### 4. Sticky mobile purchase bar
- Move Add to Cart and Buy Now into a fixed phone-only bottom action bar matching the reference.
- Keep loading, MOQ, stock, selected variation, and checkout behavior intact.
- Hide the global phone bottom navigation on product-detail routes so it cannot overlap the purchase bar; all other pages retain the global bottom navigation.
- Add safe-area and page-bottom spacing so content is never covered.

### 5. Verification
- Verify a product with Size and a product with another/custom attribute when available.
- Confirm natural variation ordering, correct dynamic attribute heading/value, accordion interactions, frequently-bought selection, cart actions, and sticky positioning at a phone viewport.
- Capture a fresh mobile screenshot and check for overlap, horizontal overflow, and runtime errors.

## Technical details
- Refactor phone-specific sections into focused product components where practical rather than expanding the existing page monolith further.
- Reuse the existing Button, SignedImage, cart context, semantic design tokens, and Lucide icons.
- The uploaded phone image is a visual reference only and will not be embedded in the application.
