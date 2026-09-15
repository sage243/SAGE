import type { Correspondence } from "./correspondence-types";
import { readCollection, writeCollection } from "./json-db";
import { uid } from "./utils";

const SEED: Correspondence[] = [
  {
    id: "corr_msv_001",
    reference: "SAGE-RDC/DG/2026/001",
    direction: "outbound",
    status: "en_attente_reponse",
    date: "2026-09-09",
    subject:
      "Expression d’intérêt commercial — Demande de catalogue général, grille tarifaire de gros et procédure d’ouverture de compte client (SAGE SARL)",
    counterpartyType: "supplier",
    counterpartyId: "sup_marsavco_01",
    counterpartyName: "MARSAVCO S.A.",
    counterpartyAddress:
      "01, Avenue Kalemie, Commune de la Gombe — B.P. 8914, Kinshasa I, R.D. Congo",
    toAttention: "Direction Commerciale & Service des Ventes",
    fromName: "Germain SELEMANI AMISI",
    fromTitle: "Directeur Général / Gérant — SAGE SARL",
    bodySummary:
      "SAGE SARL initie un partenariat distributeur FMCG avec MARSAVCO (dépôt central + points de vente Gombe, Limete, Ngaliema, Funa, N’djili). Demande catalogue, tarifs gros/semi-gros USD, remises volume, CGV/logistique et dossier d’ouverture de compte.",
    requestedItems: [
      "Catalogue général des produits (Alimentaire, Hygiène, Entretien, Détergents)",
      "Grille tarifaire gros & semi-gros (HT USD, unité et carton)",
      "Barème de remises sur volume (distributeurs / grands comptes)",
      "Conditions générales de vente et logistique (MOQ, livraison Kinshasa, enlèvement dépôt)",
      "Fiche et procédure d’ouverture de compte client",
    ],
    cc: [
      "Dir. des Achats et Chaîne d’Approvisionnement",
      "Dir. des Opérations et Clientèles",
      "Directeur Financier et Comptable",
      "Chargé de Marketing et mobilisation",
    ],
    attachmentPath: "/correspondances/SAGE-RDC_DG_2026_001_MARSAVCO.docx",
    attachmentLabel: "Correspondance MARSAVCO — SAGE-RDC_001.docx",
    createdAt: "2026-09-09T10:00:00.000Z",
    updatedAt: "2026-09-15T17:10:00.000Z",
  },
];

export async function listCorrespondences() {
  const items = await readCollection("correspondences.json", SEED);
  return items.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getCorrespondence(id: string) {
  return (await listCorrespondences()).find((c) => c.id === id);
}

export async function saveCorrespondence(
  input: Omit<Correspondence, "id" | "createdAt" | "updatedAt"> & { id?: string },
) {
  const items = await listCorrespondences();
  const now = new Date().toISOString();
  if (input.id) {
    const idx = items.findIndex((c) => c.id === input.id);
    if (idx === -1) throw new Error("Correspondance introuvable");
    items[idx] = { ...items[idx], ...input, id: input.id, updatedAt: now };
    await writeCollection("correspondences.json", items);
    return items[idx];
  }
  const created: Correspondence = {
    ...input,
    id: uid("corr"),
    createdAt: now,
    updatedAt: now,
  };
  items.unshift(created);
  await writeCollection("correspondences.json", items);
  return created;
}
