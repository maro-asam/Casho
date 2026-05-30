import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL!;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const imagesBySlug: Record<string, string> = {
  "whatsapp-marketing-guide-egypt-stores-2025":
    "https://images.unsplash.com/photo-1611926653458-09294b3142bf?auto=format&fit=crop&w=900&q=80",
  "facebook-ads-secrets-small-stores-egypt":
    "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&w=900&q=80",
  "first-10000-egp-online-store-30-day-plan":
    "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=900&q=80",
  "ramadan-eid-selling-guide-egyptian-merchant":
    "https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?auto=format&fit=crop&w=900&q=80",
  "dropshipping-egypt-2025-complete-truth":
    "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=900&q=80",
  "build-strong-brand-identity-online-store":
    "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=900&q=80",
  "pricing-mistakes-kill-profitability-smart-pricing-guide":
    "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80",
  "tiktok-ecommerce-egypt-selling-guide-2025":
    "https://images.unsplash.com/photo-1611605698335-8441685b843f?auto=format&fit=crop&w=900&q=80",
  "build-customer-loyalty-online-store-lifetime-value":
    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80",
  "complete-content-strategy-online-store-30-day-plan":
    "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=900&q=80",
};

async function main() {
  console.log("🖼️  Adding cover images to blog posts (seed-3)...\n");

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

  console.log("\n✅ Cover images updated successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
