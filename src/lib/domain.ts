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

/** Document lifecycle for financial / operational docs */
export type DocStatus = "draft" | "approved" | "posted" | "cancelled" | "partial";

export type StockMovementType =
  | "purchase_receipt"
  | "sales_issue"
  | "transfer_in"
  | "transfer_out"
  | "adjustment"
  | "loss"
  | "opening";

export interface PurchaseOrderLine {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitOfMeasure: string;
  unitPrice: number;
  currency: CurrencyCode;
  transportCost: number;
  handlingCost: number;
  storageCost: number;
  otherDirectCosts: number;
  lineTotal: number;
  landedUnitCost: number;
}

export interface PurchaseOrder {
  id: string;
  number: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  status: DocStatus;
  currency: CurrencyCode;
  exchangeRate: number;
  orderedAt: string;
  expectedAt?: string;
  notes?: string;
  lines: PurchaseOrderLine[];
  subtotal: number;
  totalLanded: number;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  postedAt?: string;
  cancelledAt?: string;
}

export interface GoodsReceiptLine {
  id: string;
  purchaseLineId: string;
  productId: string;
  sku: string;
  productName: string;
  quantityReceived: number;
  unitOfMeasure: string;
  unitPrice: number;
  landedUnitCost: number;
  currency: CurrencyCode;
}

export interface GoodsReceipt {
  id: string;
  number: string;
  purchaseOrderId: string;
  purchaseOrderNumber: string;
  warehouseId: string;
  warehouseName: string;
  status: Extract<DocStatus, "draft" | "posted" | "cancelled">;
  receivedAt: string;
  notes?: string;
  lines: GoodsReceiptLine[];
  createdAt: string;
  updatedAt: string;
  postedAt?: string;
}

export interface StockMovement {
  id: string;
  type: StockMovementType;
  productId: string;
  sku: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  /** Signed delta applied to on-hand (+ in / − out) */
  quantityDelta: number;
  unitOfMeasure: string;
  unitCost: number;
  currency: CurrencyCode;
  referenceType?: "purchase_order" | "goods_receipt" | "adjustment" | "opening" | "sales_order" | "delivery";
  referenceId?: string;
  referenceNumber?: string;
  reason?: string;
  createdAt: string;
  createdBy: string;
}

export interface StockBalance {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  quantityOnHand: number;
  /** Soft reservation for approved sales orders */
  quantityReserved?: number;
  unitOfMeasure: string;
  averageUnitCost: number;
  currency: CurrencyCode;
  reorderLevel: number;
  updatedAt: string;
}

export type SalesDocStatus = DocStatus | "invoiced";

export interface SalesLine {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  quantity: number;
  quantityDelivered: number;
  unitOfMeasure: string;
  unitPrice: number;
  currency: CurrencyCode;
  /** Cost basis frozen at confirmation / delivery */
  unitCost: number;
  lineTotal: number;
  grossProfit: number;
  marginPct: number;
}

export interface Quotation {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  warehouseId: string;
  warehouseName: string;
  status: Extract<DocStatus, "draft" | "approved" | "cancelled" | "posted">;
  currency: CurrencyCode;
  exchangeRate: number;
  quotedAt: string;
  validUntil?: string;
  notes?: string;
  lines: SalesLine[];
  subtotal: number;
  totalCost: number;
  grossProfit: number;
  marginPct: number;
  salesOrderId?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
}

export interface SalesOrder {
  id: string;
  number: string;
  quotationId?: string;
  quotationNumber?: string;
  customerId: string;
  customerName: string;
  warehouseId: string;
  warehouseName: string;
  status: SalesDocStatus;
  currency: CurrencyCode;
  exchangeRate: number;
  orderedAt: string;
  promisedAt?: string;
  notes?: string;
  lines: SalesLine[];
  subtotal: number;
  totalCost: number;
  grossProfit: number;
  marginPct: number;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  postedAt?: string;
}

export interface DeliveryLine {
  id: string;
  salesLineId: string;
  productId: string;
  sku: string;
  productName: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  unitCost: number;
  currency: CurrencyCode;
}

export interface Delivery {
  id: string;
  number: string;
  salesOrderId: string;
  salesOrderNumber: string;
  customerId: string;
  customerName: string;
  warehouseId: string;
  warehouseName: string;
  status: Extract<DocStatus, "draft" | "posted" | "cancelled">;
  deliveredAt: string;
  notes?: string;
  lines: DeliveryLine[];
  createdAt: string;
  updatedAt: string;
  postedAt?: string;
  invoiceId?: string;
}

export interface InvoiceLine {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  /** Frozen cost basis */
  unitCost: number;
  currency: CurrencyCode;
  lineTotal: number;
  grossProfit: number;
  marginPct: number;
}

export interface Invoice {
  id: string;
  number: string;
  salesOrderId: string;
  salesOrderNumber: string;
  deliveryId?: string;
  deliveryNumber?: string;
  customerId: string;
  customerName: string;
  status: Extract<DocStatus, "draft" | "posted" | "cancelled"> | "paid" | "partial";
  currency: CurrencyCode;
  exchangeRate: number;
  invoicedAt: string;
  dueAt?: string;
  notes?: string;
  lines: InvoiceLine[];
  subtotal: number;
  totalCost: number;
  grossProfit: number;
  marginPct: number;
  amountPaid: number;
  balanceDue: number;
  createdAt: string;
  updatedAt: string;
  postedAt?: string;
}

export interface Payment {
  id: string;
  number: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  currency: CurrencyCode;
  exchangeRate: number;
  method: "cash" | "mobile_money" | "bank_transfer" | "cheque";
  paidAt: string;
  notes?: string;
  createdAt: string;
}
