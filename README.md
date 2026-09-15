# SAGE Platform — Save Africa Group for Excellence (SARL)

Plateforme SAGE : **site corporate** + **espace gestion** (commerce & distribution).

## Phase 0 audit

See [`docs/SAGE_PHASE0_AUDIT.md`](docs/SAGE_PHASE0_AUDIT.md) for KEEP/IMPROVE/MERGE/REMOVE/BUILD, roadmap and target ERP architecture.

## What works now (Phase 1a)

### Public
- Home focused on **current** activities (commerce + vivres)
- Catalogue from Product Master
- Devis / leads
- Contact + plan

### Gestion (`/gestion`) — login required
- Demo credentials: `admin` / `sage2026`
- Dashboard (stock value, low stock, margins)
- Clients, Fournisseurs, Produits (landed cost)
- Paramètres (FX USD→CDF, warehouses)
- Legacy demandes: `/admin/demandes`

## Core workflow (target)

Customer → Quotation → Sales Order → Stock/Procurement → Delivery → Invoice → Payment → Margin

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123)

## Stack

Next.js · TypeScript · Tailwind · shadcn/ui · JSON stores (Postgres planned)

## Data files

- `data/products-master.json` — operational products
- `data/customers.json`, `suppliers.json`, `warehouses.json`, `currency.json`
- `data/inquiries.json` — legacy leads (to merge into sales quotations)
- `data/products.json` — legacy catalogue (superseded by products-master)
