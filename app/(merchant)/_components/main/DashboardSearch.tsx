"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, PackagePlus, Plus, Search, TagsIcon, type LucideIcon } from "lucide-react";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { NAV_FOOTER, NAV_SECTIONS } from "./dashboard-nav";
import { tr } from "@/lib/i18n/dashboard";

type SearchItem = { label: string; href: string; icon?: LucideIcon };

const quickActions: SearchItem[] = [
  { get label() { return tr("إضافة منتج جديد"); }, href: "/products/new", icon: PackagePlus },
  { get label() { return tr("إضافة تصنيف"); }, href: "/categories/new", icon: TagsIcon },
  { get label() { return tr("كود خصم جديد"); }, href: "/coupons?new=1", icon: Plus },
  { get label() { return tr("الطلبات المكتملة"); }, href: "/orders?status=DELIVERED", icon: CheckCircle2 },
];

// Same pages as the sidebar, sub-pages flattened under their parent's name.
// Built per render: labels are translated getters, read in the active locale.
const getPageGroups = () => [
  ...NAV_SECTIONS.map((section) => ({ title: section.title ?? tr("الرئيسية"), items: section.items })),
  { title: tr("الحساب والدعم"), items: NAV_FOOTER },
].map(({ title, items }) => ({
  title,
  items: items.flatMap<SearchItem>((item) =>
    item.children
      ? item.children.map((child) => ({ label: tr("{0} · {1}", item.name, child.name), href: child.href, icon: item.icon }))
      : [{ label: item.name, href: item.href, icon: item.icon }],
  ),
}));

function isMac() {
  return typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
}

export default function DashboardSearch() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const run = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const renderItem = (item: SearchItem) => {
    const Icon = item.icon;
    return (
      <CommandItem key={item.href + item.label} value={item.label} onSelect={() => run(item.href)}>
        {Icon && <Icon />}
        {item.label}
      </CommandItem>
    );
  };

  return (
    <>
      {/* Icon on small screens, search field look from md up */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={tr("بحث سريع")}
        className="grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex md:h-9 md:w-56 md:items-center md:gap-2 md:border md:border-input md:bg-muted/40 md:px-3 lg:w-64"
      >
        <Search className="size-4 shrink-0" />
        <span className="hidden flex-1 text-start text-sm md:block">{tr("ابحث عن صفحة...")}</span>
        <kbd
          className="hidden rounded border border-border bg-background px-1.5 py-0.5 font-sans text-[10px] font-medium md:block"
          dir="ltr"
          suppressHydrationWarning
        >
          {isMac() ? "⌘K" : "Ctrl K"}
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen} title={tr("بحث سريع")} description={tr("ابحث عن صفحة أو إجراء")}>
        <Command>
          <CommandInput placeholder={tr("ابحث عن صفحة أو إجراء...")} />
          <CommandList>
            <CommandEmpty>{tr("مفيش نتايج.")}</CommandEmpty>

            <CommandGroup heading={tr("إجراءات سريعة")}>{quickActions.map(renderItem)}</CommandGroup>

            {getPageGroups().map((group) => (
              <div key={group.title}>
                <CommandSeparator />
                <CommandGroup heading={group.title}>{group.items.map(renderItem)}</CommandGroup>
              </div>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
