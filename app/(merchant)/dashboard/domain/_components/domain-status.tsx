"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Copy, ExternalLink, Loader2, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";

import { disconnectCustomDomainAction, verifyCustomDomainAction } from "@/actions/store/custom-domain.actions";
import { SegmentedButtons, StatusText, appleButton } from "@/components/saas-page";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { requiredRecords } from "@/lib/custom-domain/shared";
import type { DomainCheckReport } from "@/lib/custom-domain/verify";
import { cn } from "@/lib/utils";
import { lazyIntl, lazyList, tdir, tr, trv } from "@/lib/i18n/dashboard";
import { BrowserBar } from "./browser-bar";

type Status = "PENDING" | "ACTIVE" | "FAILED";

type Props = {
  domain: string;
  initialStatus: Status;
  connectedAt: string | null;
  storeUrl: string;
  targets: { cname: string; a: string };
  /** This store's ownership token (TXT record). */
  verifyToken: string;
};

const POLL_MS = 30_000;
const df = lazyIntl.date({ timeZone: "Africa/Cairo", day: "numeric", month: "long", year: "numeric" });
const rtf = lazyIntl.relative({ numeric: "auto" });

const STATUS_META: Record<Status, { label: string; tone: "success" | "warning" | "danger" }> = {
  ACTIVE: { get label() { return tr("شغّال"); }, tone: "success" },
  PENDING: { get label() { return tr("مستني الـ DNS"); }, tone: "warning" },
  FAILED: { get label() { return tr("فيه مشكلة"); }, tone: "danger" },
};

const PROBLEM_TEXT: Record<string, { title: string; body: string }> = {
  "no-records": {
    get title() { return tr("لسه مش لاقيين السجلات"); },
    get body() { return tr("ضيف السجلات اللي تحت في لوحة تحكم الدومين. لو لسه ضايفها، التغيير بياخد من دقايق لحد كام ساعة عشان ينتشر."); },
  },
  "cloudflare-proxy": {
    get title() { return tr("Cloudflare مخبّي الدومين"); },
    get body() { return tr("السحابة البرتقالي شغّالة على السجل. افتح DNS في Cloudflare ودوس على السحابة لحد ما تبقى رمادي (DNS only)."); },
  },
  "wrong-target": {
    get title() { return tr("الدومين بيشاور على مكان تاني"); },
    get body() { return tr("في سجل قديم (استضافة قديمة أو صفحة ركن) لنفس الاسم. امسحه وسيب السجلات اللي تحت بس."); },
  },
};

PROBLEM_TEXT["no-ownership"] = {
  get title() { return tr("فاضل سجل الـ TXT"); },
  get body() { return tr("الـ DNS بيشاور علينا تمام، بس لازم تضيف سجل الـ TXT اللي تحت عشان نتأكد إن الدومين بتاعك انت. ده بيحمي دومينك إن حد تاني يربطه بمتجره."); },
};

const PROVIDERS = [
  {
    id: "cloudflare",
    name: "Cloudflare",
    steps: lazyList(["افتح الدومين ← DNS ← Records.", "Add record بالقيم اللي فوق.", "خلّي Proxy status رمادي (DNS only) — مهم جدًا."]),
  },
  {
    id: "godaddy",
    name: "GoDaddy",
    steps: lazyList(["My Products ← جنب الدومين DNS.", "Add New Record بالقيم اللي فوق.", "لو في سجل A اسمه @ بقيمة Parked امسحه."]),
  },
  {
    id: "namecheap",
    name: "Namecheap",
    steps: lazyList(["Domain List ← Manage ← Advanced DNS.", "Add New Record بالقيم اللي فوق (Host = @ أو www).", "امسح سجل URL Redirect أو parkingpage لو موجود."]),
  },
  {
    id: "hostinger",
    name: "Hostinger",
    steps: lazyList(["Domains ← اختار الدومين ← DNS / Nameservers.", "ضيف السجلات اللي فوق.", "امسح أي سجل A قديم لنفس الاسم."]),
  },
];

function useNow(interval = 10_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(t);
  }, [interval]);
  return now;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label={tr("نسخ {0}", label)}
      onClick={() => {
        navigator.clipboard?.writeText(value).catch(() => {});
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className="apple-press grid size-8 shrink-0 place-items-center rounded-full text-primary hover:bg-primary/8"
    >
      {done ? <Check className="size-4 text-(--sys-green)" strokeWidth={2.6} /> : <Copy className="size-4" />}
    </button>
  );
}

/** One value line inside a record: label leading, monospace value + copy trailing. */
function ValueLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-11 items-center gap-3 ps-4 pe-2">
      <span className="w-16 shrink-0 text-[13px] text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 truncate font-mono text-[14px] rtl:text-right" dir="ltr" title={value}>
        {value}
      </span>
      <CopyButton value={value} label={label} />
    </div>
  );
}

export function DomainStatus({ domain, initialStatus, connectedAt, storeUrl, targets, verifyToken }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(initialStatus);
  const [report, setReport] = useState<DomainCheckReport | null>(null);
  const [checking, setChecking] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [provider, setProvider] = useState(PROVIDERS[0].id);
  const [disconnecting, startDisconnect] = useTransition();
  const now = useNow();
  const records = requiredRecords(domain, targets, verifyToken);

  const verify = useCallback(
    async (manual = false) => {
      setChecking(true);
      const result = await verifyCustomDomainAction().catch(() => null);
      setChecking(false);
      if (!result?.ok || !result.data) {
        if (manual) toast.error(result && !result.ok ? result.message : tr("مقدرناش نفحص دلوقتي."));
        return;
      }
      const data = result.data;
      setReport(data);
      setStatus((prev) => {
        if (prev !== "ACTIVE" && data.status === "ACTIVE") {
          toast.success(tr("{0} شغّال 🎉", domain));
          router.refresh();
        } else if (manual && data.status !== "ACTIVE") {
          toast(tr("لسه مش جاهز — شوف التفاصيل تحت."));
        }
        return data.status;
      });
    },
    [domain, router],
  );

  // Check on open, then keep polling while it's not live and the tab is visible.
  useEffect(() => {
    const first = setTimeout(() => verify(), 0);
    if (status === "ACTIVE") return () => clearTimeout(first);
    const t = setInterval(() => {
      if (document.visibilityState === "visible") verify();
    }, POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-arm only when the status changes
  }, [status === "ACTIVE"]);

  function disconnect() {
    startDisconnect(async () => {
      const result = await disconnectCustomDomainAction();
      if (!result.ok) {
        toast.error(trv(result.message));
        return;
      }
      setConfirm(false);
      toast.success(result.message ?? tr("اتفصل الدومين"));
      router.refresh();
    });
  }

  function shareInstructions() {
    const text = [
      tr("إعدادات الدومين {0} لمتجر كاشو:", domain),
      ...records.map((r) => `• ${r.type} — Host: ${r.host} — Value: ${r.value}`),
      tr("امسح أي سجل A أو CNAME قديم لنفس الأسماء."),
      tr("لو الدومين على Cloudflare: خلّي السحابة رمادي (DNS only)."),
    ].join("\n");
    navigator.clipboard?.writeText(text).catch(() => {});
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  }

  const live = status === "ACTIVE";
  const dnsOk = report ? report.dns.ok : live;
  const sslOk = live;
  const problem =
    report && !report.dns.ok
      ? PROBLEM_TEXT[report.dns.problem ?? "no-records"]
      : report && !live && !report.ownership && !connectedAt
        ? PROBLEM_TEXT["no-ownership"]
        : null;
  const hostingWaiting = report && report.dns.ok && !live;
  const checkedAgo = report ? rtf.format(Math.round((new Date(report.checkedAt).getTime() - now) / 60000), "minute") : null;
  const failed = status === "FAILED";

  const steps = [
    { label: tr("ربطت الدومين بمتجرك"), done: true },
    { label: tr("سجلات الـ DNS متظبطة"), done: dnsOk },
    { label: tr("شغّال بشهادة أمان SSL"), done: sslOk },
  ];
  const activeProvider = PROVIDERS.find((p) => p.id === provider) ?? PROVIDERS[0];

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0 space-y-6">
        {/* ── Hero: the address as customers will see it ───────────── */}
        <section className="apple-card flex flex-col items-center px-6 pt-10 pb-8 text-center" aria-live="polite">
          <BrowserBar host={domain} secure={live} />
          <div className="mt-6">
            <StatusText tone={STATUS_META[status].tone}>{STATUS_META[status].label}</StatusText>
          </div>
          <h2 className="mt-1.5 max-w-full truncate text-[28px] leading-[34px] font-bold ltr:tracking-[-0.015em]" dir="ltr">
            {domain}
          </h2>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            {live && connectedAt
              ? tr("شغّال من {0}", df.format(new Date(connectedAt)))
              : checking
                ? tr("بنفحص دلوقتي…")
                : checkedAgo
                  ? tr("آخر فحص {0} · بنعيد الفحص تلقائي كل ٣٠ ثانية", checkedAgo)
                  : tr("بنفحص تلقائي…")}
          </p>
          <div className="mt-6 flex w-full max-w-sm flex-col gap-2">
            {live ? (
              <a href={`https://${domain}`} target="_blank" rel="noreferrer" className={cn(appleButton.filled, "h-[50px] text-[17px]")}>
                <ExternalLink className="size-4" />
                {tr("افتح المتجر")}
              </a>
            ) : (
              <button type="button" onClick={() => verify(true)} disabled={checking} className={cn(appleButton.filled, "h-[50px] text-[17px]")}>
                <RefreshCw className={cn("size-4", checking && "animate-spin")} />
                {tr("افحص دلوقتي")}
              </button>
            )}
            <button type="button" onClick={() => setConfirm(true)} className={cn(appleButton.plain, "mx-0 h-11 text-(--sys-red) hover:bg-(--sys-red)/8")}>
              {tr("افصل الدومين")}
            </button>
          </div>
        </section>

        {/* ── Diagnosis ───────────────────────────────────────────── */}
        {!live && (problem || hostingWaiting || failed) && (
          <section className={cn("flex gap-3 rounded-[14px] px-4 py-3.5", failed ? "bg-(--sys-red)/10" : "bg-(--sys-orange)/12")}>
            <AlertTriangle className={cn("mt-0.5 size-[18px] shrink-0", failed ? "text-(--sys-red)" : "text-(--sys-orange)")} />
            <div className="min-w-0 space-y-1">
              <p className="text-[15px] font-semibold">
                {problem?.title ?? (hostingWaiting ? tr("الـ DNS تمام — بنجهّز شهادة الأمان") : tr("الدومين وقف يشاور على متجرك"))}
              </p>
              <p className="text-[13px] leading-[19px] text-foreground/75">
                {problem?.body ??
                  (hostingWaiting
                    ? tr("خلاص فاضل دقايق. هنفعّل الدومين لوحده أول ما الشهادة تجهز — مش محتاج تعمل حاجة.")
                    : tr("حد غيّر إعدادات الـ DNS. رجّع السجلات اللي تحت."))}
              </p>
              {report && (report.dns.found.a.length > 0 || report.dns.found.cname.length > 0) && (
                <p className="text-[12px] text-muted-foreground">
                  {tr("لقينا دلوقتي:")}{" "}
                  <span className="font-mono" dir="ltr">
                    {[...report.dns.found.cname.map((c) => `CNAME ${c}`), ...report.dns.found.a.map((ip) => `A ${ip}`)].join(" · ")}
                  </span>
                </p>
              )}
            </div>
          </section>
        )}

        {/* ── DNS records: one grouped card per record ─────────────── */}
        {!live && (
          <section className="space-y-2" aria-labelledby="records-title">
            <div className="flex items-end justify-between gap-3 px-4">
              <div>
                <h2 id="records-title" className="text-[13px] font-semibold text-muted-foreground">
                  {tr("السجلات المطلوبة")}
                </h2>
              </div>
              <button type="button" onClick={shareInstructions} className={cn(appleButton.plain, "h-7 text-[13px] font-semibold")}>
                <Send className="size-3.5 rtl:-scale-x-100" />
                {tr("ابعتها للي بيظبطلك الدومين")}
              </button>
            </div>
            <ul className="space-y-3">
              {records.map((r) => (
                <li key={`${r.type}-${r.host}`} className="apple-card apple-rows overflow-hidden rounded-[14px] [--row-inset:16px]">
                  <div className="flex items-center gap-3 px-4 py-2.5">
                    <span className="inline-flex h-6 min-w-12 items-center justify-center rounded-[6px] bg-primary/10 px-2 font-mono text-[12px] font-semibold text-primary">
                      {r.type}
                    </span>
                    <span className="min-w-0 truncate text-[13px] text-muted-foreground">{r.note}</span>
                  </div>
                  <ValueLine label={tr("الاسم")} value={r.host} />
                  <ValueLine label={tr("القيمة")} value={r.value} />
                </li>
              ))}
            </ul>
            <p className="px-4 text-[13px] leading-[18px] text-muted-foreground">
              {tr("ضيفها في لوحة تحكم الشركة اللي اشتريت منها الدومين.")}{" "}
              {tr("TTL سيبه على الافتراضي (Auto). امسح أي سجل A أو CNAME قديم بنفس الاسم — وإلا الدومين هيفضل يروح للمكان القديم.")}
            </p>
          </section>
        )}

        {/* ── Provider guides ─────────────────────────────────────── */}
        {!live && (
          <section className="apple-card space-y-4 p-5" aria-labelledby="providers-title">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 id="providers-title" className="text-[17px] font-semibold">
                {tr("خطوات حسب شركة الدومين")}
              </h2>
              <SegmentedButtons
                label={tr("خطوات حسب شركة الدومين")}
                role="tablist"
                value={provider}
                onChange={setProvider}
                options={PROVIDERS.map((p) => [p.id, p.name] as const)}
                className="max-w-full overflow-x-auto"
              />
            </div>
            <ol className="space-y-3" role="tabpanel">
              {activeProvider.steps.map((s, i) => (
                <li key={i} className="flex gap-3 text-[15px]">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-[12px] font-semibold text-primary-foreground tabular-nums">
                    {i + 1}
                  </span>
                  <span className="leading-6">{s}</span>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>

      <aside className="space-y-6 xl:sticky xl:top-6">
        {/* Progress */}
        <ol className="apple-card px-5 py-4" aria-label={tr("خطوات الربط")}>
          {steps.map((step, i) => {
            const current = !step.done && steps.slice(0, i).every((s) => s.done);
            return (
              <li key={step.label} className="relative flex items-center gap-3 pb-4 last:pb-0" aria-current={current ? "step" : undefined}>
                {i < steps.length - 1 && (
                  <span aria-hidden className={cn("absolute start-[13px] top-8 bottom-1 w-0.5 rounded-full", step.done ? "bg-(--sys-green)" : "bg-(--fill-3)")} />
                )}
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full text-[13px] font-semibold tabular-nums",
                    step.done ? "bg-(--sys-green) text-white" : current ? "bg-primary text-primary-foreground" : "bg-(--fill-3) text-muted-foreground",
                  )}
                >
                  {step.done ? (
                    <Check className="size-4" strokeWidth={3} />
                  ) : current && checking ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    i + 1
                  )}
                </span>
                <span className={cn("text-[15px]", step.done ? "" : current ? "font-semibold" : "text-muted-foreground")}>{step.label}</span>
              </li>
            );
          })}
        </ol>

        {/* Links */}
        <section className="space-y-2" aria-labelledby="links-title">
          <h2 id="links-title" className="px-4 text-[13px] font-semibold text-muted-foreground">
            {tr("روابط متجرك")}
          </h2>
          <div className="apple-card apple-rows overflow-hidden rounded-[14px] [--row-inset:16px]">
            {live && (
              <div className="space-y-0.5 py-2.5 ps-4 pe-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] text-muted-foreground">{tr("رابط متجرك الأساسي")}</span>
                  <CopyButton value={`https://${domain}`} label={tr("الرابط")} />
                </div>
                <p className="truncate text-[15px] font-medium rtl:text-right" dir="ltr">
                  https://{domain}
                </p>
                <p className="pe-2 text-[12px] text-muted-foreground">{tr("ده اللي جوجل والمشاركات هيستخدموه.")}</p>
              </div>
            )}
            <div className="space-y-0.5 py-2.5 ps-4 pe-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] text-muted-foreground">{tr("رابط كاشو")}</span>
                <CopyButton value={storeUrl} label={tr("رابط كاشو")} />
              </div>
              <p className="truncate text-[15px] text-muted-foreground rtl:text-right" dir="ltr">
                {storeUrl.replace(/^https?:\/\//, "")}
              </p>
              <p className="pe-2 text-[12px] text-muted-foreground">{tr("لسه شغّال — أي لينك قديم مش هيبوظ.")}</p>
            </div>
          </div>
        </section>
      </aside>

      <AlertDialog open={confirm} onOpenChange={(open) => !disconnecting && setConfirm(open)}>
        <AlertDialogContent dir={tdir()} className="max-w-[20rem] gap-0 p-0 text-center">
          <AlertDialogHeader className="items-center gap-1 px-5 pt-6 pb-5 text-center sm:text-center">
            <AlertDialogTitle className="text-[17px] font-semibold">{tr("تفصل {0}؟", domain)}</AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] leading-[18px]">
              {live
                ? tr("اللي هيفتح الدومين ده مش هيلاقي متجرك. متجرك هيفضل شغّال على رابط كاشو.")
                : tr("هتقدر تربط نفس الدومين أو دومين تاني بعدين.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="grid grid-cols-2 gap-0 border-t border-border/60 sm:space-x-0">
            <AlertDialogCancel
              disabled={disconnecting}
              className="m-0 h-11 rounded-none border-0 bg-transparent text-[17px] font-semibold text-primary shadow-none hover:bg-(--fill-3)/60"
            >
              {tr("رجوع")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                disconnect();
              }}
              disabled={disconnecting}
              className="m-0 h-11 gap-1.5 rounded-none border-0 border-s border-border/60 bg-transparent text-[17px] text-(--sys-red) shadow-none hover:bg-(--fill-3)/60"
            >
              {disconnecting && <Loader2 className="size-4 animate-spin" />}
              {tr("افصل الدومين")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
