# Nexus PMO — Design System Reference

> **For AI tools and Lovable:** Read this file before generating any new screen, component, or layout.
> Check the **ACTIVE DESIGN SYSTEM** line below and apply only that system's tokens.
> Do not mix tokens across systems. Do not invent values not listed here.

---

## ▶ ACTIVE DESIGN SYSTEM: DS02

> To switch: change the line above to `DS02` (or any defined system).
> All colour tokens, card styles, and mode rules come from the active system only.

---

## How to Switch

When asked to "switch to DS02" (or any system):
1. Update the `ACTIVE DESIGN SYSTEM` line at the top of this file
2. Apply all tokens from that system's section to `src/styles.css`
3. Replace CSS variable values in `:root` with the new system's palette
4. If the new system supports Light Mode, add a `[data-theme="light"]` block with light tokens

---

## Design System Catalogue

---

# DS01 — Dark Navy / Teal Glass
**Status:** Active  
**Mode:** Dark only  
**Character:** Deep navy background, semi-transparent glass cards, single teal accent. Professional, data-dense, high-contrast.

## DS01 · Visual Language

- Deep navy background with subtle teal radial glow
- Semi-transparent glass cards with soft borders
- Teal (`#51CAAD`) as the single accent — used sparingly
- No white surfaces. No light mode. Everything is dark.
- Typography: Outfit font, medium weight headers

## DS01 · Colour Tokens

### Core Palette

| Token | Value | Usage |
|---|---|---|
| `--background` | `#0B1120` | Page background |
| `--surface` | `#0F1729` | Sidebar, popovers, elevated surfaces |
| `--foreground` | `#E2E8F0` | Primary text |
| `--muted-foreground` | `#94A3B8` | Secondary / label text |
| `--border` | `rgba(255,255,255,0.08)` | All borders |
| `--card` | `rgba(255,255,255,0.04)` | Card backgrounds |
| `--secondary` | `rgba(255,255,255,0.06)` | Hover / fill backgrounds |
| `--input` | `rgba(255,255,255,0.06)` | Input backgrounds |
| `--popover` | `#111a2e` | Dropdown / popover backgrounds |

### Accent

| Token | Value | Usage |
|---|---|---|
| `--accent` | `#51CAAD` | Primary CTA, active states, links |
| `--accent-foreground` | `#06231D` | Text on teal backgrounds |
| `--accent-dim` | `rgba(81,202,173,0.12)` | Chip backgrounds, selected fills |
| `--accent-glow` | `rgba(81,202,173,0.25)` | Glow effects |
| `--ring` | `rgba(81,202,173,0.4)` | Focus ring |

### RAG Status

| Token | Value | Meaning |
|---|---|---|
| `--rag-green` | `#10B981` | On track / approved / healthy |
| `--rag-amber` | `#F59E0B` | At risk / pending / warning |
| `--rag-red` | `#EF4444` | Critical / rejected / error |
| `--rag-blue` | `#3B82F6` | New / informational / not started |
| `--rag-grey` | `#64748B` | Inactive / on hold / archived |

### Role Colours

| Role | Hex |
|---|---|
| Executive | `#8B5CF6` |
| Portfolio Director | `#0EA5E9` |
| Resource Manager | `#F97316` |
| Project Manager | `#10B981` |
| Team Member | `#64748B` |

### Shadows

| Token | Value |
|---|---|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.4)` |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.5)` |
| `--shadow-lg` | `0 8px 32px rgba(0,0,0,0.6)` |
| `--shadow-teal` | `0 4px 20px rgba(81,202,173,0.35)` |

### Body Background Gradient

```css
background-image:
  radial-gradient(1200px 600px at 80% -20%, rgba(81,202,173,0.06), transparent 60%),
  radial-gradient(900px 500px at -10% 100%, rgba(59,130,246,0.05), transparent 60%);
```

## DS01 · Card Style — `.glass-card`

```css
background: rgba(255,255,255,0.04);
border: 1px solid rgba(255,255,255,0.08);
border-radius: 12px;
backdrop-filter: blur(8px);
transition: all 200ms ease;
/* hover */
border-color: rgba(81,202,173,0.2);
background: rgba(255,255,255,0.06);
```

## DS01 · Do's and Don'ts

**Do:**
- Use `.glass-card` for every content container
- Use `--accent` only for the primary actionable element per section
- Use `text-muted-foreground` for supporting text
- Use RAG colours only for health/status — never decoration

**Don't:**
- Don't use white or light backgrounds
- Don't use `font-bold` — max is `font-semibold`
- Don't use `rounded-2xl` or larger
- Don't mix with DS02 tokens

---

# DS02 — Warm Light / Dark Mode
**Status:** Active (defined from Figma — Attendance App Design System)  
**Mode:** Light (default) + Dark  
**Character:** Warm cream surfaces, golden yellow accent, lavender secondary, clean white backgrounds. Professional and approachable — works in both modes.

## DS02 · Visual Language

- White / warm-cream backgrounds — no glass, solid surfaces
- Golden yellow (`#f2c94c`) as the primary accent
- Lavender/purple (`#ccc4ec`, `#dec9ff`) as the secondary accent
- Dark navy (`#1c274c`) for deep accents and high-contrast elements
- Clean, modern typography — Inter as the primary font
- Consistent 8px / 10px / 16px radius system

---

## DS02 · CSS Variables

Apply these to `:root` in `styles.css` when DS02 is active.

### Light Mode (default)

```css
:root {
  /* Backgrounds */
  --background: #ffffff;
  --surface:    #f5efeb;       /* warm cream — cards, panels */
  --surface-alt: #e5e5e5;     /* dividers, inactive tabs */
  --surface-alt-2: #c7c5d0;   /* subtle fills */

  /* Text */
  --foreground:         #262626;   /* primary text */
  --text-secondary:     #3d3d44;   /* secondary text */
  --muted-foreground:   #737373;   /* captions, metadata */
  --text-inverse:       #ffffff;   /* text on dark backgrounds */

  /* Accent — Golden Yellow */
  --accent:             #f2c94c;
  --accent-foreground:  #1c274c;   /* dark text on accent */
  --accent-dim:         rgba(242,201,76,0.15);
  --accent-deep:        #1c274c;   /* navy — used for strong emphasis */
  --accent-dark:        #30384a;   /* slightly lighter navy */

  /* Secondary Accent — Lavender */
  --accent-secondary:   #ccc4ec;
  --accent-secondary-2: #dec9ff;
  --accent-blue:        #a0c9e9;

  /* Border & Input */
  --border: #a3a3a3;
  --border-light: #d4d4d4;
  --input:  #ffffff;
  --ring:   rgba(242,201,76,0.5);

  /* Semantic */
  --destructive:            #ef4444;
  --destructive-foreground: #ffffff;
}
```

### Dark Mode

```css
[data-theme="dark"] {
  --background:       #121318;
  --surface:          #1c1c24;
  --surface-alt:      #292931;
  --surface-alt-2:    #30384a;

  --foreground:       #ffffff;
  --text-secondary:   #c7c5d0;
  --muted-foreground: #737373;
  --text-inverse:     #121318;

  --accent:             #f2c94c;
  --accent-foreground:  #121318;
  --accent-dim:         rgba(242,201,76,0.15);
  --accent-deep:        #a0c9e9;
  --accent-dark:        #30384a;

  --accent-secondary:   #ccc4ec;
  --accent-secondary-2: #dec9ff;
  --accent-blue:        #a0c9e9;

  --border:       rgba(255,255,255,0.12);
  --border-light: rgba(255,255,255,0.06);
  --input:        rgba(255,255,255,0.06);
  --ring:         rgba(242,201,76,0.4);
}
```

---

## DS02 · Colour Reference

### Core Palette

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--background` | `#ffffff` | `#121318` | Page background |
| `--surface` | `#f5efeb` | `#1c1c24` | Cards, panels, inputs |
| `--surface-alt` | `#e5e5e5` | `#292931` | Dividers, inactive fills |
| `--foreground` | `#262626` | `#ffffff` | Primary text |
| `--muted-foreground` | `#737373` | `#737373` | Metadata, captions |
| `--border` | `#a3a3a3` | `rgba(255,255,255,0.12)` | All borders |

### Accent Palette

| Token | Value | Usage |
|---|---|---|
| `--accent` | `#f2c94c` | Primary CTA, active states, highlights |
| `--accent-foreground` | `#1c274c` (light) / `#121318` (dark) | Text on accent backgrounds |
| `--accent-dim` | `rgba(242,201,76,0.15)` | Chip fills, selected backgrounds |
| `--accent-deep` | `#1c274c` | Deep emphasis, dark buttons |
| `--accent-secondary` | `#ccc4ec` | Secondary badges, info chips |
| `--accent-secondary-2` | `#dec9ff` | Hover glow, focus rings on secondary |
| `--accent-blue` | `#a0c9e9` | Info states, blue tags |

### Semantic Colours (same both modes)

| Purpose | Colour |
|---|---|
| Success / On Track | `#10b981` |
| Warning / At Risk | `#f59e0b` |
| Danger / Error | `#ef4444` |
| Info / New | `#3b82f6` |

---

## DS02 · Typography

**Primary font:** `Inter` (Google Fonts). Fallback: `ui-sans-serif, system-ui, sans-serif`.  
**Display / Headings:** `Poppins` for large display text if needed.

| Element | Size | Weight | Notes |
|---|---|---|---|
| Display | 78px | 700 | Hero / splash only |
| H1 | 48px | 700 | Page titles |
| H2 | 44px | 700 | Section headers |
| H3 | 40px | 600 | Sub-sections |
| H4 | 36px | 700 | Card headers |
| H5 | 32px | 600 | |
| Body Large | 16px | 400 | Default body text |
| Body | 14px | 400 | Tables, cards |
| Caption | 12px | 400 | Metadata, timestamps |
| Label | 12px | 600 | Form labels, eyebrows |

> Numbers and IDs: still use `.num-mono` (Courier New / monospace) as inherited from Shared Rules.

---

## DS02 · Border Radius

Most-used values from the design system:

| Token | Value | Usage |
|---|---|---|
| `rounded-sm` | 4px | Badges, tags |
| `rounded-md` | 8px | **Default** — buttons, inputs, most cards |
| `rounded-lg` | 10px | Cards, panels |
| `rounded-xl` | 16px | Large modals, hero containers |
| `rounded-full` | 9999px | Avatars, pills, toggles |

---

## DS02 · Shadows

| Token | Value | Usage |
|---|---|---|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.1)` | Subtle lift |
| `shadow-md` | `0 2px 4px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.1)` | Cards |
| `shadow-lg` | `0 4px 6px rgba(0,0,0,0.1), 0 10px 15px rgba(0,0,0,0.1)` | Modals |
| `shadow-accent` | `0 7px 8px rgba(242,201,76,0.2)` | Accent button glow |
| `focus-ring` | `0 0 0 2px rgba(242,201,76,0.5)` | Focus state |

---

## DS02 · Sidebar Style

The sidebar is **always dark** in DS02 — regardless of the light/dark mode toggle. This creates a "dark sidebar + light/dark content" split that is common in professional SaaS apps.

```
Background:    #1c1c24  (always — light mode AND dark mode)
Text:          rgba(255,255,255,0.7)
Active item:   background #ccc4ec (lavender), text #1c274c (dark navy)
Hover item:    background rgba(255,255,255,0.08)
Border:        rgba(255,255,255,0.08)
Radius:        rounded-xl (12px) per item
Height:        h-10 (40px) per item
```

**Active state rule:** The active nav item uses `--accent-secondary` (`#ccc4ec`) as its background with `#1c274c` as text — NOT the golden accent. This mirrors the DS02 Figma reference exactly.

**No section labels** — no "MAIN" or "MANAGEMENT" group headers. All items flow in a single list.

## DS02 · Card Style

No glassmorphism — solid surfaces with light shadows.

```css
/* Light mode */
background: #f5efeb;          /* --surface */
border: 1px solid #d4d4d4;    /* --border-light */
border-radius: 8px;
box-shadow: 0 1px 3px rgba(0,0,0,0.08);
transition: all 200ms ease;

/* Hover */
border-color: #f2c94c;        /* accent border on hover */
box-shadow: 0 2px 8px rgba(242,201,76,0.15);

/* Dark mode */
background: #1c1c24;
border: 1px solid rgba(255,255,255,0.1);
```

---

## DS02 · Do's and Don'ts

**Do:**
- Use `--background` (`#fff` / `#121318`) as the page background
- Use `--surface` (`#f5efeb` / `#1c1c24`) for cards and panels
- Use `--accent` (`#f2c94c`) as the single primary CTA colour
- Use `data-theme="dark"` on `<html>` to switch to dark mode
- Use `Inter` for all body text
- Keep border-radius at 8px for most elements

**Don't:**
- Don't use glassmorphism (`backdrop-filter: blur`) — DS02 uses solid surfaces
- Don't use the DS01 navy (`#0B1120`) as a background in DS02
- Don't mix DS01 teal (`#51CAAD`) with DS02 golden accent
- Don't use `font-bold` for body text — max `font-semibold` (600)
- Don't hardcode hex values — always use CSS variables

---

# Shared Rules (apply to ALL design systems)

These rules are system-agnostic and always apply regardless of active DS.

## Toolbar Pattern — Search + Filter + Primary CTA

**Rule:** On any list/table/grid screen, search, Filter and the primary Add CTA live together
in one right-aligned toolbar row — never split across the page.

```
[ result count ] ................ [ 🔍 Search by … ] [ ⚙ Filter (n) ] [ + Add X ]
```

- Order is fixed: **Search → Filter → Primary CTA** (right-aligned, `gap-3`).
- Result count (`text-xs text-muted-foreground`) sits far-left via `mr-auto`.
- Search: `Input` with leading `Search` icon (`pl-9`), width `w-72` (full width on mobile).
  Every search input across pages, drawers, and popups uses fill `#292931`, stroke `#46464F`,
  and placeholder text `#767680` through the shared search-field tokens.
- Filter: `variant="outline"` with accent-lavender border + icon, numeric badge for active filters,
  opens a **right side drawer** (`Sheet`, 380px) with drill-down groups, applied-filter chips,
  and Clear / Cancel / Apply.
- Primary CTA: single primary button (`<Button variant="primary">` with `Plus` icon). `Add X` always uses the primary brand fill.
- The section title/description block stays on its own row above the toolbar — no CTA in it.
- All three controls share the global control metrics: **height 36px, radius 8px**.
- Buttons are not form fields: `Button` sets `data-ds-field="off"` so the control baseline does not override button background colours.


## Filter Side Drawer (DS02)

**Rule:** Every list screen filters through the same right side drawer (`PageToolbar` / `FilterDrawer`).

- Panel: every right-side `SheetContent`, including filter and record-detail drawers, uses
  `rounded-l-lg border-l border-border bg-drawer`. Filter drawers are **380px**; detail drawers may
  use **480px**. `--drawer-surface` is **#121319** in dark mode. Never use `bg-surface` for a drawer.
- **Close (✕) button:** the close affordance is identical across every drawer and popup
  (`SheetContent` default close, `FormDialog` close, and the filter drawer header). It is a
  **24px round chip** (`h-6 w-6 rounded-full`) with a subtle filled background
  `bg-[var(--btn-secondary-bg-hover)]` (`--p-neutral-700` dark), foreground at 90% opacity, and a
  **12px** `X` icon (`h-3 w-3`). No bare/large X, no white background, no border. Hover raises the
  icon to full foreground. Do not reintroduce a plain `X size={20/22}` close anywhere.
- Header row: `px-5 py-4`, 14px medium title; root level has a round close button,
  drill-down level has a `ChevronLeft` Back button before the title.
- Groups list: full-width rows, `py-3`, label left + `ChevronRight` right, hover `bg-secondary/30`.
- Option rows: `Checkbox` + label, `gap-3 py-2`, hover `bg-secondary/40`. Checkbox state always
  reads from the **draft** state, never the applied value, so selection reacts immediately;
  changes commit only on **Apply**.
- Long option lists (> 6) get a search field: `Input` with leading `Search` icon inside a
  `relative` wrapper (`absolute left-3 top-1/2 -translate-y-1/2`, `pl-9`) — the padding wrapper
  is outside the `relative` box so the icon never drifts from the field.
- Applied filters: chips section above the footer with `Clear Filters`.
- Footer: `border-t`, right-aligned **Cancel** (dark outlined) + **Apply** (primary).

## Typography


**Font family:** `Outfit` (Google Fonts). Fallback: `ui-sans-serif, system-ui, sans-serif`.  
**Monospace:** `Courier New`, `ui-monospace` — use `.num-mono` class for all numbers, IDs, currencies.

| Element | Tailwind class |
|---|---|
| Page title | `text-2xl font-semibold` |
| Section header | `text-base font-medium` |
| Card title | `text-sm font-medium` |
| Body text | `text-sm text-muted-foreground` |
| Eyebrow label | `.label-eyebrow` (uppercase, accent, 0.65rem, tracked) |
| Metadata | `text-xs text-muted-foreground` |
| Numbers / IDs | `.num-mono` |

All `h1–h5`: `font-weight: 500`, `letter-spacing: -0.01em`. Never use `font-bold`.

## Border Radius

| Token | Value | Usage |
|---|---|---|
| `rounded-sm` | `4px` | Badges, chips, tags |
| `rounded-md` | `8px` | Buttons, inputs |
| `rounded-lg` | `12px` | Cards, dialogs |
| `rounded-xl` | `16px` | Large panels, modals |
| `rounded-full` | `9999px` | Avatars, pills |

## Layout

### App Shell
```
Sidebar (240px, collapsible to 44px) + Topbar (48px) + main (px-10 py-8)
```

### Bento Grid
```tsx
<div className="grid gap-4 md:grid-cols-3">
  <div className="glass-card col-span-2 p-5">Wide</div>
  <div className="glass-card p-5">Narrow</div>
</div>
```

### KPI Strip
```tsx
<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
  <div className="glass-card p-4">
    <div className="label-eyebrow">Label</div>
    <div className="mt-1 text-2xl font-medium num-mono text-foreground">22</div>
    <div className="mt-0.5 text-xs text-muted-foreground">sub-label</div>
  </div>
</div>
```

### Tab Navigation
```tsx
<Tabs defaultValue="x">
  <TabsList className="bg-secondary/40">
    <TabsTrigger value="x"
      className="text-xs data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
      Tab
    </TabsTrigger>
  </TabsList>
  <TabsContent value="x" className="mt-5">...</TabsContent>
</Tabs>
```

## Overlays — Modal vs Drawer Decision Rule

**Rule:** choose the overlay container by the *nature of the task*, not by visual
habit. Consistency across the product comes from matching the container to the
task type — two surfaces doing the same kind of job must use the same container.
This rule applies in every design system and over the Components detail below.

### Use a Modal (centered popup) when

- The task is **short and decisive**: one decision or a compact form the user must
  complete before continuing.
- It should **interrupt the full context** on purpose.
- Content fits without scrolling alongside the originating list.
- It commits or cancels a single atomic action.

**Examples:** `ConfirmDialog` (delete / acknowledge), `FormDialog` quick-adds
(Cost Category, Job Role, Department), Calendar event create / edit, approval
prompts.

### Use a Drawer (side panel) when

- The task is **reading or editing rich detail** that benefits from keeping the
  source list visible.
- Content is large or multi-section and would crowd a modal.
- The user moves between the list and the detail repeatedly.
- Reading the detail does not require blocking the whole screen.

**Examples:** Risk view, Issue view, resource request detail, filter side drawer,
record detail panels.

### Decision test

1. One decision / short form, must block everything else → **Modal**.
2. Rich detail, keep the list in view, read-and-act → **Drawer**.

### Consistency note

A Calendar "Add Event" modal and a Risk "view detail" drawer are *not*
inconsistent — they serve different task types. True system consistency is
consistency of **task type**, not of container shape. When in doubt, ask "what
kind of task is this?" and pick the container for that task type.

> **Reuse:** confirmation → `ConfirmDialog`; form / content popup → `FormDialog`;
> rich read / edit detail → right side `Sheet` drawer (480px, see Filter Side
> Drawer for the shared close affordance and surface tokens).

## Date Display Standard

All user-visible calendar dates use one English, day-first format:

| Date content | Format | Example |
|---|---|---|
| Includes a year | `DD MMM, YYYY` | `22 Sep, 2026` |
| Omits the year | `DD MMM` | `22 Sep` |

- Always zero-pad the day and use the English three-letter month abbreviation.
- Apply the rule to tables, cards, drawers, dialogs, tooltips, schedules, filters,
  exports intended for people, and selected values in date controls.
- Relative time such as `Today`, `Yesterday`, or `2d ago` remains relative.
- Month-only or period labels such as `Sep 2026`, `Q3`, and `FY2026` remain period labels.
- Store, calculate, submit, filter, and route with machine-readable ISO dates
  (`YYYY-MM-DD`). Native date-input values also remain ISO. Formatting is a
  presentation-layer concern only.
- Parse date-only ISO values as local calendar dates to prevent timezone shifts.
- Reuse `formatDateWithYear` and `formatDateWithoutYear` from
  `src/lib/date-format.ts`; do not create local display formatters.

## Components

### Buttons
| Variant | Usage |
|---|---|
| `bg-accent text-accent-foreground hover:bg-accent/90` | Primary CTA — one per section |
| `variant="outline"` | Emphasized outline actions — `#1D1D1F` fill, `#DEC9FF` text and border |
| `variant="secondary"` | Secondary actions — `#1D1D1F` fill, `#E0E0E0` text, `#A0A0A0` border |
| `variant="ghost"` | Tertiary / icon-only |
| `variant="destructive"` | Delete, reject, remove |

**Control metrics & font:** every `Button` is height **36px**, radius **8px**. All button labels — including the Main CTA (`size="sm"` primary in the toolbar) — render at **`text-sm` = 14px**. The `sm` size only narrows horizontal padding (`px-3`); it never reduces the label to `text-xs`. Buttons that genuinely need a smaller label override explicitly with `text-xs`/`text-[11px]`.

### Badges & Status Pills
**Pill rule (mandatory):** every badge, tag, chip, and status indicator is a **fully rounded pill** — `rounded-full`, height **28px** (`h-7`), `px-3`, `text-xs font-medium`. Never a rounded rectangle (`rounded-sm` / `rounded-md`). The shared `Badge` component already encodes this, so use it instead of hand-rolled spans.

Map to RAG: green=approved/active, amber=pending/risk, red=rejected/critical, blue=new/draft, grey=archived/hold.

```tsx
<Badge variant="outline" className="border-rag-green/30 bg-rag-green/10 text-rag-green">Approved</Badge>
```

### Empty States
```tsx
<div className="glass-card p-8 text-center">
  <div className="text-sm text-muted-foreground">No items found</div>
</div>
```

### Dialogs
- `max-w-md` confirmations · `max-w-lg` forms · `max-w-4xl` multi-step
- Footer: Cancel (dark `secondary`, left) · Primary action (right)
- **Popup Cancel rule:** Cancel must always use the dark secondary treatment (`variant="secondary"`) in every popup. Never use a white-filled treatment for Cancel.
- **Project Schedule rule:** schedule forms use `FormDialog`; destructive confirmations use `ConfirmDialog`. Do not use a generic alert popup for editable forms or deletes.
- All popup shells share the semantic modal surface/border, 20px title, 28px padding, 24px close chip, and right-aligned 12px action gap.

## Spacing
`gap-3` tight grids · `gap-4` standard grids · `p-4` compact cards · `p-5` standard cards · `mt-5` tab content

## Interaction
- Transitions: `transition-all duration-200`
- Drag: `opacity-30 scale-95` on dragged item
- Focus: `ring-2 ring-accent/40`
- Pulse: `.pulse-dot` on critical RAG only

## Button States (all design systems)

Six variants, each with Default / Hover / Disabled (disabled = 50% opacity, no pointer events).
Values come from the `--btn-*` tokens in `src/styles.css` — never hardcode hex in components.

| Variant | Default | Hover |
|---|---|---|
| `primary` (`default`) | lavender fill, dark text | vivid purple fill, white text |
| `secondary` | `#1D1D1F` fill, `#E0E0E0` text, `#A0A0A0` border | lighter dark fill |
| `outline` | `#1D1D1F` fill, `#DEC9FF` text and border | vivid purple text and border |
| `outlineSecondary` | **Retired — do not use** | **Retired — do not use** |
| `danger` (`destructive`) | red fill | deep maroon fill |
| `warning` | golden fill, dark text | dark gold fill |

## Icons — Filter & Add

Filter uses the Iconsax (vuesax) **Setting4** icon; Add uses Iconsax **Add** (`+`).
Both are exported from `src/lib/icons.tsx` as `Filter` / `Plus` — import from there only.

## Confirmation Popups (DS02)

Use `ConfirmDialog` from `@/components/ui/confirm-dialog` for every confirm,
destructive or acknowledgement prompt. Never hand-roll a confirm modal.

| Tone | Icon (Solar) | Confirm button |
|---|---|---|
| `success` | check-circle | primary (lavender) |
| `info` | info-circle | primary (lavender) |
| `warning` | danger-triangle | warning (gold) |
| `danger` | trash-bin | danger (red) |

Anatomy (fixed): bare 28px close ✕ top-right → 44px tinted icon circle with matching
1px ring → bold title → muted description → footer with secondary "Cancel"
plus the tone's action button, both centered. Optional `children` renders an
inner body (e.g. a searchable checkbox list) left-aligned above the footer.
The Cancel action always uses the dark `secondary` treatment and must never have a white fill.

Tokens live in `src/styles.css` as `--confirm-{tone}-{icon|surface|ring}`.

```tsx
<ConfirmDialog
  open={open} onOpenChange={setOpen}
  tone="danger" title="Delete department?"
  description="This action can't be undone."
  cancelLabel="Cancel" confirmLabel="Delete"
  onConfirm={handleDelete}
/>
```

## Standard Popups — every other dialog (DS02)

Any popup that is **not** one of the four toned confirms (success / info /
warning / danger) uses `FormDialog` from `@/components/ui/form-dialog`.
This is the single shape/style for add / edit / form / content dialogs.

Anatomy (fixed):
- Container: `bg-card`, 1px `--border`, radius 16px (`rounded-2xl`), padding 28px, max-height 90vh scrollable
- Header: **bold left-aligned title** (20px, 600) + optional muted description; bare 28px ✕ top-right with no circular fill or border
- Body: left-aligned stack, `gap-5`. Each field uses `Field` + `Input`/`Textarea`/`Select` (36px, radius 8px)
- Footer: Cancel uses the dark `secondary` treatment; Save/Add uses `primary` lavender.
  Cancel must never use `outline`, `outlineSecondary`, or any white-filled treatment in a popup.
- **No-white CTA rule:** no popup or side drawer action may use a white-filled button. Primary actions
  use `primary`; emphasized outlined actions such as **Convert to Issue** use `outline`; cancel, edit,
  attach, and standard secondary actions use `secondary`.
- Toggles (e.g. "Enable …") sit as a full-width row: label left, `Switch` right.
- Close-control distinction: centered popups use the bare 28px ✕. Filters and side drawers keep the compact 24px circular close chip.

Sizes: `sm` (max-w-sm) · `md` (max-w-lg, default) · `lg` (max-w-2xl) · `xl` (max-w-4xl).

```tsx
<FormDialog
  open={open} onOpenChange={setOpen}
  title="Add Job Role"
  cancelLabel="Cancel" submitLabel="Add Job Role"
  onSubmit={handleSave}
>
  <Field label="Job Role Name">
    <Input placeholder="Enter job role name" />
  </Field>
  <Field label="Description" optional>
    <Textarea placeholder="Enter description" />
  </Field>
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium">Enable DOO management for this job role</span>
    <Switch />
  </div>
</FormDialog>
```

## Form Elements (DS02)

## Tables — Row Actions & Pagination (DS02)

**Row actions:** every table row's action cell uses `TableRowActions` from
`@/components/TableRowActions` — two 36px circular buttons on a dark surface
(lavender **Edit-2**, red **Trash**, both Iconsax), hidden until the row is
hovered/focused. Never hand-roll ghost pencil/trash buttons in a table.

```tsx
<TableCell><TableRowActions onEdit={...} onDelete={...} /></TableCell>
```

**Pagination:** every table paginates at 10 rows per page using
`usePagination` + `TablePagination` from `@/components/TablePagination`.
Footer anatomy: `Showing 1 to 10 of 95 items` far-left, page pills right,
chevron prev/next on both ends. Default selected page is **1**.
- Active pill: `bg-[var(--btn-primary-bg)]` lavender square, `text-[var(--btn-primary-fg)]` dark text.
- Inactive pills: `text-foreground` white text, subtle hover background.
- Active chevron: `text-[var(--btn-primary-bg)]` lavender.
- Disabled chevron: `text-muted-foreground` gray.

```tsx
const pager = usePagination(visible);      // 10 per page
{pager.pageItems.map(...)}
<TablePagination {...pager} itemLabel="departments" />
```

Source: Figma · Design System — NERA · Form Elements.
All field states are token-driven in `src/styles.css` (`--field-*`) and applied
globally through `data-ui="control"` (inputs, selects, single-line controls) and
`data-ui="control-text"` (textarea). Never restyle a field with ad-hoc classes.

| State | Rule |
|---|---|
| Default | bg `--field-bg` (#1D1D1F), 1px `--field-border`, radius 8px, height 36px |
| Hover | border `--field-border-hover` |
| Focused | border `--field-border-focus` (lavender) + 3px ring `--field-ring-focus` |
| Filled | bg `--field-bg-filled` = #1D1D1F (auto via `:not(:placeholder-shown)` / `data-filled`) — fill never changes from default |
| Error | `aria-invalid="true"` → red border + red ring, error text `--field-error-fg` |
| Disabled | `disabled` → muted bg, 50% opacity, `not-allowed` cursor |

Mandatory-field validation is always shown inline in both full pages and every
dialog, sheet, or popover. Wrap each validated control in `Field`, pass its
`error`, and let `Field` propagate `aria-invalid` and `aria-describedby` to the
control. Error text uses `role="alert"`. Clear that field's error when its value
changes. Do not use a toast for missing or invalid field values; reserve toasts
for form-level failures and operation outcomes.

Escape hatch: `data-ds-field="off"` on a control opts out of the state styling.

### Field wrapper

`Field` from `@/components/ui/field` is the only approved label/hint/error
anatomy: label (600, 12px) → `(Optional)` tag → info tooltip → control →
hint (`--field-hint-fg`) or error (`--field-error-fg`, replaces the hint).
Use `FieldSuffix` for trailing units (e.g. "Minutes").

```tsx
<Field label="Email" htmlFor="email" required info="Work email" error={err}>
  <Input id="email" placeholder="Option 1" />
</Field>
```

### Multiple selection

`MultiSelectField` from `@/components/ui/multi-select-field` — chips with
per-chip remove, `+N` overflow after 5, clear-all ✕, and the same field states.
