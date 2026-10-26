# Fajri — Data Analyst Portfolio V2

Editorial charcoal/silver one-page portfolio, built to reproduce `reference/design-reference.png`
with Fajri's real content. Phase 1 = complete homepage foundation (all eight sections, responsive,
base motion, EN/ID toggle).

## Stack
Next.js 16 (App Router) · TypeScript · React 19 · Tailwind CSS v4 (preflight only) + hand-written
global CSS · `motion/react` · `lucide-react` · `next/image` · `next/font/google` (Anton, Inter, Cormorant Garamond).

## Run
```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run typecheck
npm run build && npm start
```

## Where things live
| Path | What |
| --- | --- |
| `data/portfolio.ts` | **All copy, stats, projects, links, contact info** (EN + ID). Edit here. |
| `app/globals.css` | Design tokens (`:root`) and all section styles + breakpoints. |
| `components/sections/*` | Hero, StatsStrip, FeaturedWork, Capabilities (+About), DataProcess, ContactBanner. |
| `components/motion/*` | `ScrollReveal`, `StaggerContainer`/`StaggerItem`, `AnimatedHeadline`. |
| `lib/language.tsx` | EN/ID provider (persisted in localStorage) + `MotionConfig reducedMotion="user"`. |
| `public/images/profile/hero-cutout.webp` | Derived portrait cutout (see DESIGN_SPEC.md). |

## Content integrity
All facts come from V1 (`fajri-data-porto/data/portfolio.ts`). Every project dashboard/dataset is
**synthetic demonstration data** and is labelled so on the page. Python / advanced SQL are shown
under "Current Learning", not as established skills. No certifications are claimed.

## Status
Production release. The `main` branch is the source for Vercel production deployments.
