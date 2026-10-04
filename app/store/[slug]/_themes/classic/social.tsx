import { cn } from "@/lib/utils";
import type { StoreContact } from "../types";
import { getSocialLinks } from "../shared/social";

export { getSocialLinks, whatsappHref } from "../shared/social";

export function SocialLinks({ contact, className }: { contact: StoreContact; className?: string }) {
  const links = getSocialLinks(contact);
  if (links.length === 0) return <span />;
  return (
    <ul className={cn("flex items-center gap-1", className)}>
      {links.map(({ label, href, Icon }) => (
        <li key={label}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="grid size-11 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-(--c-subtle) hover:text-foreground"
          >
            <Icon className="size-5" aria-hidden />
          </a>
        </li>
      ))}
    </ul>
  );
}
