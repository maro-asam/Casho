import type { Metadata } from "next";
import CompareHero from "../../_components/compare/CompareHero";
import FeeCalculator from "../../_components/compare/FeeCalculator";
import CompareTable from "../../_components/compare/CompareTable";
import MoveFromShopify from "../../_components/compare/MoveFromShopify";
import HonestTake from "../../_components/compare/HonestTake";
import FinalCTA from "../../_components/apple/FinalCTA";
import "../../_components/compare/compare.css";

export const metadata: Metadata = {
  title: "كاشو ولا شوبيفاي؟ الفرق للتاجر في مصر — كاشو",
  description:
    "مقارنة بين كاشو وشوبيفاي للتاجر اللي بيبيع في مصر: العمولة على الطلبات الأونلاين، عملة الاشتراك، الحماية من الأوردرات الوهمية، الشحن، والنقل من شوبيفاي.",
  alternates: { canonical: "/compare/shopify" },
  openGraph: {
    title: "Casho vs Shopify — كاشو ولا شوبيفاي؟",
    description: "شوبيفاي معمول للعالم. كاشو معمول لمصر: 0% عمولة على طلباتك، واشتراك بالجنيه.",
    type: "website",
  },
};

// Same system as the home page: white → gray → white → gray → white → black.
// Shopify facts are dated in _components/compare/copy.ts (`sources`).
export default function CompareShopifyPage() {
  return (
    <div className="al">
      <CompareHero />
      <FeeCalculator />
      <CompareTable />
      <MoveFromShopify />
      <HonestTake />
      <FinalCTA />
    </div>
  );
}
