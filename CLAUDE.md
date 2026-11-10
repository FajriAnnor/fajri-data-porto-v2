# CLAUDE.md — Fajri Portfolio (porto-v2.1)

Brand-new personal portfolio for Fajri, a Data Analyst. Plain HTML + CSS + vanilla JS, deployed on Vercel with one serverless function (`api/visit.js`) for a visitor counter.
This is a standalone project. Do NOT touch or reference any other existing project.

When something is missing or ambiguous: STOP and ask. Never guess, never invent facts.
Do NOT deploy, git push, or create commits unless the user asks.

---

## 1. SCOPE LOCK — DO NOT GO BEYOND THE AGREED DESIGN IDEAS

Only build what is listed in the brief's sections 4–7 (visual design, page sections, visitor counter, quality requirements). The following are explicitly OUT OF SCOPE for now. Do not build, stub, or add placeholders for them:

- "Why I do this" section (to be decided later)
- Certifications section (bootcamp starts 18 Nov 2026; no certificates yet)
- Real photo (use the grayscale SVG placeholder; photo drops in later as `/assets/portrait.jpg`)
- Language toggle / i18n (English only for now, but keep copy/data in one data file so translation is easy later)
- Blog, dark mode, gallery, extra pages, testimonials, skill-percentage bars, contact form backend, analytics scripts, cookie banners, any extra animation not listed in the brief
- Extra projects or extra experience entries beyond those listed in the brief

If something extra would help, list it as a suggestion at the end of the report. Do not implement it.

Tech stack is fixed: no framework, no build step, no CSS framework, no npm UI libraries. One sans-serif Google Font (Inter or Manrope) with `display=swap`. Counter storage: Upstash Redis via REST using `fetch` (env vars `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`).

---

## 2. TRUTHFULNESS RULES (critical for a recruiter-facing portfolio)

- Use ONLY the facts and numbers written in the brief. Never invent numbers, dates, percentages, "hours saved", ROI, team sizes, or tool names.
- Real-work numbers (WEDISON, CV Berkah Jaya Mandiri) and synthetic-demo numbers (the 3 projects) must never be mixed. Every project card carries a small visible tag "Synthetic demo data". Experience cards carry no such tag.
- Do not state any "before → after" time reduction. There are no measured time figures. Describe improvements qualitatively only.
- Dates not provided stay empty in the data file and are simply not rendered. No placeholder text like "TBD" or "Lorem ipsum" anywhere visible.
- Wording for numbers: "average" and "up to" must be preserved exactly as given in the brief.
- Do NOT claim any time saved or company-wide adoption numbers for the WEDISON experience.
- CV Berkah Jaya Mandiri tech line: only "Excel dashboards, sales database management". Add no tool that was not listed.

---

## 9. ACCEPTANCE CHECKLIST (all must be true before saying "done")

- [ ] Sections present in order: Hero, About, Core expertise, Projects (3), Experience (2), Contact, Footer — and nothing else.
- [ ] No "Why I do this", no certifications, no language toggle, no extra pages.
- [ ] Every number on the page matches the brief exactly; "average" and "up to" kept; no invented figures or dates; no time-saved claims.
- [ ] Project cards show "Synthetic demo data"; experience cards do not.
- [ ] Loader ≤ 1.6 s, skippable, once per session, off for reduced motion, never blocks content, graceful when the API is down.
- [ ] Visitor counter counts unique browsers only, ignores bots, never throws, stores no personal data.
- [ ] Light theme, single blue accent, floating pill nav, two-column section layout, cut-corner primary button, grayscale portrait slot.
- [ ] Works at 375 / 768 / 1440 with no horizontal scroll; no console errors.
- [ ] README and CLAUDE.md exist and are accurate.

The final report must contain: what was built, what was verified (real results), anything that could not be verified, any deviation from the brief (there should be none), and a list of optional suggestions NOT implemented. Lighthouse scores must be reported only if actually run.
