"use server";

import type { ActionResult, FormState } from "@/lib/action-result";
import { requireActionUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { formDataToObject, productCreateSchema, productSchema, toFieldErrors } from "@/lib/validation/schemas";
import { DomainError, refreshAll, runAction, throwDbError } from "./helpers";

const BUCKET = "product-images";
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

type Supabase = Awaited<ReturnType<typeof createClient>>;

function readImage(formData: FormData) {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return null;
  if (!EXT[file.type]) throw new DomainError("imageType", undefined, "image");
  if (file.size > MAX_IMAGE_BYTES) throw new DomainError("imageTooLarge", undefined, "image");
  return file;
}

async function uploadImage(supabase: Supabase, productId: number, file: File) {
  const path = `${productId}/${Date.now()}.${EXT[file.type]}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: true });
  if (error) {
    console.error("[storage upload]", error);
    throw new DomainError("generic");
  }
  return path;
}

async function removeImage(supabase: Supabase, path: string | null) {
  if (path) await supabase.storage.from(BUCKET).remove([path]);
}

async function assertUniqueCode(supabase: Supabase, code: string, exceptId?: number) {
  const { data } = await supabase.from("products").select("id").eq("code", code).maybeSingle();
  if (data && data.id !== exceptId) throw new DomainError("duplicateCode", undefined, "code");
}

const UNIQUE = { products_code_key: { key: "duplicateCode", field: "code" } };

export async function createProductAction(_prev: FormState, formData: FormData): Promise<ActionResult<{ id: number }>> {
  return runAction(async () => {
    await requireActionUser("products.manage");
    const parsed = productCreateSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return { ok: false, message: "errors.validation", fieldErrors: toFieldErrors(parsed.error) };
    }
    const d = parsed.data;
    const code = d.code.toUpperCase();
    const image = readImage(formData);
    const supabase = await createClient();
    await assertUniqueCode(supabase, code);

    // El trigger log_initial_stock registra el movimiento de stock inicial en la misma transacción.
    const { data, error } = await supabase
      .from("products")
      .insert({
        code,
        name: d.name,
        description: d.description ?? null,
        category_id: d.categoryId,
        brand: d.brand,
        compatible_model: d.compatibleModel ?? null,
        purchase_price: d.purchasePrice,
        sale_price: d.salePrice,
        stock: d.initialStock,
        min_stock: d.minStock,
        supplier_id: d.supplierId ?? null,
        active: d.active,
      })
      .select("id")
      .single();
    throwDbError(error, UNIQUE);

    if (image) {
      const path = await uploadImage(supabase, data!.id, image);
      throwDbError((await supabase.from("products").update({ image_path: path }).eq("id", data!.id)).error);
    }
    refreshAll();
    return { ok: true, message: "toast.productCreated", data: { id: data!.id } };
  });
}

export async function updateProductAction(
  productId: number,
  _prev: FormState,
  formData: FormData,
): Promise<ActionResult<{ id: number }>> {
  return runAction(async () => {
    await requireActionUser("products.manage");
    const parsed = productSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return { ok: false, message: "errors.validation", fieldErrors: toFieldErrors(parsed.error) };
    }
    const d = parsed.data;
    const code = d.code.toUpperCase();
    const image = readImage(formData);
    const supabase = await createClient();
    await assertUniqueCode(supabase, code, productId);

    const { data: current } = await supabase.from("products").select("image_path").eq("id", productId).maybeSingle();
    if (!current) throw new DomainError("notFound");

    let imagePath: string | null | undefined;
    if (image) imagePath = await uploadImage(supabase, productId, image);
    else if (formData.get("removeImage") === "true") imagePath = null;

    // Las existencias NO se editan aquí: solo mediante movimientos de inventario.
    const { error } = await supabase
      .from("products")
      .update({
        code,
        name: d.name,
        description: d.description ?? null,
        category_id: d.categoryId,
        brand: d.brand,
        compatible_model: d.compatibleModel ?? null,
        purchase_price: d.purchasePrice,
        sale_price: d.salePrice,
        min_stock: d.minStock,
        supplier_id: d.supplierId ?? null,
        active: d.active,
        ...(imagePath !== undefined ? { image_path: imagePath } : {}),
      })
      .eq("id", productId);
    throwDbError(error, UNIQUE);
    if (imagePath !== undefined && current.image_path !== imagePath) await removeImage(supabase, current.image_path);

    refreshAll();
    return { ok: true, message: "toast.productUpdated", data: { id: productId } };
  });
}

export async function toggleProductActiveAction(productId: number): Promise<ActionResult> {
  return runAction(async () => {
    await requireActionUser("products.manage");
    const supabase = await createClient();
    const { data: product } = await supabase.from("products").select("active").eq("id", productId).maybeSingle();
    if (!product) throw new DomainError("notFound");
    throwDbError((await supabase.from("products").update({ active: !product.active }).eq("id", productId)).error);
    refreshAll();
    return { ok: true, message: product.active ? "toast.productDeactivated" : "toast.productActivated" };
  });
}

/** Elimina definitivamente un producto solo si no tiene ventas ni movimientos (aparte del stock inicial). */
export async function deleteProductAction(productId: number): Promise<ActionResult> {
  return runAction(async () => {
    await requireActionUser("products.manage");
    const supabase = await createClient();
    const [{ count: sales }, { count: movements }, { data: product }] = await Promise.all([
      supabase.from("sale_items").select("id", { count: "exact", head: true }).eq("product_id", productId),
      supabase
        .from("inventory_movements")
        .select("id", { count: "exact", head: true })
        .eq("product_id", productId)
        .neq("type", "ADJUSTMENT"),
      supabase.from("products").select("image_path").eq("id", productId).maybeSingle(),
    ]);
    if (!product) throw new DomainError("notFound");
    if ((sales ?? 0) > 0 || (movements ?? 0) > 0) throw new DomainError("productHasHistory");

    // Movimientos de stock inicial: se eliminan con una función segura junto con el producto.
    throwDbError((await supabase.rpc("delete_product", { p_product_id: productId })).error);
    await removeImage(supabase, product.image_path);
    refreshAll();
    return { ok: true, message: "toast.productDeleted" };
  });
}
