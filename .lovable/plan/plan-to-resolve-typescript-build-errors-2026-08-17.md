# Plan to Resolve TypeScript Build Errors

I will resolve the TypeScript build errors in the migrated Houskase codebase by fixing environment variable access, correcting notification state types, and adding null/undefined checks across several components.

## Proposed Changes

### Environment Variable Access
- Fix `src/components/SecurityHeaders.tsx` and `src/components/debug/ResponsiveDebug.tsx` to access `import.meta.env` and `process.env` properties using index signatures (`['PROPERTY_NAME']`) as required by the project's TypeScript configuration (`TS4111`).

### Notification & Chat State Types
- Update `src/components/admin/AdminHeader.tsx` and `src/components/chat/ChatInterface.tsx` to handle `null` values in notification and chat data.
- Adjust `Notification` and `Message` interfaces to allow `is_read` to be `boolean | null` and `last_message_at` to be `string | null` to match the Supabase response types.

### Null and Undefined Safety
- Add null/undefined checks in `src/components/admin/ImageLibraryDialog.tsx` for storage item IDs.
- Fix `src/components/admin/ProductForm.tsx` where optional props (like `open`) are passed `undefined` when a `boolean` is expected.
- Add safety checks for `firstVar` and other dynamic variables in `src/components/admin/ProductForm.tsx`.
- Enhance `src/components/blog/BlogContent.tsx` to safely handle potentially missing lines, titles, and image properties.

### Component Logic Fixes
- Fix `src/components/checkout/CouponInput.tsx` to safely access coupon validation results.
- Ensure `src/components/dashboard/RFQTab.tsx` properly checks for the existence of the `status` configuration before accessing its properties.
- Correct `src/components/home/DynamicProductSections.tsx` to handle `null` values for product limits and other section properties.

## Technical Details

- **TS4111 (Index Signature Access):** Change `import.meta.env.VITE_VAR` to `import.meta.env['VITE_VAR']`.
- **TS2345/TS2322 (Type Incompatibility):** Use type casting or interface updates (e.g., `is_read: boolean | null`) and null-coalescing (`item.is_read ?? false`).
- **TS18048/TS2532 (Object Possibly Undefined):** Add optional chaining (`?.`) and explicit truthy checks (`if (obj) ...`).
- **TS2375 (Exact Optional Property Types):** Use `open={openSections[id] ?? false}` instead of just `open={openSections[id]}` if the key might be missing.
