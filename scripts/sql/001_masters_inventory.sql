-- SAGE Platform — masters + inventory (PostgreSQL 18 / Render)
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS schema_meta (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS warehouses (
  id text PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  city text NOT NULL,
  address text,
  is_default boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'actif',
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS suppliers (
  id text PRIMARY KEY,
  code text NOT NULL UNIQUE,
  legal_name text NOT NULL,
  contact_person text,
  phone text NOT NULL,
  email text,
  address text,
  city text NOT NULL,
  payment_terms_days integer NOT NULL DEFAULT 0,
  product_categories jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'actif',
  notes text,
  outstanding_balance numeric(18,4) NOT NULL DEFAULT 0,
  outstanding_currency text NOT NULL DEFAULT 'USD',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customers (
  id text PRIMARY KEY,
  code text NOT NULL UNIQUE,
  type text NOT NULL,
  legal_name text NOT NULL,
  contact_person text,
  phone text NOT NULL,
  whatsapp text,
  email text,
  address text,
  city text NOT NULL,
  tax_id text,
  credit_limit numeric(18,4) NOT NULL DEFAULT 0,
  credit_limit_currency text NOT NULL DEFAULT 'USD',
  payment_terms_days integer NOT NULL DEFAULT 0,
  assigned_salesperson text,
  status text NOT NULL DEFAULT 'actif',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY,
  sku text NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'product',
  activity text NOT NULL,
  category text NOT NULL,
  subcategory text,
  brand text,
  unit_of_measure text NOT NULL,
  purchase_price numeric(18,6) NOT NULL DEFAULT 0,
  purchase_currency text NOT NULL DEFAULT 'USD',
  transport_cost numeric(18,6) NOT NULL DEFAULT 0,
  handling_cost numeric(18,6) NOT NULL DEFAULT 0,
  storage_cost numeric(18,6) NOT NULL DEFAULT 0,
  other_direct_costs numeric(18,6) NOT NULL DEFAULT 0,
  landed_cost numeric(18,6) NOT NULL DEFAULT 0,
  selling_price numeric(18,6) NOT NULL DEFAULT 0,
  wholesale_price numeric(18,6) NOT NULL DEFAULT 0,
  retail_price numeric(18,6) NOT NULL DEFAULT 0,
  selling_currency text NOT NULL DEFAULT 'USD',
  price_label text NOT NULL DEFAULT '',
  min_stock numeric(18,4) NOT NULL DEFAULT 0,
  max_stock numeric(18,4) NOT NULL DEFAULT 0,
  reorder_level numeric(18,4) NOT NULL DEFAULT 0,
  quantity_on_hand numeric(18,4) NOT NULL DEFAULT 0,
  supplier_id text,
  warehouse_id text,
  batch_lot text,
  expiry_date text,
  status text NOT NULL DEFAULT 'active',
  featured boolean NOT NULL DEFAULT false,
  public_visible boolean NOT NULL DEFAULT true,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  stock_note text,
  image_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS products_sku_uidx ON products (sku);
CREATE INDEX IF NOT EXISTS products_activity_idx ON products (activity);
CREATE INDEX IF NOT EXISTS products_status_idx ON products (status);

CREATE TABLE IF NOT EXISTS currency_settings (
  id integer PRIMARY KEY DEFAULT 1,
  base_currency text NOT NULL DEFAULT 'USD',
  payload jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_balances (
  id text PRIMARY KEY,
  product_id text NOT NULL,
  sku text NOT NULL,
  product_name text NOT NULL,
  warehouse_id text NOT NULL,
  warehouse_name text NOT NULL,
  quantity_on_hand numeric(18,4) NOT NULL DEFAULT 0,
  quantity_reserved numeric(18,4) NOT NULL DEFAULT 0,
  unit_of_measure text NOT NULL,
  average_unit_cost numeric(18,6) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  reorder_level numeric(18,4) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS stock_balances_product_wh_uidx
  ON stock_balances (product_id, warehouse_id);
CREATE INDEX IF NOT EXISTS stock_balances_wh_idx ON stock_balances (warehouse_id);

CREATE TABLE IF NOT EXISTS stock_movements (
  id text PRIMARY KEY,
  type text NOT NULL,
  product_id text NOT NULL,
  sku text NOT NULL,
  product_name text NOT NULL,
  warehouse_id text NOT NULL,
  warehouse_name text NOT NULL,
  quantity numeric(18,4) NOT NULL,
  quantity_delta numeric(18,4) NOT NULL,
  unit_of_measure text NOT NULL,
  unit_cost numeric(18,6) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  reference_type text,
  reference_id text,
  reference_number text,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text NOT NULL DEFAULT 'system'
);

CREATE INDEX IF NOT EXISTS stock_movements_product_created_idx
  ON stock_movements (product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS stock_movements_ref_idx
  ON stock_movements (reference_type, reference_id);

INSERT INTO schema_meta (key, value, updated_at)
VALUES ('masters_inventory_version', '1', now())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
