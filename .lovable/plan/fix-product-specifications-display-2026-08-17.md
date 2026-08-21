# Fix Product Specifications Display

The product specifications (attributes like Material, Color, etc.) are currently missing from the frontend because:
1. The database table `product_attribute_assignments` is empty.
2. The `product_attributes` table contains placeholder names (e.g., "Attr-16b6c") instead of real names like "Material".
3. The UI in `ProductDetail.tsx` might be too restrictive in its attribute fetching.

## Proposed Changes

### 1. Data Import (Database)
- Execute a comprehensive migration (`supabase/migrations/20260817170000_import_data_fix.sql`) that:
    - Updates `product_attributes` with correct names from CSV `file-20`.
    - Populates `product_attribute_values` from CSV `file-18`.
    - Populates `product_attribute_assignments` from CSV `file-19`.
    - Ensures `visible_on_product` is set correctly.

### 2. UI Robustness (Frontend)
- Update `ProductDetail.tsx` to ensure it fetches all assignments regardless of the `visible_on_product` flag if it helps in debugging, or ensure the flag is correctly handled. (Actually, I'll keep the flag but ensure data has it as `true`).
- Already refined the grouping logic to be safer.

### 3. Verification
- Use Playwright to visit a product page and verify that the "SPECIFICATIONS" section contains the expected labels (Material, Color, etc.) and values.
