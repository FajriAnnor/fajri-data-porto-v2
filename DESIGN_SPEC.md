# Design spec — V2 (derived from reference/design-reference.png)

Reference is a 736×1307 compressed screenshot; it was scaled ×~1.96 to a 1440px desktop target.

## Tokens
Background `#1c1d26` / deep `#11141c` / secondary `#242832` · surface `#292c35` · text `#ebebed` /
`#b5b7bd` / `#9398a2` · silver `#d7d8dc` · border `rgba(220,224,234,.15–.2)`.
Primary button: silver gradient (`#e2e3e6 → #a9abb2`), dark text. No saturated accents anywhere.

## Type
- Display: **Anton**, uppercase, `font-size: clamp(76px, 15.2vw, 232px)`, line-height .9, silver
  vertical gradient fill. Same family for contact headline and availability label.
- UI/body: **Inter** (300 for stat numerals; labels 10–12px, tracking .14–.26em).
- Monogram: **Cormorant Garamond** 300, tracking −.09em ("FA" ≈ reference's "AV").

## Layout (1440)
Container `min(100% − 72px, 1380px)`. Order: header → hero → stats → featured work (3 equal cards) →
capabilities | tools (+ learning) → about strip → process (5 columns) → contact banner → footer.
Breakpoints: 1100 (hero availability/description reflow), 960 (single-column split, 3+2 process,
stacked contact), 860 (menu button, single-column projects), 760 (mobile hero, 2×2 stats,
vertical process timeline).

## Deliberate deviations from the reference
1. **Portrait** is a derived cutout of V1's `hero-photo.png` (white shirt, studio portrait), not a
   grey blazer; muted with `grayscale(.62) brightness(.8)`. The headline sits **in front of** the
   portrait (as in the reference); the portrait's left edge is masked so `ST` stays legible.
2. **About strip** (`#about`) is an extra compact row — requested by the brief for the ABOUT anchor.
3. Tool "logos" are monochrome monogram tiles (Xl, Tb, Pb…), mirroring the reference's tile style
   without brand colours or extra icon libraries.
4. Project card titles are uppercase (per brief), where the reference uses title case.
5. Cards carry small pill links (Tableau Public / GitHub / Live demo) so every verified URL is reachable.

## Portrait cutout
`public/images/profile/hero-cutout.webp` was produced by region-growing the flat grey studio backdrop
from V1's `hero-photo.png` (alpha-feathered). It is an algorithmic cutout: hair edges are good at
normal size but a professional cutout would be cleaner at large/retina scale.
