import type { Instrumentation } from "next";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { logEvent, createLogContext } = await import("./lib/observability/logger");
    logEvent("APPLICATION_STARTED", createLogContext());
  }
}

export const onRequestError: Instrumentation.onRequestError = async () => {
  const { logEvent, createLogContext } = await import("./lib/observability/logger");
  logEvent("REQUEST_ERROR", createLogContext(), { reason: "internal" });
};
