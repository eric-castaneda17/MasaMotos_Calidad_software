import { describe, expect, it } from "vitest";
import { calculateTotals } from "../../../src/lib/sale-calc";

describe("SWR-VEN-003 · calculateTotals", () => {
  it("UT-01 · calcula el descuento porcentual antes del IVA", () => {
    // Arrange
    const lines = [
      { unitPrice: 20_000, quantity: 2 },
      { unitPrice: 10_000, quantity: 1 },
    ];

    // Act
    const totals = calculateTotals(lines, "PERCENT", 10, 19, true);

    // Assert
    expect(totals).toEqual({
      subtotal: 50_000,
      discount: 5_000,
      taxRate: 19,
      taxAmount: 8_550,
      total: 53_550,
    });
  });

  it("UT-02 · aplica un descuento fijo con el IVA deshabilitado", () => {
    // Arrange
    const lines = [{ unitPrice: 25_000, quantity: 2 }];

    // Act
    const totals = calculateTotals(lines, "AMOUNT", 10_000, 19, false);

    // Assert
    expect(totals).toEqual({
      subtotal: 50_000,
      discount: 10_000,
      taxRate: 0,
      taxAmount: 0,
      total: 40_000,
    });
  });

  it("UT-03 · limita un descuento fijo superior al subtotal", () => {
    // Arrange
    const lines = [{ unitPrice: 25_000, quantity: 2 }];

    // Act
    const totals = calculateTotals(lines, "AMOUNT", 60_000, 19, true);

    // Assert
    expect(totals).toEqual({
      subtotal: 50_000,
      discount: 50_000,
      taxRate: 19,
      taxAmount: 0,
      total: 0,
    });
  });

  it("UT-04 · ignora un descuento negativo en el cálculo de la vista previa", () => {
    // Arrange
    const lines = [{ unitPrice: 25_000, quantity: 2 }];

    // Act
    const totals = calculateTotals(lines, "PERCENT", -10, 19, true);

    // Assert
    expect(totals).toEqual({
      subtotal: 50_000,
      discount: 0,
      taxRate: 19,
      taxAmount: 9_500,
      total: 59_500,
    });
  });
});
