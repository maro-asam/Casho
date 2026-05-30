import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL!;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const imagesBySlug: Record<string, string> = {
  "how-to-start-online-store-egypt":
    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80",
  "7-ways-increase-online-store-sales":
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=900&q=80",
  "instagram-marketing-for-online-stores":
    "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=900&q=80",
  "shipping-delivery-guide-egypt-ecommerce":
    "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=900&q=80",
  "product-description-seo-conversion-tips":
    "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=900&q=80",
  "casho-vs-foreign-platforms-arabic-ecommerce":
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80",
  "electronic-payment-egypt-merchant-guide":
    "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=900&q=80",
  "inventory-management-online-store":
    "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=900&q=80",
};

async function main() {
  console.log("🖼️  Adding cover images to blog posts...\n");

  for (const [slug, coverImage] of Object.entries(imagesBySlug)) {
    const updated = await prisma.blogPost.updateMany({
      where: { slug },
      data: { coverImage },
    });

    if (updated.count > 0) {
      console.log(`  ✓ ${slug}`);
    } else {
      console.log(`  ⚠️  Not found: ${slug}`);
    }
  }

  console.log("\n✅ Done!");
}

main()
  .catch((e) => {
    console.error("❌ Failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
