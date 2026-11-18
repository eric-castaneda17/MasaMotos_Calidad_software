import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./docs/calidad/10_Playwright",
  testMatch: "**/*.spec.mts",
  outputDir: "./test-results/qa",
  reporter: [
    ["list"],
    ["json", { outputFile: ".qa/playwright-resultados.json" }],
    ["html", { outputFolder: "playwright-report/qa", open: "never" }],
  ],
  workers: 1,
  retries: 0,
  timeout: 75000,
  expect: { timeout: 15000 },
  use: {
    baseURL: process.env.QA_APP_URL ?? "http://localhost:3000",
    channel: "msedge",
    locale: "es-CO",
    trace: "off",
  },
});
