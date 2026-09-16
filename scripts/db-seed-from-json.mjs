#!/usr/bin/env node
/**
 * Seed Render Postgres from local data/*.json (masters + inventory).
 * Usage: DATABASE_URL=... node scripts/db-seed-from-json.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");
const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DATABASE_URL manquant");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: url,
  ssl: /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: false },
});

function readJson(name, fallback) {
  const p = path.join(dataDir, name);
  if (!fs.existsSync(p)) return fallback;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function n(v, d = 0) {
  const x = Number(v);
  return Number.isFinite(x) ? x : d;
}

function ts(v) {
  if (!v) return new Date().toISOString();
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const warehouses = readJson("warehouses.json", []);
    for (const w of warehouses) {
      await client.query(
        `INSERT INTO warehouses (id, code, name, city, address, is_default, status, notes, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (id) DO UPDATE SET
           code=EXCLUDED.code, name=EXCLUDED.name, city=EXCLUDED.city, address=EXCLUDED.address,
           is_default=EXCLUDED.is_default, status=EXCLUDED.status, notes=EXCLUDED.notes,
           updated_at=EXCLUDED.updated_at`,
        [
          w.id,
          w.code,
          w.name,
          w.city,
          w.address || null,
          Boolean(w.isDefault),
          w.status || "actif",
          w.notes || null,
          ts(w.updatedAt),
        ],
      );
    }
    console.log("warehouses", warehouses.length);

    const suppliers = readJson("suppliers.json", []);
    for (const s of suppliers) {
      await client.query(
        `INSERT INTO suppliers (
           id, code, legal_name, contact_person, phone, email, address, city,
           payment_terms_days, product_categories, status, notes,
           outstanding_balance, outstanding_currency, created_at, updated_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12,$13,$14,$15,$16)
         ON CONFLICT (id) DO UPDATE SET
           code=EXCLUDED.code, legal_name=EXCLUDED.legal_name, contact_person=EXCLUDED.contact_person,
           phone=EXCLUDED.phone, email=EXCLUDED.email, address=EXCLUDED.address, city=EXCLUDED.city,
           payment_terms_days=EXCLUDED.payment_terms_days, product_categories=EXCLUDED.product_categories,
           status=EXCLUDED.status, notes=EXCLUDED.notes,
           outstanding_balance=EXCLUDED.outstanding_balance, outstanding_currency=EXCLUDED.outstanding_currency,
           updated_at=EXCLUDED.updated_at`,
        [
          s.id,
          s.code,
          s.legalName,
          s.contactPerson || null,
          s.phone,
          s.email || null,
          s.address || null,
          s.city,
          n(s.paymentTermsDays),
          JSON.stringify(s.productCategories || []),
          s.status || "actif",
          s.notes || null,
          n(s.outstandingBalance),
          s.outstandingCurrency || "USD",
          ts(s.createdAt),
          ts(s.updatedAt),
        ],
      );
    }
    console.log("suppliers", suppliers.length);

    const customers = readJson("customers.json", []);
    for (const c of customers) {
      await client.query(
        `INSERT INTO customers (
           id, code, type, legal_name, contact_person, phone, whatsapp, email, address, city, tax_id,
           credit_limit, credit_limit_currency, payment_terms_days, assigned_salesperson, status, notes,
           created_at, updated_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
         ON CONFLICT (id) DO UPDATE SET
           code=EXCLUDED.code, type=EXCLUDED.type, legal_name=EXCLUDED.legal_name,
           contact_person=EXCLUDED.contact_person, phone=EXCLUDED.phone, whatsapp=EXCLUDED.whatsapp,
           email=EXCLUDED.email, address=EXCLUDED.address, city=EXCLUDED.city, tax_id=EXCLUDED.tax_id,
           credit_limit=EXCLUDED.credit_limit, credit_limit_currency=EXCLUDED.credit_limit_currency,
           payment_terms_days=EXCLUDED.payment_terms_days, assigned_salesperson=EXCLUDED.assigned_salesperson,
           status=EXCLUDED.status, notes=EXCLUDED.notes, updated_at=EXCLUDED.updated_at`,
        [
          c.id,
          c.code,
          c.type,
          c.legalName,
          c.contactPerson || null,
          c.phone,
          c.whatsapp || null,
          c.email || null,
          c.address || null,
          c.city,
          c.taxId || null,
          n(c.creditLimit),
          c.creditLimitCurrency || "USD",
          n(c.paymentTermsDays),
          c.assignedSalesperson || null,
          c.status || "actif",
          c.notes || null,
          ts(c.createdAt),
          ts(c.updatedAt),
        ],
      );
    }
    console.log("customers", customers.length);

    const products = readJson("products-master.json", []);
    for (const p of products) {
      await client.query(
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
          p.kind || "product",
          p.activity,
          p.category,
          p.subcategory || null,
          p.brand || null,
          p.unitOfMeasure,
          n(p.purchasePrice),
          p.purchaseCurrency || "USD",
          n(p.transportCost),
          n(p.handlingCost),
          n(p.storageCost),
          n(p.otherDirectCosts),
          n(p.landedCost),
          n(p.sellingPrice),
          n(p.wholesalePrice),
          n(p.retailPrice),
          p.sellingCurrency || "USD",
          p.priceLabel || "",
          n(p.minStock),
          n(p.maxStock),
          n(p.reorderLevel),
          n(p.quantityOnHand),
          p.supplierId || null,
          p.warehouseId || null,
          p.batchLot || null,
          p.expiryDate || null,
          p.status || "active",
          Boolean(p.featured),
          p.publicVisible !== false,
          JSON.stringify(p.tags || []),
          p.stockNote || null,
          p.imageUrl || null,
          ts(p.updatedAt),
        ],
      );
    }
    console.log("products", products.length);

    const currency = readJson("currency.json", { baseCurrency: "USD", rates: [] });
    await client.query(
      `INSERT INTO currency_settings (id, base_currency, payload, updated_at)
       VALUES (1, $1, $2::jsonb, now())
       ON CONFLICT (id) DO UPDATE SET base_currency=EXCLUDED.base_currency, payload=EXCLUDED.payload, updated_at=now()`,
      [currency.baseCurrency || "USD", JSON.stringify(currency)],
    );
    console.log("currency_settings 1");

    const balances = readJson("stock-balances.json", []);
    for (const b of balances) {
      await client.query(
        `INSERT INTO stock_balances (
           id, product_id, sku, product_name, warehouse_id, warehouse_name,
           quantity_on_hand, quantity_reserved, unit_of_measure, average_unit_cost,
           currency, reorder_level, updated_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT (id) DO UPDATE SET
           product_id=EXCLUDED.product_id, sku=EXCLUDED.sku, product_name=EXCLUDED.product_name,
           warehouse_id=EXCLUDED.warehouse_id, warehouse_name=EXCLUDED.warehouse_name,
           quantity_on_hand=EXCLUDED.quantity_on_hand, quantity_reserved=EXCLUDED.quantity_reserved,
           unit_of_measure=EXCLUDED.unit_of_measure, average_unit_cost=EXCLUDED.average_unit_cost,
           currency=EXCLUDED.currency, reorder_level=EXCLUDED.reorder_level, updated_at=EXCLUDED.updated_at`,
        [
          b.id,
          b.productId,
          b.sku,
          b.productName,
          b.warehouseId,
          b.warehouseName,
          n(b.quantityOnHand),
          n(b.quantityReserved),
          b.unitOfMeasure,
          n(b.averageUnitCost),
          b.currency || "USD",
          n(b.reorderLevel),
          ts(b.updatedAt),
        ],
      );
    }
    console.log("stock_balances", balances.length);

    const movements = readJson("stock-movements.json", []);
    for (const m of movements) {
      await client.query(
        `INSERT INTO stock_movements (
           id, type, product_id, sku, product_name, warehouse_id, warehouse_name,
           quantity, quantity_delta, unit_of_measure, unit_cost, currency,
           reference_type, reference_id, reference_number, reason, created_at, created_by
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
         ON CONFLICT (id) DO NOTHING`,
        [
          m.id,
          m.type,
          m.productId,
          m.sku,
          m.productName,
          m.warehouseId,
          m.warehouseName,
          n(m.quantity),
          n(m.quantityDelta),
          m.unitOfMeasure,
          n(m.unitCost),
          m.currency || "USD",
          m.referenceType || null,
          m.referenceId || null,
          m.referenceNumber || null,
          m.reason || null,
          ts(m.createdAt),
          m.createdBy || "system",
        ],
      );
    }
    console.log("stock_movements", movements.length);

    await client.query("COMMIT");
    console.log("Seed OK");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
