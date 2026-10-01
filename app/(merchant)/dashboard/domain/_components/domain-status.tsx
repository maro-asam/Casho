"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Copy, ExternalLink, Loader2, Lock, RefreshCw, Send, Unplug } from "lucide-react";
import { toast } from "sonner";

import { disconnectCustomDomainAction, verifyCustomDomainAction } from "@/actions/store/custom-domain.actions";
import { StatusPill } from "@/components/saas-page";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requiredRecords } from "@/lib/custom-domain/shared";
import type { DomainCheckReport } from "@/lib/custom-domain/verify";
import { cn } from "@/lib/utils";

type Status = "PENDING" | "ACTIVE" | "FAILED";

type Props = {
  domain: string;
  initialStatus: Status;
  connectedAt: string | null;
  storeUrl: string;
  targets: { cname: string; a: string };
};

const POLL_MS = 30_000;
const df = new Intl.DateTimeFormat("ar-EG", { timeZone: "Africa/Cairo", day: "numeric", month: "long", year: "numeric" });
const rtf = new Intl.RelativeTimeFormat("ar-EG", { numeric: "auto" });

const STATUS_META: Record<Status, { label: string; tone: "success" | "warning" | "danger" }> = {
  ACTIVE: { label: "شغّال", tone: "success" },
  PENDING: { label: "مستني الـ DNS", tone: "warning" },
  FAILED: { label: "فيه مشكلة", tone: "danger" },
};

const PROBLEM_TEXT: Record<string, { title: string; body: string }> = {
  "no-records": {
    title: "لسه مش لاقيين السجلات",
    body: "ضيف السجلات اللي تحت في لوحة تحكم الدومين. لو لسه ضايفها، التغيير بياخد من دقايق لحد كام ساعة عشان ينتشر.",
  },
  "cloudflare-proxy": {
    title: "Cloudflare مخبّي الدومين",
    body: "السحابة البرتقالي شغّالة على السجل. افتح DNS في Cloudflare ودوس على السحابة لحد ما تبقى رمادي (DNS only).",
  },
  "wrong-target": {
    title: "الدومين بيشاور على مكان تاني",
    body: "في سجل قديم (استضافة قديمة أو صفحة ركن) لنفس الاسم. امسحه وسيب السجلات اللي تحت بس.",
  },
};

const PROVIDERS = [
  {
    id: "cloudflare",
    name: "Cloudflare",
    steps: ["افتح الدومين ← DNS ← Records.", "Add record بالقيم اللي فوق.", "خلّي Proxy status رمادي (DNS only) — مهم جدًا."],
  },
  {
    id: "godaddy",
    name: "GoDaddy",
    steps: ["My Products ← جنب الدومين DNS.", "Add New Record بالقيم اللي فوق.", "لو في سجل A اسمه @ بقيمة Parked امسحه."],
  },
  {
    id: "namecheap",
    name: "Namecheap",
    steps: ["Domain List ← Manage ← Advanced DNS.", "Add New Record بالقيم اللي فوق (Host = @ أو www).", "امسح سجل URL Redirect أو parkingpage لو موجود."],
  },
  {
    id: "hostinger",
    name: "Hostinger",
    steps: ["Domains ← اختار الدومين ← DNS / Nameservers.", "ضيف السجلات اللي فوق.", "امسح أي سجل A قديم لنفس الاسم."],
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
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-7 shrink-0 text-muted-foreground"
      aria-label={`نسخ ${label}`}
      onClick={() => {
        navigator.clipboard?.writeText(value).catch(() => {});
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
    </Button>
  );
}

export function DomainStatus({ domain, initialStatus, connectedAt, storeUrl, targets }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(initialStatus);
  const [report, setReport] = useState<DomainCheckReport | null>(null);
  const [checking, setChecking] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [disconnecting, startDisconnect] = useTransition();
  const now = useNow();
  const records = requiredRecords(domain, targets);

  const verify = useCallback(
    async (manual = false) => {
      setChecking(true);
      const result = await verifyCustomDomainAction().catch(() => null);
      setChecking(false);
      if (!result?.ok || !result.data) {
        if (manual) toast.error(result && !result.ok ? result.message : "مقدرناش نفحص دلوقتي.");
        return;
      }
      const data = result.data;
      setReport(data);
      setStatus((prev) => {
        if (prev !== "ACTIVE" && data.status === "ACTIVE") {
          toast.success(`${domain} شغّال 🎉`);
          router.refresh();
        } else if (manual && data.status !== "ACTIVE") {
          toast("لسه مش جاهز — شوف التفاصيل تحت.");
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
        toast.error(result.message);
        return;
      }
      setConfirm(false);
      toast.success(result.message ?? "اتفصل الدومين");
      router.refresh();
    });
  }

  function shareInstructions() {
    const text = [
      `إعدادات الدومين ${domain} لمتجر كاشو:`,
      ...records.map((r) => `• ${r.type} — Host: ${r.host} — Value: ${r.value}`),
      "امسح أي سجل A أو CNAME قديم لنفس الأسماء.",
      "لو الدومين على Cloudflare: خلّي السحابة رمادي (DNS only).",
    ].join("\n");
    navigator.clipboard?.writeText(text).catch(() => {});
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  }

  const live = status === "ACTIVE";
  const dnsOk = report ? report.dns.ok : live;
  const sslOk = live;
  const problem = report && !report.dns.ok ? PROBLEM_TEXT[report.dns.problem ?? "no-records"] : null;
  const hostingWaiting = report && report.dns.ok && !live;
  const checkedAgo = report ? rtf.format(Math.round((new Date(report.checkedAt).getTime() - now) / 60000), "minute") : null;

  const steps = [
    { label: "ربطت الدومين بمتجرك", done: true },
    { label: "سجلات الـ DNS متظبطة", done: dnsOk },
    { label: "شغّال بشهادة أمان SSL", done: sslOk },
  ];

  return (
    <div className="space-y-4">
      {/* ── Header card ─────────────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              {live && <Lock className="size-4 text-emerald-600" aria-label="آمن" />}
              <p className="truncate font-mono text-lg font-semibold" dir="ltr">
                {domain}
              </p>
              <StatusPill tone={STATUS_META[status].tone}>{STATUS_META[status].label}</StatusPill>
            </div>
            <p className="text-xs text-muted-foreground">
              {live && connectedAt
                ? `شغّال من ${df.format(new Date(connectedAt))}`
                : checking
                  ? "بنفحص دلوقتي…"
                  : checkedAgo
                    ? `آخر فحص ${checkedAgo} · بنعيد الفحص تلقائي كل ٣٠ ثانية`
                    : "بنفحص تلقائي…"}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {live ? (
              <Button asChild size="sm" className="gap-1.5">
                <a href={`https://${domain}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" />
                  افتح المتجر
                </a>
              </Button>
            ) : (
              <Button size="sm" className="gap-1.5" onClick={() => verify(true)} disabled={checking}>
                <RefreshCw className={cn("size-4", checking && "animate-spin")} />
                افحص دلوقتي
              </Button>
            )}
            <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground hover:text-destructive" onClick={() => setConfirm(true)}>
              <Unplug className="size-4" />
              افصل
            </Button>
          </div>
        </div>

        {/* Stepper */}
        <ol className="grid border-t border-border sm:grid-cols-3">
          {steps.map((step, i) => {
            const current = !step.done && steps.slice(0, i).every((s) => s.done);
            return (
              <li key={step.label} className={cn("flex items-center gap-2.5 px-5 py-3 text-sm", i > 0 && "border-t border-border sm:border-s sm:border-t-0")}>
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full border text-[11px] font-medium tabular-nums",
                    step.done
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : current
                        ? "border-primary text-primary"
                        : "border-border text-muted-foreground",
                  )}
                >
                  {step.done ? <Check className="size-3.5" /> : current && checking ? <Loader2 className="size-3.5 animate-spin" /> : i + 1}
                </span>
                <span className={cn(step.done ? "text-foreground" : current ? "font-medium" : "text-muted-foreground")}>{step.label}</span>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ── Live: done ──────────────────────────────────────────── */}
      {live && (
        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">رابط متجرك الأساسي</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="truncate font-mono text-sm" dir="ltr">
                https://{domain}
              </p>
              <CopyButton value={`https://${domain}`} label="الرابط" />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">ده اللي جوجل والمشاركات هيستخدموه.</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">رابط كاشو</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="truncate font-mono text-sm text-muted-foreground" dir="ltr">
                {storeUrl.replace(/^https?:\/\//, "")}
              </p>
              <CopyButton value={storeUrl} label="رابط كاشو" />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">لسه شغّال — أي لينك قديم مش هيبوظ.</p>
          </div>
        </section>
      )}

      {/* ── Diagnosis ───────────────────────────────────────────── */}
      {!live && (problem || hostingWaiting || status === "FAILED") && (
        <section
          className={cn(
            "flex gap-3 rounded-xl border p-4",
            status === "FAILED" ? "border-rose-500/30 bg-rose-500/5" : "border-amber-500/30 bg-amber-500/5",
          )}
        >
          <AlertTriangle className={cn("mt-0.5 size-4 shrink-0", status === "FAILED" ? "text-rose-600" : "text-amber-600")} />
          <div className="min-w-0 space-y-1.5 text-sm">
            <p className="font-medium">
              {problem?.title ?? (hostingWaiting ? "الـ DNS تمام — بنجهّز شهادة الأمان" : "الدومين وقف يشاور على متجرك")}
            </p>
            <p className="leading-6 text-muted-foreground">
              {problem?.body ??
                (hostingWaiting
                  ? "خلاص فاضل دقايق. هنفعّل الدومين لوحده أول ما الشهادة تجهز — مش محتاج تعمل حاجة."
                  : "حد غيّر إعدادات الـ DNS. رجّع السجلات اللي تحت.")}
            </p>
            {report && (report.dns.found.a.length > 0 || report.dns.found.cname.length > 0) && (
              <p className="text-xs text-muted-foreground">
                لقينا دلوقتي:{" "}
                <span className="font-mono" dir="ltr">
                  {[...report.dns.found.cname.map((c) => `CNAME ${c}`), ...report.dns.found.a.map((ip) => `A ${ip}`)].join(" · ")}
                </span>
              </p>
            )}
          </div>
        </section>
      )}

      {/* ── DNS records ─────────────────────────────────────────── */}
      {!live && (
        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex flex-col gap-2 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold">السجلات المطلوبة</h3>
              <p className="text-xs text-muted-foreground">ضيفها في لوحة تحكم الشركة اللي اشتريت منها الدومين.</p>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={shareInstructions}>
              <Send className="size-3.5" />
              ابعتها للي بيظبطلك الدومين
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 text-xs text-muted-foreground">
                  <th className="h-10 ps-4 text-right font-medium">النوع</th>
                  <th className="h-10 text-right font-medium">الاسم (Host)</th>
                  <th className="h-10 text-right font-medium">القيمة (Value)</th>
                  <th className="hidden h-10 pe-4 text-right font-medium sm:table-cell">ليه</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {records.map((r) => (
                  <tr key={`${r.type}-${r.host}`}>
                    <td className="py-3 ps-4">
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{r.type}</span>
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1">
                        <span className="font-mono" dir="ltr">
                          {r.host}
                        </span>
                        <CopyButton value={r.host} label="الاسم" />
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1">
                        <span className="font-mono" dir="ltr">
                          {r.value}
                        </span>
                        <CopyButton value={r.value} label="القيمة" />
                      </span>
                    </td>
                    <td className="hidden py-3 pe-4 text-xs text-muted-foreground sm:table-cell">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
            TTL سيبه على الافتراضي (Auto). امسح أي سجل A أو CNAME قديم بنفس الاسم — وإلا الدومين هيفضل يروح للمكان القديم.
          </p>
        </section>
      )}

      {/* ── Provider guides ─────────────────────────────────────── */}
      {!live && (
        <section className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">خطوات حسب شركة الدومين</h3>
          <Tabs defaultValue="cloudflare" dir="rtl">
            <TabsList className="h-auto flex-wrap">
              {PROVIDERS.map((p) => (
                <TabsTrigger key={p.id} value={p.id} className="text-xs">
                  {p.name}
                </TabsTrigger>
              ))}
            </TabsList>
            {PROVIDERS.map((p) => (
              <TabsContent key={p.id} value={p.id}>
                <ol className="mt-2 space-y-2">
                  {p.steps.map((s, i) => (
                    <li key={i} className="flex gap-2.5 text-sm">
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-muted text-[11px] tabular-nums">{i + 1}</span>
                      <span className="leading-6 text-muted-foreground">{s}</span>
                    </li>
                  ))}
                </ol>
              </TabsContent>
            ))}
          </Tabs>
        </section>
      )}

      <AlertDialog open={confirm} onOpenChange={(open) => !disconnecting && setConfirm(open)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تفصل {domain}؟</AlertDialogTitle>
            <AlertDialogDescription>
              {live
                ? "اللي هيفتح الدومين ده مش هيلاقي متجرك. متجرك هيفضل شغّال على رابط كاشو."
                : "هتقدر تربط نفس الدومين أو دومين تاني بعدين."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disconnecting}>رجوع</AlertDialogCancel>
            <Button variant="destructive" onClick={disconnect} disabled={disconnecting} className="gap-1.5">
              {disconnecting && <Loader2 className="size-4 animate-spin" />}
              افصل الدومين
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
