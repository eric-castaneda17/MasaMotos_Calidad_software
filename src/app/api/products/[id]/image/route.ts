import { getCurrentUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** Imagen del bucket privado product-images; la descarga usa la sesión del usuario (aplican las políticas de Storage). */
export async function GET(_req: Request, ctx: RouteContext<"/api/products/[id]/image">) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });

  const { id } = await ctx.params;
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId <= 0) return new NextResponse(null, { status: 400 });

  const supabase = await createClient();
  const { data: product } = await supabase.from("products").select("image_path").eq("id", productId).maybeSingle();
  if (!product?.image_path) return new NextResponse(null, { status: 404 });

  const { data: file, error } = await supabase.storage.from("product-images").download(product.image_path);
  if (error || !file) return new NextResponse(null, { status: 404 });

  return new NextResponse(file, {
    headers: {
      "Content-Type": file.type || "application/octet-stream",
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
