import { productsQueryString, type ProductsQuery } from "@/lib/products-query";

/** Listing query string from a filter form (category, price range, featured),
 *  keeping the current search + sort and going back to page 1. Fields a form
 *  doesn't render keep their current value; a form that renders the featured
 *  checkbox must also send `featuredField` (an unchecked box sends nothing). */
export function filtersQueryString(query: ProductsQuery, data: FormData) {
  const min = data.has("minPrice") ? Math.max(0, Number(data.get("minPrice") || 0)) : query.minPrice;
  const max = data.has("maxPrice") ? Math.max(0, Number(data.get("maxPrice") || 0)) : query.maxPrice;
  const swap = max > 0 && min > max;
  return productsQueryString({
    ...query,
    ...(data.has("inStockField") && { inStock: data.get("inStock") === "true" }),
    ...(data.has("brand") && { brand: String(data.get("brand") ?? "") }),
    ...(data.has("size") && { size: String(data.get("size") ?? "") }),
    ...(data.has("color") && { color: String(data.get("color") ?? "") }),
    category: String(data.get("category") ?? query.category ?? ""),
    featured: data.has("featuredField") ? data.get("featured") === "true" : query.featured,
    minPrice: swap ? max : min,
    maxPrice: swap ? min : max,
    page: 1,
  });
}

/** Listing query string with every filter cleared (search + sort kept).
 *  Forms rendering the in-stock checkbox send `inStockField` too (see above). */
export function clearedQueryString(query: ProductsQuery) {
  return productsQueryString({ search: query.search, sort: query.sort });
}
