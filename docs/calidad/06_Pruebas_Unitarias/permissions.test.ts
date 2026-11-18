import { describe, expect, it } from "vitest";
import { can } from "../../../src/lib/permissions";

describe("SWR-AUTH-006 · can", () => {
  it("UT-05 · deniega registrar ventas cuando no existe un rol", () => {
    // Arrange
    const role = null;

    // Act
    const allowed = can(role, "sales.create");

    // Assert
    expect(allowed).toBe(false);
  });

  it("UT-06 · permite al vendedor registrar ventas", () => {
    // Arrange
    const role = "SELLER";

    // Act
    const allowed = can(role, "sales.create");

    // Assert
    expect(allowed).toBe(true);
  });

  it("UT-07 · deniega al vendedor el alta de productos", () => {
    // Arrange
    const role = "SELLER";

    // Act
    const allowed = can(role, "products.manage");

    // Assert
    expect(allowed).toBe(false);
  });

  it("UT-08 · permite al administrador dar de alta productos", () => {
    // Arrange
    const role = "ADMIN";

    // Act
    const allowed = can(role, "products.manage");

    // Assert
    expect(allowed).toBe(true);
  });
});
