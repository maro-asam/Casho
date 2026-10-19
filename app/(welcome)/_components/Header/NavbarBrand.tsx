"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useLang } from "../../_i18n/LanguageContext";

export default function NavbarBrand({
  onClick,
  className,
}: {
  onClick?: () => void;
  className?: string;
}) {
  const { lang } = useLang();

  return (
    <Link
      href="/"
      onClick={onClick}
      aria-label="Casho"
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-lg pe-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <Image src="/logo.svg" width={36} height={36} alt="" priority className="size-8 rounded-full" />
      <span className="text-lg font-bold tracking-tight text-(--al-text)">{lang === "ar" ? "كاشو" : "Casho"}</span>
    </Link>
  );
}
