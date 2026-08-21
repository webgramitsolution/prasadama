# Plan - Finalize Email Automation and Testing

Verify all transactional email templates, ensure triggers are correctly wired, and provide an admin preview interface with automated integration checks.

## User Review Required

> [!IMPORTANT]
> I have implemented a `test-email-templates` Edge Function that runs automated checks across all templates. The admin preview at `/dev/email-preview-internal` will now support all templates including Signup and Password Reset.

## Proposed Changes

### Edge Functions
- **send-signup-otp**: Modified to return HTML preview when `correlationId` is set to `preview-only`.
- **manage-password-reset**: Modified to return HTML preview when the recipient is `test@houskase.com`.
- **test-email-templates**: (New) Integration function to run health checks on all email endpoints.
- **send-order-notification**: Already supports `preview_only` mode.

### Admin Preview UI (`src/pages/dev/EmailPreview.tsx`)
- Extended the dropdown to include **Signup OTP** and **Password Reset OTP**.
- Updated the fetch logic to call the correct function based on selection.
- Ensured branded branding checks (logo, footer color) apply to all templates.

### Automated Integration Tests
- Deployed a dedicated Edge Function to verify that each notification type (OTP, Reset, Order Statuses) responds with valid status codes.

## Technical Details
- Added `test-email-templates` for one-click health monitoring of the entire notification system.
- Standardized the `preview_only` behavior across disparate Edge Functions.
- Wired triggers: Order status updates call `send-order-notification`, signup calls `send-signup-otp`, and password reset calls `manage-password-reset`.
