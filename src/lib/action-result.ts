/**
 * Resultado estándar de las server actions. `message` y los valores de
 * `fieldErrors` son claves de traducción (namespaces "toast", "errors", "validation").
 */
export type ActionResult<T = undefined> =
  | { ok: true; message?: string; data?: T }
  | {
      ok: false;
      message: string;
      params?: Record<string, string | number>;
      fieldErrors?: Record<string, string>;
    };

export type FormState = ActionResult<unknown> | null;
