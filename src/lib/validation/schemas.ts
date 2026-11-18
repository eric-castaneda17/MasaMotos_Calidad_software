import { z } from "zod";

/** Compartidos por cliente y servidor; los mensajes son claves del namespace "validation". */

const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const requiredText = (max: number) =>
  z
    .string({ error: "required" })
    .trim()
    .min(1, { error: "required" })
    .max(max, { error: "tooLong" });

const optionalText = (max: number) =>
  z.preprocess(
    emptyToUndefined,
    z.string().trim().max(max, { error: "tooLong" }).optional(),
  );

const optionalEmail = z.preprocess(
  emptyToUndefined,
  z.email({ error: "invalidEmail" }).max(160, { error: "tooLong" }).optional(),
);

const optionalPhone = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .trim()
    .regex(/^[0-9+()\-\s]{7,20}$/, { error: "invalidPhone" })
    .optional(),
);

const money = z.coerce
  .number({ error: "invalidNumber" })
  .refine(Number.isFinite, { error: "invalidNumber" })
  .min(0, { error: "nonNegative" })
  .max(9_999_999_999, { error: "tooLarge" });

const nonNegativeInt = z.coerce
  .number({ error: "invalidNumber" })
  .int({ error: "integer" })
  .min(0, { error: "nonNegative" })
  .max(1_000_000, { error: "tooLarge" });

const positiveInt = z.coerce
  .number({ error: "invalidNumber" })
  .int({ error: "integer" })
  .min(1, { error: "positive" })
  .max(1_000_000, { error: "tooLarge" });

const id = z.coerce.number({ error: "required" }).int().positive({ error: "required" });

const optionalId = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().positive().optional(),
);

const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

export const loginSchema = z.object({
  email: z.email({ error: "invalidEmail" }),
  password: z.string().min(1, { error: "required" }),
});

export const productSchema = z
  .object({
    code: requiredText(40).regex(/^[A-Za-z0-9\-_.]+$/, { error: "invalidCode" }),
    name: requiredText(150),
    description: optionalText(2000),
    categoryId: id,
    brand: requiredText(80),
    compatibleModel: optionalText(160),
    purchasePrice: money,
    salePrice: money,
    minStock: nonNegativeInt,
    supplierId: optionalId,
    active: checkbox,
  })
  .refine((d) => d.salePrice >= d.purchasePrice, {
    path: ["salePrice"],
    error: "salePriceBelowCost",
  });

/** Stock inicial solo al crear (después se modifica con movimientos). */
export const productCreateSchema = productSchema.and(
  z.object({ initialStock: nonNegativeInt }),
);

export const movementSchema = z.object({
  productId: id,
  type: z.enum(["ENTRY", "EXIT", "ADJUSTMENT"], { error: "required" }),
  quantity: nonNegativeInt,
  reason: optionalText(255),
});

export const categorySchema = z.object({
  name: requiredText(80),
  description: optionalText(255),
  active: checkbox,
});

export const DOCUMENT_TYPES = ["CC", "CE", "NIT", "PP", "TI"] as const;

export const customerSchema = z.object({
  fullName: requiredText(150),
  documentType: z.enum(DOCUMENT_TYPES, { error: "required" }),
  documentNumber: requiredText(30).regex(/^[0-9A-Za-z\-]{3,30}$/, {
    error: "invalidDocument",
  }),
  phone: optionalPhone,
  email: optionalEmail,
  address: optionalText(255),
});

export const supplierSchema = z.object({
  name: requiredText(150),
  taxId: requiredText(30).regex(/^[0-9A-Za-z\-.]{3,30}$/, { error: "invalidDocument" }),
  contactName: optionalText(120),
  phone: optionalPhone,
  email: optionalEmail,
  address: optionalText(255),
  city: optionalText(80),
  active: checkbox,
});

export const saleSchema = z.object({
  customerId: id,
  paymentMethodId: id,
  discountType: z.enum(["PERCENT", "AMOUNT"]),
  discountValue: z.coerce.number().min(0, { error: "nonNegative" }).default(0),
  amountReceived: z.preprocess(emptyToUndefined, money.optional()),
  notes: optionalText(500),
  items: z
    .array(z.object({ productId: id, quantity: positiveInt }))
    .min(1, { error: "emptyCart" })
    .max(200),
});

export type SaleInput = z.infer<typeof saleSchema>;

const password = z
  .string()
  .min(8, { error: "passwordMin" })
  .max(72, { error: "tooLong" })
  .regex(/[A-Za-z]/, { error: "passwordWeak" })
  .regex(/[0-9]/, { error: "passwordWeak" });

export const userCreateSchema = z.object({
  name: requiredText(120),
  email: z.email({ error: "invalidEmail" }).max(160),
  role: z.enum(["ADMIN", "SELLER"]),
  password,
  active: checkbox,
});

export const userUpdateSchema = z.object({
  name: requiredText(120),
  email: z.email({ error: "invalidEmail" }).max(160),
  role: z.enum(["ADMIN", "SELLER"]),
  password: z.preprocess(emptyToUndefined, password.optional()),
  active: checkbox,
});

export const profileSchema = z.object({
  name: requiredText(120),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { error: "required" }),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    error: "passwordMismatch",
  });

export const settingsSchema = z.object({
  companyName: requiredText(120),
  companyTaxId: optionalText(30),
  companyAddress: optionalText(255),
  companyPhone: optionalPhone,
  companyEmail: optionalEmail,
  taxRate: z.coerce
    .number({ error: "invalidNumber" })
    .min(0, { error: "nonNegative" })
    .max(100, { error: "tooLarge" }),
  taxEnabled: checkbox,
  invoicePrefix: requiredText(10).regex(/^[A-Za-z0-9\-]+$/, { error: "invalidCode" }),
  invoiceFooter: optionalText(500),
});

export const paymentMethodSchema = z.object({
  name: requiredText(80),
  active: checkbox,
});

export function toFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function formDataToObject(formData: FormData) {
  const obj: Record<string, unknown> = {};
  for (const [k, v] of formData.entries()) {
    if (k.startsWith("$ACTION")) continue;
    if (typeof v === "string") obj[k] = v;
  }
  return obj;
}
