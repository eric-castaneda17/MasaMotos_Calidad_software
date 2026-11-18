"use client";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import DataCard from "@/components/common/DataCard";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/context/ToastContext";
import { useFormat } from "@/hooks/useFormat";
import { useMessage } from "@/hooks/useMessage";
import { useModal } from "@/hooks/useModal";
import { useRouter } from "@/i18n/navigation";
import { CartIcon } from "@/icons";
import type { CustomerOption } from "@/lib/actions/customers";
import type { PosProduct } from "@/lib/actions/pos";
import { createSaleAction } from "@/lib/actions/sales";
import { calculateTotals, type DiscountType } from "@/lib/sale-calc";
import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import CartTable from "./CartTable";
import CustomerPicker from "./CustomerPicker";
import PaymentPanel from "./PaymentPanel";
import ProductSearch from "./ProductSearch";
import SaleSuccessModal from "./SaleSuccessModal";
import type { CartLine, PaymentMethodOption } from "./types";

interface PosScreenProps {
  methods: PaymentMethodOption[];
  taxRate: number;
  taxEnabled: boolean;
  defaultCustomer: CustomerOption | null;
}

export default function PosScreen({ methods, taxRate, taxEnabled, defaultCustomer }: PosScreenProps) {
  const t = useTranslations("pos");
  const msg = useMessage();
  const f = useFormat();
  const toast = useToast();
  const router = useRouter();
  const confirm = useModal();
  const [isPending, startTransition] = useTransition();

  const [lines, setLines] = useState<CartLine[]>([]);
  const [customer, setCustomer] = useState<CustomerOption | null>(defaultCustomer);
  const [methodId, setMethodId] = useState<number | null>(methods[0]?.id ?? null);
  const [discountType, setDiscountType] = useState<DiscountType>("PERCENT");
  const [discountValue, setDiscountValue] = useState(0);
  const [amountReceived, setAmountReceived] = useState("");
  const [notes, setNotes] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [receivedError, setReceivedError] = useState<string>();
  const [result, setResult] = useState<{ invoiceId: number; invoiceNumber: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const totals = useMemo(
    () => calculateTotals(lines, discountType, discountValue, taxRate, taxEnabled),
    [lines, discountType, discountValue, taxRate, taxEnabled],
  );
  const inCart = useMemo(() => new Map(lines.map((l) => [l.productId, l.quantity])), [lines]);
  const isCash = methods.find((m) => m.id === methodId)?.code === "CASH";

  const addProduct = (p: PosProduct) => {
    if ((inCart.get(p.id) ?? 0) >= p.stock) {
      toast.error(t("stockLimit", { stock: p.stock, product: p.name }));
      return;
    }
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === p.id);
      if (existing) {
        if (existing.quantity >= p.stock) return prev;
        return prev.map((l) => (l.productId === p.id ? { ...l, quantity: l.quantity + 1, stock: p.stock } : l));
      }
      return [...prev, { productId: p.id, code: p.code, name: p.name, unitPrice: p.salePrice, stock: p.stock, quantity: 1 }];
    });
  };

  const setQuantity = (productId: number, quantity: number) => {
    const line = lines.find((l) => l.productId === productId);
    if (!line) return;
    if (quantity > line.stock) {
      toast.error(t("stockLimit", { stock: line.stock, product: line.name }));
    }
    setLines((prev) =>
      prev.map((l) =>
        l.productId === productId ? { ...l, quantity: Math.min(l.stock, Math.max(1, quantity)) } : l,
      ),
    );
  };

  const resetSale = () => {
    setLines([]);
    setCustomer(defaultCustomer);
    setDiscountValue(0);
    setAmountReceived("");
    setNotes("");
    setShowErrors(false);
    setReceivedError(undefined);
    setResult(null);
  };

  const requestConfirm = () => {
    setShowErrors(true);
    setReceivedError(undefined);
    if (lines.length === 0) return toast.error(msg("errors.emptyCart"));
    if (!customer) return toast.error(t("customer.required"));
    if (!methodId) return toast.error(msg("errors.paymentMethodRequired"));
    if (isCash && amountReceived && Number(amountReceived) < totals.total) {
      setReceivedError(msg("errors.amountReceivedTooLow"));
      return;
    }
    confirm.openModal();
  };

  const submit = () => {
    if (!customer || !methodId) return;
    startTransition(async () => {
      const res = await createSaleAction({
        customerId: customer.id,
        paymentMethodId: methodId,
        discountType,
        discountValue,
        amountReceived: isCash && amountReceived ? Number(amountReceived) : undefined,
        notes: notes.trim() || undefined,
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
      });
      confirm.closeModal();
      if (res.ok && res.data) {
        toast.success(msg(res.message));
        setResult({ invoiceId: res.data.invoiceId, invoiceNumber: res.data.invoiceNumber });
        setLines([]);
        setRefreshKey((k) => k + 1);
      } else if (!res.ok) {
        toast.error(msg(res.message, res.params));
        if (res.fieldErrors?.amountReceived) setReceivedError(msg(res.fieldErrors.amountReceived));
        setRefreshKey((k) => k + 1);
      }
    });
  };

  const itemCount = lines.reduce((a, l) => a + l.quantity, 0);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
      <div className="min-w-0 space-y-6 xl:col-span-3">
        <DataCard>
          <ProductSearch onAdd={addProduct} inCart={inCart} refreshKey={refreshKey} />
        </DataCard>
        <DataCard
          title={t("cart.title")}
          subtitle={lines.length ? t("cart.items", { count: itemCount }) : undefined}
          actions={
            lines.length > 0 && (
              <button
                type="button"
                onClick={() => setLines([])}
                className="text-sm font-medium text-error-600 hover:text-error-700 dark:text-error-400"
              >
                {t("cart.clear")}
              </button>
            )
          }
          bodyClassName="py-1 sm:py-2"
        >
          <CartTable lines={lines} onQuantity={setQuantity} onRemove={(id) => setLines((p) => p.filter((l) => l.productId !== id))} />
        </DataCard>
      </div>

      <div className="min-w-0 space-y-6 xl:col-span-2">
        <div className="space-y-6 xl:sticky xl:top-28">
          <DataCard title={t("customer.title")}>
            <CustomerPicker value={customer} onChange={setCustomer} error={showErrors && !customer} />
          </DataCard>
          <DataCard title={t("payment.title")}>
            <PaymentPanel
              methods={methods}
              methodId={methodId}
              onMethod={setMethodId}
              discountType={discountType}
              discountValue={discountValue}
              onDiscount={(type, value) => {
                setDiscountType(type);
                setDiscountValue(value);
              }}
              amountReceived={amountReceived}
              onAmountReceived={setAmountReceived}
              notes={notes}
              onNotes={setNotes}
              totals={totals}
              taxEnabled={taxEnabled}
              receivedError={receivedError}
            />
            <Button
              className="mt-5 w-full"
              size="md"
              startIcon={<CartIcon />}
              onClick={requestConfirm}
              disabled={lines.length === 0}
              loading={isPending}
              data-testid="pos-confirm"
            >
              {isPending ? t("confirming") : t("confirm")}
            </Button>
          </DataCard>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirm.isOpen}
        onClose={confirm.closeModal}
        title={t("confirmTitle")}
        message={t("confirmMessage", { total: f.money(totals.total), customer: customer?.fullName ?? "" })}
        confirmLabel={t("confirm")}
        variant="primary"
        loading={isPending}
        onConfirm={submit}
      />
      <SaleSuccessModal
        invoiceNumber={result?.invoiceNumber ?? null}
        onNewSale={resetSale}
        onViewInvoice={() => result && router.push(`/facturas/${result.invoiceId}`)}
      />
    </div>
  );
}
