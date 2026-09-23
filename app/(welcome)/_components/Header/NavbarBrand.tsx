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
  const { t } = useLang();

  return (
    <Link
      href="/"
      onClick={onClick}
      aria-label="Casho"
      className={cn(
        "group flex shrink-0 items-center gap-2.5 rounded-xl pe-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        className,
      )}
    >
      <span className="flex items-center justify-center transition-transform duration-300 group-hover:-rotate-6 dark:ring-white/10">
        <Image src="/logo.svg" width={100} height={100} alt="" priority className="size-9 rounded-full md:size-11" />
      </span>

    </Link>
  );
}
