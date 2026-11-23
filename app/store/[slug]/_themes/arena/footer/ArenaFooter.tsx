import Link from "next/link";

import CashoLogo from "@/components/common/CashoLogo";

import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import type { StoreShell } from "../../types";
import { policyFooterLinks } from "../../shared/policies/links";
import { getSocialLinks, whatsappHref } from "../../shared/social";
import { st } from "@/lib/i18n/storefront";

/** A quiet footer like the reference app's single line, with the store's
 *  pages, legal pages and social links. */
export default function ArenaFooter({ shell }: { shell: StoreShell }) {
  const social = getSocialLinks(shell.contact);
  const wa = whatsappHref(shell.contact.whatsapp);
  const links = [
    { label: st("الألعاب"), href: buildStoreUrl(shell.slug, "/categories") },
    { label: st("تتبّع طلبك"), href: buildStoreUrl(shell.slug, "/track") },
    { label: st("عن المتجر"), href: buildStoreUrl(shell.slug, "/about") },
    { label: st("تواصل معانا"), href: buildStoreUrl(shell.slug, "/contact") },
    ...policyFooterLinks(shell),
  ];
  return (
    <footer className="an-footer">
      <div className="an-wrap">
        <nav aria-label={st("روابط المتجر")} className="an-footer-links">
          {links.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
        </nav>
        {(social.length > 0 || wa) && (
          <div className="mt-4 flex justify-center gap-2">
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="an-iconbtn" aria-label={st("واتساب")}>
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.05 21.5h-.01a9.45 9.45 0 0 1-4.81-1.32l-.35-.21-3.58.94.96-3.49-.23-.36a9.43 9.43 0 0 1-1.45-5.03c0-5.21 4.24-9.45 9.46-9.45a9.4 9.4 0 0 1 6.69 2.77 9.4 9.4 0 0 1 2.76 6.69c0 5.21-4.24 9.46-9.45 9.46m8.05-17.5A11.32 11.32 0 0 0 12.04.66C5.77.66.66 5.76.66 12.04c0 2 .52 3.96 1.52 5.69L.57 23.33l5.73-1.5a11.36 11.36 0 0 0 5.74 1.46h.01c6.27 0 11.38-5.1 11.38-11.38 0-3.04-1.18-5.9-3.33-8.05" />
                </svg>
              </a>
            )}
            {social.map(({ label, href, Icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="an-iconbtn" aria-label={label}>
                <Icon />
              </a>
            ))}
          </div>
        )}
        <p className="an-footer-line">
          {shell.name}
          {shell.description ? ` — ${shell.description.split(/[\n.]/)[0]}` : ""}
        </p>
        {shell.showPoweredByCasho && (
          <div className="mt-2 flex justify-center">
            <a href="https://casho.store" target="_blank" rel="noopener" className="an-footer-line inline-flex min-h-10 items-center gap-2 transition-opacity hover:opacity-80">
              {st("متجر مبني على")}
              <CashoLogo withSubTitle={false} iconClassName="size-6" />
            </a>
          </div>
        )}
      </div>
    </footer>
  );
}
