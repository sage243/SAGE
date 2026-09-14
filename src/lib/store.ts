import { promises as fs } from "fs";
import path from "path";
import type { Inquiry, Offer } from "./types";
import { uid } from "./utils";

const dataDir = path.join(process.cwd(), "data");

async function ensureDataFiles() {
  await fs.mkdir(dataDir, { recursive: true });
  const productsPath = path.join(dataDir, "products.json");
  const inquiriesPath = path.join(dataDir, "inquiries.json");

  try {
    await fs.access(productsPath);
  } catch {
    await fs.writeFile(productsPath, JSON.stringify(SEED_OFFERS, null, 2), "utf8");
  }

  try {
    await fs.access(inquiriesPath);
  } catch {
    await fs.writeFile(inquiriesPath, JSON.stringify(SEED_INQUIRIES, null, 2), "utf8");
  }
}

async function readJson<T>(file: string): Promise<T> {
  await ensureDataFiles();
  const raw = await fs.readFile(path.join(dataDir, file), "utf8");
  return JSON.parse(raw) as T;
}

async function writeJson<T>(file: string, data: T) {
  await ensureDataFiles();
  await fs.writeFile(path.join(dataDir, file), JSON.stringify(data, null, 2), "utf8");
}

export async function listOffers(): Promise<Offer[]> {
  const offers = await readJson<Offer[]>("products.json");
  return offers.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getOffer(id: string): Promise<Offer | undefined> {
  const offers = await listOffers();
  return offers.find((o) => o.id === id);
}

export async function saveOffer(input: Omit<Offer, "id" | "updatedAt"> & { id?: string }) {
  const offers = await listOffers();
  const now = new Date().toISOString();
  if (input.id) {
    const idx = offers.findIndex((o) => o.id === input.id);
    if (idx === -1) throw new Error("Offre introuvable");
    offers[idx] = { ...offers[idx], ...input, id: input.id, updatedAt: now };
    await writeJson("products.json", offers);
    return offers[idx];
  }
  const created: Offer = {
    ...input,
    id: uid("off"),
    updatedAt: now,
  };
  offers.unshift(created);
  await writeJson("products.json", offers);
  return created;
}

export async function deleteOffer(id: string) {
  const offers = await listOffers();
  await writeJson(
    "products.json",
    offers.filter((o) => o.id !== id),
  );
}

export async function listInquiries(): Promise<Inquiry[]> {
  const items = await readJson<Inquiry[]>("inquiries.json");
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createInquiry(
  input: Omit<Inquiry, "id" | "createdAt" | "updatedAt" | "status" | "priority"> & {
    priority?: Inquiry["priority"];
  },
) {
  const items = await listInquiries();
  const now = new Date().toISOString();
  const created: Inquiry = {
    ...input,
    id: uid("dem"),
    createdAt: now,
    updatedAt: now,
    status: "nouveau",
    priority: input.priority ?? "normale",
  };
  items.unshift(created);
  await writeJson("inquiries.json", items);
  return created;
}

export async function updateInquiry(
  id: string,
  patch: Partial<Pick<Inquiry, "status" | "priority" | "internalNote">>,
) {
  const items = await listInquiries();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error("Demande introuvable");
  items[idx] = {
    ...items[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await writeJson("inquiries.json", items);
  return items[idx];
}

const SEED_OFFERS: Offer[] = [
  {
    id: "off_comm_01",
    division: "commerce-general",
    kind: "product",
    name: "Kit pièces freinage utilitaire",
    description:
      "Plaquettes, disques et liquide de frein pour flottes légères opérant à Kinshasa. Stock rotatif, références courantes.",
    priceLabel: "Sur cotation",
    unit: "kit",
    tags: ["automobile", "B2B", "stock"],
    status: "active",
    featured: true,
    stockNote: "Réassort hebdomadaire",
    updatedAt: "2026-09-10T09:00:00.000Z",
  },
  {
    id: "off_comm_02",
    division: "commerce-general",
    kind: "product",
    name: "Collection prêt-à-porter urbain",
    description:
      "Habillement et chaussures pour points de vente et revendeurs. Assortiment mixte homme / femme.",
    priceLabel: "À partir de 12 USD",
    unit: "pièce",
    tags: ["mode", "revendeurs"],
    status: "active",
    featured: false,
    updatedAt: "2026-09-08T11:20:00.000Z",
  },
  {
    id: "off_rest_01",
    division: "restauration-vivres",
    kind: "service",
    name: "Traiteur bureaux — formule midi",
    description:
      "Livraison de repas chauds pour équipes de 10 à 80 personnes dans la Gombe et communes limitrophes.",
    priceLabel: "À partir de 6 USD / couvert",
    tags: ["traiteur", "entreprises"],
    status: "active",
    featured: true,
    updatedAt: "2026-09-12T08:15:00.000Z",
  },
  {
    id: "off_rest_02",
    division: "restauration-vivres",
    kind: "product",
    name: "Panier vivres urbains (semaine)",
    description:
      "Assortiment de vivres secs et frais pour ménages et petites cantines. Livraison groupée le samedi.",
    priceLabel: "35–55 USD",
    unit: "panier",
    tags: ["distribution", "ménages"],
    status: "active",
    featured: true,
    updatedAt: "2026-09-11T16:40:00.000Z",
  },
  {
    id: "off_voy_01",
    division: "agence-voyage",
    kind: "service",
    name: "Dossier visa Schengen / Afrique",
    description:
      "Accompagnement complet : checklist documents, prise de rendez-vous et suivi jusqu’à décision.",
    priceLabel: "Frais de service + coûts consulaires",
    tags: ["visa", "particuliers", "entreprises"],
    status: "active",
    featured: true,
    updatedAt: "2026-09-09T10:00:00.000Z",
  },
  {
    id: "off_voy_02",
    division: "agence-voyage",
    kind: "service",
    name: "Transport personnes & fret léger",
    description:
      "Cotations pour déplacements interurbains et acheminement de marchandises légères.",
    priceLabel: "Sur devis",
    tags: ["transport", "fret"],
    status: "active",
    featured: false,
    updatedAt: "2026-09-07T14:00:00.000Z",
  },
  {
    id: "off_agro_01",
    division: "agro-pastoral",
    kind: "product",
    name: "Précommande récolte maraîchère",
    description:
      "Engagement d’achat anticipé pour légumes de saison destinés aux restaurants et marchés urbains.",
    priceLabel: "Prix saisonnier",
    tags: ["précommande", "B2B"],
    status: "active",
    featured: false,
    updatedAt: "2026-09-05T12:00:00.000Z",
  },
  {
    id: "off_pharma_01",
    division: "pharma-petrole",
    kind: "product",
    name: "Équipements médicaux essentiels",
    description:
      "Fourniture B2B d’équipements et consommables pour cliniques et pharmacies (sous conditions réglementaires).",
    priceLabel: "Catalogue B2B",
    tags: ["médical", "B2B", "agrément"],
    status: "active",
    featured: true,
    stockNote: "Sur commande / licences",
    updatedAt: "2026-09-06T09:30:00.000Z",
  },
  {
    id: "off_pet_01",
    division: "pharma-petrole",
    kind: "product",
    name: "Huiles & lubrifiants flottes",
    description:
      "Approvisionnement en huiles et produits pétroliers pour ateliers et flottes professionnelles.",
    priceLabel: "Sur cotation volume",
    tags: ["pétrole", "flottes"],
    status: "active",
    featured: false,
    updatedAt: "2026-09-04T15:10:00.000Z",
  },
  {
    id: "off_immo_01",
    division: "immobilier-construction",
    kind: "service",
    name: "Devis matériaux de construction",
    description:
      "Cotation ciment, fer, menuiserie et finitions pour chantiers résidentiels et commerciaux.",
    priceLabel: "Devis sous 48 h",
    tags: ["matériaux", "chantier"],
    status: "active",
    featured: true,
    updatedAt: "2026-09-03T13:00:00.000Z",
  },
  {
    id: "off_immo_02",
    division: "immobilier-construction",
    kind: "product",
    name: "Mobilier bureau & habitat",
    description:
      "Gammes de mobilier pour bureaux, hôtels et logements — vente unitaire ou lot.",
    priceLabel: "À partir de 80 USD",
    tags: ["mobilier"],
    status: "draft",
    featured: false,
    updatedAt: "2026-09-02T10:00:00.000Z",
  },
];

const SEED_INQUIRIES: Inquiry[] = [
  {
    id: "dem_seed_01",
    createdAt: "2026-09-13T08:22:00.000Z",
    updatedAt: "2026-09-13T08:22:00.000Z",
    fullName: "Claire Mwamba",
    organization: "Cabinet Mwamba & Associés",
    phone: "+243 810 000 111",
    email: "c.mwamba@exemple.cd",
    city: "Kinshasa",
    division: "restauration-vivres",
    offerId: "off_rest_01",
    offerName: "Traiteur bureaux — formule midi",
    message:
      "Besoin d’une formule midi pour 25 collaborateurs, 3 jours/semaine, livraison Gombe.",
    status: "en_cours",
    priority: "haute",
    internalNote: "Relancer avec menu semaine 38.",
  },
  {
    id: "dem_seed_02",
    createdAt: "2026-09-12T16:05:00.000Z",
    updatedAt: "2026-09-12T16:05:00.000Z",
    fullName: "Jean-Baptiste Ilunga",
    organization: "Garage Express Limete",
    phone: "+243 990 222 333",
    city: "Kinshasa",
    division: "commerce-general",
    offerId: "off_comm_01",
    offerName: "Kit pièces freinage utilitaire",
    message: "Besoin de 12 kits freinage pour Toyota Hiace. Délai souhaité : 10 jours.",
    status: "nouveau",
    priority: "normale",
  },
];
