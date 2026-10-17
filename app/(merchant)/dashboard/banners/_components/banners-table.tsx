import Image from "next/image";
import Link from "next/link";
import type { BannerLinkType } from "@prisma/client";
import { AlertTriangle, MousePointerClick } from "lucide-react";

import { cn } from "@/lib/utils";
import { StatusPill, type PillTone } from "@/components/saas-page";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { BannerStatus } from "@/lib/banners/banner-link";
import { BannerActiveSwitch } from "./banner-active-switch";
import { BannerMoveButtons } from "./banner-move-buttons";
import { BannerRowActions } from "./banner-row-actions";

export type BannerRow = {
  id: string;
  title: string;
  image: string;
  isActive: boolean;
  status: BannerStatus;
  startsAt: Date | null;
  endsAt: Date | null;
  clicks: number;
  createdAt: Date;
  linkType: BannerLinkType;
  /** Destination summary; `warning` = the target is gone and the link falls back. */
  destination: { label: string; detail?: string; warning?: string };
};

const STATUS: Record<BannerStatus, { label: string; tone: PillTone }> = {
  live: { label: "ظاهر", tone: "success" },
  scheduled: { label: "مجدول", tone: "info" },
  expired: { label: "منتهي", tone: "warning" },
  hidden: { label: "مخفي", tone: "neutral" },
};

const dateFormat = new Intl.DateTimeFormat("ar-EG", {
  timeZone: "Africa/Cairo",
  day: "numeric",
  month: "short",
  year: "numeric",
});
const dateTimeFormat = new Intl.DateTimeFormat("ar-EG", {
  timeZone: "Africa/Cairo",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});
const numberFormat = new Intl.NumberFormat("ar-EG");

/** "من ١٠ أكتوبر لحد ٢٠ أكتوبر" — the part of the schedule that matters now. */
function scheduleNote(banner: BannerRow) {
  if (banner.status === "scheduled" && banner.startsAt) return `يبدأ ${dateTimeFormat.format(banner.startsAt)}`;
  if (banner.status === "expired" && banner.endsAt) return `انتهى ${dateTimeFormat.format(banner.endsAt)}`;
  if (banner.endsAt) return `لحد ${dateTimeFormat.format(banner.endsAt)}`;
  return null;
}

type Props = {
  banners: BannerRow[];
  storeId: string;
  storefrontUrl: string;
  /** Builds the `?edit=<id>` link while keeping the current filters. */
  editHref: (id: string) => string;
  /** Reorder only makes sense on the unfiltered list (it is the slider order). */
  reorderable: boolean;
  firstId?: string;
  lastId?: string;
};

function Thumb({ banner, className }: { banner: BannerRow; className?: string }) {
  return (
    <div className={cn("relative aspect-3/1 shrink-0 overflow-hidden rounded-md border border-border bg-muted", className)}>
      <Image src={banner.image} alt="" fill sizes="144px" className="object-cover" />
    </div>
  );
}

function Destination({ banner }: { banner: BannerRow }) {
  const { label, detail, warning } = banner.destination;
  return (
    <div className="min-w-0 text-sm">
      <p className="truncate">
        <span className="text-muted-foreground">{label}</span>
        {detail && <span className="font-medium"> · {detail}</span>}
      </p>
      {warning && (
        <p className="mt-0.5 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
          <AlertTriangle className="size-3 shrink-0" />
          <span className="truncate">{warning}</span>
        </p>
      )}
    </div>
  );
}

/** Desktop: table. Mobile: stacked rows — same data, same row link. */
export function BannersTable({ banners, storeId, storefrontUrl, editHref, reorderable, firstId, lastId }: Props) {
  const actionsFor = (banner: BannerRow) => (
    <BannerRowActions
      storeId={storeId}
      banner={{ id: banner.id, title: banner.title, isActive: banner.isActive }}
      editHref={editHref(banner.id)}
      storefrontUrl={storefrontUrl}
    />
  );
  const moveFor = (banner: BannerRow) =>
    reorderable && (
      <BannerMoveButtons
        bannerId={banner.id}
        storeId={storeId}
        title={banner.title}
        canMoveUp={banner.id !== firstId}
        canMoveDown={banner.id !== lastId}
      />
    );

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="h-10 ps-4 text-right text-xs font-medium text-muted-foreground">البانر</TableHead>
              <TableHead className="h-10 text-right text-xs font-medium text-muted-foreground">بيودّي على</TableHead>
              <TableHead className="h-10 text-right text-xs font-medium text-muted-foreground">الحالة</TableHead>
              <TableHead className="hidden h-10 text-right text-xs font-medium text-muted-foreground lg:table-cell">النقرات</TableHead>
              <TableHead className="h-10 w-28 pe-4 text-left text-xs font-medium text-muted-foreground">ظاهر</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {banners.map((banner) => {
              const note = scheduleNote(banner);
              return (
                // The edit link stretches over the row; switch, arrows + menu sit above it (z-10).
                <TableRow key={banner.id} className="relative">
                  <TableCell className="py-3 ps-4">
                    <div className="flex items-center gap-3">
                      {moveFor(banner)}
                      <Thumb banner={banner} className="w-32" />
                      <div className="min-w-0">
                        <Link
                          href={editHref(banner.id)}
                          scroll={false}
                          className="block max-w-60 truncate text-sm font-medium after:absolute after:inset-0 hover:underline focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-ring"
                        >
                          {banner.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">اتضاف {dateFormat.format(banner.createdAt)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-56 py-3">
                    <Destination banner={banner} />
                  </TableCell>
                  <TableCell className="py-3">
                    <StatusPill tone={STATUS[banner.status].tone}>{STATUS[banner.status].label}</StatusPill>
                    {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
                  </TableCell>
                  <TableCell className="hidden py-3 text-sm tabular-nums lg:table-cell">
                    {banner.linkType === "NONE" ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <MousePointerClick className="size-3.5 text-muted-foreground" />
                        {numberFormat.format(banner.clicks)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-3 pe-4">
                    <div className="flex items-center justify-end gap-2">
                      <BannerActiveSwitch
                        key={String(banner.isActive)}
                        bannerId={banner.id}
                        storeId={storeId}
                        title={banner.title}
                        isActive={banner.isActive}
                      />
                      {actionsFor(banner)}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y divide-border md:hidden">
        {banners.map((banner) => {
          const note = scheduleNote(banner);
          return (
            <li key={banner.id} className="relative space-y-3 p-4">
              <Thumb banner={banner} className="w-full" />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <Link
                    href={editHref(banner.id)}
                    scroll={false}
                    className="block truncate text-sm font-medium after:absolute after:inset-0 focus-visible:outline-none"
                  >
                    {banner.title}
                  </Link>
                  <Destination banner={banner} />
                  <p className="text-xs text-muted-foreground">
                    {STATUS[banner.status].label}
                    {note && ` · ${note}`}
                    {banner.linkType !== "NONE" && ` · ${numberFormat.format(banner.clicks)} نقرة`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {moveFor(banner)}
                  <BannerActiveSwitch
                    key={String(banner.isActive)}
                    bannerId={banner.id}
                    storeId={storeId}
                    title={banner.title}
                    isActive={banner.isActive}
                  />
                  {actionsFor(banner)}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
