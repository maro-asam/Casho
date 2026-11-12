import Link from "next/link";

import { appleButton } from "@/components/saas-page";
import { tr } from "@/lib/i18n/dashboard";
import { cn } from "@/lib/utils";
import { TierGlyph } from "@/components/plans/tier-glyph";

/**
 * Enterprise isn't a plan yet (no DB row, nothing to buy): its name, a "soon"
 * badge, and one action — telling us you're interested. No promised features.
 */
export function EnterpriseSoon() {
  return (
    <article
      aria-labelledby="enterprise-soon-title"
      className="apple-card relative flex flex-col gap-5 overflow-hidden p-6 sm:flex-row sm:items-center lg:p-7"
    >
      <div className="flex min-w-0 items-center gap-3 sm:w-[min(380px,45%)]">
        <TierGlyph tier="ENTERPRISE" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 id="enterprise-soon-title" className="text-[24px] leading-[30px] font-bold ltr:tracking-[-0.01em]">
              Enterprise
            </h3>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-[12px] font-semibold text-muted-foreground">{tr("قريبًا")}</span>
          </div>
          <p className="mt-1 text-[15px] leading-[21px] text-muted-foreground">{tr("للبراندات والسلاسل الكبيرة. جاية قريب.")}</p>
        </div>
      </div>

      <p className="flex-1 text-[15px] leading-[22px] text-muted-foreground">
        {tr("لو بيزنسك محتاج أكتر من Scale، قولنا محتاج إيه وهنجهزهالك.")}
      </p>

      <Link href="/dashboard/support" className={cn(appleButton.tinted, "h-11 shrink-0 px-5 text-primary")}>
        {tr("كلّمنا لو مهتم")}
      </Link>
    </article>
  );
}
