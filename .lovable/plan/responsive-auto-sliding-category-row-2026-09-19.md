# Responsive Auto-Sliding Category Row

## What will change
- Keep all active category circles in one horizontal row.
- Center the row when fewer items are available; show up to 8 together on desktop.
- Show 3.3 circles on phones and 6 circles on tablets so the next item remains visibly discoverable.
- Allow touch/mouse swiping whenever the categories exceed the visible count.
- Auto-slide only when the row has overflow, pause while the user interacts, and continue afterward.
- Add the existing animated gold wave/shine treatment to every maroon category ribbon.
- Keep every current category image, label, order, and destination unchanged.

## Technical details
- Update the homepage category rail in `PromoBanners.tsx` with a scroll reference, responsive item widths, overflow-aware centering, and looping auto-scroll behavior.
- Reuse the existing premium shine utilities and respect reduced-motion preferences.
- Verify the category row on phone, tablet, and desktop widths, including swipe and auto-slide behavior.
