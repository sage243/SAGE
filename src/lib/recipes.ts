import type { CurrencyCode, Recipe, RecipeIngredient, RecipeProduction } from "./domain";
import { computeGrossMargin } from "./domain";
import { applyStockDelta, getStockBalance } from "./inventory";
import { getCurrencySettings, getProduct, listCustomers, listProducts, listWarehouses } from "./masters";
import { readCollection, writeCollection } from "./json-db";
import { uid } from "./utils";

function money(n: number) {
  return Number(Number(n || 0).toFixed(4));
}

const SEED_RECIPES: Recipe[] = [];
const SEED_PRODUCTIONS: RecipeProduction[] = [];

export async function listRecipes() {
  const items = await readCollection("recipes.json", SEED_RECIPES);
  if (items.length === 0) {
    const seeded = await seedDefaultRecipes();
    return seeded;
  }
  return items.sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

export async function listRecipeProductions() {
  return (await readCollection("recipe-productions.json", SEED_PRODUCTIONS)).sort((a, b) =>
    b.producedAt.localeCompare(a.producedAt),
  );
}

async function seedDefaultRecipes(): Promise<Recipe[]> {
  const [products, warehouses] = await Promise.all([listProducts(), listWarehouses()]);
  const wh =
    warehouses.find((w) => w.id === "wh_limete_01") ||
    warehouses.find((w) => w.isDefault) ||
    warehouses[0];
  if (!wh) return [];

  const bySku = Object.fromEntries(products.map((p) => [p.sku, p]));
  const now = new Date().toISOString();

  const recipes: Recipe[] = [];

  const traiteur = bySku["RST-TRT-MIDI"];
  const riz = bySku["VIV-RIZ-25"];
  const huile = bySku["VIV-HUI-5L"] || bySku["ALI-SB-001"];
  if (traiteur && riz && huile) {
    // ~0.08 sac riz (~2 kg) + ~0.04 bidon huile (~0.2 L) per couvert — illustrative BOM
    const ingredients: RecipeIngredient[] = [
      {
        id: uid("ri"),
        productId: riz.id,
        sku: riz.sku,
        productName: riz.name,
        quantityPerOutput: 0.08,
        unitOfMeasure: riz.unitOfMeasure,
      },
      {
        id: uid("ri"),
        productId: huile.id,
        sku: huile.sku,
        productName: huile.name,
        quantityPerOutput: 0.04,
        unitOfMeasure: huile.unitOfMeasure,
      },
    ];
    if (bySku["ALI-KN-001"]) {
      ingredients.push({
        id: uid("ri"),
        productId: bySku["ALI-KN-001"].id,
        sku: bySku["ALI-KN-001"].sku,
        productName: bySku["ALI-KN-001"].name,
        quantityPerOutput: 0.05,
        unitOfMeasure: bySku["ALI-KN-001"].unitOfMeasure,
      });
    }
    recipes.push({
      id: "rcp_traiteur_midi",
      code: "RCP-TRT-MIDI",
      name: "Formule midi traiteur",
      description: "Repas chaud bureaux — consommation stock riz / huile / assaisonnement par couvert.",
      outputProductId: traiteur.id,
      outputSku: traiteur.sku,
      outputName: traiteur.name,
      outputKind: traiteur.kind,
      category: "traiteur",
      warehouseId: wh.id,
      warehouseName: wh.name,
      status: "active",
      ingredients,
      theoreticalCost: 0,
      sellingPrice: traiteur.sellingPrice || 6,
      currency: "USD",
      createdAt: now,
      updatedAt: now,
    });
  }

  const panier = bySku["VIV-PAN-SEM"];
  if (panier && riz && huile) {
    recipes.push({
      id: "rcp_panier_sem",
      code: "RCP-PAN-SEM",
      name: "Assemblage panier vivres semaine",
      description: "Préparation panier distribution urbaine à partir du stock vivres.",
      outputProductId: panier.id,
      outputSku: panier.sku,
      outputName: panier.name,
      outputKind: panier.kind,
      category: "autre",
      warehouseId: wh.id,
      warehouseName: wh.name,
      status: "active",
      ingredients: [
        {
          id: uid("ri"),
          productId: riz.id,
          sku: riz.sku,
          productName: riz.name,
          quantityPerOutput: 0.2,
          unitOfMeasure: riz.unitOfMeasure,
        },
        {
          id: uid("ri"),
          productId: huile.id,
          sku: huile.sku,
          productName: huile.name,
          quantityPerOutput: 0.25,
          unitOfMeasure: huile.unitOfMeasure,
        },
      ],
      theoreticalCost: 0,
      sellingPrice: panier.sellingPrice || 45,
      currency: "USD",
      createdAt: now,
      updatedAt: now,
    });
  }

  // Boisson chaude Lipton si dispo
  const lipton = bySku["ALI-TH-001"];
  if (lipton) {
    // Create virtual output as service-like product if no tea service — use lipton itself as prep cup conversion
    // Better: use a drink service code. If missing, attach to a synthetic output using traiteur pattern.
    const drinkOut = products.find((p) => p.sku === "RST-TH-TASSE");
    let output = drinkOut;
    if (!output) {
      // register lightweight output in products-master via inline seed object stored only on recipe;
      // for stock we only consume ingredients. Use a placeholder product id on recipe only if product exists.
      // Skip if no dedicated output — create recipe targeting a named drink without product master by cloning lipton as output for cost display only.
    }
  }

  const blueBand = bySku["ALI-BB-001"];
  const simba1 = bySku["ALI-SB-002"];
  if (blueBand && simba1 && traiteur) {
    // Petit-déj cantine: Blue Band + huile Simba (portion) attached to traiteur as alternate? Skip — keep 2 solid recipes.
  }

  for (const r of recipes) {
    r.theoreticalCost = await computeRecipeCost(r);
  }
  await writeCollection("recipes.json", recipes);
  return recipes;
}

export async function computeRecipeCost(recipe: Recipe) {
  let total = 0;
  for (const ing of recipe.ingredients) {
    const bal = await getStockBalance(ing.productId, recipe.warehouseId);
    const product = await getProduct(ing.productId);
    const unitCost = bal?.averageUnitCost ?? product?.landedCost ?? 0;
    total += unitCost * ing.quantityPerOutput;
  }
  return money(total);
}

export async function refreshRecipeCosts() {
  const recipes = await listRecipes();
  for (const r of recipes) {
    r.theoreticalCost = await computeRecipeCost(r);
    r.updatedAt = new Date().toISOString();
  }
  await writeCollection("recipes.json", recipes);
  return recipes;
}

export async function saveRecipe(
  input: Omit<Recipe, "id" | "createdAt" | "updatedAt" | "theoreticalCost" | "warehouseName" | "outputSku" | "outputName" | "outputKind"> & {
    id?: string;
    theoreticalCost?: number;
  },
) {
  const [products, warehouses] = await Promise.all([listProducts(), listWarehouses()]);
  const output = products.find((p) => p.id === input.outputProductId);
  const warehouse = warehouses.find((w) => w.id === input.warehouseId);
  if (!output) throw new Error("Produit / service de sortie introuvable");
  if (!warehouse) throw new Error("Entrepôt introuvable");
  if (!input.ingredients?.length) throw new Error("Au moins un ingrédient est requis");

  const ingredients: RecipeIngredient[] = [];
  for (const raw of input.ingredients) {
    const p = products.find((x) => x.id === raw.productId);
    if (!p) throw new Error(`Ingrédient introuvable: ${raw.productId}`);
    if (p.kind !== "product") throw new Error(`${p.sku} n’est pas un article de stock`);
    const qty = Number(raw.quantityPerOutput);
    if (!Number.isFinite(qty) || qty <= 0) throw new Error(`Quantité invalide pour ${p.sku}`);
    ingredients.push({
      id: raw.id || uid("ri"),
      productId: p.id,
      sku: p.sku,
      productName: p.name,
      quantityPerOutput: qty,
      unitOfMeasure: p.unitOfMeasure,
    });
  }

  const items = await listRecipes();
  const now = new Date().toISOString();
  const base: Recipe = {
    id: input.id || uid("rcp"),
    code: input.code.trim(),
    name: input.name.trim(),
    description: input.description,
    outputProductId: output.id,
    outputSku: output.sku,
    outputName: output.name,
    outputKind: output.kind,
    category: input.category,
    warehouseId: warehouse.id,
    warehouseName: warehouse.name,
    status: input.status || "active",
    ingredients,
    theoreticalCost: 0,
    sellingPrice: Number(input.sellingPrice || output.sellingPrice || 0),
    currency: (input.currency as CurrencyCode) || output.sellingCurrency || "USD",
    createdAt: now,
    updatedAt: now,
  };
  base.theoreticalCost = await computeRecipeCost(base);

  if (input.id) {
    const idx = items.findIndex((r) => r.id === input.id);
    if (idx === -1) throw new Error("Recette introuvable");
    items[idx] = { ...base, id: input.id, createdAt: items[idx].createdAt, updatedAt: now };
    await writeCollection("recipes.json", items);
    return items[idx];
  }
  items.unshift(base);
  await writeCollection("recipes.json", items);
  return base;
}

export async function produceRecipe(input: {
  recipeId: string;
  quantity: number;
  mode?: "service" | "prep";
  notes?: string;
  customerId?: string;
}) {
  const qty = Number(input.quantity);
  if (!Number.isFinite(qty) || qty <= 0) throw new Error("Quantité invalide");

  const recipes = await listRecipes();
  const recipe = recipes.find((r) => r.id === input.recipeId);
  if (!recipe) throw new Error("Recette introuvable");
  if (recipe.status !== "active") throw new Error("Recette inactive");

  const [warehouses, products, customers, currency] = await Promise.all([
    listWarehouses(),
    listProducts(),
    listCustomers(),
    getCurrencySettings(),
  ]);
  const warehouse = warehouses.find((w) => w.id === recipe.warehouseId);
  if (!warehouse) throw new Error("Entrepôt introuvable");

  const customer = input.customerId ? customers.find((c) => c.id === input.customerId) : undefined;
  const now = new Date().toISOString();
  const ingredientLines: RecipeProduction["ingredientLines"] = [];
  let totalCost = 0;

  for (const ing of recipe.ingredients) {
    const product = products.find((p) => p.id === ing.productId);
    if (!product) throw new Error(`Ingrédient ${ing.sku} introuvable`);
    const consumeQty = money(ing.quantityPerOutput * qty);
    const bal = await getStockBalance(product.id, warehouse.id);
    const unitCost = bal?.averageUnitCost ?? product.landedCost;
    const lineCost = money(consumeQty * unitCost);

    await applyStockDelta({
      type: "recipe_consumption",
      product,
      warehouse,
      quantity: consumeQty,
      quantityDelta: -consumeQty,
      unitCost,
      currency: product.purchaseCurrency,
      referenceType: "recipe",
      referenceId: recipe.id,
      referenceNumber: recipe.code,
      reason: `Recette ${recipe.code} × ${qty}`,
    });

    ingredientLines.push({
      productId: product.id,
      sku: product.sku,
      productName: product.name,
      quantity: consumeQty,
      unitOfMeasure: product.unitOfMeasure,
      unitCost,
      lineCost,
    });
    totalCost += lineCost;
  }

  totalCost = money(totalCost);
  const unitCost = money(totalCost / qty);
  const sellingPrice = recipe.sellingPrice;
  const revenue = money(sellingPrice * qty);
  const { grossProfit, marginPct } = computeGrossMargin(revenue, totalCost);

  const productions = await listRecipeProductions();
  const production: RecipeProduction = {
    id: uid("rpd"),
    number: `RP-2026-${String(productions.length + 1).padStart(4, "0")}`,
    recipeId: recipe.id,
    recipeCode: recipe.code,
    recipeName: recipe.name,
    outputProductId: recipe.outputProductId,
    outputSku: recipe.outputSku,
    outputName: recipe.outputName,
    quantity: qty,
    warehouseId: warehouse.id,
    warehouseName: warehouse.name,
    totalCost,
    unitCost,
    sellingPrice,
    revenue,
    grossProfit: money(grossProfit),
    marginPct: money(marginPct),
    currency: recipe.currency || "USD",
    mode: input.mode || "service",
    notes: input.notes,
    customerId: customer?.id,
    customerName: customer?.legalName,
    producedAt: now,
    createdAt: now,
    ingredientLines,
  };
  productions.unshift(production);
  await writeCollection("recipe-productions.json", productions);

  // refresh theoretical cost after movement (CMP may change slightly on weighted avg — usually not on issue)
  recipe.theoreticalCost = await computeRecipeCost(recipe);
  recipe.updatedAt = now;
  const rIdx = recipes.findIndex((r) => r.id === recipe.id);
  if (rIdx !== -1) {
    recipes[rIdx] = recipe;
    await writeCollection("recipes.json", recipes);
  }

  void currency;
  return production;
}

export async function getRecipesDashboard() {
  const [recipes, productions] = await Promise.all([listRecipes(), listRecipeProductions()]);
  const active = recipes.filter((r) => r.status === "active");
  const costToday = productions
    .filter((p) => p.producedAt.slice(0, 10) === new Date().toISOString().slice(0, 10))
    .reduce((s, p) => s + p.totalCost, 0);
  const revenue = productions.reduce((s, p) => s + p.revenue, 0);
  const cost = productions.reduce((s, p) => s + p.totalCost, 0);
  return {
    recipeCount: active.length,
    productionCount: productions.length,
    revenueUsd: money(revenue),
    costUsd: money(cost),
    grossProfitUsd: money(revenue - cost),
    costTodayUsd: money(costToday),
    recent: productions.slice(0, 8),
  };
}
