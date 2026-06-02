import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL!;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const images: Record<string, string> = {
  "how-to-create-store-on-casho-step-by-step":
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80",
  "casho-dashboard-complete-guide":
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80",
  "activate-electronic-payment-casho-store":
    "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=900&q=80",
  "coupons-discounts-casho-strategy":
    "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=900&q=80",
  "casho-themes-comparison-which-one-to-choose":
    "https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&w=900&q=80",
  "casho-seo-settings-guide":
    "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=900&q=80",
  "manage-orders-shipping-casho-guide":
    "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=900&q=80",
  "casho-subscription-plans-which-one-is-right":
    "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=900&q=80",
  "high-traffic-low-conversion-rate-fix":
    "https://images.unsplash.com/photo-1533750349088-cd871a92f312?auto=format&fit=crop&w=900&q=80",
  "customer-trust-problem-how-to-fix":
    "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=900&q=80",
  "competitor-cheaper-price-how-to-compete":
    "https://images.unsplash.com/photo-1634128221889-82ed6efebfc3?auto=format&fit=crop&w=900&q=80",
  "sales-stopped-7-day-revival-plan":
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=900&q=80",
  "handling-returns-refunds-online-store-egypt":
    "https://images.unsplash.com/photo-1586880244406-556ebe35f282?auto=format&fit=crop&w=900&q=80",
  "finding-suppliers-egypt-practical-guide":
    "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=900&q=80",
  "first-order-what-to-do-in-30-minutes":
    "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=900&q=80",
  "family-doesnt-believe-online-selling-how-to-deal":
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80",
  "handling-negative-reviews-difficult-customers-online":
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
  "product-pricing-from-scratch-how-to-guide":
    "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=900&q=80",
  "casho-banners-homepage-customization-guide":
    "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=900&q=80",
  "casho-store-idea-to-first-sale-complete-journey":
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=80",
};

async function main() {
  for (const [slug, coverImage] of Object.entries(images)) {
    const updated = await prisma.blogPost.updateMany({ where: { slug }, data: { coverImage } });
    if (updated.count > 0) console.log(`✓ image set: ${slug}`);
    else console.log(`⚠️  not found: ${slug}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
