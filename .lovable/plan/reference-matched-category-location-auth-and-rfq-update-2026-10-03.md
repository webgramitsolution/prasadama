# Reference-matched category, location, auth, and RFQ update

## Scope
- Set the homepage category strip to a flat `#fdf3e8` background, remove the dark text-gradient overlay shown in the small reference, and reduce its bottom spacing by 20px.
- Use `#ae1e2a` as the phone theme color and on the customer authentication screens without changing their structure.
- Add 10px space below the mobile Delivery Location confirmation button.
- Rebuild `/rfq` to closely match the supplied Prasadam bulk-order blueprint while retaining real authentication, RFQ-cart data, quantity controls, validation, attachment handling, submission, and admin/backend records.

## RFQ page composition
- Use the supplied wide bulk-order image as the full-width hero background, with the procurement label, headline, supporting text, and three service highlights over it.
- Add the three-step progress row directly below the hero.
- Build a compact two-column desktop workspace: **Your Bulk Order** on the left and **Business & Contact Details** on the right; stack cleanly on phones.
- Match the blueprint’s thin borders, compact fields, maroon actions, warm summary panel, restrained shadows, and footer benefits row.
- Connect the delivery-pincode field to the existing validated shared location selector so saved location data is reused.
- Require sign-in before RFQ submission and preserve the existing RFQ database and notification flow.

## Verification
- Check `/`, `/login`, `/signup`, mobile location picker, and `/rfq` on phone, tablet, and desktop widths.
- Verify empty and populated RFQ-cart states, signed-out login handoff, quantity controls, and successful form behavior where an authenticated test session is available.
- Confirm the preview builds without errors and no unrelated sections changed.

## Technical details
- Reuse semantic design tokens/components; update the theme token to the requested maroon rather than scattering hardcoded colors.
- Keep category merchandising driven by active category records.
- Keep RFQ submission and cart operations on the existing authenticated backend tables and functions.
