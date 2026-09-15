import type { DivisionSlug } from "./types";

export type CurrencyCode = "CDF" | "USD";

export type PartyStatus = "actif" | "inactif" | "bloque";

export type CustomerType = "particulier" | "entreprise" | "institution";

export type ProductKind = "product" | "service";

export type ProductStatus = "active" | "draft" | "archived";

export type ActivityFocus = "current" | "future";

export interface CurrencySettings {
  baseCurrency: CurrencyCode;
  rates: {
    id: string;
    from: CurrencyCode;
    to: CurrencyCode;
    rate: number;
    effectiveAt: string;
    source?: string;
  }[];
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  city: string;
  address?: string;
  isDefault: boolean;
  status: PartyStatus;
  notes?: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  code: string;
  type: CustomerType;
  legalName: string;
  contactPerson?: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  city: string;
  taxId?: string;
  creditLimit: number;
  creditLimitCurrency: CurrencyCode;
  paymentTermsDays: number;
  assignedSalesperson?: string;
  status: PartyStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  code: string;
  legalName: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  city: string;
  paymentTermsDays: number;
  productCategories: string[];
  status: PartyStatus;
  notes?: string;
  outstandingBalance: number;
  outstandingCurrency: CurrencyCode;
  createdAt: string;
  updatedAt: string;
}

/** Operational product master — replaces marketing-only Offer over time. */
export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  kind: ProductKind;
  /** Activity tag from Article 2 — not a separate app */
  activity: DivisionSlug;
  category: string;
  subcategory?: string;
  brand?: string;
  unitOfMeasure: string;
  /** Purchase price from supplier (transaction currency) */
  purchasePrice: number;
  purchaseCurrency: CurrencyCode;
  transportCost: number;
  handlingCost: number;
  storageCost: number;
  otherDirectCosts: number;
  /** Computed / stored landed cost in purchase currency */
  landedCost: number;
  sellingPrice: number;
  wholesalePrice: number;
  retailPrice: number;
  sellingCurrency: CurrencyCode;
  /** Legacy display string for public catalogue compatibility */
  priceLabel: string;
  minStock: number;
  maxStock: number;
  reorderLevel: number;
  quantityOnHand: number;
  supplierId?: string;
  warehouseId?: string;
  batchLot?: string;
  expiryDate?: string;
  status: ProductStatus;
  featured: boolean;
  publicVisible: boolean;
  tags: string[];
  stockNote?: string;
  updatedAt: string;
}

export function computeLandedCost(input: {
  purchasePrice: number;
  transportCost?: number;
  handlingCost?: number;
  storageCost?: number;
  otherDirectCosts?: number;
}) {
  return (
    Number(input.purchasePrice || 0) +
    Number(input.transportCost || 0) +
    Number(input.handlingCost || 0) +
    Number(input.storageCost || 0) +
    Number(input.otherDirectCosts || 0)
  );
}

export function computeGrossMargin(sellingPrice: number, landedCost: number) {
  if (!sellingPrice) return { grossProfit: 0, marginPct: 0 };
  const grossProfit = sellingPrice - landedCost;
  return {
    grossProfit,
    marginPct: (grossProfit / sellingPrice) * 100,
  };
}
