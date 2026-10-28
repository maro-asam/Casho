import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import { LargeTitle, StatusText } from "@/components/saas-page";
import { APPS, APP_CATEGORY_LABELS, type AppCategory, type AppDefinition } from "@/lib/apps/catalog";
import { liveAppearance, APPEARANCE_SELECT } from "@/lib/studio/appearance";
import { getThemePreset } from "@/constants/store-themes";
import { getStoreFont } from "@/constants/arabic-fonts";
import { prisma } from "@/lib/prisma";
import { INSTAGRAM_ORDERS_ENABLED } from "@/lib/instagram/feature";
import type { PillTone } from "@/components/saas-page";
import { AppIcon } from "./_components/app-ui";
import { tdir, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return {
    title: tr("التطبيقات"),
    description: tr("ثيمات وخطوط وأدوات تضيفها لمتجرك وتثبتها بضغطة"),
  };
}

/** What the card says under the tagline; no tone = a plain "open" link. */
type AppState = { label: string; tone?: PillTone; detail?: string };

export default async function AppsPage() {
  await loadDashboardLocale();
  const userId = await requireUserId();
  const store = await prisma.store.findFirst({
    where: { userId },
    select: {
      id: true,
      settings: { select: { ...APPEARANCE_SELECT, telegramChatId: true } },
      apps: { select: { appId: true, isActive: true } },
      instagramConnection: { select: { id: true } },
    },
  });

  const appearance = liveAppearance(store?.settings);
  const installed = new Map(store?.apps.map((a) => [a.appId, a]) ?? []);

  const stateOf = (app: AppDefinition): AppState => {
    switch (app.id) {
      case "themes":
        return { label: tr("مثبت"), tone: "success", detail: getThemePreset(appearance.themeConfig.presetId).name };
      case "fonts":
        return { label: tr("مثبت"), tone: "success", detail: getStoreFont(appearance.fontId).name };
      case "telegram":
        return store?.settings?.telegramChatId ? { label: tr("متصل"), tone: "success" } : { label: tr("اربط") };
      case "instagram":
        if (!INSTAGRAM_ORDERS_ENABLED) return { label: tr("قريباً"), tone: "neutral" };
        return store?.instagramConnection ? { label: tr("متصل"), tone: "success" } : { label: tr("اربط") };
    }
    if (app.kind === "tool") return { label: tr("فتح") };
    const row = installed.get(app.id);
    if (!row) return { label: tr("تثبيت") };
    return row.isActive ? { label: tr("مثبت وشغال"), tone: "success" } : { label: tr("مثبت — متوقف"), tone: "warning" };
  };

  const categories = Object.keys(APP_CATEGORY_LABELS) as AppCategory[];

  return (
    <div className="space-y-8" dir={tdir()}>
      <LargeTitle
        title={tr("التطبيقات")}
        subtitle={tr("كل اللي تقدر تضيفه لمتجرك — ثيمات وخطوط وأدوات من Casho وشركاء — كل تطبيق ليه صفحته وإعداداته.")}
      />

      {categories.map((category) => {
        const apps = APPS.filter((app) => app.category === category);
        if (apps.length === 0) return null;
        return (
          <section key={category} aria-labelledby={`apps-${category}`} className="space-y-3">
            <h2 id={`apps-${category}`} className="px-1 text-[20px] leading-[25px] font-semibold">
              {tr(APP_CATEGORY_LABELS[category])}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {apps.map((app) => {
                const state = stateOf(app);
                return (
                  <li key={app.id}>
                    <Link
                      href={app.href}
                      className="apple-card apple-press group flex h-full items-start gap-4 p-4 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <AppIcon id={app.id} />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-[17px] leading-[22px] font-semibold">{tr(app.name)}</p>
                          <ChevronLeft className="size-4 shrink-0 text-muted-foreground ltr:-scale-x-100" />
                        </div>
                        <p className="line-clamp-2 text-[13px] leading-[18px] text-muted-foreground">{tr(app.tagline)}</p>
                        <div className="pt-1">
                          {state.tone ? (
                            <StatusText tone={state.tone}>
                              {state.label}
                              {state.detail && <span className="text-muted-foreground"> · {state.detail}</span>}
                            </StatusText>
                          ) : (
                            <span className="text-[13px] font-semibold text-primary">{state.label}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
