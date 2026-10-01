import Link from "next/link";
import { ArrowDownRight, ArrowLeft, ArrowUpRight, CalendarDays, GalleryHorizontal, Gift, ImageIcon, Minus, Smartphone, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SectionKey } from "@/types/store-theme.types";
import { upcomingSeasons } from "./seasons";
import { studioHref } from "./studio-nav";

const nf = new Intl.NumberFormat("ar-EG");
const pf = new Intl.NumberFormat("ar-EG", { style: "percent", maximumFractionDigits: 1 });
const df = new Intl.DateTimeFormat("ar-EG", { timeZone: "Africa/Cairo", day: "numeric", month: "long" });

export const SECTION_LABELS: Record<SectionKey, string> = {
  showHero: "الهيرو",
  showHeroBanner: "بانر مخصص",
  showOfferStrip: "شريط العروض",
  showSocialProof: "إثبات الثقة",
  showBestSellers: "الأكثر مبيعًا",
  showCategories: "التصنيفات",
  showFeaturedProducts: "المنتجات المميزة",
  showCollections: "معرض المجموعات",
  showWhyChooseUs: "ليه تختارنا",
  showTestimonials: "آراء العملاء",
  showUrgency: "قسم الإلحاح",
  showLatestProducts: "أحدث المنتجات",
  showAboutBrand: "نبذة عن المتجر",
  showRichText: "نص حر",
  showNewsletter: "الاشتراك البريدي",
};

// ─── Brand snapshot ───────────────────────────────────────────────────────────

export function BrandSnapshot(props: {
  storeName: string;
  storeHost: string;
  logo: string | null;
  cover: string | null;
  description: string | null;
  themeName: string;
  fontName: string;
  fontFamily: string;
  primary: string;
  secondary: string;
  announcement: string | null;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div
        className="relative h-28 bg-cover bg-center"
        style={props.cover ? { backgroundImage: `url(${props.cover})` } : { background: `linear-gradient(135deg, ${props.primary}, ${props.secondary})` }}
      >
        {props.announcement && (
          <p className="absolute inset-x-0 top-0 truncate px-3 py-1 text-center text-[11px]" style={{ background: props.primary, color: "#fff" }}>
            {props.announcement}
          </p>
        )}
        {!props.cover && (
          <Link
            href={studioHref("identity")}
            className="absolute bottom-2 end-2 inline-flex items-center gap-1 rounded-md bg-background/80 px-2 py-1 text-[11px] backdrop-blur hover:bg-background"
          >
            <ImageIcon className="size-3" />
            ضيف غلاف
          </Link>
        )}
      </div>
      <div className="flex items-end gap-3 px-4">
        <div className="-mt-8 grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl border-4 border-card bg-muted shadow-sm">
          {props.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={props.logo} alt="" className="size-full object-contain" />
          ) : (
            <span className="text-lg font-bold" style={{ color: props.primary }}>
              {props.storeName.charAt(0)}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 pb-1 pt-2">
          <p className="truncate font-semibold" style={{ fontFamily: props.fontFamily }}>
            {props.storeName}
          </p>
          <p className="truncate font-mono text-xs text-muted-foreground" dir="ltr">
            {props.storeHost}
          </p>
        </div>
      </div>
      <p className={cn("px-4 pt-2 text-sm leading-6", props.description ? "text-muted-foreground" : "text-muted-foreground/70 italic")}>
        {props.description || "مفيش وصف للمتجر لسه — سطرين عنك بيفرقوا في الثقة."}
      </p>

      <dl className="mt-3 grid grid-cols-3 divide-x divide-x-reverse divide-border border-y border-border text-sm">
        <SpecLink href={studioHref("theme")} label="الثيم" value={props.themeName} />
        <SpecLink href={studioHref("fonts")} label="الخط" value={props.fontName} style={{ fontFamily: props.fontFamily }} />
        <Link href={studioHref("colors")} className="px-4 py-2.5 transition-colors hover:bg-muted/40">
          <dt className="text-xs text-muted-foreground">الألوان</dt>
          <dd className="mt-1 flex items-center gap-1.5">
            <span className="size-4 rounded-full ring-1 ring-black/10" style={{ background: props.primary }} />
            <span className="size-4 rounded-full ring-1 ring-black/10" style={{ background: props.secondary }} />
          </dd>
        </Link>
      </dl>

      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4">
        <QuickAction href="/builder" icon={Wand2} label="المحرر المرئي" primary className="hidden lg:flex" />
        <QuickAction href={studioHref("identity")} icon={ImageIcon} label="اللوجو والغلاف" />
        <QuickAction href="/banners?new=1" icon={GalleryHorizontal} label="بانر جديد" />
        <QuickAction href="/customization?tab=popups&popup=new" icon={Gift} label="نافذة خصم" />
      </div>
    </section>
  );
}

function SpecLink({ href, label, value, style }: { href: string; label: string; value: string; style?: React.CSSProperties }) {
  return (
    <Link href={href} className="min-w-0 px-4 py-2.5 transition-colors hover:bg-muted/40">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate font-medium" style={style}>
        {value}
      </dd>
    </Link>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  primary,
  className,
}: {
  href: string;
  icon: typeof Wand2;
  label: string;
  primary?: boolean;
  className?: string;
}) {
  return (
    <Button asChild variant={primary ? "default" : "outline"} size="sm" className={cn("h-9 justify-start gap-1.5 text-xs", className)}>
      <Link href={href}>
        <Icon className="size-3.5" />
        {label}
      </Link>
    </Button>
  );
}

// ─── Store pulse ──────────────────────────────────────────────────────────────

export type Pulse = {
  visits: number;
  prevVisits: number;
  orders: number;
  prevOrders: number;
  mobileVisits: number;
};

function Delta({ now, prev }: { now: number; prev: number }) {
  if (!prev && !now) return <span className="text-xs text-muted-foreground">—</span>;
  if (!prev) return <span className="text-xs text-muted-foreground">جديد الأسبوع ده</span>;
  const change = (now - prev) / prev;
  const Icon = change > 0.005 ? ArrowUpRight : change < -0.005 ? ArrowDownRight : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs",
        change > 0.005 ? "text-emerald-700 dark:text-emerald-400" : change < -0.005 ? "text-rose-700 dark:text-rose-400" : "text-muted-foreground",
      )}
    >
      <Icon className="size-3.5" />
      {pf.format(Math.abs(change))}
      <span className="text-muted-foreground"> عن الأسبوع اللي فات</span>
    </span>
  );
}

export function StorePulse({ pulse }: { pulse: Pulse }) {
  const conversion = pulse.visits ? pulse.orders / pulse.visits : 0;
  const prevConversion = pulse.prevVisits ? pulse.prevOrders / pulse.prevVisits : 0;
  const mobileShare = pulse.visits ? pulse.mobileVisits / pulse.visits : 0;

  const tiles = [
    { label: "الزيارات", value: nf.format(pulse.visits), delta: <Delta now={pulse.visits} prev={pulse.prevVisits} /> },
    { label: "طلبات أونلاين", value: nf.format(pulse.orders), delta: <Delta now={pulse.orders} prev={pulse.prevOrders} /> },
    {
      label: "معدل التحويل",
      value: pulse.visits ? pf.format(conversion) : "—",
      delta: pulse.visits && pulse.prevVisits ? <Delta now={conversion} prev={prevConversion} /> : <span className="text-xs text-muted-foreground">طلبات ÷ زيارات</span>,
    },
  ];

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <h3 className="font-semibold">نبض المتجر</h3>
          <p className="text-sm text-muted-foreground">آخر ٧ أيام — عشان تعرف تعديلاتك عملت فرق ولا لأ.</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{t.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{t.value}</p>
            <div className="mt-1">{t.delta}</div>
          </div>
        ))}

        <div className="rounded-xl border border-border bg-card p-4">
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Smartphone className="size-3.5" />
            زوار الموبايل
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{pulse.visits ? pf.format(mobileShare) : "—"}</p>
          {pulse.visits > 0 && (
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${pf.format(mobileShare)} من الزيارات من الموبايل`}>
              <div className="h-full rounded-full bg-primary" style={{ width: `${mobileShare * 100}%` }} />
            </div>
          )}
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {mobileShare >= 0.6 ? (
              <>
                أغلب زوارك على الموبايل —{" "}
                <Link href="/builder?device=mobile" className="font-medium text-primary hover:underline">
                  راجع شكله على الموبايل
                </Link>
              </>
            ) : pulse.visits ? (
              "زوارك متوزعين بين الموبايل والكمبيوتر."
            ) : (
              "لسه مفيش زيارات الأسبوع ده."
            )}
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Homepage outline ─────────────────────────────────────────────────────────

export function HomeOutline({ order, enabled }: { order: SectionKey[]; enabled: Partial<Record<SectionKey, boolean>> }) {
  const on = order.filter((k) => enabled[k]);
  const offCount = order.length - on.length;

  return (
    <section className="flex flex-col rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">الصفحة الرئيسية</h3>
          <p className="text-xs text-muted-foreground">
            {nf.format(on.length)} قسم ظاهر{offCount > 0 && ` · ${nf.format(offCount)} مقفول`}
          </p>
        </div>
        <Button asChild variant="ghost" size="sm" className="h-8 gap-1 text-xs">
          <Link href={studioHref("sections")}>
            رتّب
            <ArrowLeft className="size-3.5" />
          </Link>
        </Button>
      </div>
      <ol className="flex-1 space-y-1 p-3">
        {on.map((key, i) => (
          <li key={key} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm">
            <span className="grid size-5 shrink-0 place-items-center rounded bg-muted text-[11px] tabular-nums text-muted-foreground">{i + 1}</span>
            <span className="min-w-0 flex-1 truncate">{SECTION_LABELS[key]}</span>
          </li>
        ))}
        {on.length === 0 && <li className="p-4 text-center text-sm text-muted-foreground">كل الأقسام مقفولة — الصفحة الرئيسية فاضية.</li>}
      </ol>
    </section>
  );
}

// ─── Upcoming seasons ─────────────────────────────────────────────────────────

export function UpcomingSeasons({ now }: { now: Date }) {
  const seasons = upcomingSeasons(now);
  if (!seasons.length) return null;

  return (
    <section className="flex flex-col rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <CalendarDays className="size-4 text-muted-foreground" />
          مواسم جاية
        </h3>
        <p className="text-xs text-muted-foreground">جهّز العرض بدري — النافذة بتشتغل وتقف لوحدها في ميعادها.</p>
      </div>
      <ul className="flex-1 divide-y divide-border">
        {seasons.map((s) => {
          const live = s.daysLeft <= 0;
          const params = new URLSearchParams({
            tab: "popups",
            popup: "new",
            template: "campaign",
            name: s.name,
            starts: new Date(Math.max(now.getTime(), s.start.getTime() - 2 * 86400_000)).toISOString(),
            ends: s.end.toISOString(),
          });
          return (
            <li key={s.id} className="flex items-center gap-3 px-4 py-3">
              <div className="grid w-12 shrink-0 place-items-center rounded-lg bg-muted py-1.5 text-center">
                <span className="text-base font-semibold tabular-nums leading-none">{live ? "الآن" : nf.format(s.daysLeft)}</span>
                {!live && <span className="text-[10px] text-muted-foreground">يوم</span>}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {s.name}
                  <span className="ms-1.5 text-xs font-normal text-muted-foreground">
                    {s.approx && "حوالي "}
                    {df.format(s.start)}
                  </span>
                </p>
                <p className="truncate text-xs text-muted-foreground">{s.tip}</p>
              </div>
              <Button asChild variant="outline" size="sm" className="h-8 shrink-0 text-xs">
                <Link href={`/customization?${params.toString()}`} scroll={false}>
                  جهّز عرض
                </Link>
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
