# Nexus PMO — MVP Edition

**Minimal Viable Product** with 5 essential modules for portfolio management.

## 📋 Modules (Essential Only)

1. **Dashboard** — Role-adaptive home (core KPIs & quick actions)
2. **Portfolio** — Project portfolio + project detail pages
3. **Resources** — Resource capacity planning & allocation
4. **Clients & Vendors** — Master data management
5. **Financials** — Budget tracking & burn rates
6. **Organization** — Business lines, departments, calendars

## ❌ Not Included in MVP

- Pipeline (commercial forecasting)
- Risk & Issues (RAID)
- Reports
- Procurement
- Settings & Admin
- Roles & Permissions
- Help & Docs

→ These ship in **PMO-Full** after MVP launch.

## 📁 Structure

```
flowdeep-peekaboo-mvp/
├── src/
│   ├── routes/         # 6 module entry points (MVP only)
│   ├── components/     # Shared components with Full edition
│   └── lib/            # Mock data, state management
└── package.json
```

## 🔄 Synced Components

These modules are **synced with PMO-Full**:
- Changes in MVP automatically propagate to Full
- Shared components, types, and utilities
- Single source of truth for core portfolio logic

## 🚀 Getting Started

```bash
cd flowdeep-peekaboo-mvp
npm install
npm run dev
```

## 🎯 MVP Goal

Prove core portfolio management flow:
- Portfolio visibility
- Project planning & scheduling
- Resource capacity planning
- Budget tracking
- Stakeholder management

Then expand to enterprise features (Pipeline, Procurement, Governance).

## 📖 Documentation

- **Product Spec:** `../../product-spec.md` (applies to both editions)
- **Setup Guide:** `../../CLAUDE.md`
- **Session Log:** `../../SESSIONS.md`
- **Full Edition:** `../PMO-Full/`

---

**Version:** MVP (synced from Full v17, as of 2026-07-06)  
**Status:** MVP phase  
**Repo:** [flowdeep-peekaboo-mvp](https://github.com/abdulsalahuddin94-dev/flowdeep-peekaboo-mvp.git)
