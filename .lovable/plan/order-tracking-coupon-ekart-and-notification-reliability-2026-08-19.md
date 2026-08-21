# Order Tracking, Coupon, Ekart and Notification Reliability

## Goal
Complete and verify the existing order lifecycle without redesigning the storefront, buyer dashboard, or admin panel. Fix the preview/build risk, make order tracking work by order number, enforce coupon rules at checkout, and connect admin status, Ekart sync, email, and in-app updates.

## Implementation

### 1. Stabilize app loading
- Remove the unsupported remote CSS font import that can break the Vite/Tailwind build while preserving the current font-family fallbacks and visual styling.
- Verify the app boot, public routes, buyer dashboard, and admin order page in the running preview.
- Treat the supplied “Something went wrong loading this project” screen as a preview-shell failure unless an app runtime error can be reproduced; no speculative visual changes.

### 2. Make `/track-order/:orderNumber` a real order tracker
- Replace the redirect-only route with order-number-aware tracking.
- For a signed-in buyer, resolve only their own order and show order status, line items, billing/shipping details, subtotal, discount, coupon reference, tax, shipping, total, and Ekart sync/tracking state.
- Keep the existing AWB/Ekart tracking experience available for courier IDs.
- Add direct “Track order” actions from checkout success and buyer order history.
- Do not expose another buyer’s address or order data; ownership remains enforced by backend policies.

### 3. Enforce coupons atomically on the server
- Strengthen checkout validation so an invalid, inactive, not-yet-started, expired, minimum-order-failing, or exhausted coupon rejects the order instead of silently creating a full-price order.
- Enforce global usage limits and increment usage only when the coupon was actually accepted.
- Persist the accepted `coupon_id` and authoritative `discount_amount` in the order.
- Keep the existing coupon form and design; surface the server’s exact expiry/usage error at checkout.

### 4. Complete admin order management and buyer updates
- Keep the existing admin status selector, but route status changes through an authenticated admin-only backend action.
- On status change, update the buyer dashboard in real time and create an in-app notification tied to the buyer/order.
- Show coupon discount/reference and clearer Ekart status, last attempt time, and last error in the existing admin order detail.
- Remove admin-only test/debug controls and hardcoded diagnostic copy from the production order page while retaining real operational actions.

### 5. Complete Ekart sync
- Add the missing authenticated Ekart shipment function used by the current admin UI.
- Load order/items server-side by `order_id`; never trust caller-supplied order payloads.
- Permit only admins, record every attempt, and update `ekart_sync_status`, `ekart_last_attempt_at`, and `ekart_last_error` consistently.
- Trigger one best-effort automatic sync after a successfully placed/paid order, while preserving the manual retry action in admin.

### 6. Make notifications reliable
- Move order-created orchestration to the backend so closing the checkout page cannot skip it.
- Send the buyer and admin complete order emails using the existing Hostinger SMTP setup and create corresponding in-app notifications.
- Send buyer status-update email/in-app notifications after admin changes.
- Validate all notification inputs and derive recipients/order details server-side; do not accept arbitrary recipient email or order totals from the browser.

## Database and backend changes
- Add only the minimal order tracking/notification fields needed by the existing schema (for example an Ekart tracking/AWB value and notification ownership/order reference if absent).
- Tighten coupon validation/consumption with a transactional database function and explicit authenticated grants/RLS.
- Enable Realtime only on the already-used order/notification paths with teardown-safe frontend subscriptions.
- Deploy each changed backend function after code changes.

## Verification
- **Preview:** app boot, refresh/direct-link routing, `/track-order/:orderNumber`, buyer dashboard, and admin orders render without black screen or console errors.
- **Coupon lifecycle:** create a test coupon expiring tomorrow with a maximum usage limit; apply it successfully now, verify stored `coupon_id` and discount, then set it expired and confirm checkout is blocked. Also confirm the usage limit blocks the next excess use.
- **Access:** buyer cannot read another buyer’s order; non-admin cannot update status or sync Ekart.
- **Status:** admin update appears in buyer history and creates buyer email/in-app notification.
- **Ekart:** run manual sync using the real configured credentials, then verify status, last attempt, logs, and tracking ID. If the external API rejects the test order, report the provider response accurately rather than claiming success.
- **Authenticated path:** execute the real checkout while signed in and inspect stored ownership, coupon, discount, notification, and sync fields before marking complete.

## Scope guard
- No redesign or layout changes.
- No product/category/content deletion.
- No unrelated security findings or broad dead-code cleanup in this change.
