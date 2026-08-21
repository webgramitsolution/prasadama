# Admin Panel Navigation and Storage Bucket Fixes

This plan addresses the navigation issue where clicking "Edit" in the admin panel (specifically in Product Reels) doesn't redirect the user to a dedicated edit page, and the storage bucket issues causing manual upload failures across the website.

## User Review Required

> [!IMPORTANT]
> I will be updating the RLS policies for storage buckets to ensure admins have full upload permissions. This is necessary to fix the "Bucket issue" you reported.

## Proposed Changes

### 1. Navigation & Redirect Fixes
*   **Product Reels Admin (`src/pages/admin/Reels.tsx`)**:
    *   Currently, the "Edit" button just opens an inline form at the top of the list, which can be missed if the user doesn't scroll up.
    *   I will add an automatic scroll-to-top when "Edit" or "Add" is clicked so the form is immediately visible.
    *   I will also evaluate if a separate route `/admin/reels/edit/:id` is better, but consistent with other pages like `Products` and `Categories` which use conditional rendering, a scroll-to-top is the standard fix here.
*   **Admin Sidebar/Header**: Ensure consistent navigation across all admin modules.

### 2. Storage Bucket Fixes
*   **Database Migration**:
    *   Update RLS policies for the `objects` table in the `storage` schema.
    *   Ensure the `authenticated` role with the `admin` app role has `INSERT`, `UPDATE`, and `DELETE` permissions on buckets like `product-images`, `category-images`, `banners`, etc.
    *   Grant the `anon` role `SELECT` permission on these buckets if they are intended to be public.
*   **Image Upload Component (`src/components/admin/ImageUpload.tsx`)**:
    *   Improve error logging to capture specific bucket permission errors.
    *   Ensure the component correctly maps to the right bucket based on the page it's used in.

### 3. Comprehensive Fix Across Modules
*   Check and fix similar issues in:
    *   `Products` listing and edit.
    *   `Categories` admin.
    *   `Hero Slides & Banners` admin.
    *   `Trusted by Families` (Testimonials) admin.
    *   `Product Reels` admin.

## Technical Details

### RLS Policy Update
I will execute a migration to grant full storage access to admins:
```sql
CREATE POLICY "Admins have full access to all buckets"
ON storage.objects
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
```

### UI Navigation Improvement
In `Reels.tsx`, `Products.tsx`, etc., I will add:
```tsx
const openCreate = () => { 
  resetForm(); 
  setOpen(true);
  window.scrollTo({ top: 0, behavior: 'smooth' }); 
};
const openEdit = (item) => {
  setEditing(item);
  // ... set form values ...
  setOpen(true);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
```

## Verification Plan

### Automated Tests
*   **Playwright Script**:
    *   Login as admin.
    *   Navigate to `/admin/reels`.
    *   Click "Edit" on a reel and verify the page scrolls to the top/form is visible.
    *   Try to upload a test file in various sections (Products, Reels, etc.) and verify success.

### Manual Verification
*   Check the "Product Reels" edit flow.
*   Test image uploads in `Products`, `Categories`, and `Reels` to ensure no bucket errors.
