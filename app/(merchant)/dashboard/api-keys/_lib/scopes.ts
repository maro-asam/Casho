import type { ApiScope } from "@/lib/api/types";
import { tr } from "@/lib/i18n/dashboard";

export type Access = "none" | "read" | "write";

/** One row per resource; "write" grants both scopes (the API checks each scope on its own). */
export const SCOPE_GROUPS: { key: string; label: string; read: ApiScope; write?: ApiScope }[] = [
  { key: "orders", get label() { return tr("الطلبات"); }, read: "orders:read", write: "orders:write" },
  { key: "customers", get label() { return tr("العملاء"); }, read: "customers:read", write: "customers:write" },
  { key: "products", get label() { return tr("المنتجات"); }, read: "products:read" },
  { key: "shipments", get label() { return tr("الشحن"); }, read: "shipments:read", write: "shipments:write" },
  { key: "webhooks", label: "Webhooks", read: "webhooks:read", write: "webhooks:write" },
];

export function accessFor(scopes: string[], group: (typeof SCOPE_GROUPS)[number]): Access {
  if (scopes.length === 0) return group.write ? "write" : "read";
  if (group.write && scopes.includes(group.write)) return "write";
  return scopes.includes(group.read) ? "read" : "none";
}

export function scopesFrom(access: Record<string, Access>): ApiScope[] {
  return SCOPE_GROUPS.flatMap((g) => {
    const a = access[g.key] ?? "none";
    if (a === "none") return [];
    if (a === "write" && g.write) return [g.read, g.write];
    return [g.read];
  });
}

/** "الطلبات (قراءة وكتابة)، المنتجات (قراءة)" — or "كل الصلاحيات". */
export function scopeSummary(scopes: string[]) {
  if (scopes.length === 0) return tr("كل الصلاحيات");
  return SCOPE_GROUPS.flatMap((g) => {
    const a = accessFor(scopes, g);
    if (a === "none") return [];
    return [`${g.label} (${a === "write" ? tr("قراءة وكتابة") : tr("قراءة")})`];
  }).join(tr("، "));
}
