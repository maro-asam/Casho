"use client";

import { createContext } from "react";
import type { Locale } from "./runtime";

/** Active dashboard locale — read by the runtime during SSR of client components. */
export const LocaleContext = createContext<Locale>("ar");
