import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["docs/calidad/06_Pruebas_Unitarias/*.test.ts"],
    coverage: {
      provider: "v8",
      include: [
        "src/lib/sale-calc.ts",
        "src/lib/permissions.ts",
        "src/lib/validation/schemas.ts",
      ],
      reporter: ["text", "json", "json-summary"],
    },
  },
});
