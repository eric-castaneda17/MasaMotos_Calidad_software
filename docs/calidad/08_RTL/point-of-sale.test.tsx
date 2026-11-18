import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PosScreen from "../../../src/components/pos/PosScreen";
import { type PosProduct, searchPosProductsAction } from "../../../src/lib/actions/pos";
import { createSaleAction } from "../../../src/lib/actions/sales";
import { renderApp } from "./renderApp";

vi.mock("@/lib/actions/pos", () => ({ searchPosProductsAction: vi.fn() }));
vi.mock("@/lib/actions/sales", () => ({ createSaleAction: vi.fn() }));
vi.mock("@/lib/actions/customers", () => ({
  searchCustomersAction: vi.fn(),
  saveCustomerAction: vi.fn(),
}));
vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ push }) }));

const search = vi.mocked(searchPosProductsAction);
const createSale = vi.mocked(createSaleAction);
const push = vi.fn();

const brakePads: PosProduct = {
  id: 11,
  code: "REP-011",
  name: "Pastillas de freno",
  brand: "Yamaha",
  compatibleModel: null,
  salePrice: 25_000,
  stock: 3,
  stockStatus: "low",
  hasImage: false,
};
const filter: PosProduct = {
  ...brakePads,
  id: 12,
  code: "REP-012",
  name: "Filtro de aceite",
  stock: 8,
  stockStatus: "available",
};
const soldOut: PosProduct = {
  ...filter,
  id: 13,
  code: "REP-013",
  name: "Filtro agotado",
  stock: 0,
  stockStatus: "out",
};

function showSale() {
  return renderApp(
    <PosScreen
      defaultCustomer={{
        id: 1,
        fullName: "Consumidor final",
        documentType: "CC",
        documentNumber: "100",
        phone: null,
        email: null,
      }}
      methods={[{ id: 2, code: "CASH", name: "Efectivo" }]}
      taxRate={19}
      taxEnabled
    />,
  );
}

async function confirmSale(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Confirmar venta" }));
  const dialog = await screen.findByRole("alertdialog", { name: /confirmar la venta/i });
  await user.click(within(dialog).getByRole("button", { name: "Confirmar venta" }));
}

beforeEach(() => {
  search.mockReset();
  search.mockResolvedValue([brakePads, filter]);
  createSale.mockReset();
  push.mockReset();
});

describe("Punto de venta", () => {
  it("RTL-05 · SWR-BUS-005 · informa que una búsqueda no tuvo coincidencias", async () => {
    search.mockResolvedValueOnce([brakePads]).mockResolvedValueOnce([]);
    const user = userEvent.setup();
    showSale();
    await screen.findByRole("button", { name: /REP-011/ });

    await user.type(screen.getByRole("searchbox", { name: /buscar producto/i }), "REP-999");

    expect(await screen.findByText("No se encontraron productos activos.")).toBeVisible();
    expect(screen.queryByRole("button", { name: /REP-011/ })).not.toBeInTheDocument();
  });

  it("RTL-06 · SWR-BUS-003 · muestra los seis datos del repuesto y distingue un agotado", async () => {
    search.mockResolvedValue([brakePads, soldOut]);
    showSale();

    const card = await screen.findByRole("button", { name: /Pastillas de freno.*REP-011/ });
    expect(card).toHaveTextContent("Yamaha");
    expect(card).toHaveTextContent(/\$\s*25\.000/);
    expect(card).toHaveTextContent(/Existencias: 3/);
    expect(card).toHaveTextContent(/stock bajo/i);
    const unavailable = screen.getByRole("button", { name: /REP-013/ });
    expect(within(unavailable).getByText("Agotado", { exact: true })).toBeVisible();
    expect(unavailable).toHaveTextContent("Existencias: 0");
    expect(unavailable).toBeDisabled();
  });

  it("RTL-07 · SWR-VEN-001 · impide confirmar un carrito vacío", async () => {
    const user = userEvent.setup();
    showSale();
    await screen.findByRole("button", { name: /REP-011/ });

    expect(screen.getByText("El carrito está vacío")).toBeVisible();
    const confirm = screen.getByRole("button", { name: "Confirmar venta" });
    expect(confirm).toBeDisabled();
    await user.click(confirm);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(createSale).not.toHaveBeenCalled();
  });

  it("RTL-08 · SWR-VEN-001 · agrega dos repuestos y cambia solo una cantidad", async () => {
    const user = userEvent.setup();
    showSale();

    await user.click(await screen.findByRole("button", { name: /REP-011/ }));
    await user.click(screen.getByRole("button", { name: /REP-012/ }));
    const cart = screen.getByRole("list");
    const [first, second] = within(cart).getAllByRole("listitem");
    await user.click(within(first).getByRole("button", { name: "Aumentar cantidad" }));

    expect(first).toHaveTextContent("Pastillas de freno");
    expect(second).toHaveTextContent("Filtro de aceite");
    expect(within(first).getByRole("spinbutton", { name: "Cantidad" })).toHaveValue(2);
    expect(within(second).getByRole("spinbutton", { name: "Cantidad" })).toHaveValue(1);
  });

  it("RTL-09 · SWR-VEN-002 · limita el exceso escrito y explica cuántas unidades hay", async () => {
    const user = userEvent.setup();
    showSale();
    await user.click(await screen.findByRole("button", { name: /REP-011/ }));

    const quantity = screen.getByRole("spinbutton", { name: "Cantidad" });
    await user.type(quantity, "4", { initialSelectionStart: 0, initialSelectionEnd: 1 });

    expect(quantity).toHaveValue(3);
    expect(quantity).toHaveAccessibleDescription(/Existencias: 3/);
    expect(await screen.findByText("Solo hay 3 unidades disponibles de Pastillas de freno.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Aumentar cantidad" })).toBeDisabled();
  });

  it("RTL-10 · SWR-VEN-002 · distingue el límite del carrito y reabre la opción al reducir", async () => {
    const user = userEvent.setup();
    showSale();
    const card = await screen.findByRole("button", { name: /REP-011/ });
    await user.click(card);
    const increase = screen.getByRole("button", { name: "Aumentar cantidad" });

    await user.click(increase);
    await user.click(increase);
    expect(increase).toBeDisabled();
    expect(card).toBeDisabled();
    expect(card).toHaveTextContent(/límite de existencias alcanzado/i);
    expect(card).toHaveTextContent(/stock bajo/i);

    await user.click(screen.getByRole("button", { name: "Disminuir cantidad" }));
    expect(increase).toBeEnabled();
    expect(card).toBeEnabled();
    expect(card).toHaveTextContent("Queda 1 unidad por agregar");
  });

  it("RTL-11 · SWR-VEN-003 · actualiza subtotal, descuento, IVA y total al editar el porcentaje", async () => {
    const user = userEvent.setup();
    showSale();
    await user.click(await screen.findByRole("button", { name: /REP-011/ }));
    await user.click(screen.getByRole("button", { name: "Aumentar cantidad" }));

    await user.type(screen.getByRole("spinbutton", { name: "Porcentaje" }), "10");

    expect(screen.getByText("Subtotal").parentElement).toHaveTextContent(/50\.000/);
    expect(screen.getByText("Descuento", { selector: "dt" }).parentElement).toHaveTextContent(/5\.000/);
    expect(screen.getByText("IVA (19%)").parentElement).toHaveTextContent(/8\.550/);
    expect(screen.getByText("Total a pagar").parentElement).toHaveTextContent(/53\.550/);
  });

  it("RTL-12 · SWR-CPB-001 · muestra el número recibido y permite abrir la factura", async () => {
    createSale.mockResolvedValue({
      ok: true,
      message: "toast.saleCreated",
      data: { saleId: 17, invoiceId: 51, invoiceNumber: "MM-000051" },
    });
    const user = userEvent.setup();
    showSale();
    await user.click(await screen.findByRole("button", { name: /REP-011/ }));

    await confirmSale(user);

    expect(await screen.findByRole("heading", { name: "¡Venta registrada!" })).toBeVisible();
    expect(screen.getByText("Se generó la factura MM-000051.")).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("Venta registrada y factura generada.");
    await user.click(screen.getByRole("button", { name: "Ver factura" }));
    expect(push).toHaveBeenCalledWith("/facturas/51");
  });

  it("RTL-13 · SWR-VEN-002 · informa el nuevo saldo si el servidor rechaza la venta", async () => {
    createSale.mockResolvedValue({
      ok: false,
      message: "errors.insufficientStock",
      params: { product: "Pastillas de freno", available: 0 },
    });
    const user = userEvent.setup();
    showSale();
    await user.click(await screen.findByRole("button", { name: /REP-011/ }));

    await confirmSale(user);

    expect(await screen.findByText(/stock insuficiente.*disponible: 0/i)).toBeVisible();
    expect(screen.getByRole("spinbutton", { name: "Cantidad" })).toHaveValue(1);
    expect(screen.queryByRole("heading", { name: "¡Venta registrada!" })).not.toBeInTheDocument();
  });
});
