/**
 * Drizzle schema — masters + inventory (Render PostgreSQL 18).
 * Document chains (sales/purchases/recipes) stay on JSON until Phase B.
 */
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const warehouses = pgTable("warehouses", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  address: text("address"),
  isDefault: boolean("is_default").notNull().default(false),
  status: text("status").notNull().default("actif"),
  notes: text("notes"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const suppliers = pgTable("suppliers", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  legalName: text("legal_name").notNull(),
  contactPerson: text("contact_person"),
  phone: text("phone").notNull(),
  email: text("email"),
  address: text("address"),
  city: text("city").notNull(),
  paymentTermsDays: integer("payment_terms_days").notNull().default(0),
  productCategories: jsonb("product_categories").$type<string[]>().notNull().default([]),
  status: text("status").notNull().default("actif"),
  notes: text("notes"),
  outstandingBalance: numeric("outstanding_balance", { precision: 18, scale: 4 }).notNull().default("0"),
  outstandingCurrency: text("outstanding_currency").notNull().default("USD"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const customers = pgTable("customers", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  type: text("type").notNull(),
  legalName: text("legal_name").notNull(),
  contactPerson: text("contact_person"),
  phone: text("phone").notNull(),
  whatsapp: text("whatsapp"),
  email: text("email"),
  address: text("address"),
  city: text("city").notNull(),
  taxId: text("tax_id"),
  creditLimit: numeric("credit_limit", { precision: 18, scale: 4 }).notNull().default("0"),
  creditLimitCurrency: text("credit_limit_currency").notNull().default("USD"),
  paymentTermsDays: integer("payment_terms_days").notNull().default(0),
  assignedSalesperson: text("assigned_salesperson"),
  status: text("status").notNull().default("actif"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const products = pgTable(
  "products",
  {
    id: text("id").primaryKey(),
    sku: text("sku").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    kind: text("kind").notNull().default("product"),
    activity: text("activity").notNull(),
    category: text("category").notNull(),
    subcategory: text("subcategory"),
    brand: text("brand"),
    unitOfMeasure: text("unit_of_measure").notNull(),
    purchasePrice: numeric("purchase_price", { precision: 18, scale: 6 }).notNull().default("0"),
    purchaseCurrency: text("purchase_currency").notNull().default("USD"),
    transportCost: numeric("transport_cost", { precision: 18, scale: 6 }).notNull().default("0"),
    handlingCost: numeric("handling_cost", { precision: 18, scale: 6 }).notNull().default("0"),
    storageCost: numeric("storage_cost", { precision: 18, scale: 6 }).notNull().default("0"),
    otherDirectCosts: numeric("other_direct_costs", { precision: 18, scale: 6 }).notNull().default("0"),
    landedCost: numeric("landed_cost", { precision: 18, scale: 6 }).notNull().default("0"),
    sellingPrice: numeric("selling_price", { precision: 18, scale: 6 }).notNull().default("0"),
    wholesalePrice: numeric("wholesale_price", { precision: 18, scale: 6 }).notNull().default("0"),
    retailPrice: numeric("retail_price", { precision: 18, scale: 6 }).notNull().default("0"),
    sellingCurrency: text("selling_currency").notNull().default("USD"),
    priceLabel: text("price_label").notNull().default(""),
    minStock: numeric("min_stock", { precision: 18, scale: 4 }).notNull().default("0"),
    maxStock: numeric("max_stock", { precision: 18, scale: 4 }).notNull().default("0"),
    reorderLevel: numeric("reorder_level", { precision: 18, scale: 4 }).notNull().default("0"),
    quantityOnHand: numeric("quantity_on_hand", { precision: 18, scale: 4 }).notNull().default("0"),
    supplierId: text("supplier_id"),
    warehouseId: text("warehouse_id"),
    batchLot: text("batch_lot"),
    expiryDate: text("expiry_date"),
    status: text("status").notNull().default("active"),
    featured: boolean("featured").notNull().default(false),
    publicVisible: boolean("public_visible").notNull().default(true),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    stockNote: text("stock_note"),
    imageUrl: text("image_url"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    uniqueIndex("products_sku_uidx").on(t.sku),
    index("products_activity_idx").on(t.activity),
    index("products_status_idx").on(t.status),
  ],
);

export const currencySettings = pgTable("currency_settings", {
  id: integer("id").primaryKey().default(1),
  baseCurrency: text("base_currency").notNull().default("USD"),
  payload: jsonb("payload").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const stockBalances = pgTable(
  "stock_balances",
  {
    id: text("id").primaryKey(),
    productId: text("product_id").notNull(),
    sku: text("sku").notNull(),
    productName: text("product_name").notNull(),
    warehouseId: text("warehouse_id").notNull(),
    warehouseName: text("warehouse_name").notNull(),
    quantityOnHand: numeric("quantity_on_hand", { precision: 18, scale: 4 }).notNull().default("0"),
    quantityReserved: numeric("quantity_reserved", { precision: 18, scale: 4 }).notNull().default("0"),
    unitOfMeasure: text("unit_of_measure").notNull(),
    averageUnitCost: numeric("average_unit_cost", { precision: 18, scale: 6 }).notNull().default("0"),
    currency: text("currency").notNull().default("USD"),
    reorderLevel: numeric("reorder_level", { precision: 18, scale: 4 }).notNull().default("0"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    uniqueIndex("stock_balances_product_wh_uidx").on(t.productId, t.warehouseId),
    index("stock_balances_wh_idx").on(t.warehouseId),
  ],
);

export const stockMovements = pgTable(
  "stock_movements",
  {
    id: text("id").primaryKey(),
    type: text("type").notNull(),
    productId: text("product_id").notNull(),
    sku: text("sku").notNull(),
    productName: text("product_name").notNull(),
    warehouseId: text("warehouse_id").notNull(),
    warehouseName: text("warehouse_name").notNull(),
    quantity: numeric("quantity", { precision: 18, scale: 4 }).notNull(),
    quantityDelta: numeric("quantity_delta", { precision: 18, scale: 4 }).notNull(),
    unitOfMeasure: text("unit_of_measure").notNull(),
    unitCost: numeric("unit_cost", { precision: 18, scale: 6 }).notNull().default("0"),
    currency: text("currency").notNull().default("USD"),
    referenceType: text("reference_type"),
    referenceId: text("reference_id"),
    referenceNumber: text("reference_number"),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    createdBy: text("created_by").notNull().default("system"),
  },
  (t) => [
    index("stock_movements_product_created_idx").on(t.productId, t.createdAt),
    index("stock_movements_ref_idx").on(t.referenceType, t.referenceId),
  ],
);

export const schemaMeta = pgTable("schema_meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});
