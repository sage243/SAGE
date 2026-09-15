import type { Division } from "./types";

/** Business lines from Article 2 of SAGE SARL statutes (Kinshasa, 15 juillet 2026). */
export const DIVISIONS: Division[] = [
  {
    slug: "commerce-general",
    name: "Alimentation",
    shortName: "Alimentation",
    article2:
      "Alimentation : denrées, épicerie et distribution de produits alimentaires (réf. Article 2 — activité générale réorientée alimentation).",
    summary:
      "Grossiste alimentaire à Kinshasa : huiles Simba, margarine Blue Band, épicerie et hygiène (références Marsavco & Beltexco).",
    priority: 1,
    phase: 2,
    cashCycle: "quotidien",
    digitalFit:
      "Catalogue alimentaire, cotations carton/unité, commandes B2B et réassort rapide.",
    accent: "#1F6B4A",
  },
  {
    slug: "restauration-vivres",
    name: "Restauration & vivres",
    shortName: "Restauration",
    article2:
      "Services de restauration et débits de boissons ; commercialisation et distribution urbaines des vivres.",
    summary:
      "Restauration, débits de boissons et chaîne courte de distribution urbaine de vivres frais et secs.",
    priority: 1,
    phase: 2,
    cashCycle: "quotidien",
    digitalFit:
      "Menus, offres du jour, commandes groupées pour bureaux et points de vente de quartier.",
    accent: "#B45309",
  },
  {
    slug: "agence-voyage",
    name: "Agence de voyage",
    shortName: "Voyage",
    article2:
      "Agence de voyage, y compris visas, transport des personnes et des marchandises.",
    summary:
      "Visas, billets, transport de personnes et fret léger — services à commission avec forte demande digitale.",
    priority: 2,
    phase: 3,
    cashCycle: "hebdomadaire",
    digitalFit:
      "Demandes de devis voyage, suivi dossier visa et cotations transport.",
    accent: "#0F4C81",
  },
  {
    slug: "agro-pastoral",
    name: "Agro & agro-pastoral",
    shortName: "Agro",
    article2: "Activités agricoles et agro-pastorales.",
    summary:
      "Production et commercialisation agricole et agro-pastorale, avec liaison ville–campagne.",
    priority: 3,
    phase: 5,
    cashCycle: "projet",
    digitalFit:
      "Vitrine de productions, contrats d’approvisionnement et précommandes saisonnières.",
    accent: "#3F6212",
  },
  {
    slug: "pharma-petrole",
    name: "Pharma, médical & pétrole",
    shortName: "Pharma & pétrole",
    article2:
      "Commercialisation des produits pharmaceutiques et équipements médicaux ; des huiles et produits pétroliers.",
    summary:
      "Grossiste réglementé (pharma / équipements médicaux) et commercialisation d’huiles et produits pétroliers.",
    priority: 2,
    phase: 4,
    cashCycle: "mensuel",
    digitalFit:
      "Catalogue B2B, demandes d’agrément et cotations pour cliniques, pharmacies et flottes.",
    accent: "#9F1239",
  },
  {
    slug: "immobilier-construction",
    name: "Immobilier & construction",
    shortName: "Immobilier",
    article2:
      "Le mobilier, l’immobilier, construction et matériaux de construction.",
    summary:
      "Mobilier, promotion immobilière légère, construction et fourniture de matériaux.",
    priority: 3,
    phase: 5,
    cashCycle: "projet",
    digitalFit:
      "Showcase de biens et chantiers, devis matériaux et demandes de projet.",
    accent: "#7C2D12",
  },
];

export function getDivision(slug: string): Division | undefined {
  return DIVISIONS.find((d) => d.slug === slug);
}
