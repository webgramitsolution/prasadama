# RFQ Reference Match, Pricing, and Admin Workflow

## Build
- Rework the RFQ banner and progress row to closely match the supplied Prasadam blueprint: compact centered title, smaller description/status text, no gradient overlay, and tighter desktop/mobile proportions.
- Keep the supplied Prasadam bulk-order artwork as the full-width banner and reuse the same centered banner treatment at the top of Checkout.
- Tighten the RFQ two-column layout, controls, order summary, and benefit row to match the reference while preserving the existing responsive phone layout.

## Real quotation flow
- Calculate a live estimated total from each selected product or variation’s current stored price and quantity.
- Save the calculated total with the RFQ request and save each item’s current unit price, so the submitted quotation remains traceable even if product prices later change.
- Show the generated RFQ number and estimated amount after submission; final negotiated pricing remains controlled by the admin quote.

## Admin
- Keep the existing RFQ Requests section and improve it as the complete submission list with buyer, products, requested total, quoted price, status, and date.
- Allow admins to open a request, review all items, enter the final quote, add notes, and update status.

## Verification
- Test the RFQ and Checkout banners at desktop and phone sizes.
- Sign in to the preview, create or use an RFQ cart item, submit one real test request, then confirm it appears in the admin RFQ list with its amount and status.
- Confirm the final preview build has no errors.
