import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
import { ToastProvider } from "../../../src/context/ToastContext";
import messages from "../../../src/messages/es.json";

export function renderApp(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages} timeZone="America/Bogota">
      <ToastProvider>{ui}</ToastProvider>
    </NextIntlClientProvider>,
  );
}
