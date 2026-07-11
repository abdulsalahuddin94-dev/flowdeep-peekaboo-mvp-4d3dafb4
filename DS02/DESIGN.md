# DS02 Design System â€” Enterprise PMO (Nexus)

**Version:** DS02.v2.6  
**Last Updated:** 2026-07-08  
**Status:** Active in production  
**Source:** Lovable React codebase (`flowdeep-peekaboo-afe086d6` repo)  
**Latest Commit:** c0a6775 (2026-06-24 12:34 UTC)

---

## 1. Design System Overview

**DS02** is the active design system for the **Nexus Enterprise PMO** platform. It replaced DS01 (teal/dark blue) with a warmer, more professional palette featuring:
- **Golden accent** (#f2c94c) for primary actions and CTAs
- **Lavender sidebar** (#ccc4ec / #A78BFA) for active navigation
- **Dark mode default** with optional light mode toggle
- **Multi-font strategy** (Inter, Poppins, Roboto) for hierarchy and data density
- **Enterprise-grade shadows** for depth and layering

**Design Principles:**
- Data-dense, clean layouts for enterprise users
- Warm, inviting color palette (professional warmth)
- Accessibility-first contrast ratios
- Consistent spacing and rhythm
- Fast, predictable interactions

---

## 2. Typography System

All fonts imported from Google Fonts with strategic role assignment:

### Font Families

| Font | Weights | Use Case | Role |
|------|---------|----------|------|
| **Inter** | 400, 500, 600, 700 | General UI, body text, inputs | Default sans-serif; data-dense views |
| **Poppins** | 400, 500, 600, 700 | Sidebar navigation, labels | Warm, friendly, navigation-heavy areas |
| **Roboto** | 400, 500, 700 | Headings, titles, emphasis | Bold, enterprise authority |
| **SF Pro Text** | System fallback | Platform-specific | iOS/macOS consistency |
| **Anek Gujarati** | Fallback | Gujarati language support | Localization (if needed) |
| **DIN** | Fallback | Technical text | Precise measurements |

### Font Scale

| Element | Font | Size | Weight | Line Height | Letter Spacing |
|---------|------|------|--------|-------------|-----------------|
| **H1 (Page Title)** | Roboto | 32px | 700 | 1.2 | -0.01em |
| **H2 (Section Title)** | Roboto | 24px | 700 | 1.3 | -0.01em |
| **H3 (Subsection)** | Roboto | 20px | 700 | 1.4 | -0.01em |
| **H4 (Card Title)** | Roboto | 18px | 600 | 1.4 | -0.01em |
| **H5 (Small Title)** | Roboto | 16px | 600 | 1.5 | -0.01em |
| **Body (Primary)** | Inter | 14px | 400 | 1.6 | 0em |
| **Body (Secondary)** | Inter | 13px | 400 | 1.6 | 0.02em |
| **Label (Eyebrow)** | Inter | 11px | 700 | 1.4 | 0.1em |
| **Sidebar Nav** | Poppins | 14px | 400â€“600 | 1.5 | 0em |
| **Button CTA** | Inter | 14px | 600 | 1.4 | 0.02em |

### Sidebar Typography Behavior

When sidebar nav item is **hovered (not active):**
- Font weight: 500 (Medium)
- Font family: Poppins

When sidebar nav item is **active:**
- Font weight: 600 (Semibold)
- Font family: Poppins
- Color: #FFFFFF
- Background: #A78BFA (lavender pill)

---

## 3. Color Palette

### Light Mode (Default in :root)

Primary background and text colors when `[data-theme="light"]` or no theme attribute:

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| **Background** | #ffffff | 255, 255, 255 | Page background |
| **Foreground (Text)** | #262626 | 38, 38, 38 | Primary text |
| **Surface** | #f5efeb | 245, 239, 235 | Card backgrounds, subtle surfaces |
| **Card Background** | #f5efeb | 245, 239, 235 | Outlined cards |
| **Card Foreground** | #262626 | 38, 38, 38 | Text on cards |
| **Popover Background** | #ffffff | 255, 255, 255 | Dropdown, tooltip backgrounds |
| **Popover Foreground** | #262626 | 38, 38, 38 | Text in popovers |
| **Primary (Accent)** | #515B92 | 81, 91, 146 | Primary CTA buttons, focus rings |
| **Primary Foreground** | #ffffff | 255, 255, 255 | Text on primary buttons |

### Dark Mode ([data-theme="dark"])

**Status:** This is the preferred default when theme preference is not yet set.

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| **Background** | #121318 | 18, 19, 24 | Page background (dark) |
| **Foreground (Text)** | #ffffff | 255, 255, 255 | Primary text (white) |
| **Surface** | #1c1c24 | 28, 28, 36 | Card backgrounds, subtle surfaces |
| **Card Background** | #1c1c24 | 28, 28, 36 | Outlined cards |
| **Card Foreground** | #ffffff | 255, 255, 255 | Text on cards |
| **Popover Background** | #1c1c24 | 28, 28, 36 | Dropdown, tooltip backgrounds |
| **Popover Foreground** | #ffffff | 255, 255, 255 | Text in popovers |
| **Primary (Accent)** | #DEC9FF | 222, 201, 255 | Primary CTA buttons, focus rings |
| **Primary Foreground** | #1c1c24 | 28, 28, 36 | Text on primary buttons |

### Accent Color (Lavender/Purple)

Used for primary CTAs, active states, focus rings, and hover effects:

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| **Accent** | #515B92 (Blue-Dark) | #DEC9FF (Lavender) | Primary buttons, links, active elements |
| **Accent Foreground** | #FFFFFF | #1C1C24 | Text on accent backgrounds |
| **Accent Dim (Light)** | rgba(81,91,146,0.12) | â€” | Subtle backgrounds, ghost buttons (light mode) |
| **Accent Dim (Dark)** | â€” | rgba(222,201,255,0.15) | Subtle backgrounds, ghost buttons (dark mode) |
| **Accent Glow (Light)** | rgba(81,91,146,0.25) | â€” | Hover states, focus rings (light mode) |
| **Accent Glow (Dark)** | â€” | rgba(222,201,255,0.30) | Hover states, focus rings (dark mode) |

### Sidebar (Always Dark)

Sidebar maintains dark theme regardless of app theme:

| Token | Hex | Usage |
|-------|-----|-------|
| **Sidebar Background** | #1c1c24 | Sidebar main background |
| **Sidebar Foreground** | rgba(255,255,255,0.7) | Text, muted text |
| **Sidebar Primary** | #ccc4ec | Active nav item pill background |
| **Sidebar Primary Foreground** | #1c274c | Text on active nav item |
| **Sidebar Accent** | rgba(255,255,255,0.08) | Hover state background |
| **Sidebar Accent Foreground** | rgba(255,255,255,0.9) | Hover state text |
| **Sidebar Border** | rgba(255,255,255,0.08) | Dividers, subtle borders |
| **Sidebar Ring** | rgba(204,196,236,0.4) | Focus ring on active item |

### Semantic Colors

#### Status (RAG)

| Status | Hex | Usage |
|--------|-----|-------|
| **Green (On Track)** | #10B981 | Success, healthy project status |
| **Amber (At Risk)** | #F59E0B | Warning, attention needed |
| **Red (Critical)** | #EF4444 | Critical issue, urgent action |
| **Blue (Pending)** | #3B82F6 | Information, pending decision |
| **Grey (Paused)** | #64748B | Paused, archived, inactive |

#### Role Colors (Assignment & Identity)

| Role | Hex | Usage |
|------|-----|-------|
| **Executive** | #8B5CF6 | Purple â€” strategic leadership |
| **Director** | #0EA5E9 | Cyan â€” portfolio oversight |
| **Resource Mgr** | #F97316 | Orange â€” resource allocation |
| **Project Mgr** | #10B981 | Green â€” project delivery |
| **Viewer** | #64748B | Slate â€” read-only access |

#### Functional Colors

| Token | Hex | Usage |
|-------|-----|-------|
| **Destructive** | #EF4444 | Delete, reject, critical actions |
| **Destructive Foreground** | #ffffff | Text on destructive backgrounds |
| **Muted** | #e5e5e5 (light) / #292931 (dark) | Disabled, secondary, deprioritized |
| **Muted Foreground** | #737373 | Text on muted backgrounds |
| **Border** | #d4d4d4 (light) / rgba(255,255,255,0.12) (dark) | Dividers, input borders |
| **Input Background** | #ffffff (light) / rgba(255,255,255,0.06) (dark) | Form input backgrounds |
| **Ring** | rgba(242,201,76,0.5â€“0.4) | Focus ring on inputs |

### Shadow System

| Tier | Light Mode | Dark Mode | Usage |
|------|-----------|-----------|-------|
| **sm** | `0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.1)` | `0 1px 3px rgba(0,0,0,0.4)` | Raised buttons, small cards |
| **md** | `0 2px 4px rgba(0,0,0,0.06), 0 4px 6px rgba(0,0,0,0.1)` | `0 4px 12px rgba(0,0,0,0.5)` | Cards, dropdowns |
| **lg** | `0 4px 6px rgba(0,0,0,0.07), 0 10px 15px rgba(0,0,0,0.1)` | `0 8px 32px rgba(0,0,0,0.6)` | Modals, popovers |
| **accent** | `0 7px 8px rgba(81,91,146,0.2)` | `0 7px 8px rgba(222,201,255,0.2)` | Focus glow, special emphasis |

---

## 4. Spacing & Radius System

### Spacing Scale

Tailwind-based spacing (4px base unit):

| Token | Value | Used For |
|-------|-------|----------|
| **sm** | 4px | Tight spacing, borders |
| **md** | 8px | Padding, small gaps |
| **lg** | 10px | Component spacing |
| **xl** | 16px | Section spacing, larger gaps |
| **2xl** | 24px | Major layout spacing |
| **3xl** | 32px | Page padding, large containers |
| **4xl** | 48px | Page margins, hero sections |
| **5xl** | 64px | Extra large spacing |

### Border Radius

| Token | Value | Used For |
|-------|-------|----------|
| **sm** | 4px | Tight corners, small elements |
| **md** | 8px | Standard buttons, inputs |
| **lg** | 10px | Cards, containers |
| **xl** | 16px | Large modals, feature sections |

**Sidebar buttons:** 12px (custom, see Sidebar section)

---

## 5. Component Specifications

### Sidebar (DS02 + TeamSmart Integration)

**Status:** Always dark mode (no light variant)  
**Variants:** Expanded (280px) | Collapsed (122px)

#### Expanded State
- Width: 280px
- Background: #0F1729 (dark blue-black)
- Font: Poppins 14px, 400 weight
- Gap between items: 12px
- Logo/branding: visible at top
- User profile card: visible at bottom
- Item height: 40px
- Border radius: 12px (active pill)
- Padding: 12px horizontal

#### Collapsed State
- Width: 122px
- Background: #0F1729 (same)
- Icons only, no labels (24أ—24px)
- Tooltips on hover
- Gap between items: 28px
- Item height: 40px
- User profile: hidden
- Collapse toggle: ChevronLeft/Right in header

#### Navigation Item States

| State | Background | Text Color | Font Weight | Background | Transition |
|-------|-----------|-----------|------------|------------|------------|
| **Default** | Transparent | #94A3B8 | 400 | â€” | 200ms ease |
| **Hover** | rgba(212,165,116,0.08) | #CBD5E1 | 500 | Golden tint | 200ms ease |
| **Active** | #A78BFA | #FFFFFF | 600 | Lavender pill | 200ms ease |
| **Disabled** | Transparent | #475569 | 400 | â€” | 200ms ease |

#### Sidebar Colors (Key Tokens)

| Token | Hex | Usage |
|-------|-----|-------|
| Background | #0F1729 | Sidebar main background |
| Default text | #94A3B8 | Unselected nav items |
| Hover text | #CBD5E1 | Nav item on hover |
| Active pill | #A78BFA | Active nav item background |
| Active text | #FFFFFF | Active nav item text |
| Hover glow | rgba(212,165,116,0.08) | Subtle golden tint on hover |
| Border/divider | rgba(255,255,255,0.08) | Separators |

#### CSS Classes

```css
.ds02-sidebar { 
  font-family: "Poppins", sans-serif !important; 
  background-color: #0F1729 !important; 
  border-color: rgba(255, 255, 255, 0.08) !important; 
}

.ds02-sidebar [data-sidebar-menu-button] {
  color: #94A3B8;
  font-family: "Poppins", sans-serif;
  font-size: 14px;
  font-weight: 400;
  transition: all 200ms ease;
}

.ds02-sidebar [data-sidebar-menu-button]:hover:not([data-state="active"]) {
  color: #CBD5E1;
  background-color: rgba(212, 165, 116, 0.08);
}

.ds02-sidebar [data-sidebar-menu-button][data-state="active"] {
  background-color: #A78BFA !important;
  color: #FFFFFF !important;
  font-weight: 600;
}

.ds02-sidebar [data-sidebar-footer] {
  border-color: rgba(255, 255, 255, 0.08) !important;
}
```

#### Responsive Behavior
- **Desktop:** Expanded (280px) by default
- **Tablet:** Collapsed (122px) by default
- **Mobile:** Hidden, hamburger menu opens overlay (280px wide)
- **State persistence:** localStorage key `sidebarState`

### Cards (.glass-card)

**Status:** Solid card design (no glassmorphism in DS02)

| Property | Value |
|----------|-------|
| Background | var(--card) |
| Border | 1px solid var(--border) |
| Border Radius | 8px |
| Shadow | var(--shadow-sm) |
| Transition | all 200ms ease |
| Hover Border | var(--accent) golden |
| Hover Shadow | var(--shadow-md) |

### Buttons

#### Primary Button

| Mode | Background | Text | Hover State |
|------|-----------|------|------------|
| **Light** | #515B92 (Blue-Dark) | #FFFFFF | Darker shade + shadow-md |
| **Dark** | #DEC9FF (Lavender) | #1c1c24 | Darker shade + shadow-md |

**Common properties:**
- Font: Inter 14px, 600 weight
- Padding: 10px 16px
- Border Radius: 8px
- Shadow: var(--shadow-sm)
- Transition: 200ms ease
- Hover: Accent glow from shadow-sm â†’ shadow-md

#### Secondary Button
- Background: var(--surface)
- Border: 1px solid var(--border)
- Text: var(--foreground)
- Font: Inter 14px, 600 weight
- Padding: 10px 16px
- Border Radius: 8px

#### Ghost Button
- Background: Transparent
- Border: 1px solid var(--border)
- Text: var(--foreground)
- Hover: Background lightened by 5%

### Inputs

- Font: Inter 14px, 400 weight
- Padding: 8px 12px
- Border: 1px solid var(--border)
- Border Radius: 8px
- Background: var(--input)
- Focus Ring: var(--ring) golden
- Placeholder: var(--muted-foreground)
- Transition: 200ms

### Data Table (StyledTable Component)

**Status:** Standardized across all tables (v2.6+)

#### Implementation
Use the reusable `StyledTable` component for consistent styling across the app:

```tsx
import { 
  StyledTable, 
  StyledTableHeader, 
  StyledTableBody, 
  StyledTableHeaderRow, 
  StyledTableRow, 
  StyledTableCell, 
  StyledTableHead 
} from "@/components/StyledTable";

<StyledTable>
  <StyledTableHeader>
    <StyledTableHeaderRow>
      <StyledTableHead>Column 1</StyledTableHead>
      <StyledTableHead>Column 2</StyledTableHead>
    </StyledTableHeaderRow>
  </StyledTableHeader>
  <StyledTableBody>
    <StyledTableRow>
      <StyledTableCell>Data</StyledTableCell>
      <StyledTableCell>Data</StyledTableCell>
    </StyledTableRow>
  </StyledTableBody>
</StyledTable>
```

#### Styling Details
- **Header Row:** `hover:bg-transparent bg-transparent border-0` (no background on hover)
- **Data Row:** `bg-[#1D1D23] hover:bg-[#252530] border-0` (dark row, slightly lighter on hover)
- **Font:** Inter 13px for content, 14px for headers
- **Cell Padding:** 12px
- **Borders:** None (border-0)
- **Row Height:** Auto, content-driven

#### Color Values
- **Row Background:** #1D1D23 (dark table row color)
- **Row Hover:** #252530 (slightly lighter shade)
- **Header Background:** Transparent (inherits page background)

#### Accessibility
- Rows clearly distinguished by dark background
- High contrast between text and background (WCAG AAA)
- Keyboard navigation supported via standard table semantics

---

## 6. Dark/Light Mode Toggle

### Implementation

The theme is controlled via the `data-theme` attribute on the `<html>` element:

```html
<!-- Dark Mode (Default) -->
<html data-theme="dark" class="dark">

<!-- Light Mode -->
<html data-theme="light">
```

**Default:** `data-theme="dark"` is set on page load via `__root.tsx`

### Storage

User's theme preference is persisted to localStorage under the key `theme`:
- `"light"` â†’ Light mode enabled
- `"dark"` â†’ Dark mode enabled
- Missing/null â†’ System default (dark)

### Toggle Behavior

The dark/light toggle button is located in the **AppTopbar** (top-right corner, before user menu):
- Icon: Sun (light mode) / Moon (dark mode)
- Click: Toggles theme and updates localStorage
- Refresh: Theme persists across page reloads
- Initial load: If `localStorage.theme === "light"`, apply light mode; else default to dark

### CSS Custom Variant

```css
@custom-variant dark (&:not([data-theme="light"] *));
```

This inverts the typical Tailwind `dark:` behavior:
- **Without `data-theme="light"`:** dark utility applies (default)
- **With `data-theme="light"`:** dark utility does NOT apply

### Light Mode Only (No Dark Variant)

- **Sidebar:** Always #1c1c24 (never changes to light)
- All other components: Switch colors per light/dark palette

---

## 7. Animation & Interaction

### Transition Durations

| Duration | Usage |
|----------|-------|
| 100ms | Quick state changes (focus, hover) |
| 200ms | Standard transitions (color, shadow, position) |
| 300ms | Modal/overlay slides |
| 500ms | Page transitions, expansions |

### Easing

Primary easing: `ease` (cubic-bezier(0.25, 0.46, 0.45, 0.94))

### Pulse Animation

```css
.pulse-dot {
  animation: ragpulse 1.5s ease-in-out infinite;
}

@keyframes ragpulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.6; transform: scale(1.3); }
}
```

Used for: Live indicators, real-time status dots, notification badges

### Motion Principles

- **Feedback:** Hover states provide immediate visual feedback
- **Predictability:** All transitions use consistent timing
- **Restraint:** Animations enhance, not distract
- **Accessibility:** All animations respect `prefers-reduced-motion`

---

## 8.5 Scrollbar Styling (DS02)

### Implementation

Scrollbars are themed to match the active design system and respond to dark/light mode:

#### Firefox (CSS)
```css
* {
  scrollbar-width: thin;
  scrollbar-color: color-mix(in oklab, var(--accent) 55%, transparent) transparent;
}
```

#### WebKit / Chromium (CSS)
```css
*::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}
*::-webkit-scrollbar-track {
  background: transparent;
}
*::-webkit-scrollbar-thumb {
  background: color-mix(in oklab, var(--accent) 45%, transparent);
  border-radius: 9999px;
  border: 2px solid transparent;
  background-clip: padding-box;
  transition: background 200ms ease;
}
*::-webkit-scrollbar-thumb:hover {
  background: var(--accent);
  background-clip: padding-box;
  border: 2px solid transparent;
}
*::-webkit-scrollbar-corner {
  background: transparent;
}
```

### Tabs Component (Active Styling Pattern)

**Active Tab Styling (Border-Bottom Underline Pattern):**

The tabs component now uses a consistent accent-colored underline across all pages:

```css
/* Applied to all page tabs: Portfolio, Pipeline, Clients & Vendors, Organization, Procurement, Resources, Risks, Financials, Settings */
.tabs-trigger[data-state=active] {
  border-b-2: border-accent;          /* Underline with accent color */
  text-color: text-foreground;        /* Standard text, not inverted */
  font-weight: font-medium;           /* Slightly bold */
}
```

**Inactive Tab:**
- Text: `text-muted-foreground` (gray)
- Border: Transparent
- Hover: `text-foreground`

**Implementation in Component:**
- TabsList: `border-b border-border` (base border line)
- TabsTrigger: `border-b-2 border-transparent` (no border by default)
- Active: `data-[state=active]:border-accent data-[state=active]:text-foreground`

**Consistency:** v2.3 applies this pattern uniformly across 10 route files and 20+ tabs for visual continuity.

### Sidebar Scrollbar (Special)

Sidebar always dark, so scrollbar uses light colors:

```css
.ds02-sidebar *::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.18);
  background-clip: padding-box;
  border: 2px solid transparent;
}
.ds02-sidebar *::-webkit-scrollbar-thumb:hover {
  background: rgba(255,255,255,0.32);
  background-clip: padding-box;
  border: 2px solid transparent;
}
.ds02-sidebar * {
  scrollbar-color: rgba(255,255,255,0.18) transparent;
}
```

### Scrollbar Behavior

| State | Light Mode | Dark Mode |
|-------|-----------|-----------|
| **Default thumb** | Accent color 45% opacity | Accent color 45% opacity |
| **Hover thumb** | Full accent color | Full accent color |
| **Sidebar thumb** | rgba(255,255,255,0.18) | rgba(255,255,255,0.18) |
| **Sidebar hover** | rgba(255,255,255,0.32) | rgba(255,255,255,0.32) |
| **Transition** | 200ms ease | 200ms ease |

---

## 8. Accessibility

### Contrast Ratios (WCAG 2.1)

| Element | Light Mode | Dark Mode | Standard |
|---------|-----------|-----------|----------|
| **Text on Background** | #262626 on #ffffff | #ffffff on #121318 | 4.5:1 (AA) |
| **Golden on Dark** | #f2c94c on #121318 | #f2c94c on #121318 | 4.8:1 (AAA) |
| **Sidebar Active** | #1c274c on #A78BFA | #1c274c on #A78BFA | 6.2:1 (AAA) |
| **Muted Text** | #737373 on #ffffff | #737373 on #121318 | 4.5:1 (AA) |

### Focus States

- **Outline:** 2px solid var(--ring) (golden) with 2px offset
- **Visible:** Always visible, never hidden
- **Keyboard navigation:** Full support, consistent tab order

### Color Alone Not Sufficient

- RAG status conveyed with color + icon + text label
- Links underlined or contextually obvious
- Buttons have text labels, not icons alone

---

## 9. Responsive Breakpoints

| Breakpoint | Width | Sidebar | Layout |
|------------|-------|---------|--------|
| **Mobile** | < 640px | Hidden (hamburger overlay) | Single column |
| **Tablet** | 640pxâ€“1024px | Collapsed (122px) | 2-column grid max |
| **Desktop** | â‰¥ 1024px | Expanded (280px) | Full multi-column layouts |

---

## 10. Component Library Status

### Implemented Components

- âœ… **AppSidebar** â€” Navigation, theme-integrated, collapsible
- âœ… **AppTopbar** â€” Header, search, theme toggle, user menu
- âœ… **Cards** (.glass-card) â€” Solid design, hover effects
- âœ… **Buttons** â€” Primary, secondary, ghost variants
- âœ… **Inputs** â€” Text, select, multi-select, date picker
- âœ… **Tables (StyledTable)** â€” Standardized data table, dark row backgrounds, sortable, filterable
- âœ… **Modals** â€” Dialogs, sheets, popovers
- âœ… **Badges/Tags** â€” Status, role, classification chips
- âœ… **Progress Bars** â€” RAG status, utilization, burn charts
- âœ… **Tiles/Stats** â€” KPI cards, metrics, live updates

### Shared Components (from product-spec)
- `Tile` â€” KPI card wrapper
- `Stat` â€” Metric display
- `MiniStat` â€” Compact metric
- `HealthBar` â€” Status bar (RAG color-coded)
- `useLiveSummary()` hook â€” Real-time data updates

---

## 11. File References

### Source Files (Lovable)

| File | Purpose | Last Updated |
|------|---------|--------------|
| `src/styles.css` | Global CSS, DS02 tokens, theme variables, header/sidebar tokens | 2026-06-24 |
| `src/components/AppSidebar.tsx` | Sidebar component, token-driven architecture (refactored) | 2026-06-21 |
| `src/components/AppTopbar.tsx` | Header, theme toggle, search, new header tokens | 2026-06-21 |
| `src/components/ui/tabs.tsx` | Tabs component, accent border styling | 2026-06-21 |
| `src/components/ui/switch.tsx` | Switch/toggle component, visibility improvements | 2026-06-24 |
| `src/components/ProjectSchedule.tsx` | Project schedule view, right-click actions, export features, health logic | 2026-06-24 |
| `src/routes/__root.tsx` | Root layout, theme provider, data-theme sync | 2026-06-21 |
| `src/routes/portfolio.$projectId.tsx` | Project detail page, right-click action support | 2026-06-24 |
| `src/routes/*.tsx` | All route pages, TabsTrigger consistency update | 2026-06-21+ |

### Design Documentation

| File | Purpose | Last Updated |
|------|---------|--------------|
| `product-spec.md` | Master design specification (v14) | 2026-06-17 |
| `product-spec-patch-v14.md` | DS02 Sidebar changes | 2026-06-17 |
| `product-spec-patch-v13.md` | DS02 system implementation | 2026-06-17 |

---

## 12. Changelog

### DS02.v2.6 (2026-07-08)

**Standardized Table Styling + StyledTable Component**

- **StyledTable Component:** New reusable table component for consistent styling across app
  - Dark row backgrounds (#1D1D23) with hover state (#252530)
  - Transparent header rows (no background)
  - No borders, clean data-dense appearance
  - Replaces inline table styling throughout the codebase
- **Unified Table Styling:** Applied to all 6 route files
  - Updated: financials.tsx, resources.tsx, portfolio.index.tsx, portfolio.$projectId.tsx, organization.tsx, clients-vendors.tsx
  - Both MVP and Full editions synchronized
  - 6 routes أ— 2 editions = 12 files updated
- **Design System Documentation:** Added StyledTable section to DESIGN.md
  - Usage examples and component API
  - Color values and accessibility guidelines
  - Recommended for all new tables going forward
- **No Outer Containers:** Removed glass-card wrappers around tables
  - Table rows are now the visual container themselves
  - Cleaner visual hierarchy, less visual noise
  - Better alignment with modern data table design patterns

**Files Updated:**
- `src/components/StyledTable.tsx` (new) â€” MVP & Full
- All route files with tables (12 total: 6 files أ— 2 editions)
- `DS02/DESIGN.md` â€” Added table specifications, component docs, changelog entry

**Component Library Impact:**
- âœ… New reusable component reduces code duplication
- âœ… Consistent table styling across all pages
- âœ… Easier to maintain and update table appearance globally
- âœ… Foundation for future table enhancements (sorting, filtering, pagination)

### DS02.v2.5 (2026-06-24)

**Calendar Component + Planned vs Actual Progress + UI Refinements**

- **Calendar Component:** New shadcn Calendar popover added to Organization module
  - Date picker with popover display
  - Calendar events integrated with project schedule
  - Responsive month/week view selectable
  - Integration with existing event data from mock-data.ts
- **Planned vs Actual Progress Tracking:** Implemented dual-axis progress visualization
  - Stacked progress bars showing planned vs actual completion
  - Visual comparison for scope tracking and forecasting
  - Color-coded indicators (planned: one color, actual: contrasting color)
  - Applied to ProjectSchedule and portfolio detail pages
- **Stacked Progress Bar Component:** New visual component for layered progress display
  - Shows overlaid progress indicators (84 lines in ProjectSchedule)
  - Better data density for project health visibility
- **Modal Bar Styling Updates:** Enhanced modal elements
  - Updated modal bar colors for better visual hierarchy
  - Adjusted width and padding for improved UX
  - Better contrast with DS02.v2.4 color palette
- **Field Renaming & Dialog Updates:** 
  - "Business lines" field renamed across dialogs for consistency
  - Dialog labels updated by scope (intake, portfolio, project-level)
  - Progress scope indicator refined in dialogs
- **Organization Module Expansion:** (152 lines added)
  - Calendar tab fully integrated
  - Event data connected to projects
  - Responsive calendar popover on date selection

**UI Components Updated:**
- Organization.tsx â€” Major refactor, 201 lines (Calendar tab: 152 + popover: 79)
- ProjectSchedule.tsx â€” Progress visualization (126 lines: stacked bars 57 + planned/actual 109)
- portfolio.$projectId.tsx â€” Calendar integration and progress bars (329 lines)
- portfolio.index.tsx â€” Calendar support (15 lines)
- projects-store.tsx â€” Calendar state management (18 lines)
- mock-data.ts â€” Calendar event data (47 lines)

### DS02.v2.4 (2026-06-24)

**Project Schedule Enhancements + Right-Click Actions + Export Features**

- **Right-Click Context Menu:** Added contextual actions to ProjectSchedule and portfolio pages
  - Quick actions available via right-click on task/project rows
  - Enhanced user interaction for common operations
- **Export Features:** New export functionality in ProjectSchedule component
  - Updated export formats (multiple format options)
  - Export-related logic added to schedule operations
- **Project Health Logic:** Added health status calculations and indicators
  - Health status displayed in schedule views
  - Dynamic updates based on project metrics
- **Toggle Visibility Fix:** Fixed switch component toggle visibility
  - UI/switch.tsx updated for proper toggle display
  - Improved visibility on both light and dark modes
- **ProjectSchedule Expansion:** Major component refactor (303 lines added)
  - 72+ lines for right-click actions
  - 144+ lines for export & health logic
  - 94+ lines for export format updates
- **Portfolio Page Updates:** Enhanced with right-click action support (140 lines)

**UI Components Updated:**
- ProjectSchedule.tsx â€” Major refactor with new features
- portfolio.$projectId.tsx â€” Right-click actions integration
- ui/switch.tsx â€” Toggle visibility improvements
- Dependency updates (bun.lock, package.json)

### DS02.v2.3 (2026-06-21)

**TabsTrigger Consistency + AppSidebar Refactoring + Token Architecture**

- **Tabs Styling Consistency:** Applied accent color borders to all TabsTriggers across 10 route pages
  - Portfolio, Pipeline, Clients & Vendors, Organization, Procurement, Resources, Risks, Financials, Settings
  - Pattern: `data-[state=active]:border-accent data-[state=active]:text-foreground`
- **AppSidebar Refactoring:** Simplified component logic, removed inline styles
  - Now uses CSS tokens exclusively: `var(--sidebar-*)`, no hex/rgba literals
  - Reduced code from 201 lines to ~130 lines (cleaner, more maintainable)
- **Color Tokens Expansion:** All route pages refactored to use CSS custom properties
  - Sidebar: `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-accent`, etc.
  - Header: `--header`, `--header-foreground`, `--header-border`
  - Cards: Using base tokens with theme variables
- **Bottom Navigation:** Expanded to full page width for better mobile/tablet experience
- **Dark/Light Mode Sync:** Improved data-theme persistence in localStorage
- **Header & Card Colors:** Refined contrast and color matching for visual consistency

### DS02.v2.2 (2026-06-21)

**Tabs Redesign + Token-Driven Architecture**

- **Tabs Active Style:** Changed from `data-[state=active]:bg-accent` (pill background) to `data-[state=active]:border-accent` (underline border-bottom)
- **TabsTrigger base:** Now uses bottom-border underline pattern instead of background highlight
- **Active Tab Styling:**
  - Border: `border-b-2 border-accent` (accent-colored underline)
  - Text: `text-foreground` (standard text color, not inverted)
  - Hover: `text-foreground` (darker on hover)
- **Token-Driven Refactoring:**
  - **Sidebar:** All colors from CSS `--sidebar-*` tokens (no hex literals)
  - **Badges:** New tokens `--sidebar-badge-bg` / `--sidebar-badge-fg` / `--sidebar-badge-danger-bg` / `--sidebar-badge-danger-fg`
  - **Header:** New tokens `--header`, `--header-foreground`, `--header-border`
- **All Tabs Updated:** Portfolio, Pipeline, Clients & Vendors, Organization, Procurement, Resources, Risks, Financials, Settings
- **Reduced Hardcoded Colors:** AppSidebar refactored to use tokens exclusively (per comment: "Do NOT add hex/rgba literals")

### DS02.v2.1 (2026-06-21)

**Scrollbar Styling + Dark Mode Default**

- **Themed Scrollbars:** Added Firefox (scrollbar-width/color) and WebKit (::-webkit-scrollbar) styling
- **Scrollbar colors:** Accent-based in main content, light-themed in sidebar
- **Dark Mode Default:** `data-theme="dark"` now set by default on page load in __root.tsx
- **Scrollbar hover:** 200ms ease transition with full accent color on hover
- **Sidebar scrollbars:** Always light colors (rgba(255,255,255,0.18â€“0.32)) for dark sidebar visibility

### DS02.v2 (2026-06-21)

**Primary CTA Button Color Update â€” Lavender/Purple Theme**

- **Light Mode Primary CTA:** Changed from #f2c94c (golden) â†’ #515B92 (blue-dark)
- **Dark Mode Primary CTA:** Changed from #f2c94c (golden) â†’ #DEC9FF (lavender)
- Updated primary button hover states and glow effects
- Updated shadow-accent tokens to lavender glows
- Maintains lavender sidebar active pill (#A78BFA) consistency
- All focus rings, CTAs, and primary actions now use new color scheme
- Figma components updated with new button colors

### DS02.v1 (2026-06-21)

**Initial consolidated documentation of DS02 design system**

- Replaced DS01 (teal #51CAAD) with DS02 (golden #f2c94c) â†گ *deprecated in v2*
- Documented multi-font strategy (Inter/Poppins/Roboto)
- Sidebar: dark-only with lavender active pill (#A78BFA)
- Dark mode default, light mode optional toggle
- Shadow system expanded for depth
- Accessibility audit completed (WCAG 2.1 AA/AAA)
- Component library fully typed and documented

**Previous Versions:**
- **DS01** (Sessions 1â€“25) â€” Teal accent (#51CAAD), Outfit font, simpler shadow system
  - Deprecated: 2026-06-17

---

## 13. Design System Usage Guidelines

### For Designers (Figma)

1. **Color tokens:** Use CSS variable names, not hardcoded hex values
2. **Font families:** Respect role assignment (Roboto for titles, Inter for body, Poppins for nav)
3. **Sidebar:** Always export/design dark mode; light mode applies to rest of UI only
4. **Spacing:** Use 4px base unit grid for all padding/margins
5. **Shadows:** Use only sm/md/lg/accent tokens, never custom shadow values

### For Developers (React/Tailwind)

1. **Theme toggle:** Respect user's localStorage `theme` preference
2. **Sidebar state:** Persist expanded/collapsed to localStorage `sidebarState`
3. **Focus management:** Use golden ring (`var(--ring)`) on all interactive elements
4. **Font application:** Use `font-family` CSS var in component styles, not hardcoded
5. **Color tokens:** Use Tailwind custom properties, not hex values directly

### For QA / Testing

1. **Light/Dark:** Test all pages in both themes
2. **Sidebar:** Verify expand/collapse on all breakpoints
3. **Accessibility:** Check focus states, contrast ratios, keyboard navigation
4. **Responsive:** Test sidebar hiding on mobile, collapse on tablet
5. **Persistence:** Refresh pageâ€”theme and sidebar state should persist

---

## 14. Token-Driven Architecture (DS02.v2.2+)

All colors are now managed via CSS custom properties. **No hardcoded hex/rgba values should appear in component code.**

### CSS Token Categories

#### Base Tokens (Light/Dark modes)
- `--background`, `--foreground`
- `--surface`, `--card`, `--card-foreground`
- `--primary`, `--primary-foreground`
- `--accent`, `--accent-foreground`, `--accent-dim`, `--accent-glow`

#### Header Tokens
- `--header` â€” Header background
- `--header-foreground` â€” Header text
- `--header-border` â€” Header divider line

#### Sidebar Tokens
- `--sidebar` â€” Sidebar background
- `--sidebar-foreground` â€” Sidebar text
- `--sidebar-muted` â€” Muted text
- `--sidebar-primary` â€” Active state background (lavender)
- `--sidebar-primary-foreground` â€” Active state text
- `--sidebar-accent` â€” Hover state background
- `--sidebar-accent-foreground` â€” Hover state text
- `--sidebar-border` â€” Dividers
- `--sidebar-badge-bg` / `--sidebar-badge-fg` â€” Normal badges
- `--sidebar-badge-danger-bg` / `--sidebar-badge-danger-fg` â€” Danger badges (red)

### How to Update Colors

To change Sidebar, Header, or Card colors: **Edit CSS variables in `styles.css` only.**

â‌Œ **Wrong:** Adding inline colors in `AppSidebar.tsx`  
âœ… **Right:** Updating `--sidebar-*` tokens in `:root` and `[data-theme="dark"]` blocks

Example:
```css
:root {
  --sidebar-primary: #lavender-hex;  /* Change here */
}

[data-theme="dark"] {
  --sidebar-primary: #lavender-hex;  /* Change here */
}
```

Then use in component:
```tsx
<span className="bg-sidebar-primary text-sidebar-primary-foreground">
  Active Item
</span>
```

---

## 15. Future Roadmap

### Planned (TBD)

- [ ] Token export to design tokens file (tokens.json / design-tokens.yml)
- [ ] Figma plugin for auto-sync with React Tailwind config
- [ ] Dark mode optimized images/illustrations (current: brightness adjusted)
- [ ] Motion design specs for micro-interactions (currently basic transitions)
- [ ] High contrast mode override for accessibility compliance (WCAG 2.2)
- [ ] Arabic (RTL) theme adjustments for proper text direction

---

**End of DS02 Design System Documentation**

Questions or updates? Reference the `product-spec.md` file or review the latest `styles.css` in the Lovable repository.
