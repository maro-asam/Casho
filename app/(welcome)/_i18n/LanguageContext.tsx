"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { type Lang, translations } from "./translations";

type Translations = (typeof translations)[Lang];

type LangContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
};

const LanguageContext = createContext<LangContextValue>({
  lang: "ar",
  setLang: () => {},
  t: translations.ar as Translations,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    const saved = localStorage.getItem("casho-lang") as Lang | null;
    if (saved === "en") setLangState("en");
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("casho-lang", l);
  };

  return (
    <LanguageContext.Provider
      value={{ lang, setLang, t: translations[lang] as Translations }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
