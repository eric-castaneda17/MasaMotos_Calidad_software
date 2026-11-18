"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "theme-mode";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function readStoredTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  if (saved === "auto") return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  return "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // null hasta leer localStorage, que solo existe en el cliente (evita errores de hidratación).
  const [stored, setStored] = useState<Theme | null>(null);
  const theme = stored ?? "light";

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStored(readStoredTheme());
  }, []);

  useEffect(() => {
    if (!stored) return;
    localStorage.setItem(STORAGE_KEY, stored);
    document.documentElement.classList.toggle("dark", stored === "dark");
  }, [stored]);

  const toggleTheme = useCallback(() => setStored((t) => (t === "dark" ? "light" : "dark")), []);
  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}
