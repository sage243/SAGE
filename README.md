# SAGE Platform — Save Africa Group for Excellence (SARL)

Plateforme corporate pour **SAVE AFRICA GROUP FOR EXCELLENCE (SAGE SARL)** : vitrine multi-divisions, catalogue produits/services et console commerciale, alignés sur l’**Article 2** des statuts.

## Contexte (Article 2)

L’objet social couvre :

1. Commerce général (habillement, chaussures, pièces auto…)
2. Restauration, débits de boissons, distribution urbaine de vivres
3. Agence de voyage (visas, transport personnes & marchandises)
4. Activités agricoles et agro-pastorales
5. Produits pharmaceutiques / équipements médicaux ; huiles & produits pétroliers
6. Mobilier, immobilier, construction & matériaux

**Capital social :** 5 000 USD · **Siège :** 644, Av. Tombalbaye, Immeuble Masamba, Gombe, Kinshasa.

## Plan réaliste (synthèse)

| Phase | Focus | Pourquoi |
|------|--------|----------|
| **1 (cette app)** | Hub + catalogue + demandes | Unifier l’offre sans 6 apps coûteuses |
| **2** | Commerce + restauration/vivres | Cycles de cash courts |
| **3** | Voyage | Marge à commission, peu de stock |
| **4** | Pharma / pétrole | Après conformité réglementaire |
| **5** | Agro + immobilier | Capital intensif → lead gen & partenariats |

Détail : page `/plan` dans l’application.

## Fonctionnalités livrées

- Site public FR : marque SAGE, divisions Article 2, catalogue filtrable, formulaire de devis, contact, plan réaliste
- Console ops (`/admin`) : tableau de bord, CRUD offres, pipeline des demandes (nouveau → gagné/perdu)
- Persistance locale JSON (`data/products.json`, `data/inquiries.json`) — adaptée à un MVP sans budget infra

## Démarrer en local

```bash
npm install
npm run dev -- --port 43123
```

Ouvrir [http://127.0.0.1:43123](http://127.0.0.1:43123).

Scripts utiles :

```bash
npm run build
npm run start -- --port 43123
npm run lint
```

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui

## Structure clé

- `src/lib/divisions.ts` — mapping Article 2
- `src/lib/store.ts` — lecture/écriture catalogue & demandes
- `src/app/admin/*` — console commerciale
- `src/app/plan/page.tsx` — feuille de route business
