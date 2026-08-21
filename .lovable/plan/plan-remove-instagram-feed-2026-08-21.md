# Plan - Remove Instagram Feed

The user wants to completely remove all code related to the Instagram feed from both the frontend and backend to keep the codebase "neat and clean." I will also update a verbatim code comment on the home page as requested.

## User Review Required

> [!IMPORTANT]
> This will permanently remove the Instagram feed functionality from the app, including the Edge function and all frontend components.

## Proposed Changes

### Backend (Supabase Edge Functions)
- Delete the `supabase/functions/instagram-feed` directory.

### Frontend Components
- Remove `src/components/home/InstagramFeed.tsx`.
- Update `src/pages/Index.tsx`:
    - Remove the `InstagramFeed` import.
    - Remove the `<InstagramFeed />` component from the JSX.
    - Update the verbatim text in the code comment as requested by the user.

### Verification Plan
- Run `tsgo --noEmit` to ensure no broken imports or references remain.
- Perform a final grep search for "instagram" to ensure all related code is removed.
