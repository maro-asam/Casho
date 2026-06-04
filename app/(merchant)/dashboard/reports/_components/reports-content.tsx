"use client";

import { useState } from "react";
import {
  BarChart3,
  Package,
  Star,
  Tag,
  TrendingUp,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReportsData } from "../_lib/types";
import { SectionOverview } from "./section-overview";
import { SectionSales } from "./section-sales";
import { SectionProducts } from "./section-products";
import { SectionCustomers } from "./section-customers";
import { SectionInventory } from "./section-inventory";
import { SectionCoupons } from "./section-coupons";

type Tab =
  | "overview"
  | "sales"
  | "products"
  | "customers"
  | "inventory"
  | "coupons";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "نظرة عامة", icon: BarChart3 },
  { id: "sales", label: "المبيعات", icon: TrendingUp },
  { id: "products", label: "المنتجات", icon: Package },
  { id: "customers", label: "العملاء", icon: Users },
  { id: "inventory", label: "المخزون والتقييمات", icon: Star },
  { id: "coupons", label: "الكوبونات", icon: Tag },
];

export function ReportsContent({ data }: { data: ReportsData }) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  return (
    <div className="space-y-6">
      {/* Tab nav */}
      <div className="flex items-center gap-1 overflow-x-auto rounded-2xl border border-border bg-muted/30 p-1.5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all",
              activeTab === id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Active section */}
      {activeTab === "overview" && <SectionOverview data={data} />}
      {activeTab === "sales" && <SectionSales data={data} />}
      {activeTab === "products" && <SectionProducts data={data} />}
      {activeTab === "customers" && <SectionCustomers data={data} />}
      {activeTab === "inventory" && <SectionInventory data={data} />}
      {activeTab === "coupons" && <SectionCoupons data={data} />}
    </div>
  );
}
