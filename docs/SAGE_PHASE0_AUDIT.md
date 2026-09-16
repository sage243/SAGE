# SAGE SARL — Phase 0 Audit, Roadmap & Target Architecture

**Date:** 2026-09-15  
**Status:** Audit complete — no ERP modules implemented yet  
**Stack today:** Next.js 16 · TypeScript · Tailwind 4 · shadcn/ui · JSON file store  
**Live surface:** corporate site + catalogue + devis/leads + open admin console

---

## 1. Current state (facts)

### What exists and works

| Area | Status |
|------|--------|
| Public FR site (`/`, `/divisions`, `/catalogue`, `/devis`, `/plan`, `/contact`) | Working |
| Admin console (`/admin`, `/admin/produits`, `/admin/demandes`) | Working, **no auth** |
| Offer CRUD via `/api/products` | Working |
| Inquiry pipeline via `/api/inquiries` | Working |
| Article 2 division model (6 lines) | Working as marketing taxonomy |
| JSON persistence (`data/products.json`, `data/inquiries.json`) | Working for local MVP only |

### What does **not** exist (critical gaps vs master prompt)

Customers, suppliers, SKUs, warehouses, purchases, stock movements, sales orders, deliveries, invoices, payments, multi-currency (CDF/USD), landed cost, RBAC, audit trail, PostgreSQL, SYSCOHADA readiness.

### Structural risks

1. Admin + mutating APIs are fully open (no login).
2. PII in `data/inquiries.json` is committed to git.
3. Prices are display strings (`priceLabel`), not numeric cost/price fields.
4. Homepage “cash” strip uses `featured`, so travel/pharma/immo can dominate over commerce/food.
5. JSON store: no relations, no concurrency, not deployable as multi-instance ERP.
6. Unused shadcn primitives: `card`, `dialog`, `select`, `separator`, `table`, `tabs`.
7. Seed data duplicated in `store.ts` and `data/*.json`.

---

## 2. KEEP / IMPROVE / MERGE / REMOVE / BUILD

### KEEP

| Item | Why |
|------|-----|
| Next.js App Router + TypeScript + Tailwind + shadcn | Solid base for public + ops UI |
| French-first corporate identity (SAGE SARL, siège Gombe) | Legal/brand continuity |
| Public catalogue browsing | Becomes storefront view of Product Master |
| Devis/lead capture UX | Becomes Quotation entry in sales workflow |
| Inquiry status pipeline concept | Evolves into quotation → order lifecycle |
| `/plan` business sequencing logic | Aligns with cash-engine priority |
| Division taxonomy (Article 2) as **activity labels**, not separate apps | One platform principle |

### IMPROVE

| Item | Change |
|------|--------|
| `/admin` | Become authenticated **Business Management** area with ERP nav |
| Product/Offer model | Upgrade to operational Product Master (SKU, costs, stock levels, UoM, supplier) |
| `/devis` + inquiries | Integrate into Sales: Quotation → Order (not isolated CRM) |
| Homepage / catalogue | Bias to **CURRENT** activities: commerce + food distribution; demote speculative lines |
| Navigation | Split **Public** vs **Gestion** clearly |
| Validation & API allowlists | Enforce division/status enums; rate-limit public devis |
| Data layer | Design relational schema now; keep JSON only as temporary adapter |

### MERGE

| From | Into |
|------|------|
| `Offer` + catalogue + admin produits | Single **Product Master** (`products`) |
| `/devis` + `/admin/demandes` | **Sales quotations** module + pipeline |
| `commerce-general` + food side of `restauration-vivres` (distribution) | **Priority 1 cash engine** (commerce & distribution) |
| Public “Console” link clutter | Single entry: `/gestion` (login gate) |

### REMOVE / DEFER (do not operationalize now)

| Item | Action | Reason |
|------|--------|--------|
| Operational modules for pharma, pétrole, immobilier, agro, travel/visa | Keep as **Future activities** marketing only | Capital/regulatory; not cash engine |
| Equal homepage weight for Phase 3–5 featured offers | Demote / unfeature | Dilutes Priority 1 |
| Premature restaurant POS, bar, habillement, full SYSCOHADA | Defer to Phases 6–8 | Master prompt order |
| Unused default `public/*.svg` (optional cleanup) | Remove when convenient | Dead assets |
| Duplicate seed blocks in `store.ts` once DB lands | Remove | Single source of truth |
| Open unauthenticated admin (as product posture) | Replace with RBAC | Security |

**Do not remove:** working devis form, catalogue read path, or French public pages — restructure them.

### BUILD (Priority 1 — next implementation waves)

1. **Core masters:** customers, suppliers, products, categories, warehouses, currencies, FX rates, users/roles  
2. **Procurement & stock:** PO → goods receipt → movements → valuation (landed cost)  
3. **Sales chain:** quotation → sales order → reservation → delivery → invoice → payment  
4. **Profitability:** real cost, gross profit, margin % (preserve cost basis per transaction)  
5. **Management dashboard:** sales, stock, AR/AP, cash (CDF/USD)  
6. Later: restaurant, boissons, habillement, SYSCOHADA accounting, mobile delivery

---

## 3. Public vs Gestion (target navigation)

### Public / Corporate (keep simple)

- Accueil  
- À propos / SAGE  
- Activités (Current vs Future)  
- Catalogue  
- Demande de devis  
- Contact  

### Business Management `/gestion` (main priority)

- Tableau de bord  
- Clients  
- Fournisseurs  
- Produits  
- Achats  
- Stock  
- Ventes (devis → commandes)  
- Livraisons  
- Factures  
- Paiements / Caisse  
- Rapports  
- Paramètres (users, roles, FX, warehouses)

---

## 4. Target architecture

```
┌──────────────────────────────────────────────────────────┐
│                     PUBLIC (Next.js)                      │
│  Home · Activities · Catalogue · Devis · Contact          │
└───────────────────────────┬──────────────────────────────┘
                            │ creates Quotation (lead)
┌───────────────────────────▼──────────────────────────────┐
│              GESTION (RBAC, FR desktop-first)             │
│  Dashboard · CRM · Products · Purchases · Stock · Sales   │
│  Deliveries · Invoices · Payments · Reports · Settings    │
└───────────────────────────┬──────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────┐
│                 APPLICATION SERVICES                      │
│  Pricing/LandedCost · Inventory · AR/AP · FX · Audit      │
└───────────────────────────┬──────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────┐
│              DATA (target: PostgreSQL)                    │
│  users, roles, customers, suppliers, products,            │
│  warehouses, stock_movements, purchase_*, sales_*,        │
│  deliveries, invoices, payments, currencies, fx_rates,    │
│  audit_logs                                               │
│                                                           │
│  Transition: JSON repository adapters → Prisma/Drizzle    │
└──────────────────────────────────────────────────────────┘
```

### Core commercial workflow (non-negotiable)

```
CUSTOMER → QUOTATION → SALES ORDER → PROCUREMENT/STOCK
        → DELIVERY → INVOICE → PAYMENT → PROFITABILITY
```

### Landed cost (mandatory formula)

```
real_cost = purchase_price + transport + handling + storage + other_direct_costs
gross_profit = selling_price - real_cost
gross_margin_% = gross_profit / selling_price × 100
```

Cost basis must be **frozen on each sales line** (never recalculated from live purchase price alone).

### Multi-currency (DRC)

Every money transaction stores:

- `currency` (CDF | USD)  
- `amount`  
- `exchange_rate` (immutable historical)  
- `amount_base` (configurable base, default USD or CDF in settings)

### Document lifecycle

`Draft → Approved → Posted → Cancelled` (no silent deletes for financial docs).

---

## 5. Implementation roadmap (exact order)

| Phase | Scope | Outcome |
|-------|--------|---------|
| **0** | Audit + architecture *(this document)* | Shared plan; no blind feature sprawl |
| **1** | Core data masters + auth skeleton + public simplification | Customers, suppliers, products, warehouses, FX, roles |
| **2** | Procurement & stock | PO, GRN, movements, valuation, low-stock |
| **3** | Sales chain | Merge devis → quotations/orders/deliveries/invoices/payments |
| **4** | Profitability | Landed cost reports, margin by product/activity/customer |
| **5** | Management dashboard | KPI cards: sales, stock, AR, AP, cash CDF/USD |
| **6** | Restaurant & boissons | Recipe → stock consumption |
| **7** | Habillement | Variants on same inventory |
| **8** | SYSCOHADA accounting hooks | Journals from posted commercial docs |
| **9** | Mobile delivery | Driver-oriented delivery updates |

### Immediate next coding slice (after approval of this audit)

**Phase 1a only:**

1. Restructure nav: Public vs `/gestion`  
2. Product Master schema (upgrade offers; numeric costs/prices; category; reorder levels)  
3. Customer + Supplier masters (CRUD)  
4. Warehouse + Currency + FX rate settings  
5. Auth gate for `/gestion` (simple credentials for MVP; roles stub)  
6. Refocus public home: Current = commerce & distribution; Future = other Article 2 lines  
7. PostgreSQL schema design file + JSON adapter compatibility

**Explicitly not in next slice:** restaurant POS, full accounting, pharma ops, multi-app split.

---

## 6. Testing gates (from master prompt)

A module is done only when UI + model + CRUD + validation + errors + permissions + audit (where required) + related stock/finance updates + E2E scenario pass.

Priority scenarios to unlock in Phases 2–4:

- **A** Food wholesale end-to-end  
- **B** Out-of-stock → procurement  
- **C** Partial delivery  
- **D** Customer credit / AR  
- **E** Multi-currency USD buy / CDF sell  
- **F** Stock loss / variance  

---

## 7. Decision summary

| Question | Answer |
|----------|--------|
| Rewrite from scratch? | **No** — evolve in place |
| One platform? | **Yes** |
| Operationalize all Article 2 now? | **No** — cash engine first |
| Keep JSON forever? | **No** — prototype only; design Postgres now |
| Keep public site? | **Yes** — simplify and demote speculative ops |
| First code after audit? | Phase 1a masters + `/gestion` shell + product upgrade |

---

## 8. Audit checklist (completed)

- [x] Folders, routes, APIs, components inspected  
- [x] Data models and JSON reviewed  
- [x] Duplication / dead UI / security / scale limits noted  
- [x] KEEP / IMPROVE / MERGE / REMOVE / BUILD defined  
- [x] Roadmap ordered per master prompt  
- [x] Target architecture documented  
- [x] Implementation starts only after stakeholder go-ahead on Phase 1a scope

---

## 9. Phase 1a progress (implemented after audit)

Delivered in-repo:

- `/gestion` authenticated area (`admin` / `sage2026` MVP cookie auth)
- Masters: clients, fournisseurs, produits (landed cost), entrepôts, FX CDF/USD
- Public home reframed: **current** cash engine vs **future** Article 2 activities
- Catalogue + devis wired to Product Master (`products-master`)
- Legacy `/admin` redirects into `/gestion` (demandes kept temporarily)

Next: Phase 2 procurement & stock movements.

---

## 10. Phase 2 progress (procurement & stock)

Delivered in-repo:

- Purchase orders (`/gestion/achats`) with draft → approved → partial/posted lifecycle
- Goods receipt posting updates stock balances + weighted average cost + product master qty
- Stock module (`/gestion/stock`): balances by warehouse, movements ledger, adjustments / losses
- APIs: `/api/purchases`, `/api/stock`, `/api/warehouses`
- Seed BC Beltexco `PO-2026-0001` (sardines, tomate, lait) ready to receive

Next: Phase 3 sales chain (devis → commandes → livraisons → factures).

---

## 11. Phase 3 progress (sales chain)

Delivered in-repo:

- Quotations → approve → convert to sales order
- Sales order approve reserves stock; cancel releases reservation
- Delivery posts `sales_issue` movements, releases reservation, supports partial delivery
- Invoice freezes unit cost / margin from delivery lines
- Payment recording updates AR balance (`posted` / `partial` / `paid`)
- UI `/gestion/ventes` with tabs Devis / Commandes / Livraisons / Factures
- API `/api/sales`

Next: Phase 4 profitability reports / Phase 5 management dashboard KPIs.

---

## 12. Phase 4–5 progress (profitability + management KPIs)

Delivered in-repo:

- Profitability engine from **frozen invoice cost basis** (product / customer / activity)
- Catalog theoretical margin view + low-margin alerts (&lt; 8%)
- Management dashboard KPIs: CA, gross profit, inventory, AR, AP, cash collected, NWC — USD + CDF via FX
- UI `/gestion/rentabilite` · API `/api/reports`

Next: Phase 6 restaurant & boissons (recipe → stock) — or harden reporting filters/date ranges.

---

## 13. Phase 6 progress (restaurant & boissons)

Delivered in-repo:

- Recipe BOM master (`/gestion/recettes`) with ingredients per output unit
- **Servir / produire** posts `recipe_consumption` stock movements (frozen ingredient CMP)
- Production log with cost, revenue, margin; optional customer
- Seed recipes: formule midi traiteur + assemblage panier vivres
- API `/api/recipes`

Next: Phase 7 habillement (variants) or deepen restaurant POS / beverage recipes.
