"use client";

import { UpdateProductAction } from "@/actions/products/products.actions";
import {
  ProductForm,
  type BundleCandidate,
  type ProductCategory,
  type ProductDefaults,
} from "./product-form/product-form";

type Props = {
  product: ProductDefaults;
  categories: ProductCategory[];
  products?: BundleCandidate[];
  storefrontUrl?: string;
};

/** Same form as "new product", pre-filled; saving keeps the merchant on the page. */
export default function EditProductForm({ product, categories, products = [], storefrontUrl }: Props) {
  return (
    <ProductForm
      action={UpdateProductAction.bind(null, product.id)}
      categories={categories}
      products={products}
      product={product}
      storefrontUrl={storefrontUrl}
    />
  );
}
