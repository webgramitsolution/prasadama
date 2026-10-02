# Admin-managed homepage merchandising

## What will change
- Add one **Homepage Merchandising** area in the admin menu with three clear tabs: **Shop By Category**, **Offers & Deals**, and **Promo Banners**.
- Make **Shop By Category** read directly from active top-level categories. Adding a category, image, ribbon label, order, and visibility in admin will update the homepage automatically without maintaining a second matching record.
- Slightly enlarge the category circles while preserving the supplied pale strip, red ring, animated fish-tail ribbon, swipe, and auto-slide design.
- Add a real **Offers & Deals** product row immediately below the category ribbons. It will automatically show active products with a genuine regular-price saving, ordered newest first, so qualifying new products appear automatically.
- Add a separate wide, swipeable **Promo Banners** section using admin-managed desktop/mobile images, offer text, links, order, and active status.

## Admin workflow
- Provide one-click add/edit controls and image upload in the new merchandising area.
- Category controls will manage the existing category records and include a dedicated ribbon label plus homepage visibility.
- Offer controls will keep the existing offer manager available inside the same area.
- Promo banner controls will reuse the existing banner records, now presented as wide homepage banners rather than category circles.

## Data and security
- Add optional homepage fields to categories for ribbon text and visibility; existing active top-level categories will remain visible by default.
- Keep public access read-only and restrict all merchandising changes to admins through the existing role checks and policies.
- Preserve the current five real categories and show **Shop All** first, giving six circles for phone/tablet auto-slide verification without inventing fake catalog data.

## Verification
- Test admin add/edit visibility and image controls with an authenticated admin session.
- Verify the homepage data refresh, links, real deals, and wide promo banners.
- Verify phone shows about 3.3 circles, tablet shows 6, fish-tail shine animates, and both sizes swipe/auto-slide correctly.
