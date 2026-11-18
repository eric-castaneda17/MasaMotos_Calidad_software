import { EsFlagIcon, UsFlagIcon } from "@/icons";

import type { Locale } from "./routing";

export interface Language {
  id: Locale;
  name: string;
  shortName: string;
  code: string;
  dir: "ltr" | "rtl";
  FlagIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export const languages: Language[] = [
  {
    id: "es",
    name: "Español",
    shortName: "Español",
    code: "ES",
    dir: "ltr",
    FlagIcon: EsFlagIcon,
  },
  {
    id: "en",
    name: "English",
    shortName: "English",
    code: "EN",
    dir: "ltr",
    FlagIcon: UsFlagIcon,
  },
];

export function getLanguage(locale: Locale): Language {
  return languages.find((l) => l.id === locale) || languages[0];
}

export function isRtl(locale: Locale): boolean {
  return getLanguage(locale).dir === "rtl";
}
