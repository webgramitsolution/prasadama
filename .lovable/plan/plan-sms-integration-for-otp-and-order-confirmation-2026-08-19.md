# Plan: SMS Integration for OTP and Order Confirmation

Implement SMS notifications using My Dreams Technology API for checkout OTP verification and order confirmation messages.

## Implementation Details

### 1. Backend: Edge Functions

- **Create `supabase/functions/send-sms/index.ts`**:
  - Centralized function to call the My Dreams Technology API (`http://app.mydreamstechnology.in/vb/apikey.php`).
  - Use `Deno.env.get` for `SMS_API_KEY` (pdtPO9aL4m8RSQTV) and `SMS_SENDER_ID` (MDTDMO).
  - Support template variable replacement for both OTP and Order messages.
- **Update `supabase/functions/create-order/index.ts`**:
  - Add a step to invoke `send-sms` upon successful order creation.
  - Message: `Dear {name}, Your order {order_number} has been placed successfully. Thank you for shopping with Houskase.` (Note: Exact template might need registration, I will use a generic one or stick to the one provided in PDF if it's the only one).
- **Update `supabase/functions/send-signup-otp/index.ts` (if applicable) or create a checkout OTP trigger**:
  - The user specifically asked for "OTP on checkout page".
  - I will create/update a function to send the OTP via SMS using the provided template: `Dear {#var#}, Your OTP for login to {#var#}. Valid for 30 minutes. Please do not share this OTP. Regards, My Dreams Technology Team`.

### 2. Frontend: Checkout OTP Flow

- **Modify `src/pages/Checkout.tsx`**:
  - Before final `handleSubmit` processing, add a phone verification step.
  - UI: "Verify your phone number" section that appears before the "Place Order" button.
  - Logic: 
    1. User enters phone.
    2. "Send OTP" button calls `send-sms`.
    3. User enters OTP.
    4. "Verify OTP" logic (using a small new Edge Function or existing `verify-signup-otp` if adaptable).
    5. Once verified, enable the actual checkout.

### 3. Security & Config

- Add `SMS_API_KEY` and `SMS_SENDER_ID` to backend secrets.
- Use `pdtPO9aL4m8RSQTV` and `MDTDMO` as provided.

## User Review Required

> [!IMPORTANT]
> The PDF provided only lists ONE approved template for login OTP. SMS providers in India often require pre-registration of templates (DLT). I will use the provided OTP template. For order confirmation, I'll implement the logic, but if the SMS fails, it might be due to a missing registered template for "Order Placed".

---

**Visual Edit Confirmation:** I will update the instruction block in `src/pages/Index.tsx` as requested.
