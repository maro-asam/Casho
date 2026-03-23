export type ProductsQuery = {
  search: string;
  category: string;
  featured: boolean;
  minPrice: number;
  maxPrice: number;
  sort:
    | "newest"
    | "oldest"
    | "price-asc"
    | "price-desc"
    | "name-asc"
    | "name-desc";
  page: number;
};

type RawSearchParams = {
  search?: string;
  category?: string;
  featured?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  page?: string;
};

export function normalizeProductsQueryParams(
  params?: RawSearchParams,
): ProductsQuery {
  const sortOptions = [
    "newest",
    "oldest",
    "price-asc",
    "price-desc",
    "name-asc",
    "name-desc",
  ] as const;

  const sort = sortOptions.includes(params?.sort as ProductsQuery["sort"])
    ? (params?.sort as ProductsQuery["sort"])
    : "newest";

  const minPrice = Math.max(0, Number(params?.minPrice || 0));
  const maxPrice = Math.max(0, Number(params?.maxPrice || 0));
  const page = Math.max(1, Number(params?.page || 1));

  return {
    search: params?.search?.trim() || "",
    category: params?.category?.trim() || "",
    featured: params?.featured === "true",
    minPrice,
    maxPrice,
    sort,
    page,
  };
}

export function buildProductsUrl(
  storeSlug: string,
  params: Partial<ProductsQuery>,
) {
  const query = new URLSearchParams();

  if (params.search) query.set("search", params.search);
  if (params.category) query.set("category", params.category);
  if (params.featured) query.set("featured", "true");
  if (params.minPrice && params.minPrice > 0) {
    query.set("minPrice", String(params.minPrice));
  }
  if (params.maxPrice && params.maxPrice > 0) {
    query.set("maxPrice", String(params.maxPrice));
  }
  if (params.sort && params.sort !== "newest") query.set("sort", params.sort);
  if (params.page && params.page > 1) query.set("page", String(params.page));

  const qs = query.toString();
  return `/store/${storeSlug}/products${qs ? `?${qs}` : ""}`;
}

export function getSortOptionLabel(sort: ProductsQuery["sort"]) {
  switch (sort) {
    case "oldest":
      return "الأقدم أولًا";
    case "price-asc":
      return "السعر من الأقل للأعلى";
    case "price-desc":
      return "السعر من الأعلى للأقل";
    case "name-asc":
      return "الاسم أ - ي";
    case "name-desc":
      return "الاسم ي - أ";
    default:
      return "الأحدث أولًا";
  }
}