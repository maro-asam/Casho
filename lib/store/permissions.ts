import { StoreRole } from "@prisma/client";

export type StorePermission =
  | "manage_settings"
  | "manage_products"
  | "manage_orders"
  | "manage_customers"
  | "manage_staff"
  | "view_analytics"
  | "manage_billing"
  | "transfer_ownership"
  | "delete_store"
  | "view_orders"
  | "update_order_status";

const ROLE_PERMISSIONS: Record<StoreRole, StorePermission[]> = {
  STORE_OWNER: [
    "manage_settings",
    "manage_products",
    "manage_orders",
    "manage_customers",
    "manage_staff",
    "view_analytics",
    "manage_billing",
    "transfer_ownership",
    "delete_store",
    "view_orders",
    "update_order_status",
  ],
  STORE_MANAGER: [
    "manage_products",
    "manage_orders",
    "manage_customers",
    "view_analytics",
    "view_orders",
    "update_order_status",
  ],
  STORE_STAFF: [
    "view_orders",
    "update_order_status",
    "manage_customers",
  ],
};

export function hasPermission(role: StoreRole, permission: StorePermission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function getPermissions(role: StoreRole): StorePermission[] {
  return ROLE_PERMISSIONS[role];
}

export const ROLE_LABELS: Record<StoreRole, string> = {
  STORE_OWNER: "مالك المتجر",
  STORE_MANAGER: "مدير",
  STORE_STAFF: "موظف",
};

export const ROLE_COLORS: Record<StoreRole, string> = {
  STORE_OWNER: "bg-amber-500/15 text-amber-700 border-amber-200",
  STORE_MANAGER: "bg-blue-500/15 text-blue-700 border-blue-200",
  STORE_STAFF: "bg-slate-500/15 text-slate-700 border-slate-200",
};

// Roles a given role can assign (no privilege escalation)
export const ASSIGNABLE_ROLES: Record<StoreRole, StoreRole[]> = {
  STORE_OWNER: ["STORE_MANAGER", "STORE_STAFF"],
  STORE_MANAGER: [],
  STORE_STAFF: [],
};
