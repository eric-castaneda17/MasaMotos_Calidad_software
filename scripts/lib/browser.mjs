/**
 * Utilidades de navegador para las pruebas de humo y la captura de evidencias.
 * Usa playwright-core con el navegador instalado en el equipo (Edge o Chrome),
 * sin descargar navegadores adicionales.
 */
import { chromium } from "playwright-core";
import { qaCredentials } from "./qa-credentials.mjs";

export const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

export async function launch() {
  for (const channel of ["msedge", "chrome"]) {
    try {
      return await chromium.launch({ channel, headless: true });
    } catch {
      /* intenta el siguiente */
    }
  }
  throw new Error("No se encontró Microsoft Edge ni Google Chrome instalados.");
}

/** Crea un contexto con el idioma fijado en la cookie NEXT_LOCALE. */
export async function newContext(browser, { locale = "es", viewport = { width: 1440, height: 900 } } = {}) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const url = new URL(BASE_URL);
  await context.addCookies([{ name: "NEXT_LOCALE", value: locale, domain: url.hostname, path: "/" }]);
  return context;
}

export async function login(page, email, password) {
  await page.goto(`${BASE_URL}/signin`, { waitUntil: "networkidle" });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await Promise.all([
    page.waitForURL((u) => !u.pathname.startsWith("/signin"), { timeout: 30000 }),
    page.click('[data-testid="signin-submit"]'),
  ]);
  await page.waitForLoadState("networkidle");
}

export const ADMIN = {
  get email() { return qaCredentials("ADMIN").email; },
  get password() { return qaCredentials("ADMIN").password; },
};
export const SELLER = {
  get email() { return qaCredentials("SELLER").email; },
  get password() { return qaCredentials("SELLER").password; },
};
