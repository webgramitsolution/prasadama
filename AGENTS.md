<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Homepage merchandising must use category records for category circles, an editable site setting for the synthetic Shop All circle, discounted active products for deals, and promo banner records for wide banners, so admin changes automatically reach the storefront.
- Delivery location must use the shared context and validated postal suggestions; never auto-request GPS or infer location silently because inaccurate delivery data harms checkout trust.
- RFQ must remain an authenticated, database-backed cart and submission workflow; visual redesigns must preserve admin records and shared delivery-location data.
- RFQ estimates must be calculated from current persisted product or variation prices and saved as request and item snapshots; admin final quotes remain authoritative.
- Reuse the shared RFQ benefits component on quotation, checkout, and order-confirmation surfaces so the trust row stays visually identical.
- Keep the shopping assistant deterministic and catalog-backed in the browser; it must not depend on paid or external AI APIs.
- Store product description media as backward-compatible JSON blocks with image-only full-width and two-column layouts.

- Render footer artwork as independent aspect-preserving decorative layers beneath live mobile accordions and desktop links so navigation stays accessible without stretching temple imagery.
- Phone login and signup share aspect-preserving image-backed banners and locally scoped semantic accents so auth styling never changes the website theme.
- Site images are self-hosted under public/cdn and referenced as /cdn/... so the app works on external hosts (Hostinger) where Lovable's asset proxy is unavailable.
- Storefront wrappers containing the shared sticky Header must use overflow-x-clip rather than overflow-x-hidden so horizontal clipping does not create a non-scrolling ancestor that breaks viewport stickiness.
- SMTP diagnostic email recipients must be derived from the authenticated administrator's verified account email on the server, never from arbitrary request addresses, to prevent unsolicited test-email delivery.
