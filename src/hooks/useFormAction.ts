"use client";

import { useToast } from "@/context/ToastContext";
import type { ActionResult, FormState } from "@/lib/action-result";
import { type FormEvent, useCallback, useState, useTransition } from "react";
import { useMessage } from "./useMessage";

type FormActionFn<T> = (prev: FormState, formData: FormData) => Promise<ActionResult<T>>;

/** Envía el formulario sin el reinicio automático de React 19, para no perder los datos si hay errores. */
export function useFormAction<T = unknown>(
  action: FormActionFn<T>,
  opts: { onSuccess?: (data?: T) => void; silentError?: boolean } = {},
) {
  const toast = useToast();
  const msg = useMessage();
  const [state, setState] = useState<ActionResult<T> | null>(null);
  const [pending, startTransition] = useTransition();
  const { onSuccess, silentError } = opts;

  const onSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      startTransition(async () => {
        const res = await action(state, formData);
        setState(res);
        if (res.ok) {
          if (res.message) toast.success(msg(res.message));
          onSuccess?.(res.data);
        } else if (!silentError) {
          toast.error(msg(res.message, res.params));
        }
      });
    },
    [action, state, toast, msg, onSuccess, silentError],
  );

  const fieldErrors: Record<string, string> = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const reset = useCallback(() => setState(null), []);

  return { state, pending, onSubmit, fieldErrors, reset };
}

export function useActionRunner() {
  const toast = useToast();
  const msg = useMessage();
  const [pending, startTransition] = useTransition();

  const run = useCallback(
    <T,>(fn: () => Promise<ActionResult<T>>, onDone?: (res: ActionResult<T>) => void) => {
      startTransition(async () => {
        const res = await fn();
        if (res.ok) {
          if (res.message) toast.success(msg(res.message));
        } else {
          toast.error(msg(res.message, res.params));
        }
        onDone?.(res);
      });
    },
    [toast, msg],
  );

  return { run, pending };
}
