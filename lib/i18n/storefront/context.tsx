"use client";

import { createContext } from "react";
import type { StoreLocale } from "./runtime";

/** Active store language — read by the runtime during SSR of client components. */
export const StoreLocaleContext = createContext<StoreLocale>("ar");
