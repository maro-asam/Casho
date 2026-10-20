"use client";

import { CreateProductAction } from "@/actions/products/products.actions";
import { ProductForm, type BundleCandidate, type ProductCategory } from "./product-form/product-form";

export default function CreateProductForm({
  categories,
  products = [],
}: {
  categories: ProductCategory[];
  products?: BundleCandidate[];
}) {
  return <ProductForm action={CreateProductAction} categories={categories} products={products} />;
}
