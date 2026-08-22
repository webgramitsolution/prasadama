# Save Label — exact ribbon match

## What the reference shows
- Red ribbon band starting flush at the card's left edge, sitting slightly below the card top (small white gap above).
- Top edge nearly straight, dipping gently; bottom edge sweeps upward to the right.
- Right end tapers into a curved, slightly pointed tip (not a blunt rectangle).
- A thin metallic gold stroke follows the whole silhouette, brightest along the top and the curved right tip.
- White bold text "Save ₹400", left padding roughly double the vertical padding.

## Build steps
1. Redraw `--ribbon-shape` SVG path in `src/index.css` to the reference silhouette: flush square left edge, gently arcing top, strongly rising bottom curve, tapered curved right tip.
2. Keep the two-layer technique (`.badge-premium-gold` gold gradient layer masked by the shape, `.badge-premium-inner` red fill masked by the same shape inset by the stroke width), tune the stroke to ~1.5–2px so the gold reads as a thin contour.
3. Adjust badge placement in `src/components/products/ProductCard.tsx`: offset from the top (~8px) instead of flush to the corner, still flush left; keep the existing font size, weight, and paddings.
4. Keep the subtle gold shimmer sweep already on the badge (no new animation).
5. Verify with a screenshot of one product card and compare against the reference.

## Scope
Only the Save badge shape/position. BUY NOW button, card layout, prices, and images stay unchanged.
