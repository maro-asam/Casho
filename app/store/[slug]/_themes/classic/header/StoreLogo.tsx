import Image from "next/image";
import Link from "next/link";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { cn } from "@/lib/utils";

type Props = {
  storeSlug: string;
  storeName: string;
  logo: string | null;
  logoRadius: number;
  /** Merchant logo size (px). Classic caps it so the header stays compact. */
  logoSize: number;
  showStoreName: boolean;
  /** Max rendered logo height in px for this placement. */
  maxHeight: number;
  className?: string;
};

export default function StoreLogo({
  storeSlug,
  storeName,
  logo,
  logoRadius,
  logoSize,
  showStoreName,
  maxHeight,
  className,
}: Props) {
  const height = Math.max(28, Math.min(logoSize, maxHeight));
  const isSvg = !!logo && (logo.endsWith(".svg") || logo.includes("/svg"));
  // Without a logo the store name is the brand mark, whatever the setting says.
  const nameVisible = showStoreName || !logo;

  return (
    <Link
      href={buildStoreUrl(storeSlug)}
      aria-label={`${storeName} — الصفحة الرئيسية`}
      className={cn("flex min-w-0 shrink items-center gap-2.5", className)}
    >
      {logo && (
        <span
          className="relative block shrink-0 overflow-hidden"
          style={{ height, width: height, borderRadius: Math.min(logoRadius, height / 2) }}
        >
          {isSvg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className="size-full object-contain" />
          ) : (
            <Image src={logo} alt="" fill sizes={`${height * 2}px`} priority className="object-cover" />
          )}
        </span>
      )}
      {nameVisible && (
        <span className="truncate text-base font-bold tracking-tight sm:text-lg">{storeName}</span>
      )}
    </Link>
  );
}
