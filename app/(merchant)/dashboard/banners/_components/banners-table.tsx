import Image from "next/image";
import Link from "next/link";
import type { BannerLinkType } from "@prisma/client";
import { AlertTriangle, MousePointerClick } from "lucide-react";

import { cn } from "@/lib/utils";
import { StatusText, type PillTone } from "@/components/saas-page";
import type { BannerStatus } from "@/lib/banners/banner-link";
import { BannerActiveSwitch } from "./banner-active-switch";
import { BannerMoveButtons } from "./banner-move-buttons";
import { BannerRowActions } from "./banner-row-actions";
import { lazyIntl, tr } from "@/lib/i18n/dashboard";

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
  live: { get label() { return tr("ظاهر"); }, tone: "success" },
  scheduled: { get label() { return tr("مجدول"); }, tone: "info" },
  expired: { get label() { return tr("منتهي"); }, tone: "warning" },
  hidden: { get label() { return tr("مخفي"); }, tone: "neutral" },
};

const dateFormat = lazyIntl.date({
  timeZone: "Africa/Cairo",
  day: "numeric",
  month: "short",
  year: "numeric",
});
const dateTimeFormat = lazyIntl.date({
  timeZone: "Africa/Cairo",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});
const numberFormat = lazyIntl.number();

/** "من ١٠ أكتوبر لحد ٢٠ أكتوبر" — the part of the schedule that matters now. */
function scheduleNote(banner: BannerRow) {
  if (banner.status === "scheduled" && banner.startsAt) return tr("يبدأ {0}", dateTimeFormat.format(banner.startsAt));
  if (banner.status === "expired" && banner.endsAt) return tr("انتهى {0}", dateTimeFormat.format(banner.endsAt));
  if (banner.endsAt) return tr("لحد {0}", dateTimeFormat.format(banner.endsAt));
  return null;
}

type Props = {
  banners: BannerRow[];
  storeId: string;
  storefrontUrl: string;
  /** Link to the banner's edit page. */
  editHref: (id: string) => string;
  /** Reorder only makes sense on the unfiltered list (it is the slider order). */
  reorderable: boolean;
  firstId?: string;
  lastId?: string;
};

function Thumb({ banner, className }: { banner: BannerRow; className?: string }) {
  return (
    <div className={cn("relative aspect-3/1 shrink-0 overflow-hidden rounded-[10px] bg-muted", className)}>
      <Image src={banner.image} alt="" fill sizes="144px" className="object-cover" />
    </div>
  );
}

function Destination({ banner }: { banner: BannerRow }) {
  const { label, detail, warning } = banner.destination;
  return (
    <div className="min-w-0 text-[15px]">
      <p className="truncate">
        <span className="text-muted-foreground">{label}</span>
        {detail && <span> · {detail}</span>}
      </p>
      {warning && (
        <p className="mt-0.5 flex items-center gap-1 text-[12px] text-foreground/80">
          <AlertTriangle className="size-3.5 shrink-0 text-(--sys-orange)" />
          <span className="truncate">{warning}</span>
        </p>
      )}
    </div>
  );
}

const th = "h-9 px-3 pb-2 text-start align-bottom text-[12px] font-medium whitespace-nowrap text-muted-foreground";
const td = "relative px-3 py-3 align-middle";

/** Desktop: list-view table. Mobile: grouped rows — same data, same row link. */
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
  const switchFor = (banner: BannerRow) => (
    <BannerActiveSwitch
      key={String(banner.isActive)}
      bannerId={banner.id}
      storeId={storeId}
      title={banner.title}
      isActive={banner.isActive}
    />
  );

  return (
    <>
      <div className="hidden md:block">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <th className={`${th} ps-5`}>{tr("البانر")}</th>
              <th className={th}>{tr("بيودّي على")}</th>
              <th className={th}>{tr("الحالة")}</th>
              <th className={`${th} hidden lg:table-cell`}>{tr("النقرات")}</th>
              <th className={`${th} w-32 pe-4 text-end`}>{tr("ظاهر")}</th>
            </tr>
          </thead>
          <tbody>
            {banners.map((banner) => {
              const note = scheduleNote(banner);
              return (
                // The edit link stretches over the row; switch, arrows + menu sit above it (z-10).
                <tr
                  key={banner.id}
                  className="relative transition-colors hover:bg-muted/50 has-focus-visible:bg-muted/50 [&>td]:border-t-[0.5px] [&>td]:border-border"
                >
                  <td className={`${td} ps-5`}>
                    <div className="flex items-center gap-3">
                      {moveFor(banner)}
                      <Thumb banner={banner} className="w-32" />
                      <div className="min-w-0">
                        <Link
                          href={editHref(banner.id)}
                          className="block max-w-60 truncate text-[15px] leading-5 after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
                        >
                          {banner.title}
                        </Link>
                        <p className="text-[13px] text-muted-foreground">{tr("اتضاف {0}", dateFormat.format(banner.createdAt))}</p>
                      </div>
                    </div>
                  </td>
                  <td className={`${td} max-w-56`}>
                    <Destination banner={banner} />
                  </td>
                  <td className={td}>
                    <StatusText tone={STATUS[banner.status].tone}>{STATUS[banner.status].label}</StatusText>
                    {note && <p className="mt-0.5 text-[12px] text-muted-foreground">{note}</p>}
                  </td>
                  <td className={`${td} hidden text-[15px] tabular-nums lg:table-cell`}>
                    {banner.linkType === "NONE" ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <MousePointerClick className="size-4 text-muted-foreground" strokeWidth={1.8} />
                        {numberFormat.format(banner.clicks)}
                      </span>
                    )}
                  </td>
                  <td className={`${td} pe-4`}>
                    <div className="flex items-center justify-end gap-2.5">
                      {switchFor(banner)}
                      {actionsFor(banner)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="apple-rows [--row-inset:16px] md:hidden">
        {banners.map((banner) => {
          const note = scheduleNote(banner);
          return (
            <li key={banner.id} className="relative space-y-3 px-4 py-4">
              <Thumb banner={banner} className="w-full rounded-xl" />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <Link
                    href={editHref(banner.id)}
                    className="block truncate text-[15px] leading-5 after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
                  >
                    {banner.title}
                  </Link>
                  <Destination banner={banner} />
                  <p className="flex flex-wrap items-center gap-x-1 text-[13px] text-muted-foreground">
                    <StatusText tone={STATUS[banner.status].tone}>{STATUS[banner.status].label}</StatusText>
                    {note && <span>· {note}</span>}
                    {banner.linkType !== "NONE" && <span>{tr(" · {0} نقرة", numberFormat.format(banner.clicks))}</span>}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {moveFor(banner)}
                  {switchFor(banner)}
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
