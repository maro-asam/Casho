import { getStoreCategories } from "@/lib/store.queries";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function StoreCategoriesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const data = await getStoreCategories(slug);
  if (!data) return notFound();

  const { store, categories } = data;

  if (store.subscriptionStatus !== "active") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="border rounded-2xl p-10 text-center">
          <h1 className="text-2xl font-bold mb-4">This store is not active</h1>
          <p className="text-gray-500">
            The merchant needs to activate the subscription.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="wrapper py-10">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="h2-bold">Categories</h1>
          <p className="opacity-70 mt-1">Store: {store.name}</p>
        </div>

        <Link
          href={`/store/${store.slug}`}
          className="px-4 py-2 rounded-xl border"
        >
          Back to Store
        </Link>
      </div>

      {categories.length === 0 ? (
        <div className="border rounded-2xl p-10 text-center opacity-80">
          No categories yet
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/store/${store.slug}?cat=${c.slug}`}
              className="border rounded-2xl p-5 hover:shadow-sm transition"
            >
              <div className="font-semibold text-lg">{c.name}</div>
              <div className="text-sm opacity-70 mt-1">
                Browse products →
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}