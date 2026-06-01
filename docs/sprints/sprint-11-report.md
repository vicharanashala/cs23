# Sprint 11 Report — Layout 1: Main Dashboard

**Date:** 2026-06-02
**Sprint:** Main Dashboard (Public App Layout 1)
**Status:** ✅ Complete — TypeScript clean, Vite build successful

---

## Objective

Build the main dashboard page (`/`) with 3 navigation routes, trending widget, and the full Emergency Diagnostic Quiz (Innovation A).

---

## File Created

```
apps/web/src/pages/MainDashboard.tsx  (~350 lines)
```

### Layout Sections

**1. Welcome Section**
- Heading: "Welcome to the Samagama Internship Support Center"
- Subtext: contextual help message
- Centered, padded above nav cards

**2. Three Navigation Cards**
Grid: 1 col mobile → 3 cols desktop

| Card | Icon | Path | Active |
|---|---|---|---|
| Browse & Search FAQs | 🔍 | `/browse` | — |
| Submit a New Question | 📝 | `/submit` | ✅ highlighted |
| Track Ticket Status | 📦 | `/track` | — |

Active card (Submit) gets `ring-2 ring-blue-500 border-blue-400`. Cards use `useNavigate` from TanStack Router.

**3. Trending Widget**
- TanStack Query: `GET /api/faqs/trending`
- Skeleton (`animate-pulse`) while loading
- Entirely hidden on fetch error (`isError` → return null)
- Click to expand/collapse description inline
- Shows `data.title` or `data.question.title` (backend returns either shape)

**4. Emergency Diagnostic Quiz (Innovation A)**

Collapsible card — toggle button collapses/expands quiz. Nav cards **hidden** when quiz is open.

3 steps, each showing a progress indicator (`Step N of 3` with dot indicators):

| Step | Question | Options |
|---|---|---|
| 1 | What area are you facing a problem with? | A) Selection Process B) Onboarding & Documents C) Internship Tasks |
| 2 | Which specific phase are you currently in? | A) Applied B) In Progress C) Completed |
| 3 | How long have you been facing this issue? | A) Just happened now B) 1–3 working days C) 4+ working days |

Step 3 → immediately reveals result (no submit button needed).

---

## Recommendation Matrix (27 combinations = 3×3×3)

All 27 `(focus × phase × urgency)` combinations defined in `RECOMMENDATIONS` object.

**HIGH priority paths** (at minimum, per spec):
- `AA→C` (Selection/Applied/4+ days)
- `AB→C` (Selection/In Progress/4+ days)
- `BA→C` (Onboarding/In Progress/4+ days)

Additional HIGH priority paths added:
- `AA→A`, `AB→A`, `BA→A`, `BB→A`, `BC→A` (all areas with "Just happened now" urgency)
- `CA→A` (Internship Tasks/Applied/Just happened now)

Each HIGH path generates an urgent email action script with `internships@samagama.in`, subject line, and specific instructions.

All others: `MEDIUM` or `LOW` with appropriate guidance.

Result block: coloured background (red=HIGH, yellow=MEDIUM, blue=LOW), `Badge` component showing priority, action script text.

Reset button → clears all 3 selections back to Step 1.

Back navigation available on Steps 2 and 3.

---

## Build Verification

| Check | Result |
|---|---|
| `tsc --noEmit` | ✅ 0 errors |
| `npm run build` | ✅ 1.76s, 331KB JS (107KB gzip), 17KB CSS (3.7KB gzip) |

---

## Notes

- `useNavigate({ from: '/' })` used for correct TanStack Router relative navigation
- TanStack Query `staleTime: 5 * 60 * 1000` for trending (more forgiving than default 60s)
- `QuizFocus` and `QuizPhase` types kept despite `PHASE_OPTIONS` removal — still used in state declarations
- `QuizUrgency` removed (was unused)
- Nav cards and Trending widget both hidden when quiz is open — space reclaimed

---

*Previous: sprint-10-report.md (Frontend Foundation)*
*Next: Sprint 12 — Layout 2: Browse & Search*