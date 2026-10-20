// Shared by the server page and the client Studio (no "use client" here:
// the page calls isPanelId while rendering).

export const PANEL_IDS = [
  "home",
  "theme",
  "colors",
  "fonts",
  "layout",
  "identity",
  "sections",
  "popups",
  "whatsapp",
  "social-proof",
] as const;
export type PanelId = (typeof PANEL_IDS)[number];
export const isPanelId = (v: unknown): v is PanelId => PANEL_IDS.includes(v as PanelId);
