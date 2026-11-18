import { describe, expect, it } from "vitest";
import { saleSchema } from "../../../src/lib/validation/schemas";

const sale = {
  customerId: 1,
  paymentMethodId: 1,
  discountType: "PERCENT",
} as const;

describe("SWR-VEN-001 · saleSchema", () => {
  it("UT-09 · acepta un carrito con una línea de una unidad", () => {
    // Arrange
    const input = { ...sale, items: [{ productId: 7, quantity: 1 }] };

    // Act
    const result = saleSchema.safeParse(input);

    // Assert
    expect(result).toEqual({
      success: true,
      data: { ...input, discountValue: 0 },
    });
  });

  it("UT-10 · rechaza un carrito sin líneas", () => {
    // Arrange
    const input = { ...sale, items: [] };

    // Act
    const result = saleSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      expect.objectContaining({ path: ["items"], message: "emptyCart" }),
    ]);
  });

  it("UT-11 · rechaza una línea con cantidad cero", () => {
    // Arrange
    const input = { ...sale, items: [{ productId: 7, quantity: 0 }] };

    // Act
    const result = saleSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      expect.objectContaining({ path: ["items", 0, "quantity"], message: "positive" }),
    ]);
  });
});
