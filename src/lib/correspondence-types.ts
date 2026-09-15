import type { CurrencyCode } from "./domain";

export type CorrespondenceDirection = "outbound" | "inbound";

export type CorrespondenceStatus =
  | "brouillon"
  | "envoye"
  | "accuse_reception"
  | "en_attente_reponse"
  | "clos";

export interface Correspondence {
  id: string;
  reference: string;
  direction: CorrespondenceDirection;
  status: CorrespondenceStatus;
  date: string;
  subject: string;
  counterpartyType: "supplier" | "customer" | "other";
  counterpartyId?: string;
  counterpartyName: string;
  counterpartyAddress?: string;
  toAttention?: string;
  fromName: string;
  fromTitle: string;
  bodySummary: string;
  requestedItems: string[];
  cc?: string[];
  attachmentPath?: string;
  attachmentLabel?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierCommercialProfile {
  supplierId: string;
  legalName: string;
  addressLines: string[];
  phones: string[];
  emails: string[];
  city: string;
  country: string;
  paymentCurrency: CurrencyCode;
  notes?: string;
}
