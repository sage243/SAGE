/**
 * Postgres-backed collection access for masters + inventory.
 * Falls back to caller/JSON when DATABASE_URL is absent.
 */
import type {
  CurrencySettings,
  Customer,
  Product,
  StockBalance,
  StockMovement,
  Supplier,
  Warehouse,
} from "@/lib/domain";
import { dbQuery, isDatabaseConfigured } from "@/lib/db/client";

export { isDatabaseConfigured };

function num(v: unknown, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function mapWarehouse(r: Record<string, unknown>): Warehouse {
  return {
    id: String(r.id),
    code: String(r.code),
    name: String(r.name),
    city: String(r.city),
    address: r.address ? String(r.address) : undefined,
    isDefault: Boolean(r.is_default),
    status: (r.status as Warehouse["status"]) || "actif",
    notes: r.notes ? String(r.notes) : undefined,
    updatedAt: new Date(String(r.updated_at)).toISOString(),
  };
}

function mapSupplier(r: Record<string, unknown>): Supplier {
  return {
    id: String(r.id),
    code: String(r.code),
    legalName: String(r.legal_name),
    contactPerson: r.contact_person ? String(r.contact_person) : undefined,
    phone: String(r.phone),
    email: r.email ? String(r.email) : undefined,
    address: r.address ? String(r.address) : undefined,
    city: String(r.city),
    paymentTermsDays: num(r.payment_terms_days),
    productCategories: Array.isArray(r.product_categories)
      ? (r.product_categories as string[])
      : [],
    status: (r.status as Supplier["status"]) || "actif",
    notes: r.notes ? String(r.notes) : undefined,
    outstandingBalance: num(r.outstanding_balance),
    outstandingCurrency: (r.outstanding_currency as Supplier["outstandingCurrency"]) || "USD",
    createdAt: new Date(String(r.created_at)).toISOString(),
    updatedAt: new Date(String(r.updated_at)).toISOString(),
  };
}

function mapCustomer(r: Record<string, unknown>): Customer {
  return {
    id: String(r.id),
    code: String(r.code),
    type: r.type as Customer["type"],
    legalName: String(r.legal_name),
    contactPerson: r.contact_person ? String(r.contact_person) : undefined,
    phone: String(r.phone),
    whatsapp: r.whatsapp ? String(r.whatsapp) : undefined,
    email: r.email ? String(r.email) : undefined,
    address: r.address ? String(r.address) : undefined,
    city: String(r.city),
    taxId: r.tax_id ? String(r.tax_id) : undefined,
    creditLimit: num(r.credit_limit),
    creditLimitCurrency: (r.credit_limit_currency as Customer["creditLimitCurrency"]) || "USD",
    paymentTermsDays: num(r.payment_terms_days),
    assignedSalesperson: r.assigned_salesperson ? String(r.assigned_salesperson) : undefined,
    status: (r.status as Customer["status"]) || "actif",
    notes: r.notes ? String(r.notes) : undefined,
    createdAt: new Date(String(r.created_at)).toISOString(),
    updatedAt: new Date(String(r.updated_at)).toISOString(),
  };
}

function mapProduct(r: Record<string, unknown>): Product {
  return {
    id: String(r.id),
    sku: String(r.sku),
    name: String(r.name),
    description: String(r.description || ""),
    kind: (r.kind as Product["kind"]) || "product",
    activity: r.activity as Product["activity"],
    category: String(r.category),
    subcategory: r.subcategory ? String(r.subcategory) : undefined,
    brand: r.brand ? String(r.brand) : undefined,
    unitOfMeasure: String(r.unit_of_measure),
    purchasePrice: num(r.purchase_price),
    purchaseCurrency: (r.purchase_currency as Product["purchaseCurrency"]) || "USD",
    transportCost: num(r.transport_cost),
    handlingCost: num(r.handling_cost),
    storageCost: num(r.storage_cost),
    otherDirectCosts: num(r.other_direct_costs),
    landedCost: num(r.landed_cost),
    sellingPrice: num(r.selling_price),
    wholesalePrice: num(r.wholesale_price),
    retailPrice: num(r.retail_price),
    sellingCurrency: (r.selling_currency as Product["sellingCurrency"]) || "USD",
    priceLabel: String(r.price_label || ""),
    minStock: num(r.min_stock),
    maxStock: num(r.max_stock),
    reorderLevel: num(r.reorder_level),
    quantityOnHand: num(r.quantity_on_hand),
    supplierId: r.supplier_id ? String(r.supplier_id) : undefined,
    warehouseId: r.warehouse_id ? String(r.warehouse_id) : undefined,
    batchLot: r.batch_lot ? String(r.batch_lot) : undefined,
    expiryDate: r.expiry_date ? String(r.expiry_date) : undefined,
    status: (r.status as Product["status"]) || "active",
    featured: Boolean(r.featured),
    publicVisible: r.public_visible !== false,
    tags: Array.isArray(r.tags) ? (r.tags as string[]) : [],
    stockNote: r.stock_note ? String(r.stock_note) : undefined,
    imageUrl: r.image_url ? String(r.image_url) : undefined,
    updatedAt: new Date(String(r.updated_at)).toISOString(),
  };
}

function mapBalance(r: Record<string, unknown>): StockBalance {
  return {
    id: String(r.id),
    productId: String(r.product_id),
    sku: String(r.sku),
    productName: String(r.product_name),
    warehouseId: String(r.warehouse_id),
    warehouseName: String(r.warehouse_name),
    quantityOnHand: num(r.quantity_on_hand),
    quantityReserved: num(r.quantity_reserved),
    unitOfMeasure: String(r.unit_of_measure),
    averageUnitCost: num(r.average_unit_cost),
    currency: (r.currency as StockBalance["currency"]) || "USD",
    reorderLevel: num(r.reorder_level),
    updatedAt: new Date(String(r.updated_at)).toISOString(),
  };
}

function mapMovement(r: Record<string, unknown>): StockMovement {
  return {
    id: String(r.id),
    type: r.type as StockMovement["type"],
    productId: String(r.product_id),
    sku: String(r.sku),
    productName: String(r.product_name),
    warehouseId: String(r.warehouse_id),
    warehouseName: String(r.warehouse_name),
    quantity: num(r.quantity),
    quantityDelta: num(r.quantity_delta),
    unitOfMeasure: String(r.unit_of_measure),
    unitCost: num(r.unit_cost),
    currency: (r.currency as StockMovement["currency"]) || "USD",
    referenceType: r.reference_type
      ? (r.reference_type as StockMovement["referenceType"])
      : undefined,
    referenceId: r.reference_id ? String(r.reference_id) : undefined,
    referenceNumber: r.reference_number ? String(r.reference_number) : undefined,
    reason: r.reason ? String(r.reason) : undefined,
    createdAt: new Date(String(r.created_at)).toISOString(),
    createdBy: String(r.created_by || "system"),
  };
}

export async function pgListWarehouses() {
  const res = await dbQuery(`SELECT * FROM warehouses ORDER BY name`);
  return res.rows.map((r) => mapWarehouse(r as Record<string, unknown>));
}

export async function pgListSuppliers() {
  const res = await dbQuery(`SELECT * FROM suppliers ORDER BY legal_name`);
  return res.rows.map((r) => mapSupplier(r as Record<string, unknown>));
}

export async function pgListCustomers() {
  const res = await dbQuery(`SELECT * FROM customers ORDER BY legal_name`);
  return res.rows.map((r) => mapCustomer(r as Record<string, unknown>));
}

export async function pgListProducts() {
  const res = await dbQuery(`SELECT * FROM products ORDER BY name`);
  return res.rows.map((r) => mapProduct(r as Record<string, unknown>));
}

export async function pgGetCurrency(): Promise<CurrencySettings | null> {
  const res = await dbQuery(`SELECT payload FROM currency_settings WHERE id = 1`);
  if (!res.rows[0]) return null;
  return res.rows[0].payload as CurrencySettings;
}

export async function pgListStockBalances() {
  const res = await dbQuery(`SELECT * FROM stock_balances ORDER BY product_name`);
  return res.rows.map((r) => mapBalance(r as Record<string, unknown>));
}

export async function pgListStockMovements() {
  const res = await dbQuery(`SELECT * FROM stock_movements ORDER BY created_at DESC`);
  return res.rows.map((r) => mapMovement(r as Record<string, unknown>));
}

export async function pgReplaceProducts(items: Product[]) {
  // Full replace used by delete/save flows after in-memory edit — transaction
  const client = (await import("@/lib/db/client")).getPool();
  const c = await client.connect();
  try {
    await c.query("BEGIN");
    await c.query("DELETE FROM products");
    for (const p of items) {
      await c.query(
        `INSERT INTO products (
           id, sku, name, description, kind, activity, category, subcategory, brand, unit_of_measure,
           purchase_price, purchase_currency, transport_cost, handling_cost, storage_cost, other_direct_costs,
           landed_cost, selling_price, wholesale_price, retail_price, selling_currency, price_label,
           min_stock, max_stock, reorder_level, quantity_on_hand, supplier_id, warehouse_id, batch_lot,
           expiry_date, status, featured, public_visible, tags, stock_note, image_url, updated_at
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
           $11,$12,$13,$14,$15,$16,
           $17,$18,$19,$20,$21,$22,
           $23,$24,$25,$26,$27,$28,$29,
           $30,$31,$32,$33,$34::jsonb,$35,$36,$37
         )`,
        [
          p.id,
          p.sku,
          p.name,
          p.description || "",
          p.kind,
          p.activity,
          p.category,
          p.subcategory || null,
          p.brand || null,
          p.unitOfMeasure,
          p.purchasePrice,
          p.purchaseCurrency,
          p.transportCost,
          p.handlingCost,
          p.storageCost,
          p.otherDirectCosts,
          p.landedCost,
          p.sellingPrice,
          p.wholesalePrice,
          p.retailPrice,
          p.sellingCurrency,
          p.priceLabel,
          p.minStock,
          p.maxStock,
          p.reorderLevel,
          p.quantityOnHand,
          p.supplierId || null,
          p.warehouseId || null,
          p.batchLot || null,
          p.expiryDate || null,
          p.status,
          p.featured,
          p.publicVisible,
          JSON.stringify(p.tags || []),
          p.stockNote || null,
          p.imageUrl || null,
          p.updatedAt,
        ],
      );
    }
    await c.query("COMMIT");
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}

export async function pgUpsertProduct(p: Product) {
  await dbQuery(
    `INSERT INTO products (
       id, sku, name, description, kind, activity, category, subcategory, brand, unit_of_measure,
       purchase_price, purchase_currency, transport_cost, handling_cost, storage_cost, other_direct_costs,
       landed_cost, selling_price, wholesale_price, retail_price, selling_currency, price_label,
       min_stock, max_stock, reorder_level, quantity_on_hand, supplier_id, warehouse_id, batch_lot,
       expiry_date, status, featured, public_visible, tags, stock_note, image_url, updated_at
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
       $11,$12,$13,$14,$15,$16,
       $17,$18,$19,$20,$21,$22,
       $23,$24,$25,$26,$27,$28,$29,
       $30,$31,$32,$33,$34::jsonb,$35,$36,$37
     )
     ON CONFLICT (id) DO UPDATE SET
       sku=EXCLUDED.sku, name=EXCLUDED.name, description=EXCLUDED.description, kind=EXCLUDED.kind,
       activity=EXCLUDED.activity, category=EXCLUDED.category, subcategory=EXCLUDED.subcategory,
       brand=EXCLUDED.brand, unit_of_measure=EXCLUDED.unit_of_measure,
       purchase_price=EXCLUDED.purchase_price, purchase_currency=EXCLUDED.purchase_currency,
       transport_cost=EXCLUDED.transport_cost, handling_cost=EXCLUDED.handling_cost,
       storage_cost=EXCLUDED.storage_cost, other_direct_costs=EXCLUDED.other_direct_costs,
       landed_cost=EXCLUDED.landed_cost, selling_price=EXCLUDED.selling_price,
       wholesale_price=EXCLUDED.wholesale_price, retail_price=EXCLUDED.retail_price,
       selling_currency=EXCLUDED.selling_currency, price_label=EXCLUDED.price_label,
       min_stock=EXCLUDED.min_stock, max_stock=EXCLUDED.max_stock, reorder_level=EXCLUDED.reorder_level,
       quantity_on_hand=EXCLUDED.quantity_on_hand, supplier_id=EXCLUDED.supplier_id,
       warehouse_id=EXCLUDED.warehouse_id, batch_lot=EXCLUDED.batch_lot, expiry_date=EXCLUDED.expiry_date,
       status=EXCLUDED.status, featured=EXCLUDED.featured, public_visible=EXCLUDED.public_visible,
       tags=EXCLUDED.tags, stock_note=EXCLUDED.stock_note, image_url=EXCLUDED.image_url,
       updated_at=EXCLUDED.updated_at`,
    [
      p.id,
      p.sku,
      p.name,
      p.description || "",
      p.kind,
      p.activity,
      p.category,
      p.subcategory || null,
      p.brand || null,
      p.unitOfMeasure,
      p.purchasePrice,
      p.purchaseCurrency,
      p.transportCost,
      p.handlingCost,
      p.storageCost,
      p.otherDirectCosts,
      p.landedCost,
      p.sellingPrice,
      p.wholesalePrice,
      p.retailPrice,
      p.sellingCurrency,
      p.priceLabel,
      p.minStock,
      p.maxStock,
      p.reorderLevel,
      p.quantityOnHand,
      p.supplierId || null,
      p.warehouseId || null,
      p.batchLot || null,
      p.expiryDate || null,
      p.status,
      p.featured,
      p.publicVisible,
      JSON.stringify(p.tags || []),
      p.stockNote || null,
      p.imageUrl || null,
      p.updatedAt,
    ],
  );
}

export async function pgDeleteProduct(id: string) {
  await dbQuery(`DELETE FROM products WHERE id = $1`, [id]);
}

export async function pgWriteStockBalances(items: StockBalance[]) {
  const client = (await import("@/lib/db/client")).getPool();
  const c = await client.connect();
  try {
    await c.query("BEGIN");
    await c.query("DELETE FROM stock_balances");
    for (const b of items) {
      await c.query(
        `INSERT INTO stock_balances (
           id, product_id, sku, product_name, warehouse_id, warehouse_name,
           quantity_on_hand, quantity_reserved, unit_of_measure, average_unit_cost,
           currency, reorder_level, updated_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          b.id,
          b.productId,
          b.sku,
          b.productName,
          b.warehouseId,
          b.warehouseName,
          b.quantityOnHand,
          b.quantityReserved || 0,
          b.unitOfMeasure,
          b.averageUnitCost,
          b.currency,
          b.reorderLevel,
          b.updatedAt,
        ],
      );
    }
    await c.query("COMMIT");
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}

export async function pgWriteStockMovements(items: StockMovement[]) {
  const client = (await import("@/lib/db/client")).getPool();
  const c = await client.connect();
  try {
    await c.query("BEGIN");
    await c.query("DELETE FROM stock_movements");
    for (const m of items) {
      await c.query(
        `INSERT INTO stock_movements (
           id, type, product_id, sku, product_name, warehouse_id, warehouse_name,
           quantity, quantity_delta, unit_of_measure, unit_cost, currency,
           reference_type, reference_id, reference_number, reason, created_at, created_by
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
        [
          m.id,
          m.type,
          m.productId,
          m.sku,
          m.productName,
          m.warehouseId,
          m.warehouseName,
          m.quantity,
          m.quantityDelta,
          m.unitOfMeasure,
          m.unitCost,
          m.currency,
          m.referenceType || null,
          m.referenceId || null,
          m.referenceNumber || null,
          m.reason || null,
          m.createdAt,
          m.createdBy,
        ],
      );
    }
    await c.query("COMMIT");
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}
