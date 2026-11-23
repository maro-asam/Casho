"use client";

import { createContext } from "react";
import type { StoreLocale } from "./runtime";
import { DEFAULT_STORE_CURRENCY, type StoreCurrency } from "@/lib/store/currency";

/** Active store language — read by the runtime during SSR of client components. */
export const StoreLocaleContext = createContext<StoreLocale>("ar");

/** Active store currency — read by the runtime during SSR of client components. */
export const StoreCurrencyContext = createContext<StoreCurrency>(DEFAULT_STORE_CURRENCY);
