import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          environment: "node",
          include: ["docs/calidad/06_Pruebas_Unitarias/*.test.ts"],
        },
      },
      {
        resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
        plugins: [
          {
            name: "rtl-decorative-svg",
            enforce: "pre",
            load(id) {
              if (id.endsWith(".svg")) return "export default function Icon() { return null; }";
            },
          },
        ],
        test: {
          name: "rtl",
          environment: "jsdom",
          include: ["docs/calidad/08_RTL/*.test.tsx"],
          setupFiles: ["docs/calidad/08_RTL/setup.ts"],
        },
      },
      {
        resolve: {
          alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
            "server-only": fileURLToPath(new URL("./docs/calidad/12_Shift_Right/server-only.ts", import.meta.url)),
          },
        },
        test: {
          name: "observability",
          environment: "node",
          include: ["docs/calidad/12_Shift_Right/*.test.ts"],
        },
      },
    ],
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
