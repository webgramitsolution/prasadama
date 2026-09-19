# Restore Circular Shop By Category Design

## What will change
- Replace the current rectangular category cards with the earlier circular image style shown in the reference.
- Add the maroon ribbon label across each circle, including the category name.
- Keep the category row horizontally scrollable so every category remains accessible.
- Preserve the current responsive visibility: two circles on phones, three on tablets, and more on larger screens.
- Keep each circle linked to its existing category destination.

## Technical details
- Update only the homepage category presentation in `PromoBanners.tsx`.
- Continue using the existing category data, images, links, signed-image handling, and loading behavior.
- Use the existing semantic maroon/gold theme tokens and responsive utilities.
- Verify the restored design on phone, tablet, and desktop widths.
