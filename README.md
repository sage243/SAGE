# SAGE Platform — Save Africa Group for Excellence (SARL)

Plateforme SAGE : **site corporate** + **espace gestion** (alimentation & distribution).

## Phase 0 audit

See [`docs/SAGE_PHASE0_AUDIT.md`](docs/SAGE_PHASE0_AUDIT.md) for KEEP/IMPROVE/MERGE/REMOVE/BUILD, roadmap and target ERP architecture.

## What works now (Phase 1a + Phase 2)

### Public
- Home focused on **current** activities (alimentation + vivres)
- **Catalogue pro** avec images produit (`public/products/`), filtres, recherche, fiche `/catalogue/[sku]`
- Devis / leads
- Contact + plan

### Gestion (`/gestion`) — login required
- Demo credentials: `admin` / `sage2026`
- Dashboard (stock value, low stock, open POs, margins)
- Clients, Fournisseurs, Produits (landed cost)
- **Achats** — bons de commande → approbation → réception (GRN)
- **Stock** — soldes multi-entrepôts (Gombe + Limete, qty 100–1000), mouvements simulés (ventes/réceptions/pertes/recettes), alertes d’épuisement (critique / alerte / tendance)
- **Ventes** — devis → commande (réservation) → livraison (sortie + coût figé) → facture → paiement
- **Recettes** — restauration/boissons : BOM → consommation stock à chaque service
- **Rentabilité** — marges réalisées par produit / client / activité + catalogue théorique
- **Tableau de bord** — KPIs CA, stock, AR, AP, encaissements USD/CDF
- **Correspondances** — courriers commerciaux (ex. SAGE-RDC/DG/2026/001 → MARSAVCO)
- Paramètres (FX USD→CDF, warehouses)
- Legacy demandes: `/admin/demandes`

## Core workflow (target)

Customer → Quotation → Sales Order → Stock/Procurement → Delivery → Invoice → Payment → Margin

## Database (Render PostgreSQL 18)

Masters + stock can run on Postgres when `DATABASE_URL` is set (JSON remains the fallback).

```bash
# .env.local — External Database URL from Render
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require

npm run db:setup   # migrate schema + seed from data/*.json
curl http://127.0.0.1:3847/api/health/db
```

### Deploy on Render (Web Service)

| Setting | Value |
|---------|--------|
| Build Command | `npm ci && npm run build` |
| Start Command | `npm run start` |
| `PORT` | laissé par Render (`10000`) — l’app lit `process.env.PORT` |
| `DATABASE_URL` | **Internal Database URL** (copier-coller **complet** depuis Postgres → Connect) |

Si les logs montrent `ENOTFOUND base`, l’URL est tronquée / mal collée (le hostname doit être du type `dpg-….frankfurt-postgres.render.com`, pas `base`).

Vérifier : `https://VOTRE-SERVICE.onrender.com/api/health/db`

Sales / purchases / recipes still use JSON until the next migration phase.


Open [http://127.0.0.1:3847](http://127.0.0.1:3847)

## Stack

Next.js · TypeScript · Tailwind · shadcn/ui · JSON stores (Postgres planned)

## Data files

- `data/products-master.json` — operational products (incl. Beltexco)
- `data/customers.json`, `suppliers.json`, `warehouses.json`, `currency.json`
- `data/purchase-orders.json`, `goods-receipts.json`
- `data/stock-balances.json`, `stock-movements.json`
- `data/quotations.json`, `sales-orders.json`, `deliveries.json`, `invoices.json`, `payments.json`
- `data/recipes.json`, `recipe-productions.json`
- `data/correspondences.json` — courriers fournisseurs (DOCX dans `public/correspondances/`)
- `data/inquiries.json` — legacy leads (to merge into sales quotations)
- `data/products.json` — legacy catalogue (superseded by products-master)
