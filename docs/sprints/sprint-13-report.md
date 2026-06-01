# Sprint 13 Report — Layout 3: Submit Ticket + Duplicate Blocker

**Date:** 2026-06-02
**Sprint:** Submit Ticket (Public App Layout 3) + Innovation B
**Status:** ✅ Complete — TypeScript clean, Vite build successful

---

## Objective

Build the ticket submission page (`/submit`) with react-hook-form + Zod validation, the Debounced Duplicate Blocker (Innovation B), and success/resolution states.

---

## New Dependencies Installed

```
react-hook-form  @7.77.0
@hookform/resolvers @3.10.0
zod @3.25.76
```

---

## File Created

```
apps/web/src/pages/SubmitTicket.tsx  (~380 lines)
```

---

## Form

### Fields

| Field | Type | Validation |
|---|---|---|
| Email | `input[type=email]` | `z.string().email()` |
| Category | Radio group (4 options) | `z.enum([4 categories])` |
| Description | `textarea`, 5 rows | `z.string().min(20)` |

### react-hook-form Setup
- `useForm<FormValues>` with `zodResolver(schema)`
- `mode: 'onTouched'` — validation triggers on blur
- `noValidate` on `<form>` — lets react-hook-form handle all validation
- Inline field errors rendered below each field
- Character count shown for description when `0 < length < 20`

---

## Innovation B — Debounced Duplicate Blocker

**Trigger condition:** `debouncedDescription.length >= 10`

**Debounce:** 400ms via `useDebounce(description, 400)`

**API call:** `GET /api/faqs/search/similar?title={first 80 chars of debounced description}`

**Panel behaviour:**
- Shown when `similarMatches?.length > 0` and not dismissed and not resolved
- "Checking for similar questions..." spinner while `isFetching`
- Dismissable: "✗ No, continue submitting" → sets `duplicateDismissed = true` (session-only)
- "✓ Yes, this helps!" → sets `resolved = true` → renders `ResolvedState`

**Submit button:**
- Disabled while `showDuplicatePanel` is true (duplicate not yet acted on)
- Label: `"Resolve duplicate first"` when blocked

---

## States

### Default Form State
Full form with Zod validation.

### Resolved State (`resolved === true`)
🎉 emoji, "Glad we could help!" heading, two nav buttons (Browse / Home).

### Success State (`isSubmitted === true`)
- Ticket ID in a styled `code` block
- **Copy button** → `navigator.clipboard.writeText(trackingId)`, shows "Copied!" for 2s
- "Check status later → Track Ticket" link (navigates to `/track`)

### Error State
Inline red banner above form with `submitMutation.error?.message`.

---

## Build Verification

| Check | Result |
|---|---|
| `tsc --noEmit` | ✅ 0 errors |
| `npm run build` | ✅ 1.97s, 434KB JS (135KB gzip), 22KB CSS (4.5KB gzip) |

---

## Notes

- Packages installed during this sprint (not pre-existing): `react-hook-form`, `@hookform/resolvers`, `zod`
- `Input` component not used — all fields are native HTML inputs with custom styling
- `DuplicatePanel` is a controlled component — parent owns state, child receives callbacks
- `submitMutation.onSuccess` uses `response.data.trackingId` directly — axios wraps the JSON body in `.data`
- `useEffect` on mount resets all state (for when user navigates away and back)

---

*Previous: sprint-12-report.md (Browse & Search)*
*Next: Sprint 14 — Layout 4: Ticket Tracking*