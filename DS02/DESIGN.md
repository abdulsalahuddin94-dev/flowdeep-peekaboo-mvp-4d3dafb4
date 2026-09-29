# DS02 Design System — Enterprise PMO (Nexus)

**Version:** DS02.v3.11  
**Last Updated:** 2026-09-29  
**Status:** Active in production (Complete & Production-Ready)  
**Structure:** Primitives (110: 85 colors + 25 dimensions) → Semantic (77: Light & Dark modes)  
**Total Tokens:** 187 Figma variables, zero broken references, 100% WCAG 2.1 AA/AAA accessible  
**Source of Truth:** `D:\Work\Abdulrahman\TrianglZ\PMO\DS02\design-tokens.json` (DTCG format)  
**Integration:** Figma ↔ Lovable (Full & MVP) fully synced, Dark/Light modes production-tested  
**Latest Changes:** Shadow values optimized for Dark mode contrast, RAG status colors verified across both themes

---

## Overview

**DS02** is a **Tailwind-aligned design system** for Nexus Enterprise PMO with two layers:

1. **Primitives** — Raw design tokens (color families, spacing, typography)
2. **Semantic** — Meaningful tokens built from primitives (surface, text, status, accent)

**Design Principles:**
- Data-dense, clean layouts for enterprise users
- Warm, professional color palette
- Accessibility-first (WCAG 2.1 AA/AAA)
- Consistent spacing and rhythm
- Dark mode default, light mode optional
- Token-driven, no hardcoded colors

---

## 1. Color System

### Status Colors (RAG) — Production Verified

All RAG status colors are consistent across Light & Dark modes for universal legibility:

| Status | Color | Hex | Usage |
|--------|-------|-----|-------|
| **Success** (On Track) | Emerald | #10B981 | Healthy projects, green status |
| **Warning** (At Risk) | Amber | #F59E0B | At-risk projects, yellow status |
| **Danger** (Critical) | Red | #EF4444 | Off-track projects, red status |
| **Info** (Pending) | Blue | #3B82F6 | New/pending, blue status |
| **Grey** (On Hold) | Slate | #64748B | Inactive/archived, grey status |

### Indicator Colors (KPI Visualization)

**Revenue Indicator** — Teal family (same on light & dark backgrounds):
| Variant | Hex | Usage |
|---------|-----|-------|
| Revenue-Light | #7FD9C4 | Hover states, light emphasis |
| Revenue (Primary) | #51CAAD | Main revenue indicator |
| Revenue-Dark | #2A9F82 | Dark emphasis, selected |

---

## 2. Typography

#### Font Families
| Family | Weight | Use Case |
|--------|--------|----------|
| Poppins | 400, 500, 600, 700 | Universal default, sidebar, navigation |
| Courier New | monospace | Code, technical text |

#### Font Sizes
| Token | Size | Line Height | Letter Spacing |
|-------|------|-------------|-----------------|
| xs | 11px | 1.4 | 0.1em |
| sm | 13px | 1.6 | 0.02em |
| base | 14px | 1.6 | 0em |
| md | 14px | 1.6 | 0.02em |
| lg | 16px | 1.5 | 0em |
| xl | 18px | 1.4 | -0.01em |
| 2xl | 20px | 1.4 | -0.01em |
| 3xl | 24px | 1.3 | -0.01em |
| 4xl | 32px | 1.2 | -0.01em |

---

## 3. Spacing Scale

4px base unit, Tailwind-aligned:

| Token | Value |
|-------|-------|
| xs | 2px |
| sm | 4px |
| md | 8px |
| lg | 12px |
| xl | 16px |
| 2xl | 24px |
| 3xl | 32px |
| 4xl | 48px |
| 5xl | 64px |

---

## 4. Border Radius

| Token | Value |
|-------|-------|
| sm | 4px |
| md | 8px |
| lg | 10px |
| xl | 16px |

---

## 5. Shadows

| Context | Light Mode | Dark Mode |
|---------|---|---|
| **Shadow SM** | 0 1px 2px rgba(0,0,0,0.06) | 0 1px 3px rgba(0,0,0,0.4) |
| **Shadow MD** | 0 2px 4px rgba(0,0,0,0.06) | 0 4px 12px rgba(0,0,0,0.5) |
| **Shadow LG** | 0 4px 6px rgba(0,0,0,0.07) | 0 8px 32px rgba(0,0,0,0.6) |
| **Shadow Accent (Light)** | 0 7px 8px rgba(81,91,146,0.2) | — |
| **Shadow Accent (Dark)** | — | 0 7px 8px rgba(222,201,255,0.2) |

---

## 6. Implementation

All semantic tokens defined in `src/styles.css` with Tailwind integration.

**Usage in Components:**

```tsx
<button className="bg-accent text-accent-foreground shadow-sm">
  Save
</button>
```

---

## 7. Theme Switching

Theme controlled via `data-theme` attribute on `<html>`:

```html
<!-- Dark Mode (Default) -->
<html data-theme="dark">

<!-- Light Mode -->
<html data-theme="light">
```

---

## 8. Changelog

### DS02.v3.11 (2026-09-29)
- **Schedule tables:** row actions (burger menu) live in a dedicated narrow actions column that appears only on hover — overlays must never cover data cells; the Financial Link chip itself is clickable and opens its link dialog.
- **Portfolio cards:** progress shows `Actual % / Planned %` with a planned marker on the bar (planned is time-derived, never stored).

### DS02.v3.10 (2026-09-28)
**Interaction and Status Improvements**
- Revenue Breakdown derives Overdue from expected dates and collection progress; its final Status cell swaps the pill for row actions on hover.
- Risk and Issue detail drawers support editing comments through the existing status-update popup and deleting comments through a confirmation popup.
- Risk & Issues KPI summaries present the complete severity distribution: Critical, High, Medium, and Low.

### DS02.v3.9 (2026-09-27)
**Module Alignment — Approvals**
- Approvals now follows the standard module anatomy: shared page header, search and filter drawer, semantic data table, fully rounded pills, status-to-actions hover behavior, pagination, and row-opened detail drawer.
- Approval and rejection use the shared form-dialog pattern; rich request context remains in a right-side drawer according to the Modal vs Drawer decision rule.

### DS02.v3.8 (2026-09-22)
**Shape Rule — Badges are fully rounded pills**
- Every badge, tag, chip, and status indicator is a fully rounded pill: `rounded-full`, height 28px (`h-7`), `px-3`, `text-xs font-medium`, 1px border.
- Rounded rectangles (`rounded-sm` / `rounded-md`) are no longer allowed for badges; the rule is encoded in the shared `Badge` component so all future badges inherit it.
- Aligns all modules with the Organization module status-pill treatment.

### DS02.v3.7 (2026-09-22)
**Display Rule — Calendar Dates**
- Standardized every user-visible date with a year as `DD MMM, YYYY` (for example `22 Sep, 2026`) and without a year as `DD MMM` (for example `22 Sep`).
- Requires zero-padded days and English three-letter month abbreviations while preserving ISO `YYYY-MM-DD` for storage, calculations, routing, filtering, and native date controls.
- Exempts relative time and period-only labels; implementation uses the shared presentation helpers in `src/lib/date-format.ts`.

### DS02.v3.6 (2026-09-22)
**Interaction Rule — Modal vs Drawer Decision Rule**
- Documented the official overlay-container decision rule (see root `DESIGN.md` → "Overlays — Modal vs Drawer Decision Rule"): choose container by task type, not habit. Modal = short decisive task that must block context; Drawer = rich read/edit detail that keeps the source list visible.
- Establishes system consistency as consistency of task type, not container shape (Calendar Add Event modal vs Risk view drawer are not inconsistent).

### DS02.v3.5 (2026-07-26)
**Documentation Update — Live Standards Sync**
- Updated Shadow values for Dark mode
- Documented RAG status colors as production-verified
- Added Status/Grey (On Hold) indicator
- Updated typography to Poppins universal default
- Verified Indicator/Revenue colors work on both themes

### DS02.v3.4 (2026-07-22)
**Complete Rebuild from design-tokens.json**
- Created 110 Primitive variables + 77 Semantic variables
- design-tokens.json established as Source of Truth (DTCG format)
- All 187 variables synced to Figma, zero broken aliases

---

**End of DS02 Design System Documentation (v3.10) — MVP Edition**
