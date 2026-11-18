export type Role = "ADMIN" | "SELLER";

/** El administrador puede todo; el vendedor vende, consulta productos, gestiona clientes y factura. */
export const PERMISSIONS = {
  "dashboard.view": ["ADMIN", "SELLER"],
  "products.view": ["ADMIN", "SELLER"],
  "products.manage": ["ADMIN"],
  "inventory.manage": ["ADMIN"],
  "categories.manage": ["ADMIN"],
  "customers.view": ["ADMIN", "SELLER"],
  "customers.manage": ["ADMIN", "SELLER"],
  "suppliers.manage": ["ADMIN"],
  "sales.create": ["ADMIN", "SELLER"],
  "sales.view": ["ADMIN", "SELLER"],
  "sales.void": ["ADMIN"],
  "invoices.view": ["ADMIN", "SELLER"],
  "reports.view": ["ADMIN"],
  "users.manage": ["ADMIN"],
  "settings.manage": ["ADMIN"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role | undefined | null, permission: Permission) {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}
