"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Popover } from "radix-ui";

import { cn } from "@/lib/utils";
import { Arrow, DN_PORTAL, Price } from "../ui";

/** "Shop the look" dot on a product photo; opens a small card for that product. */
export default function Hotspot({
  href,
  name,
  price,
  compareAt,
  dir,
  className,
}: {
  href: string;
  name: string;
  price: number;
  compareAt: number | null;
  dir: "rtl" | "ltr";
  className?: string;
}) {
  return (
    <Popover.Root>
      <Popover.Trigger aria-label={`تفاصيل ${name}`} className={cn("dn-hotspot", className)}>
        <Plus className="size-4" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          dir={dir}
          side="top"
          sideOffset={14}
          collisionPadding={16}
          className={cn(DN_PORTAL, "dn-modal z-40 w-64 bg-(--dn-drawer) p-4 shadow-(--dn-shadow) outline-none")}
        >
          <p className="line-clamp-2 text-[0.9375rem] leading-6">{name}</p>
          <Price price={price} compareAt={compareAt} size="sm" className="mt-1" />
          <Link href={href} className="dn-link dn-label mt-3">
            عرض المنتج
            <Arrow />
          </Link>
          <Popover.Arrow className="fill-(--dn-drawer)" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
