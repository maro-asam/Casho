"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { UpdateStoreFontAction, UpdateStoreLanguageAction } from "@/actions/settings/theme.actions";
import { SegmentedButtons } from "@/components/saas-page";
import { ARABIC_FONT_LIST } from "@/constants/arabic-fonts";
import { ENGLISH_FONT_LIST } from "@/constants/english-fonts";
import { cn } from "@/lib/utils";
import { useBuilder } from "../BuilderContext";
import { Group, PanelBody, Row } from "../studio-ui";
import { tr } from "@/lib/i18n/dashboard";

export default function FontsPanel() {
  const { storeId, appearance, save } = useBuilder();
  const [fontId, setFontId] = useState(appearance.fontId);
  const [language, setLanguage] = useState(appearance.storeLanguage);
  const [busy, setBusy] = useState<string | null>(null);
  const english = language === "en";
  const fonts = english ? ENGLISH_FONT_LIST : ARABIC_FONT_LIST;

  async function pickFont(id: string) {
    if (id === fontId || busy) return;
    const previous = fontId;
    setFontId(id);
    setBusy(id);
    await save(() => UpdateStoreFontAction({ storeId, fontId: id, target: "draft" }), { onError: () => setFontId(previous) });
    setBusy(null);
  }

  async function pickLanguage(next: "ar" | "en") {
    if (next === language || busy) return;
    const previous = { language, fontId };
    setLanguage(next);
    setFontId(next === "en" ? "inter" : "cairo");
    setBusy("language");
    // Language + its default font in one step, so one undo reverts both.
    await save(() => UpdateStoreLanguageAction({ storeId, storeLanguage: next, withDefaultFont: true, target: "draft" }), {
      onError: () => {
        setLanguage(previous.language);
        setFontId(previous.fontId);
      },
    });
    setBusy(null);
  }

  return (
    <PanelBody>
      {/* All candidates, so each row previews in its own face. */}
      {fonts.map((f) => (
        <link key={f.id} rel="stylesheet" href={f.googleUrl} />
      ))}

      <Group footer={tr("اللغة بتغيّر اتجاه المتجر وخطه الافتراضي.")}>
        <Row label={tr("لغة المتجر")}>
          {busy === "language" && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
          <SegmentedButtons
            label={tr("لغة المتجر")}
            value={language}
            onChange={pickLanguage}
            options={[
              ["ar", tr("عربي")],
              ["en", "English"],
            ]}
          />
        </Row>
      </Group>

      <Group title={english ? "Fonts" : tr("الخط")} footer={tr("اختار خط مريح للقراية على الموبايل — بيتطبق على كل كلام المتجر.")}>
        <div role="radiogroup" aria-label={tr("الخط")} dir={english ? "ltr" : undefined}>
          {fonts.map((f) => {
            const active = f.id === fontId;
            return (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => pickFont(f.id)}
                className="relative flex w-full items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none [&+&]:before:absolute [&+&]:before:inset-x-4 [&+&]:before:top-0 [&+&]:before:border-t-[0.5px] [&+&]:before:border-border"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[19px] leading-7" style={{ fontFamily: f.family }}>
                    {f.sample ?? tr("متجرك الإلكتروني — تسوّق بكل سهولة")}
                  </span>
                  <span className="block text-[12px] text-muted-foreground" dir="ltr">
                    {f.name}
                  </span>
                </span>
                {busy === f.id ? (
                  <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
                ) : (
                  <Check className={cn("size-5 shrink-0 text-primary", !active && "invisible")} strokeWidth={2.6} />
                )}
              </button>
            );
          })}
        </div>
      </Group>
    </PanelBody>
  );
}
