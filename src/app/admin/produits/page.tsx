import type { Metadata } from "next";
import { ProductsManager } from "@/components/admin/products-manager";
import { listOffers } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Produits & services",
};

export default async function AdminProductsPage() {
  const offers = await listOffers();
  return <ProductsManager initialOffers={offers} />;
}
