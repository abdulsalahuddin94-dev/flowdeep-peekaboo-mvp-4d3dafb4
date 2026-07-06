# Nexus PMO — MVP Edition (PMO-MVP)

## 🎯 Project Overview

**Nexus PMO MVP** is a **Minimal Viable Product** with 6 essential modules for portfolio management. This is the lean version designed to prove core flow quickly.

There's also a **PMO-Full** (complete edition) with all 13 modules that syncs shared components with this MVP.

---

## 📋 MVP Modules (6 Essential)

1. **Dashboard** — Role-adaptive home (core KPIs, quick actions)
2. **Portfolio** — Project portfolio + project detail pages
3. **Resources** — Resource capacity planning & allocation
4. **Clients & Vendors** — Master data management
5. **Financials** — Budget tracking & burn rates
6. **Organization** — Business lines, departments, calendars

### ❌ Not in MVP (shipped in Full later):
- Pipeline (commercial forecasting)
- Risk & Issues (RAID log)
- Reports
- Procurement
- Settings & Admin
- Roles & Permissions Manager
- Help & Docs

---

## 🔄 Synced with PMO-Full

These 6 modules are **shared** with the Full edition:
- Changes made here automatically propagate to Full
- Single source of truth for core portfolio logic
- Shared components, types, utilities

**Why?** Reduces duplication, ensures consistency, allows MVP to drive quality of core features.

---

## 📁 Project Structure

```
src/
├── routes/                    # 6 module entry points (MVP only)
│   ├── index.tsx             # Dashboard (core only)
│   ├── portfolio.index.tsx    # Portfolio list
│   ├── portfolio.$projectId.tsx  # Project detail
│   ├── financials.tsx        # Financials
│   ├── resources.tsx         # Resources
│   ├── clients-vendors.tsx   # Clients & Vendors
│   └── organization.tsx      # Organization
│
├── components/
│   ├── ProjectSchedule.tsx   # Milestone/task scheduling (shared with Full)
│   ├── ProjectGantt.tsx      # Gantt chart (shared with Full)
│   ├── RagBadge.tsx          # Status indicators (shared)
│   └── [other shared]        # All shared with Full edition
│
└── lib/
    ├── mock-data.ts         # Mock projects, resources, etc.
    ├── projects-store.ts    # Global state (milestones, notifications)
    └── [utilities]
```

---

## 🎨 Design System (DS02.v2.5)

| Token | Value |
|---|---|
| **Primary BG** | `#0B1120` (dark, default) / `#FFFFFF` (light) |
| **Accent** | `#D4A574` (golden) |
| **Secondary** | `#94A3B8` → `#CBD5E1` (gradient) |
| **Sidebar BG** | Always dark (no light variant) |
| **Active state** | Lavender `#A78BFA` (nav pills) |
| **Typography** | Poppins (sidebar), Inter (body) |

---

## 🛠 Tech Stack

- **Framework:** React 18 + TypeScript
- **Routing:** TanStack Router
- **Styling:** Tailwind CSS + shadcn/ui
- **State:** Zustand (projects-store, notifications)
- **Icons:** lucide-react
- **Toasts:** sonner
- **Bilingual:** English + Arabic (RTL support)

---

## 🚀 Getting Started

```bash
npm install
npm run dev
```

Visit `http://localhost:5173` → Dashboard loads with role selector

---

## 📊 MVP Features

### Portfolio Module
- **Portfolio Overview** — Active projects, RAG health, budget summary
- **Project Detail** — Core tabs:
  1. Overview
  2. Project Charter
  3. Project Schedule (Milestone + Task planning)
  4. Team & Allocation
  5. Financials
  6. Documents
  7. Status Reports
  8. Lessons Learned

(Note: Not all 13 tabs; focused on essential PM activities)

### Project Schedule
- **Milestone & Task management** with dependencies (FS/SF/SS/FF)
- **Approval workflows** — Requires approval + approvers
- **Progress tracking** — Planned vs actual
- **MS Project XML import** — Drag-and-drop compatibility

### Resources Module
- **Capacity planning** — Utilization heatmap
- **Requests** — Pending/Fulfilled groups
- **Excel import** — Bulk resource upload

### Financials Module
- **Budget overview** — Spending, burn rate
- **By-Project table** — Year filter, revenue, margin
- **CapEx/OpEx summary** — Spend breakdown

### Organization Module
- **Master data** — Business lines, departments
- **Calendar** — Organization-wide events

---

## 🔗 Dual-Track Setup

**PMO-MVP repo:** `flowdeep-peekaboo-mvp` (this one)  
**PMO-Full repo:** `flowdeep-peekaboo-8a63f52d` (companion, includes all 13 modules)

**Architecture:**
- **MVP** → Minimal scope, faster iteration, core flow validation
- **Full** → All enterprise modules (Pipeline, Procurement, RAID, Reports, etc.)
- **Sync** → Shared modules flow MVP → Full automatically

**Why synced?**
- MVP drives quality of core features (Portfolio, Resources, Financials, etc.)
- Changes made here don't break Full
- Single source of truth for shared code

---

## 📝 Session Log & Versioning

**Log updates:** `../../SESSIONS.md` (at project root)

**Product spec:** `../../product-spec.md` (applies to both editions)

**Rule:** Every session that changes code:
1. Prepend entry to SESSIONS.md
2. If spec changes, increment version + create patch file

---

## 🎓 For Handoff

When onboarding:
1. **Read** `../../CLAUDE.md` (root-level, understands dual-track model)
2. **Read** this file (MVP specifics)
3. **Reference** `../../product-spec.md` for feature details
4. **Check** SESSIONS.md for recent changes

---

## ⚙️ Important Rules

- **No TrianglZ branding** — client-facing deliverable
- **Bilingual** — All text must have EN + AR keys in `T` object
- **RTL safety** — Explicit CSS overrides for Arabic
- **External links** — Always `target="_blank" rel="noopener noreferrer"`
- **Code comments** — Only when WHY is non-obvious
- **Performance** — DS02 theme via localStorage
- **Synced modules** — Changes here flow to Full automatically

---

## 🔄 Development Workflow

### When working on MVP:
1. Make changes to shared modules (Portfolio, Resources, etc.)
2. Full edition automatically syncs on next pull
3. Commit message indicates which modules affected

### Git remote:
```bash
git remote -v
# origin https://github.com/abdulsalahuddin94-dev/flowdeep-peekaboo-mvp.git
```

---

## 🎯 MVP Goal

Prove core portfolio management capability:
- ✅ Portfolio visibility & project management
- ✅ Resource capacity planning
- ✅ Budget tracking
- ✅ Stakeholder communication
- ✅ Milestone & task scheduling

→ Ship MVP, then expand to enterprise features in Full edition

---

**Version:** MVP v17 (synced from Full, as of 2026-07-06)  
**Status:** MVP phase, synced with Full edition  
**Edition:** Minimal (6 modules)
