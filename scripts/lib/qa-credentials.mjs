import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

export function qaCredentials(role) {
  if (!["ADMIN", "SELLER"].includes(role)) throw new Error("Rol de pruebas inválido.");
  const emailKey = `QA_${role}_EMAIL`;
  const passwordKey = `QA_${role}_PASSWORD`;
  const email = process.env[emailKey]?.trim().toLowerCase();
  const password = process.env[passwordKey];
  if (!email || !password) {
    throw new Error(`Defina ${emailKey} y ${passwordKey} en el entorno privado.`);
  }
  return { email, password };
}
