import { SessionProvider } from "@/context/SessionContext";
import AdminShell from "@/layout/AdminShell";
import { requirePageUser } from "@/lib/auth/dal";
import { lowStockProducts } from "@/lib/data/analytics";
import { setRequestLocale } from "next-intl/server";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  // Consultas independientes en paralelo; sin sesión, RLS rechaza las alertas y requirePageUser redirige.
  const [user, alerts] = await Promise.all([requirePageUser(), lowStockProducts(8).catch(() => [])]);

  return (
    <SessionProvider user={user}>
      <AdminShell alerts={alerts}>{children}</AdminShell>
    </SessionProvider>
  );
}
