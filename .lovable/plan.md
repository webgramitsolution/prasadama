# Plan - Make Admin & Update Logo Size

The user wants to grant admin privileges to a specific email address (`sheepikagupta@gmail.com`) and increase the logo size in the header as it is not clearly visible.

## User Review Required

> [!IMPORTANT]
> - **Admin Access**: I will attempt to grant the 'admin' role to `sheepikagupta@gmail.com`. This requires the user to exist in the database. If they don't, I'll provide instructions.
> - **Visual Edits**: I will also update the home page verbatim text as requested.

## Proposed Changes

### Backend (Database)
- I will search for the `user_roles` table or equivalent.
- I will run a SQL migration to insert or update the role for the user with email `sheepikagupta@gmail.com` to 'admin'.

### Frontend Components
- **Header logo**: Increase the height of the logo in `src/components/layout/Header.tsx` for both mobile and desktop.
- **Verbatim Text**: Update `src/pages/Index.tsx` with the new text block provided by the user.

### Verification Plan
- Check the `Header.tsx` visual changes.
- Verify the `Index.tsx` comment update.
- (Internal) Verify the role assignment if possible.
