"use client";

import { useState } from "react";
import {
  Palette,
  Droplets,
  LayoutGrid,
  Type,
  Layers,
  ExternalLink,
  ImageIcon,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

import ThemePicker from "./ThemePicker";
import StoreColorsSection from "./StoreColorsSection";
import StoreFontPicker from "./StoreFontPicker";
import ThemeLayoutEditor from "./ThemeLayoutEditor";
import ThemeSectionsEditor from "./ThemeSectionsEditor";
import StoreIdentitySection from "./StoreIdentitySection";
import type { ThemeLayout, ThemeSections, SectionContentMap } from "@/types/store-theme.types";

type Props = {
  storeId: string;
  storeSlug: string;
  currentThemeId?: string | null;
  currentFontId?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  navbarVariant?: string | null;
  currentLayout: ThemeLayout;
  currentSections: ThemeSections;
  sectionContent?: SectionContentMap;
  logo?: string | null;
  coverImage?: string | null;
  description?: string | null;
  announcementText?: string | null;
  showStoreName?: boolean;
};

const TABS = [
  { value: "theme",    label: "الثيم",    icon: Palette },
  { value: "colors",   label: "الألوان",  icon: Droplets },
  { value: "design",   label: "التصميم",  icon: LayoutGrid },
  { value: "fonts",    label: "الخطوط",   icon: Type },
  { value: "sections", label: "الأقسام",  icon: Layers },
  { value: "identity", label: "الهوية",   icon: ImageIcon },
] as const;

export default function CustomizationTabs({
  storeId,
  storeSlug,
  currentThemeId,
  currentFontId,
  primaryColor,
  secondaryColor,
  currentLayout,
  currentSections,
  sectionContent = {},
  logo,
  coverImage,
  description,
  announcementText,
  showStoreName = true,
}: Props) {
  const [activeTab, setActiveTab] = useState<string>("theme");

  const storeUrl =
    typeof window !== "undefined"
      ? `${window.location.protocol}//${storeSlug}.${window.location.hostname.replace(/^[^.]+\./, "")}`
      : `https://${storeSlug}.casho.store`;

  return (
    <div className="space-y-5" dir="rtl">
      {/* ── Tab bar + preview button ────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full sm:w-auto"
        >
          <TabsList className="h-auto flex-wrap gap-1 p-1 sm:flex-nowrap">
            {TABS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="gap-1.5 text-xs sm:text-sm"
              >
                <Icon className="size-3.5" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Button variant="outline" size="sm" className="gap-2 shrink-0" asChild>
          <a href={storeUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-3.5" />
            معاينة المتجر
          </a>
        </Button>
      </div>

      {/* ── Tab contents ────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Theme Preset Picker */}
        <TabsContent value="theme">
          <ThemePicker storeId={storeId} currentThemeId={currentThemeId} />
        </TabsContent>

        {/* Colors */}
        <TabsContent value="colors">
          <StoreColorsSection
            store={{
              id: storeId,
              settings: {
                primaryColor: primaryColor ?? null,
                secondaryColor: secondaryColor ?? null,
              },
            }}
          />
        </TabsContent>

        {/* Layout & Design */}
        <TabsContent value="design">
          <ThemeLayoutEditor storeId={storeId} currentLayout={currentLayout} />
        </TabsContent>

        {/* Fonts */}
        <TabsContent value="fonts">
          <StoreFontPicker storeId={storeId} currentFontId={currentFontId} />
        </TabsContent>

        {/* Sections */}
        <TabsContent value="sections">
          <ThemeSectionsEditor
            storeId={storeId}
            currentSections={currentSections}
            sectionContent={sectionContent}
          />
        </TabsContent>

        {/* Identity */}
        <TabsContent value="identity">
          <StoreIdentitySection
            storeId={storeId}
            logo={logo}
            coverImage={coverImage}
            description={description}
            announcementText={announcementText}
            showStoreName={showStoreName}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
