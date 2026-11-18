import {
  BoxCubeIcon,
  CartIcon,
  GridIcon,
  PieChartIcon,
  ReceiptIcon,
  SettingsIcon,
  SwapIcon,
  TableIcon,
  TagIcon,
  TruckIcon,
  UserCircleIcon,
  UsersIcon,
} from "@/icons";
import type { Permission } from "@/lib/permissions";

export type NavItem = {
  key: string;
  path: string;
  icon: React.ReactNode;
  permission: Permission;
};

export type NavGroup = { key: string; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  {
    key: "operation",
    items: [
      { key: "dashboard", path: "/", icon: <GridIcon />, permission: "dashboard.view" },
      { key: "newSale", path: "/ventas/nueva", icon: <CartIcon />, permission: "sales.create" },
      { key: "sales", path: "/ventas", icon: <TableIcon />, permission: "sales.view" },
      { key: "invoices", path: "/facturas", icon: <ReceiptIcon />, permission: "invoices.view" },
    ],
  },
  {
    key: "management",
    items: [
      { key: "products", path: "/productos", icon: <BoxCubeIcon />, permission: "products.view" },
      { key: "inventory", path: "/inventario", icon: <SwapIcon />, permission: "inventory.manage" },
      { key: "categories", path: "/categorias", icon: <TagIcon />, permission: "categories.manage" },
      { key: "customers", path: "/clientes", icon: <UserCircleIcon />, permission: "customers.view" },
      { key: "suppliers", path: "/proveedores", icon: <TruckIcon />, permission: "suppliers.manage" },
    ],
  },
  {
    key: "administration",
    items: [
      { key: "reports", path: "/reportes", icon: <PieChartIcon />, permission: "reports.view" },
      { key: "users", path: "/usuarios", icon: <UsersIcon />, permission: "users.manage" },
      { key: "settings", path: "/configuracion", icon: <SettingsIcon />, permission: "settings.manage" },
    ],
  },
];

const ALL_PATHS = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.path));

/** Ítem activo = ruta más específica que coincide con el pathname actual. */
export function activePath(pathname: string) {
  return ALL_PATHS.filter((p) => (p === "/" ? pathname === "/" : pathname === p || pathname.startsWith(`${p}/`))).sort(
    (a, b) => b.length - a.length,
  )[0];
}
