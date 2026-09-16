import { NextResponse } from "next/server";
import { isGestionAuthenticated } from "@/lib/auth";
import {
  getRecipesDashboard,
  listRecipeProductions,
  listRecipes,
  produceRecipe,
  refreshRecipeCosts,
  saveRecipe,
} from "@/lib/recipes";
import type { CurrencyCode, Recipe } from "@/lib/domain";

export async function GET(request: Request) {
  if (!(await isGestionAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const view = new URL(request.url).searchParams.get("view") || "recipes";
  if (view === "productions") return NextResponse.json(await listRecipeProductions());
  if (view === "dashboard") return NextResponse.json(await getRecipesDashboard());
  return NextResponse.json(await refreshRecipeCosts());
}

export async function POST(request: Request) {
  if (!(await isGestionAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const action = String(body.action || "save");

    if (action === "save") {
      if (!body.code || !body.name || !body.outputProductId || !body.warehouseId || !Array.isArray(body.ingredients)) {
        return NextResponse.json(
          { error: "code, name, outputProductId, warehouseId et ingredients requis" },
          { status: 400 },
        );
      }
      const recipe = await saveRecipe({
        id: body.id,
        code: String(body.code),
        name: String(body.name),
        description: body.description || undefined,
        outputProductId: String(body.outputProductId),
        category: (body.category as Recipe["category"]) || "plat",
        warehouseId: String(body.warehouseId),
        status: (body.status as Recipe["status"]) || "active",
        ingredients: body.ingredients,
        sellingPrice: Number(body.sellingPrice || 0),
        currency: (body.currency as CurrencyCode) || "USD",
      });
      return NextResponse.json(recipe, { status: body.id ? 200 : 201 });
    }

    if (action === "produce") {
      if (!body.recipeId || !body.quantity) {
        return NextResponse.json({ error: "recipeId et quantity requis" }, { status: 400 });
      }
      const production = await produceRecipe({
        recipeId: String(body.recipeId),
        quantity: Number(body.quantity),
        mode: body.mode === "prep" ? "prep" : "service",
        notes: body.notes || undefined,
        customerId: body.customerId || undefined,
      });
      return NextResponse.json(production, { status: 201 });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur recettes";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
