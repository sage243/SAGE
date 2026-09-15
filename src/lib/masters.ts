import { computeLandedCost, type CurrencySettings, type Customer, type Product, type Supplier, type Warehouse } from "./domain";
import { readCollection, readObject, writeCollection, writeObject } from "./json-db";
import { uid } from "./utils";

const SEED_WAREHOUSES: Warehouse[] = [
  {
    id: "wh_gombe_01",
    code: "WH-GOMBE",
    name: "Dépôt Gombe",
    city: "Kinshasa",
    address: "644 Av. Tombalbaye, Immeuble Masamba",
    isDefault: true,
    status: "actif",
    updatedAt: "2026-09-15T08:00:00.000Z",
  },
  {
    id: "wh_limete_01",
    code: "WH-LIMETE",
    name: "Entrepôt Limete",
    city: "Kinshasa",
    address: "Zone industrielle Limete",
    isDefault: false,
    status: "actif",
    updatedAt: "2026-09-15T08:00:00.000Z",
  },
];

const SEED_SUPPLIERS: Supplier[] = [
  {
    id: "sup_riz_01",
    code: "FRN-001",
    legalName: "Maison du Riz Grand Marché",
    contactPerson: "Pascal Mukendi",
    phone: "+243 810 111 222",
    email: "commandes@maisonriz.cd",
    city: "Kinshasa",
    paymentTermsDays: 7,
    productCategories: ["vivres", "riz", "huiles"],
    status: "actif",
    outstandingBalance: 0,
    outstandingCurrency: "USD",
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-01T10:00:00.000Z",
  },
  {
    id: "sup_huile_01",
    code: "FRN-002",
    legalName: "Huilerie Congo Distribution",
    contactPerson: "Grace Ilunga",
    phone: "+243 990 333 444",
    city: "Kinshasa",
    paymentTermsDays: 14,
    productCategories: ["huiles", "épicerie"],
    status: "actif",
    outstandingBalance: 450,
    outstandingCurrency: "USD",
    createdAt: "2026-09-02T10:00:00.000Z",
    updatedAt: "2026-09-10T10:00:00.000Z",
  },
];

const SEED_CUSTOMERS: Customer[] = [
  {
    id: "cus_hotel_01",
    code: "CLI-001",
    type: "entreprise",
    legalName: "Hôtel Riviera Gombe",
    contactPerson: "Amina Kabongo",
    phone: "+243 812 345 678",
    whatsapp: "+243 812 345 678",
    email: "achats@riviera.cd",
    address: "Gombe",
    city: "Kinshasa",
    creditLimit: 2000,
    creditLimitCurrency: "USD",
    paymentTermsDays: 15,
    assignedSalesperson: "Équipe Commerce",
    status: "actif",
    createdAt: "2026-09-05T10:00:00.000Z",
    updatedAt: "2026-09-05T10:00:00.000Z",
  },
  {
    id: "cus_cantine_01",
    code: "CLI-002",
    type: "entreprise",
    legalName: "Cantine Enterprise Solutions",
    contactPerson: "Jean Batumike",
    phone: "+243 850 777 888",
    city: "Kinshasa",
    creditLimit: 800,
    creditLimitCurrency: "USD",
    paymentTermsDays: 7,
    status: "actif",
    createdAt: "2026-09-06T10:00:00.000Z",
    updatedAt: "2026-09-06T10:00:00.000Z",
  },
  {
    id: "cus_part_01",
    code: "CLI-003",
    type: "particulier",
    legalName: "Famille Mwamba",
    phone: "+243 970 111 000",
    city: "Kinshasa",
    creditLimit: 0,
    creditLimitCurrency: "USD",
    paymentTermsDays: 0,
    status: "actif",
    notes: "Client paniers vivres hebdomadaires",
    createdAt: "2026-09-07T10:00:00.000Z",
    updatedAt: "2026-09-07T10:00:00.000Z",
  },
];

function productSeed(partial: Omit<Product, "landedCost" | "updatedAt"> & { updatedAt?: string }): Product {
  const landedCost = computeLandedCost(partial);
  return {
    ...partial,
    landedCost,
    updatedAt: partial.updatedAt || "2026-09-15T08:00:00.000Z",
  };
}

const SEED_PRODUCTS: Product[] = [
  productSeed({
    id: "prd_riz_25",
    sku: "VIV-RIZ-25",
    name: "Riz parfumé 25 kg",
    description: "Sac de riz 25 kg pour grossistes, cantines et hôtels. Rotation rapide.",
    kind: "product",
    activity: "restauration-vivres",
    category: "Vivres",
    subcategory: "Céréales",
    brand: "Maison du Riz",
    unitOfMeasure: "sac",
    purchasePrice: 28,
    purchaseCurrency: "USD",
    transportCost: 1.5,
    handlingCost: 0.5,
    storageCost: 0.3,
    otherDirectCosts: 0.2,
    sellingPrice: 36,
    wholesalePrice: 34,
    retailPrice: 38,
    sellingCurrency: "USD",
    priceLabel: "34–38 USD / sac",
    minStock: 40,
    maxStock: 400,
    reorderLevel: 60,
    quantityOnHand: 120,
    supplierId: "sup_riz_01",
    warehouseId: "wh_limete_01",
    status: "active",
    featured: true,
    publicVisible: true,
    tags: ["vivres", "gros", "cash"],
    stockNote: "Réassort 2× / semaine",
  }),
  productSeed({
    id: "prd_huile_5",
    sku: "VIV-HUI-5L",
    name: "Huile végétale 5 L",
    description: "Bidon 5 litres pour distribution urbaine et restauration.",
    kind: "product",
    activity: "restauration-vivres",
    category: "Vivres",
    subcategory: "Huiles",
    unitOfMeasure: "bidon",
    purchasePrice: 9.5,
    purchaseCurrency: "USD",
    transportCost: 0.4,
    handlingCost: 0.2,
    storageCost: 0.1,
    otherDirectCosts: 0,
    sellingPrice: 12.5,
    wholesalePrice: 11.8,
    retailPrice: 13,
    sellingCurrency: "USD",
    priceLabel: "11,8–13 USD / bidon",
    minStock: 80,
    maxStock: 600,
    reorderLevel: 100,
    quantityOnHand: 45,
    supplierId: "sup_huile_01",
    warehouseId: "wh_limete_01",
    status: "active",
    featured: true,
    publicVisible: true,
    tags: ["vivres", "stock-bas"],
  }),
  productSeed({
    id: "prd_panier_01",
    sku: "VIV-PAN-SEM",
    name: "Panier vivres urbains (semaine)",
    description: "Assortiment vivres secs pour ménages et petites cantines. Livraison groupée samedi.",
    kind: "product",
    activity: "restauration-vivres",
    category: "Vivres",
    subcategory: "Paniers",
    unitOfMeasure: "panier",
    purchasePrice: 28,
    purchaseCurrency: "USD",
    transportCost: 2,
    handlingCost: 1,
    storageCost: 0.5,
    otherDirectCosts: 0.5,
    sellingPrice: 45,
    wholesalePrice: 42,
    retailPrice: 48,
    sellingCurrency: "USD",
    priceLabel: "42–48 USD / panier",
    minStock: 20,
    maxStock: 100,
    reorderLevel: 25,
    quantityOnHand: 30,
    warehouseId: "wh_gombe_01",
    status: "active",
    featured: true,
    publicVisible: true,
    tags: ["distribution", "ménages"],
  }),
  productSeed({
    id: "prd_frein_01",
    sku: "COM-FRN-KIT",
    name: "Kit pièces freinage utilitaire",
    description: "Plaquettes, disques et liquide pour flottes légères Kinshasa.",
    kind: "product",
    activity: "commerce-general",
    category: "Automobile",
    subcategory: "Freinage",
    unitOfMeasure: "kit",
    purchasePrice: 48,
    purchaseCurrency: "USD",
    transportCost: 3,
    handlingCost: 1,
    storageCost: 0.5,
    otherDirectCosts: 0.5,
    sellingPrice: 72,
    wholesalePrice: 68,
    retailPrice: 75,
    sellingCurrency: "USD",
    priceLabel: "Sur cotation · ~68–75 USD",
    minStock: 10,
    maxStock: 80,
    reorderLevel: 15,
    quantityOnHand: 22,
    warehouseId: "wh_limete_01",
    status: "active",
    featured: true,
    publicVisible: true,
    tags: ["automobile", "B2B"],
  }),
  productSeed({
    id: "prd_traiteur_01",
    sku: "RST-TRT-MIDI",
    name: "Traiteur bureaux — formule midi",
    description: "Livraison repas chauds 10–80 couverts, Gombe et communes proches.",
    kind: "service",
    activity: "restauration-vivres",
    category: "Restauration",
    subcategory: "Traiteur",
    unitOfMeasure: "couvert",
    purchasePrice: 3.2,
    purchaseCurrency: "USD",
    transportCost: 0.4,
    handlingCost: 0.3,
    storageCost: 0,
    otherDirectCosts: 0.3,
    sellingPrice: 6,
    wholesalePrice: 5.5,
    retailPrice: 6.5,
    sellingCurrency: "USD",
    priceLabel: "À partir de 6 USD / couvert",
    minStock: 0,
    maxStock: 0,
    reorderLevel: 0,
    quantityOnHand: 0,
    status: "active",
    featured: true,
    publicVisible: true,
    tags: ["traiteur", "entreprises"],
  }),
  productSeed({
    id: "prd_visa_01",
    sku: "VOY-VISA-SVC",
    name: "Dossier visa Schengen / Afrique",
    description: "Service d’accompagnement visa — activité future, vitrine uniquement.",
    kind: "service",
    activity: "agence-voyage",
    category: "Voyage",
    unitOfMeasure: "dossier",
    purchasePrice: 0,
    purchaseCurrency: "USD",
    transportCost: 0,
    handlingCost: 0,
    storageCost: 0,
    otherDirectCosts: 0,
    sellingPrice: 80,
    wholesalePrice: 80,
    retailPrice: 80,
    sellingCurrency: "USD",
    priceLabel: "Frais de service + coûts consulaires",
    minStock: 0,
    maxStock: 0,
    reorderLevel: 0,
    quantityOnHand: 0,
    status: "active",
    featured: false,
    publicVisible: true,
    tags: ["future", "visa"],
  }),
];

const SEED_CURRENCY: CurrencySettings = {
  baseCurrency: "USD",
  rates: [
    {
      id: "fx_usd_cdf_1",
      from: "USD",
      to: "CDF",
      rate: 2850,
      effectiveAt: "2026-09-15T06:00:00.000Z",
      source: "Référence interne SAGE",
    },
  ],
};

export async function listWarehouses() {
  return readCollection("warehouses.json", SEED_WAREHOUSES);
}

export async function saveWarehouse(input: Omit<Warehouse, "id" | "updatedAt"> & { id?: string }) {
  const items = await listWarehouses();
  const now = new Date().toISOString();
  if (input.id) {
    const idx = items.findIndex((w) => w.id === input.id);
    if (idx === -1) throw new Error("Entrepôt introuvable");
    items[idx] = { ...items[idx], ...input, id: input.id, updatedAt: now };
    await writeCollection("warehouses.json", items);
    return items[idx];
  }
  const created: Warehouse = { ...input, id: uid("wh"), updatedAt: now };
  items.unshift(created);
  await writeCollection("warehouses.json", items);
  return created;
}

export async function listSuppliers() {
  return readCollection("suppliers.json", SEED_SUPPLIERS);
}

export async function saveSupplier(input: Omit<Supplier, "id" | "createdAt" | "updatedAt"> & { id?: string }) {
  const items = await listSuppliers();
  const now = new Date().toISOString();
  if (input.id) {
    const idx = items.findIndex((s) => s.id === input.id);
    if (idx === -1) throw new Error("Fournisseur introuvable");
    items[idx] = { ...items[idx], ...input, id: input.id, updatedAt: now };
    await writeCollection("suppliers.json", items);
    return items[idx];
  }
  const created: Supplier = {
    ...input,
    id: uid("sup"),
    createdAt: now,
    updatedAt: now,
  };
  items.unshift(created);
  await writeCollection("suppliers.json", items);
  return created;
}

export async function listCustomers() {
  return readCollection("customers.json", SEED_CUSTOMERS);
}

export async function saveCustomer(input: Omit<Customer, "id" | "createdAt" | "updatedAt"> & { id?: string }) {
  const items = await listCustomers();
  const now = new Date().toISOString();
  if (input.id) {
    const idx = items.findIndex((c) => c.id === input.id);
    if (idx === -1) throw new Error("Client introuvable");
    items[idx] = { ...items[idx], ...input, id: input.id, updatedAt: now };
    await writeCollection("customers.json", items);
    return items[idx];
  }
  const created: Customer = {
    ...input,
    id: uid("cus"),
    createdAt: now,
    updatedAt: now,
  };
  items.unshift(created);
  await writeCollection("customers.json", items);
  return created;
}

export async function listProducts() {
  return readCollection("products-master.json", SEED_PRODUCTS);
}

export async function getProduct(id: string) {
  return (await listProducts()).find((p) => p.id === id);
}

export async function saveProduct(
  input: Omit<Product, "id" | "updatedAt" | "landedCost"> & { id?: string; landedCost?: number },
) {
  const items = await listProducts();
  const now = new Date().toISOString();
  const landedCost = computeLandedCost(input);
  if (input.id) {
    const idx = items.findIndex((p) => p.id === input.id);
    if (idx === -1) throw new Error("Produit introuvable");
    items[idx] = {
      ...items[idx],
      ...input,
      id: input.id,
      landedCost,
      updatedAt: now,
    };
    await writeCollection("products-master.json", items);
    return items[idx];
  }
  const created: Product = {
    ...input,
    id: uid("prd"),
    landedCost,
    updatedAt: now,
  };
  items.unshift(created);
  await writeCollection("products-master.json", items);
  return created;
}

export async function deleteProduct(id: string) {
  const items = await listProducts();
  await writeCollection(
    "products-master.json",
    items.filter((p) => p.id !== id),
  );
}

export async function getCurrencySettings() {
  return readObject("currency.json", SEED_CURRENCY);
}

export async function saveCurrencySettings(settings: CurrencySettings) {
  await writeObject("currency.json", settings);
  return settings;
}

export async function getGestionDashboard() {
  const [products, customers, suppliers, warehouses, currency] = await Promise.all([
    listProducts(),
    listCustomers(),
    listSuppliers(),
    listWarehouses(),
    getCurrencySettings(),
  ]);

  const activeProducts = products.filter((p) => p.status === "active");
  const lowStock = activeProducts.filter(
    (p) => p.kind === "product" && p.reorderLevel > 0 && p.quantityOnHand <= p.reorderLevel,
  );
  const outOfStock = activeProducts.filter(
    (p) => p.kind === "product" && p.minStock > 0 && p.quantityOnHand <= 0,
  );
  const inventoryValue = activeProducts.reduce(
    (sum, p) => sum + p.landedCost * Math.max(p.quantityOnHand, 0),
    0,
  );
  const marginSamples = activeProducts
    .filter((p) => p.sellingPrice > 0)
    .map((p) => ({
      id: p.id,
      name: p.name,
      marginPct: ((p.sellingPrice - p.landedCost) / p.sellingPrice) * 100,
      grossProfit: p.sellingPrice - p.landedCost,
    }))
    .sort((a, b) => b.marginPct - a.marginPct);

  return {
    counts: {
      products: activeProducts.length,
      customers: customers.filter((c) => c.status === "actif").length,
      suppliers: suppliers.filter((s) => s.status === "actif").length,
      warehouses: warehouses.filter((w) => w.status === "actif").length,
      lowStock: lowStock.length,
      outOfStock: outOfStock.length,
    },
    inventoryValueUsd: inventoryValue,
    lowStock,
    topMargins: marginSamples.slice(0, 5),
    fx: currency.rates[0] || null,
    baseCurrency: currency.baseCurrency,
  };
}
