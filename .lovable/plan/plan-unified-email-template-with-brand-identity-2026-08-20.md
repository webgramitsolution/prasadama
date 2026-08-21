# Plan: Unified Email Template with Brand Identity

Integrate the official HousKase brand identity into all email notifications (Order Updates, OTPs, Password Reset). The templates will feature a professional layout with the company logo, specific brand colors, and updated messaging as requested.

## Technical Details

### 1. Unified HTML Email Layout
- **Header**: Dark blue background (`#001B3D` / `#001f3f`), Logo on the left, Order details on the right.
- **Body**: Clean white background, prominent messaging (e.g., "Order #23452."), user greeting, and order status/items.
- **Button**: Call-to-action button in brand pink/red (`#E94E63`).
- **Footer**: Dark blue background (`#001B3D`), including brand name "HousKase" (replacing any "CHAATEWALA"), Scam Advisory, social icons, and contact info (sales@houskase.com). Footer background color `#ad1e2a` as requested.

### 2. Edge Function Updates
- **`send-order-notification`**: 
    - Replace the current basic HTML with the new branded template.
    - Update "CHAATEWALA" references to "HousKase".
    - Add logo URL: `https://ik.imagekit.io/houskase/home%20(1).webp?updatedAt=1783150262496`.
- **`manage-password-reset`**:
    - Update the `send-otp` action to use the branded template for consistency.
- **`create-order`**: (If it sends separate emails, it will be aligned).

### 3. Visual Specifications
- **Logo Position**: Left-aligned in the header.
- **Brand Name**: "HousKase" (Plain text, not highlighted).
- **Colors**:
    - Header/Footer background: `#ad1e2a` (as per the user's specific request for footer, applying to header for consistency if it looks best, or using the dark blue from reference).
    - Primary Action: `#E94E63`.
