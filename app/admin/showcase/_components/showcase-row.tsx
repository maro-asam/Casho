"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteShowcaseSiteAction, moveShowcaseSiteAction, setShowcasePublishedAction } from "@/actions/admin/showcase.actions";
import { StatusText } from "@/components/saas-page";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { displayHost } from "@/helpers/BuildStoreURL";
import { SHOWCASE_CATEGORIES, showcaseCategory } from "@/lib/showcase/catalog";
import { ActionButton } from "../../_components/action-button";
import { ShowcaseFormDialog, type ShowcaseFormValues } from "./showcase-form-dialog";

export type ShowcaseAdminRow = ShowcaseFormValues & { id: string; thumbUrl: string };

export function ShowcaseRow({ site, first, last }: { site: ShowcaseAdminRow; first: boolean; last: boolean }) {
  const router = useRouter();
  const [published, setPublished] = useState(site.published);
  const [pending, start] = useTransition();

  const togglePublished = (next: boolean) =>
    start(async () => {
      setPublished(next);
      const result = await setShowcasePublishedAction(site.id, next);
      if (!result.success) {
        setPublished(!next);
        toast.error(result.message);
      } else {
        toast.success(result.message);
        router.refresh();
      }
    });

  const move = (direction: "up" | "down") =>
    start(async () => {
      const result = await moveShowcaseSiteAction(site.id, direction);
      if (!result.success) toast.error(result.message);
      else router.refresh();
    });

  const closed = site.store && !site.store.open;
  const status = !published
    ? { tone: "neutral" as const, label: "مخفي" }
    : closed
      ? { tone: "warning" as const, label: "المتجر مقفول — مش ظاهر" }
      : { tone: "success" as const, label: "ظاهر" };

  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 px-4 py-4 md:grid-cols-[auto_minmax(0,1fr)_auto_auto] md:items-center md:gap-x-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={site.thumbUrl} alt="" loading="lazy" className="aspect-[16/10] w-24 rounded-lg bg-muted object-cover object-top ring-1 ring-border sm:w-32" />

      <div className="min-w-0 space-y-0.5">
        <p className="truncate font-semibold">{site.name}</p>
        <p className="text-sm text-muted-foreground">{SHOWCASE_CATEGORIES[showcaseCategory(site.category)].ar}</p>
        <a href={site.url} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 text-sm text-primary hover:underline" dir="ltr">
          <span className="truncate">{displayHost(site.url)}</span>
          <ExternalLink className="size-3.5 shrink-0" />
        </a>
      </div>

      <div className="col-span-2 flex items-center gap-3 md:col-span-1">
        <Switch checked={published} onCheckedChange={togglePublished} disabled={pending} aria-label="ظاهر في الصفحة الرئيسية" />
        <StatusText tone={status.tone}>{status.label}</StatusText>
      </div>

      <div className="col-span-2 flex items-center gap-1 md:col-span-1 md:justify-self-end">
        <Button size="icon" variant="ghost" className="size-8" onClick={() => move("up")} disabled={pending || first} aria-label="لفوق">
          <ArrowUp className="size-4" />
        </Button>
        <Button size="icon" variant="ghost" className="size-8" onClick={() => move("down")} disabled={pending || last} aria-label="لتحت">
          <ArrowDown className="size-4" />
        </Button>
        <ShowcaseFormDialog
          id={site.id}
          initial={site}
          trigger={
            <Button size="sm" variant="ghost">
              <Pencil className="size-3.5" />
              تعديل
            </Button>
          }
        />
        <ActionButton
          action={deleteShowcaseSiteAction.bind(null, site.id)}
          variant="ghost"
          className="text-(--sys-red) hover:text-(--sys-red)"
          confirm={{
            title: `مسح «${site.name}»؟`,
            description: "هيختفي من الصفحة الرئيسية. المتجر نفسه مش هيتأثر.",
            confirmLabel: "امسح",
            destructive: true,
          }}
        >
          <Trash2 className="size-3.5" />
          مسح
        </ActionButton>
      </div>
    </li>
  );
}
