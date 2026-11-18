/** Variables públicas de Supabase (seguras en el navegador; la seguridad la da RLS). */
export function supabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY. Configúrelas en .env.local (vea .env.example).",
    );
  }
  return { url, key };
}
