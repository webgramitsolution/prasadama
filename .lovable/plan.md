# Cart and Smart Delivery Location Upgrade

## Goal
Improve the cart drawer’s offer progress and visual hierarchy, align product-page sections, and replace the current location picker with the complete FNP-inspired pincode flow shown in the supplied desktop and mobile references—using Prasadam branding throughout.

## What will change

### Cart drawer
- Make the entire cart drawer white, with restrained Prasadam accent surfaces for the offer-progress and summary areas.
- Keep quantity offer milestones based on the selected variation’s unit price.
- Show quantity 1 as active when one item is present; keep quantities 2 and 3 grey until reached; activate each milestone as cart quantity increases.
- Update the unlocked-offers message and milestone amounts immediately when the selected variation or quantity changes.
- Color the icon beside “Estimated Total” with the same green used for coupons.
- Preserve current cart actions, quantity controls, coupon behavior, and checkout flow.

### Product-page spacing
- Align the Trending Reels rail’s left and right edges with the same page margins used by Trending Products, including loading placeholders.
- On phones, give every Frequently Bought Together product row a complete 5px-radius border instead of only top/bottom divider lines.

### Smart delivery location
- Add one shared delivery-location state for the whole storefront, persisted across refreshes and immediately available to product, cart, and checkout screens.
- Remove silent IP/GPS guessing. The browser will not request location permission and will not auto-fill an inaccurate location.
- Desktop/tablet header before selection: show the India flag, “Where to deliver?”, “Location missing”, and a chevron.
- Desktop/tablet click: open a centered, accessible Prasadam-styled modal with a dark overlay, country selector, pincode/locality search, suggestions, close action, and Confirm button.
- Mobile first visit: automatically open a full-width bottom sheet with rounded top corners and a fixed Confirm area. Mobile will never show the desktop modal.
- Mobile header before selection: show “Enter location to check availability”; after confirmation show the selected pincode and location with an edit chevron.
- Search after at least three digits with a 300ms debounce. Results will use real Indian postal data, support loading/empty/error states, touch, keyboard arrows, Enter, highlighting, and stale-request cancellation.
- Confirm only a selected, validated six-digit result. Save country, pincode, locality/post office, city/district, state, and display label.
- Reopening the selector pre-fills the saved location and allows changing it without reloading.
- Check the existing delivery-pincode records when available, while keeping postal lookup separate from delivery eligibility so an unknown serviceability status is never presented as deliverable.

## Technical details
- Introduce a `DeliveryLocationProvider` around the storefront and reusable desktop modal, mobile bottom sheet, and autocomplete components.
- Keep the current header structure; only replace its location control and add the compact mobile location row.
- Use semantic design tokens and existing dialog/sheet/button/input components.
- Use an actual Indian postal dataset/service for suggestions and exact-pincode validation; do not hardcode example results.
- Record the shared location-state architecture in `AGENTS.md`.

## Verification
- Test desktop, tablet, and phone layouts for overflow and correct modal/sheet behavior.
- Verify first visit, search, suggestion selection, confirmation, refresh persistence, reopen/change, invalid input, empty results, and failed lookup.
- Verify cart milestone colors and prices at quantities 1, 2, and 3 with a variation-priced product.
- Verify Trending Reels alignment and the 5px mobile Frequently Bought Together borders.
- Confirm the preview builds cleanly and the central flows work end to end.
