"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useActiveNavKey, useNavLinks } from "./nav-links";

export default function NavbarDesktopLinks() {
  const links = useNavLinks();
  const activeKey = useActiveNavKey();

  return (
    <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
      {links.map((link) => {
        const active = activeKey === link.key;

        return (
          <Link
            key={link.key}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            {link.name}
          </Link>
        );
      })}
    </nav>
  );
}
