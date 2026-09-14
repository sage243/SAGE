export type DivisionSlug =
  | "commerce-general"
  | "restauration-vivres"
  | "agence-voyage"
  | "agro-pastoral"
  | "pharma-petrole"
  | "immobilier-construction";

export type OfferKind = "product" | "service";

export type OfferStatus = "active" | "draft" | "archived";

export type InquiryStatus =
  | "nouveau"
  | "en_cours"
  | "devis_envoye"
  | "gagne"
  | "perdu";

export interface Division {
  slug: DivisionSlug;
  name: string;
  shortName: string;
  article2: string;
  summary: string;
  priority: 1 | 2 | 3;
  phase: 1 | 2 | 3 | 4 | 5;
  cashCycle: "quotidien" | "hebdomadaire" | "mensuel" | "projet";
  digitalFit: string;
  accent: string;
}

export interface Offer {
  id: string;
  division: DivisionSlug;
  kind: OfferKind;
  name: string;
  description: string;
  priceLabel: string;
  unit?: string;
  tags: string[];
  status: OfferStatus;
  featured: boolean;
  stockNote?: string;
  updatedAt: string;
}

export interface Inquiry {
  id: string;
  createdAt: string;
  updatedAt: string;
  fullName: string;
  organization?: string;
  phone: string;
  email?: string;
  city: string;
  division: DivisionSlug;
  offerId?: string;
  offerName?: string;
  message: string;
  status: InquiryStatus;
  priority: "normale" | "haute";
  internalNote?: string;
}
