import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { StatusPill } from "@/components/saas-page";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BannerActiveSwitch } from "./banner-active-switch";
import { BannerRowActions } from "./banner-row-actions";

export type BannerRow = {
  id: string;
  title: string;
  image: string;
  isActive: boolean;
  createdAt: Date;
};

const dateFormat = new Intl.DateTimeFormat("ar-EG", {
  timeZone: "Africa/Cairo",
  day: "numeric",
  month: "short",
  year: "numeric",
});

type Props = {
  banners: BannerRow[];
  storeId: string;
  storefrontUrl: string;
  /** Builds the `?edit=<id>` link while keeping the current filters. */
  editHref: (id: string) => string;
};

function Thumb({ banner, className }: { banner: BannerRow; className?: string }) {
  return (
    <div className={cn("relative aspect-3/1 shrink-0 overflow-hidden rounded-md border border-border bg-muted", className)}>
      <Image src={banner.image} alt="" fill sizes="144px" className="object-cover" />
    </div>
  );
}

/** Desktop: table. Mobile: stacked rows — same data, same row link. */
export function BannersTable({ banners, storeId, storefrontUrl, editHref }: Props) {
  const actionsFor = (banner: BannerRow) => (
    <BannerRowActions
      storeId={storeId}
      banner={{ id: banner.id, title: banner.title, isActive: banner.isActive }}
      editHref={editHref(banner.id)}
      storefrontUrl={storefrontUrl}
    />
  );

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="h-10 ps-4 text-right text-xs font-medium text-muted-foreground">البانر</TableHead>
              <TableHead className="h-10 text-right text-xs font-medium text-muted-foreground">الحالة</TableHead>
              <TableHead className="hidden h-10 text-right text-xs font-medium text-muted-foreground lg:table-cell">
                اتضاف في
              </TableHead>
              <TableHead className="h-10 w-28 pe-4 text-left text-xs font-medium text-muted-foreground">ظاهر</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {banners.map((banner) => (
              // The edit link stretches over the row; switch + menu sit above it (z-10).
              <TableRow key={banner.id} className="relative">
                <TableCell className="py-3 ps-4">
                  <div className="flex items-center gap-3">
                    <Thumb banner={banner} className="w-36" />
                    <Link
                      href={editHref(banner.id)}
                      scroll={false}
                      className="max-w-72 truncate text-sm font-medium after:absolute after:inset-0 hover:underline focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-ring"
                    >
                      {banner.title}
                    </Link>
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <StatusPill tone={banner.isActive ? "success" : "neutral"}>{banner.isActive ? "ظاهر" : "مخفي"}</StatusPill>
                </TableCell>
                <TableCell className="hidden py-3 text-sm text-muted-foreground lg:table-cell">
                  {dateFormat.format(banner.createdAt)}
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
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y divide-border md:hidden">
        {banners.map((banner) => (
          <li key={banner.id} className="relative space-y-3 p-4">
            <Thumb banner={banner} className="w-full" />
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={editHref(banner.id)}
                  scroll={false}
                  className="block truncate text-sm font-medium after:absolute after:inset-0 focus-visible:outline-none"
                >
                  {banner.title}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {banner.isActive ? "ظاهر" : "مخفي"} · {dateFormat.format(banner.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
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
        ))}
      </ul>
    </>
  );
}
