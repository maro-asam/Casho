import type { CSSProperties } from "react";
import {
  BarChart3,
  Boxes,
  Check,
  FileDown,
  Gift,
  Globe,
  Package,
  PieChart,
  ScanBarcode,
  Search,
  Send,
  ShoppingCart,
  Sparkles,
  TicketPercent,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

// App-icon style glyph per feature key — the way Apple One shows each service.
// Display only: which plan has which feature always comes from the DB.
const FEATURE_ICONS: Record<string, { icon: LucideIcon; from: string; to: string }> = {
  products: { icon: Package, from: "#ffb340", to: "#ff7a00" },
  discount_codes: { icon: TicketPercent, from: "#ff5e7e", to: "#e0234e" },
  team_members: { icon: Users, from: "#5c8aff", to: "#1447e6" },
  custom_domain: { icon: Globe, from: "#40c8e0", to: "#0a84ff" },
  order_export: { icon: FileDown, from: "#4cd964", to: "#1f9e4a" },
  loyalty: { icon: Gift, from: "#ffd60a", to: "#ff9500" },
  abandoned_cart: { icon: ShoppingCart, from: "#ff8a5c", to: "#e8431a" },
  crm: { icon: UserRound, from: "#8e8cff", to: "#5856d6" },
  crm_advanced: { icon: PieChart, from: "#d07bff", to: "#8e44d0" },
  telegram: { icon: Send, from: "#6fd0ff", to: "#229ed9" },
  pos: { icon: ScanBarcode, from: "#6e6e73", to: "#1d1d1f" },
  inventory: { icon: Boxes, from: "#d4a373", to: "#9a6a3a" },
  ai: { icon: Sparkles, from: "#d77bff", to: "#5e5ce6" },
  reports: { icon: BarChart3, from: "#6b95ff", to: "#2a4fe0" },
  seo: { icon: Search, from: "#4cd964", to: "#248a3d" },
};

export function FeatureIcon({ featureKey }: { featureKey: string }) {
  const f = FEATURE_ICONS[featureKey] ?? { icon: Check, from: "#a1a1a6", to: "#6e6e73" };
  const Icon = f.icon;
  return (
    <span aria-hidden className="feat-icon" style={{ "--fi-from": f.from, "--fi-to": f.to } as CSSProperties}>
      <Icon strokeWidth={2.1} />
    </span>
  );
}
