import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProductDetailsRoute({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>;
}) {
  const { slug, productSlug } = await params;

  if (!slug || !productSlug) {
    return notFound();
  }

  const store = await prisma.store.findUnique({
    where: { slug },
  });

  if (!store) return notFound();

  const product = await prisma.product.findFirst({
    where: {
      slug: productSlug,
      storeId: store.id
    },
  });

  if (!product) return notFound();

  return (
    <div className="min-h-screen p-10">
      <h1 className="text-4xl font-bold mb-6">{product.name}</h1>

      {product.image && (
        <Image
          src={product.image}
          alt={product.name}
          width={800}
          height={600}
          className="w-full max-w-md rounded-xl mb-6 object-cover"
        />
      )}

      <p className="text-xl mb-4 font-semibold">{product.price} EGP</p>

      <p className="text-gray-600">From store: {store.name}</p>
    </div>
  );
}
