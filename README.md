# SAGE Platform — Save Africa Group for Excellence (SARL)

Plateforme SAGE : **site corporate** + **espace gestion** (alimentation & distribution).

## Phase 0 audit

See [`docs/SAGE_PHASE0_AUDIT.md`](docs/SAGE_PHASE0_AUDIT.md) for KEEP/IMPROVE/MERGE/REMOVE/BUILD, roadmap and target ERP architecture.

## What works now (Phase 1a + Phase 2)

### Public
- Home focused on **current** activities (alimentation + vivres)
- Catalogue from Product Master (tarifs Marsavco 2026 & Beltexco Kinshasa)
- Devis / leads
- Contact + plan

### Gestion (`/gestion`) — login required
- Demo credentials: `admin` / `sage2026`
- Dashboard (stock value, low stock, open POs, margins)
- Clients, Fournisseurs, Produits (landed cost)
- **Achats** — bons de commande → approbation → réception (GRN)
- **Stock** — soldes par entrepôt, mouvements, ajustements / pertes
- **Ventes** — devis → commande (réservation) → livraison (sortie + coût figé) → facture → paiement
- **Rentabilité** — marges réalisées par produit / client / activité + catalogue théorique
- **Tableau de bord** — KPIs CA, stock, AR, AP, encaissements USD/CDF
- **Correspondances** — courriers commerciaux (ex. SAGE-RDC/DG/2026/001 → MARSAVCO)
- Paramètres (FX USD→CDF, warehouses)
- Legacy demandes: `/admin/demandes`

## Core workflow (target)

Customer → Quotation → Sales Order → Stock/Procurement → Delivery → Invoice → Payment → Margin

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:3847](http://127.0.0.1:3847)

## Stack

Next.js · TypeScript · Tailwind · shadcn/ui · JSON stores (Postgres planned)

## Data files

- `data/products-master.json` — operational products (incl. Beltexco)
- `data/customers.json`, `suppliers.json`, `warehouses.json`, `currency.json`
- `data/purchase-orders.json`, `goods-receipts.json`
- `data/stock-balances.json`, `stock-movements.json`
- `data/quotations.json`, `sales-orders.json`, `deliveries.json`, `invoices.json`, `payments.json`
- `data/correspondences.json` — courriers fournisseurs (DOCX dans `public/correspondances/`)
- `data/inquiries.json` — legacy leads (to merge into sales quotations)
- `data/products.json` — legacy catalogue (superseded by products-master)
