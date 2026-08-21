# Plan - Update Branded Email Templates

Apply the HousKase brand identity (logo, #001B3D header, #ad1e2a footer) and correct messaging to all transactional email templates.

## User Review Required

> [!IMPORTANT]
> I will be updating the HTML structure of all automated emails. Please ensure the logo URL (`https://ik.imagekit.io/houskase/home%20(1).webp?updatedAt=1783150262496`) is correct and accessible.

## Proposed Changes

### Edge Functions
- **send-signup-otp**: Replace simple HTML with the full branded template (header, footer, scam advisory).
- **manage-password-reset**: Ensure the password reset OTP email also uses the standardized branded template.
- **send-order-notification**: Verify and ensure the order notification templates (new, confirmed, shipped, etc.) are using the consistent brand layout.

### Shared Template Structure
- **Header**: Background `#001B3D`, HousKase logo left-aligned.
- **Footer**: Background `#ad1e2a`, white text, social links, and the required scam advisory message.
- **Content**: White container on `#f6f9fc` background, `#E94E63` accent color for primary buttons.
- **Messaging**: Remove any "CHAATEWALA!" references and use "HousKase International".

## Technical Details

- Standardize `RobustSmtp` usage across all functions to ensure reliable delivery via Hostinger.
- Centralize the HTML generation logic or duplicate the template structure to maintain consistency.
- Update `signup_otp_events` and `password_reset_otps` triggers if needed, though most logic resides in the Edge Functions.
