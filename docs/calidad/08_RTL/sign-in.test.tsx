import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SignInForm from "../../../src/components/auth/SignInForm";
import type { ActionResult } from "../../../src/lib/action-result";
import { loginAction } from "../../../src/lib/actions/auth";
import { renderApp } from "./renderApp";

vi.mock("@/lib/actions/auth", () => ({ loginAction: vi.fn() }));

const login = vi.mocked(loginAction);

async function fillCredentials(user: ReturnType<typeof userEvent.setup>, email: string) {
  await user.type(screen.getByRole("textbox", { name: /correo electrónico/i }), email);
  await user.type(screen.getByLabelText(/contraseña/i, { selector: "input" }), "clave-de-prueba");
}

beforeEach(() => {
  login.mockReset();
});

describe("Inicio de sesión", () => {
  it("RTL-01 · SWR-AUTH-002 · asocia el aviso de formato con el correo y conserva lo escrito", async () => {
    login.mockResolvedValue({
      ok: false,
      message: "errors.validation",
      fieldErrors: { email: "invalidEmail" },
    });
    const user = userEvent.setup();
    renderApp(<SignInForm />);

    await fillCredentials(user, "correo-sin-arroba");
    await user.click(screen.getByRole("button", { name: "Ingresar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/correo electrónico válido/i);
    const email = screen.getByRole("textbox", { name: /correo electrónico/i });
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAccessibleDescription(/correo electrónico válido/i);
    expect(email).toHaveValue("correo-sin-arroba");
  });

  it("RTL-02 · SWR-AUTH-002 · muestra el rechazo genérico de credenciales", async () => {
    login.mockResolvedValue({ ok: false, message: "errors.invalidCredentials" });
    const user = userEvent.setup();
    renderApp(<SignInForm />);

    await fillCredentials(user, "vendedor@example.test");
    await user.click(screen.getByRole("button", { name: "Ingresar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Correo o contraseña incorrectos.");
    expect(screen.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
    expect(screen.getByRole("textbox", { name: /correo electrónico/i })).not.toHaveAttribute("aria-invalid");
  });

  it("RTL-03 · SWR-AUTH-004 · informa que una cuenta está desactivada", async () => {
    login.mockResolvedValue({ ok: false, message: "errors.inactiveUser" });
    const user = userEvent.setup();
    renderApp(<SignInForm />);

    await fillCredentials(user, "inactivo@example.test");
    await user.click(screen.getByRole("button", { name: "Ingresar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Su usuario está desactivado.");
    expect(screen.getByRole("button", { name: "Ingresar" })).toBeEnabled();
  });

  it("RTL-04 · SWR-AUTH-002 · bloquea un segundo envío mientras llega la respuesta", async () => {
    let respond!: (result: ActionResult) => void;
    login.mockReturnValue(new Promise((resolve) => {
      respond = resolve;
    }));
    const user = userEvent.setup();
    renderApp(<SignInForm />);

    await fillCredentials(user, "vendedor@example.test");
    await user.click(screen.getByRole("button", { name: "Ingresar" }));
    const submitting = await screen.findByRole("button", { name: /ingresando/i });
    expect(submitting).toBeDisabled();
    await user.click(submitting);
    expect(login).toHaveBeenCalledTimes(1);

    await act(async () => respond({ ok: false, message: "errors.invalidCredentials" }));
    expect(await screen.findByRole("button", { name: "Ingresar" })).toBeEnabled();
  });
});
