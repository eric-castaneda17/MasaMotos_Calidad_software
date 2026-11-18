"use client";

import DataCard from "@/components/common/DataCard";
import CheckboxInput from "@/components/form/CheckboxInput";
import SelectInput from "@/components/form/SelectInput";
import TextAreaInput from "@/components/form/TextAreaInput";
import TextInput from "@/components/form/TextInput";
import Button from "@/components/ui/button/Button";
import { useFormAction } from "@/hooks/useFormAction";
import { useFormat } from "@/hooks/useFormat";
import { useMessage } from "@/hooks/useMessage";
import { useRouter } from "@/i18n/navigation";
import { UploadIcon } from "@/icons";
import type { ActionResult, FormState } from "@/lib/action-result";
import { createProductAction, updateProductAction } from "@/lib/actions/products";
import type { ProductDetail } from "@/lib/data/products";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";

type Option = { id: number; name: string; active: boolean };

interface ProductFormProps {
  product?: ProductDetail;
  categories: Option[];
  suppliers: Option[];
}

const MAX_IMAGE = 2 * 1024 * 1024;

export default function ProductForm({ product, categories, suppliers }: ProductFormProps) {
  const t = useTranslations("products");
  const tc = useTranslations("common");
  const msg = useMessage();
  const f = useFormat();
  const router = useRouter();
  const isEdit = !!product;

  const action: (prev: FormState, fd: FormData) => Promise<ActionResult<{ id: number }>> = product
    ? updateProductAction.bind(null, product.id)
    : createProductAction;
  const { pending, onSubmit, fieldErrors } = useFormAction(action, {
    onSuccess: (data) => data && router.push(`/productos/${data.id}`),
  });

  const [purchase, setPurchase] = useState(product?.purchasePrice ?? 0);
  const [sale, setSale] = useState(product?.salePrice ?? 0);
  const margin = sale > 0 ? ((sale - purchase) / sale) * 100 : 0;

  const [preview, setPreview] = useState<string | null>(
    product?.hasImage ? `/api/products/${product.id}/image?v=${product.updatedAt.toISOString()}` : null,
  );
  const [removeImage, setRemoveImage] = useState(false);
  const [imageError, setImageError] = useState<string | undefined>();

  useEffect(() => () => {
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
  }, [preview]);

  const onImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageError(undefined);
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setImageError("errors.imageType");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE) {
      setImageError("errors.imageTooLarge");
      e.target.value = "";
      return;
    }
    setPreview(URL.createObjectURL(file));
    setRemoveImage(false);
  };

  const catOptions = categories
    .filter((c) => c.active || c.id === product?.categoryId)
    .map((c) => ({ value: String(c.id), label: c.name }));
  const supOptions = suppliers
    .filter((s) => s.active || s.id === product?.supplierId)
    .map((s) => ({ value: String(s.id), label: s.name }));

  return (
    <form onSubmit={onSubmit} noValidate encType="multipart/form-data" className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="space-y-6 xl:col-span-2">
        <DataCard title={t("sections.general")}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <TextInput
              label={t("fields.code")}
              name="code"
              defaultValue={product?.code}
              placeholder={t("placeholders.code")}
              required
              maxLength={40}
              error={fieldErrors.code}
              className="[&_input]:font-mono [&_input]:uppercase"
            />
            <TextInput
              label={t("fields.name")}
              name="name"
              defaultValue={product?.name}
              placeholder={t("placeholders.name")}
              required
              maxLength={150}
              error={fieldErrors.name}
            />
            <SelectInput
              label={t("fields.category")}
              name="categoryId"
              defaultValue={product ? String(product.categoryId) : ""}
              placeholder={tc("select")}
              options={catOptions}
              required
              error={fieldErrors.categoryId}
            />
            <TextInput
              label={t("fields.brand")}
              name="brand"
              defaultValue={product?.brand}
              placeholder={t("placeholders.brand")}
              required
              maxLength={80}
              error={fieldErrors.brand}
            />
            <TextInput
              label={t("fields.compatibleModel")}
              name="compatibleModel"
              defaultValue={product?.compatibleModel ?? ""}
              placeholder={t("placeholders.compatibleModel")}
              maxLength={160}
              error={fieldErrors.compatibleModel}
            />
            <SelectInput
              label={t("fields.supplier")}
              name="supplierId"
              defaultValue={product?.supplierId ? String(product.supplierId) : ""}
              placeholder={t("noSupplier")}
              options={supOptions}
              error={fieldErrors.supplierId}
            />
            <TextAreaInput
              label={t("fields.description")}
              name="description"
              defaultValue={product?.description ?? ""}
              placeholder={t("placeholders.description")}
              maxLength={2000}
              rows={4}
              error={fieldErrors.description}
              className="sm:col-span-2"
            />
          </div>
        </DataCard>

        <DataCard title={t("sections.pricing")}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <TextInput
              label={t("fields.purchasePrice")}
              name="purchasePrice"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              prefix="$"
              defaultValue={product?.purchasePrice ?? ""}
              onChange={(e) => setPurchase(Number(e.target.value) || 0)}
              required
              error={fieldErrors.purchasePrice}
            />
            <TextInput
              label={t("fields.salePrice")}
              name="salePrice"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              prefix="$"
              defaultValue={product?.salePrice ?? ""}
              onChange={(e) => setSale(Number(e.target.value) || 0)}
              required
              error={fieldErrors.salePrice}
            />
            <div>
              <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-400">{t("fields.margin")}</p>
              <div className="flex h-11 items-center rounded-lg bg-gray-50 px-4 text-sm font-semibold text-gray-800 tabular-nums dark:bg-white/5 dark:text-white/90">
                {f.money(sale - purchase)} · {margin.toFixed(1)}%
              </div>
            </div>
          </div>
        </DataCard>
      </div>

      <div className="space-y-6">
        <DataCard title={t("sections.inventory")}>
          <div className="space-y-5">
            {isEdit ? (
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-white/5">
                <p className="text-sm text-gray-500 dark:text-gray-400">{t("fields.stock")}</p>
                <p className="text-2xl font-bold text-gray-900 tabular-nums dark:text-white">{product.stock}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t("hints.stockReadonly")}</p>
              </div>
            ) : (
              <TextInput
                label={t("fields.initialStock")}
                name="initialStock"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                defaultValue={0}
                hint={t("hints.initialStock")}
                required
                error={fieldErrors.initialStock}
              />
            )}
            <TextInput
              label={t("fields.minStock")}
              name="minStock"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              defaultValue={product?.minStock ?? 5}
              hint={t("hints.minStock")}
              required
              error={fieldErrors.minStock}
            />
            <CheckboxInput label={t("fields.active")} name="active" defaultChecked={product?.active ?? true} />
          </div>
        </DataCard>

        <DataCard title={t("sections.image")}>
          <div className="space-y-4">
            <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-white/3">
              {preview && !removeImage ? (
                <Image src={preview} alt={product?.name ?? ""} fill className="object-contain p-2" unoptimized />
              ) : (
                <span className="text-sm text-gray-400">{t("noImage")}</span>
              )}
            </div>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-white/5">
              <UploadIcon className="size-5" />
              {preview && !removeImage ? t("changeImage") : t("selectImage")}
              <input type="file" name="image" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onImage} />
            </label>
            {isEdit && preview && !removeImage && (
              <button
                type="button"
                className="w-full text-sm font-medium text-error-600 hover:text-error-700 dark:text-error-400"
                onClick={() => setRemoveImage(true)}
              >
                {t("removeImage")}
              </button>
            )}
            <input type="hidden" name="removeImage" value={removeImage ? "true" : "false"} />
            {imageError || fieldErrors.image ? (
              <p className="text-xs text-error-600 dark:text-error-400" role="alert">
                {msg(imageError ?? fieldErrors.image)}
              </p>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400">{t("hints.image")}</p>
            )}
          </div>
        </DataCard>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end xl:flex-col-reverse">
          <Button variant="outline" onClick={() => router.back()} disabled={pending}>
            {tc("cancel")}
          </Button>
          <Button type="submit" loading={pending} data-testid="product-submit">
            {pending ? tc("saving") : isEdit ? tc("saveChanges") : t("new")}
          </Button>
        </div>
      </div>
    </form>
  );
}
