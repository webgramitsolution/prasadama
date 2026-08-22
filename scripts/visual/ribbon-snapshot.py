#!/usr/bin/env python3
"""Pixel-diff snapshot check for the Save ribbon and BUY NOW gold frame.

Usage:
  python3 scripts/visual/ribbon-snapshot.py            # compare against baselines
  python3 scripts/visual/ribbon-snapshot.py --update   # refresh baselines

Captures the first product card's Save badge and BUY NOW button from the running
dev server, then compares each crop with its stored baseline. Exits non-zero when
the mean pixel difference goes above THRESHOLD, so alignment, ribbon shape, and
the gold contour cannot drift silently.
"""
import asyncio
import os
import sys

from PIL import Image, ImageChops
from playwright.async_api import async_playwright

BASE_URL = os.environ.get("SNAPSHOT_URL", "http://localhost:8080/products")
HERE = os.path.dirname(os.path.abspath(__file__))
BASELINE_DIR = os.path.join(HERE, "baseline")
OUT_DIR = os.path.join(HERE, "current")
THRESHOLD = 4.0  # mean per-channel difference (0-255)
TARGETS = {
    "save-ribbon": ".badge-premium-gold",
    "buy-now": ".btn-gold-frame",
}


async def capture() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 1800},
            reduced_motion="reduce",  # freeze shimmer so diffs stay deterministic
        )
        page = await context.new_page()
        await page.goto(BASE_URL, wait_until="domcontentloaded")
        for name, selector in TARGETS.items():
            el = page.locator(selector).first
            await el.wait_for(state="visible", timeout=30000)
            await el.scroll_into_view_if_needed()
            await page.wait_for_timeout(600)
            await el.screenshot(path=os.path.join(OUT_DIR, f"{name}.png"))
        await browser.close()


def compare() -> int:
    failures = 0
    for name in TARGETS:
        current_path = os.path.join(OUT_DIR, f"{name}.png")
        baseline_path = os.path.join(BASELINE_DIR, f"{name}.png")
        if not os.path.exists(baseline_path):
            print(f"[skip] no baseline for {name}; run with --update")
            continue
        cur = Image.open(current_path).convert("RGB")
        base = Image.open(baseline_path).convert("RGB")
        if cur.size != base.size:
            print(f"[FAIL] {name}: size {cur.size} != baseline {base.size}")
            failures += 1
            continue
        diff = ImageChops.difference(cur, base)
        pixels = list(diff.getdata())
        mean = sum(sum(px) for px in pixels) / (len(pixels) * 3)
        status = "ok" if mean <= THRESHOLD else "FAIL"
        print(f"[{status}] {name}: mean diff {mean:.2f} (threshold {THRESHOLD})")
        if mean > THRESHOLD:
            failures += 1
    return failures


def update() -> None:
    os.makedirs(BASELINE_DIR, exist_ok=True)
    for name in TARGETS:
        Image.open(os.path.join(OUT_DIR, f"{name}.png")).save(
            os.path.join(BASELINE_DIR, f"{name}.png")
        )
        print(f"[updated] {name}")


if __name__ == "__main__":
    asyncio.run(capture())
    if "--update" in sys.argv:
        update()
        sys.exit(0)
    sys.exit(1 if compare() else 0)
