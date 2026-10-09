# Qlinic Design System (Master)

> Source of truth for the staff panel (`admin/`) and the patient site (`frontend/`).
> When building a page, first check `design-system/qlinic/pages/<page>.md`; if it exists,
> its rules override this file. Otherwise follow this file.
>
> Started from the UI/UX Pro Max skill ("healthcare SaaS admin dashboard clinic",
> style **Minimalism & Swiss**, density 8/10, motion 2/10, variance 3/10), then adjusted
> for Qlinic: a dense, all-day tool for reception, doctors and lab staff in Pakistan.
> Adjustments are marked **(Qlinic)** with the reason.

---

## 1. Principles

1. **Calm and clinical.** Neutral surfaces, one brand colour, colour used for meaning
   (status, urgency), not decoration. No gradients, no rainbow icon tiles.
2. **Work first.** Every screen opens on what the user does now (today's queue, today's
   appointments, open lab requests), not on totals.
3. **Dense but legible.** Compact spacing for long lists; 14px minimum for data, 16px for
   form inputs; numbers in tabular figures.
4. **Never lose a patient.** Destructive actions are confirmed in an in-app dialog that
   says what will happen (e.g. "The patient is told on WhatsApp"). No browser pop-ups.
5. **Bilingual where patients are involved.** Urdu text uses an Urdu font and `dir="rtl"`.

---

## 2. Colour

Tokens live in `admin/tailwind.config.js` and `frontend/tailwind.config.js`.
All text/background pairs below pass WCAG AA (4.5:1).

### Brand: teal (`primary`)

| Token | Hex | Use |
|---|---|---|
| `primary-50` | `#ECFEFF` | Selected nav item, subtle highlight |
| `primary-100` | `#CFFAFE` | Badges, focus halo |
| `primary-600` | `#0891B2` | Icons, chart accents (not text on white for small text) |
| `primary` / `primary-700` | `#0E7490` | **Buttons, links, active states** (white text 5.36:1) |
| `primary-800` | `#155E75` | Button hover |
| `primary-900` | `#164E63` | Headings on tinted panels |

**(Qlinic)** The skill's primary `#0891B2` fails AA with white text (3.68:1) and it
compensated with black text on teal buttons. We use `#0E7490` with white text instead.

### Neutrals (Tailwind `slate`)

| Role | Token | Hex |
|---|---|---|
| App background | `slate-50` | `#F8FAFC` |
| Card / table surface | `white` | `#FFFFFF` |
| Border, dividers | `slate-200` | `#E2E8F0` |
| Primary text | `slate-900` | `#0F172A` |
| Secondary text | `slate-600` | `#475569` (7.6:1) |
| Muted text (minimum for any text) | `slate-500` | `#64748B` (4.8:1) |

**(Qlinic)** The skill tinted the whole app cyan (`#ECFEFF` background, `#A5F3FC` borders).
For long tables over a full shift, neutral surfaces with a teal accent are calmer.
Never use `gray-400`/`slate-400` for text (2.5:1).

### Status (fixed meanings, always with an icon or a word, never colour alone)

| Meaning | Text | Background | Examples |
|---|---|---|---|
| Success / done | `emerald-700` | `emerald-50` | Completed, Approved, Seen |
| Waiting / attention | `amber-800` | `amber-50` | Pending, Waiting for lab |
| Danger / urgent | `red-700` | `red-50` | Cancelled, Urgent, Not here |
| Info / neutral | `slate-700` | `slate-100` | Walk-in, Left |
| Follow-up | `violet-700` | `violet-50` | Follow-up visit |

**(Qlinic)** The skill's accent `#059669` fails AA with white text (3.77:1); success uses
`emerald-700` text on a light background, not white-on-green buttons.

### Charts

Keep the validated profit chart pair (hospital `#2a78d6`, doctor `#eb6834`) from the
dataviz palette; it passes colour-blind separation. Do not recolour charts to the brand teal.

---

## 3. Typography

| Role | Font | Notes |
|---|---|---|
| Headings, numbers in tiles | **Figtree** 600/700 | Clean, friendly, healthcare |
| Body, tables, forms | **Noto Sans** 400/500/600 | Highly legible; pairs with Noto Nastaliq Urdu |
| Urdu | **Noto Nastaliq Urdu** | Always with `dir="rtl"` and `lang="ur"` |

Source: the skill's "Medical Clean" pairing (Healthcare, medical clinics, accessibility).
**(Qlinic)** The skill's dashboard pairing (Fira Code mono headings) reads as a developer
tool; its first suggestion (Atkinson Hyperlegible) has no matching Urdu family.

Scale (staff panel):

| Use | Class |
|---|---|
| Page title | `text-2xl font-semibold` (Figtree) |
| Section title | `text-lg font-semibold` |
| Body / table | `text-sm` (14px) |
| Form inputs | `text-base` (16px, avoids mobile zoom) |
| Caption / helper | `text-xs` minimum, `slate-500` or darker |
| Numbers (money, counts, times) | add `tabular-nums` |

---

## 4. Space, shape, elevation

- Spacing: Tailwind scale, dense dashboard rhythm: 8px inside controls, 12-16px inside
  cards, 24px between sections. Page gutter 16px (phone), 24px (desktop).
- Page content width: `max-w-7xl` for every staff page (one width everywhere).
- Radius: `rounded-lg` (8px) for controls and badges, `rounded-xl` (12px) for cards and
  dialogs, `rounded-full` only for avatars and pills.
- Elevation: cards use a 1px `slate-200` border and no shadow; dropdowns and dialogs use
  `shadow-lg`. **(Qlinic)** No hover lift on cards: cards are containers, not buttons.

---

## 5. Components (admin/src/components/ui)

| Component | Rules |
|---|---|
| `Button` | Variants: primary (teal), secondary (white + border), ghost, danger. Sizes sm/md. Always a text label; icon optional. `cursor-pointer`, visible focus ring, disabled state, loading state. |
| `Avatar` | Photo if present, else initials on a calm tint derived from the name. Never a broken image. |
| `ConfirmDialog` / `useDialog()` | Replaces `window.confirm/prompt/alert`. Title, consequence sentence, confirm label naming the action ("Cancel appointment"), danger tone for destructive actions, Escape/overlay to close, focus on the safe button. |
| `PageHeader` | Title, one-line description, actions on the right; wraps on phone. |
| `Card` | White, `rounded-xl`, `border-slate-200`. |
| `Badge` | Status colours from section 2 only. |
| `EmptyState` | Icon, one sentence, the next action. |
| Tables | Page scrolls (no fixed-height inner boxes); header row sticky; actions = one labelled primary action + "More" menu; destructive actions in the menu and confirmed. |

Icons: one set, `react-icons/fa` (already used). Decorative icons `aria-hidden`; icon-only
buttons need `aria-label` and a tooltip (`title`).

---

## 6. Motion

Transitions 150-200ms on colour/opacity only. No scroll animations, no layout-shifting
hovers, respect `prefers-reduced-motion`. **(Qlinic)** The skill's GSAP scroll reveal is for
marketing pages; not used in the staff panel.

---

## 7. Anti-patterns (do not use)

- Gradients, glassmorphism, neon or purple/pink "AI" colours
- Emoji as icons
- Hidden scrollbars or fixed-height boxes that clip lists
- Browser `confirm`/`prompt`/`alert`
- Developer wording in the UI (".env", variable names, stack traces)
- Text lighter than `slate-500`
- Colour as the only signal of status

---

## 8. Pre-delivery checklist

- [ ] Uses tokens above (no raw hex in components, no `blue-*`/`indigo-*` brand colours)
- [ ] Text contrast 4.5:1; focus ring visible on every control
- [ ] Icon-only buttons have `aria-label`; decorative icons `aria-hidden`
- [ ] No horizontal scroll at 375px; works at 768px (reception tablet), 1024px, 1440px
- [ ] Lists scroll with the page; nothing clipped
- [ ] Destructive actions use `ConfirmDialog` with the consequence spelled out
- [ ] Empty, loading and error states present
- [ ] Urdu text in Noto Nastaliq with `dir="rtl"`
- [ ] `npm run check:integration` passes; screenshot pass done
