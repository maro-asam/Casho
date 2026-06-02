"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Globe,
  CheckCircle2,
  Clock3,
  XCircle,
  ArrowRight,
  Copy,
  ExternalLink,
  RefreshCw,
  Unlink,
  ChevronRight,
  Loader2,
  AlertCircle,
  Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import {
  checkDomainAvailabilityAction,
  connectCustomDomainAction,
  disconnectCustomDomainAction,
  getDomainStatusAction,
} from "@/actions/store/custom-domain.actions";

type Props = {
  storeSlug: string;
  initialDomain: string | null;
  initialStatus: "PENDING" | "ACTIVE" | "FAILED" | null;
  initialConnectedAt: Date | null;
};

type Step = "idle" | "enter" | "instructions" | "connected";

type CheckState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "valid" }
  | { status: "invalid"; reason: string }
  | { status: "taken" };

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "casho.store";

function StatusBadge({ status }: { status: "PENDING" | "ACTIVE" | "FAILED" | null }) {
  if (!status) return null;
  const map = {
    PENDING: {
      label: "قيد المراجعة",
      icon: Clock3,
      className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200",
    },
    ACTIVE: {
      label: "مفعّل",
      icon: CheckCircle2,
      className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200",
    },
    FAILED: {
      label: "فشل",
      icon: XCircle,
      className: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200",
    },
  };
  const { label, icon: Icon, className } = map[status];
  return (
    <Badge
      variant="outline"
      className={cn("flex items-center gap-1.5 rounded-xl px-3 py-1 text-sm font-medium", className)}
    >
      <Icon className="size-3.5" />
      {label}
    </Badge>
  );
}

function DnsInstructionsCard({ domain }: { domain: string }) {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-800 dark:bg-blue-950/30">
        <div className="mb-2 flex items-center gap-2 text-blue-700 dark:text-blue-400">
          <Info className="size-4" />
          <p className="font-semibold text-sm">كيف تربط نطاقك؟</p>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          اذهب إلى لوحة تحكم مزوّد النطاق (مثل GoDaddy, Namecheap, Cloudflare) وأضف أحد
          السجلات التالية:
        </p>
      </div>

      <div className="space-y-3">
        {/* CNAME */}
        <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-semibold text-sm">الخيار الأول — CNAME</p>
            <Badge variant="outline" className="text-xs">مُوصى به</Badge>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-lg bg-background p-2.5 font-mono border">
              <span>
                <span className="text-muted-foreground">النوع: </span>CNAME
                <span className="mx-3 text-muted-foreground">|</span>
                <span className="text-muted-foreground">الاسم: </span>
                {domain.startsWith("www.") ? "www" : "@"}
                <span className="mx-3 text-muted-foreground">|</span>
                <span className="text-muted-foreground">القيمة: </span>
                stores.{ROOT_DOMAIN}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="size-7 p-0"
                onClick={() => copy(`stores.${ROOT_DOMAIN}`, "cname")}
              >
                {copied === "cname" ? (
                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* A Record */}
        <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
          <p className="mb-3 font-semibold text-sm">الخيار الثاني — A Record</p>
          <div className="flex items-center justify-between rounded-lg bg-background p-2.5 font-mono text-sm border">
            <span>
              <span className="text-muted-foreground">النوع: </span>A
              <span className="mx-3 text-muted-foreground">|</span>
              <span className="text-muted-foreground">الاسم: </span>@
              <span className="mx-3 text-muted-foreground">|</span>
              <span className="text-muted-foreground">القيمة: </span>
              76.76.21.21
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="size-7 p-0"
              onClick={() => copy("76.76.21.21", "a")}
            >
              {copied === "a" ? (
                <CheckCircle2 className="size-3.5 text-emerald-600" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-800 dark:bg-amber-950/20">
        <div className="flex items-start gap-2 text-amber-700 dark:text-amber-400">
          <Clock3 className="mt-0.5 size-4 shrink-0" />
          <div className="space-y-1 text-sm">
            <p className="font-semibold">وقت الانتشار</p>
            <p className="leading-6 text-muted-foreground">
              بعد إضافة السجل، ممكن ياخد من ٥ دقايق لـ ٤٨ ساعة حتى يكتمل الانتشار.
              بعدها هنفعّل النطاق تلقائياً.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomDomainClient({
  storeSlug,
  initialDomain,
  initialStatus,
}: Props) {
  const [step, setStep] = useState<Step>(initialDomain ? "connected" : "idle");
  const [domain, setDomain] = useState(initialDomain ?? "");
  const [inputValue, setInputValue] = useState("");
  const [checkState, setCheckState] = useState<CheckState>({ status: "idle" });
  const [currentStatus, setCurrentStatus] = useState<"PENDING" | "ACTIVE" | "FAILED" | null>(
    initialStatus
  );
  const [currentDomain, setCurrentDomain] = useState(initialDomain);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

  const [isPending, startTransition] = useTransition();
  const [isChecking, setIsChecking] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkIdRef = useRef(0);

  // Debounced domain availability check
  useEffect(() => {
    const val = inputValue.trim();
    if (!val) {
      setCheckState({ status: "idle" });
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    setCheckState({ status: "checking" });

    debounceRef.current = setTimeout(async () => {
      const id = ++checkIdRef.current;
      setIsChecking(true);
      const result = await checkDomainAvailabilityAction(val);
      if (checkIdRef.current !== id) return;
      setIsChecking(false);
      setCheckState(result);
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue]);

  function handleConnect() {
    if (checkState.status !== "valid") return;
    setDomain(inputValue.trim().toLowerCase());
    setStep("instructions");
  }

  function handleSaveDomain() {
    startTransition(async () => {
      const result = await connectCustomDomainAction(domain);
      if (result.success) {
        toast.success(result.message);
        setCurrentDomain(domain);
        setCurrentStatus("PENDING");
        setStep("connected");
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleDisconnect() {
    startTransition(async () => {
      const result = await disconnectCustomDomainAction();
      if (result.success) {
        toast.success(result.message);
        setCurrentDomain(null);
        setCurrentStatus(null);
        setDomain("");
        setInputValue("");
        setCheckState({ status: "idle" });
        setStep("idle");
      } else {
        toast.error(result.message);
      }
      setShowDisconnectDialog(false);
    });
  }

  function handleRefreshStatus() {
    setIsRefreshing(true);
    startTransition(async () => {
      const result = await getDomainStatusAction();
      setIsRefreshing(false);
      if (result) {
        setCurrentStatus(result.customDomainStatus);
        setCurrentDomain(result.customDomain);
        toast.info("تم تحديث الحالة");
      }
    });
  }

  // ── IDLE: no domain connected ─────────────────────────────────────────────
  if (step === "idle") {
    return (
      <div className="space-y-6">
        <Card className="border-dashed border-2 border-border/50">
          <CardContent className="flex flex-col items-center justify-center gap-5 py-14 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Globe className="size-8" />
            </div>
            <div className="space-y-2 max-w-sm">
              <h2 className="text-xl font-semibold">لا يوجد نطاق مربوط</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                اربط نطاقك الخاص بمتجرك وقدّم تجربة احترافية لعملائك مثل{" "}
                <span className="font-mono text-foreground">mystore.com</span>
              </p>
            </div>
            <Button
              onClick={() => setStep("enter")}
              className="rounded-xl gap-2"
              size="lg"
            >
              <Globe className="size-4" />
              ربط نطاق خاص
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: Globe, color: "text-blue-600 bg-blue-500/10", title: "نطاق خاص", desc: "أضف نطاقك الشخصي مثل mystore.com" },
            { icon: CheckCircle2, color: "text-emerald-600 bg-emerald-500/10", title: "ثقة أعلى", desc: "نطاقك الخاص يبني ثقة أكبر مع العملاء" },
            { icon: RefreshCw, color: "text-purple-600 bg-purple-500/10", title: "توجيه تلقائي", desc: "كل الزيارات تُوجَّه لمتجرك تلقائياً" },
          ].map(({ icon: Icon, color, title, desc }) => (
            <Card key={title} className="border-border/60 shadow-sm">
              <CardContent className="p-5">
                <div className={cn("mb-3 flex size-10 items-center justify-center rounded-xl", color)}>
                  <Icon className="size-5" />
                </div>
                <p className="font-semibold text-sm">{title}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ── ENTER: input domain ────────────────────────────────────────────────────
  if (step === "enter") {
    return (
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={() => setStep("idle")} className="hover:text-foreground transition-colors">
            النطاق الخاص
          </button>
          <ChevronRight className="size-4 rotate-180" />
          <span className="text-foreground font-medium">إضافة نطاق</span>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="size-5 text-primary" />
              أدخل النطاق
            </CardTitle>
            <CardDescription>
              أدخل النطاق الذي تريد ربطه بمتجرك (مثال: mystore.com أو www.mystore.com)
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Input
                  dir="ltr"
                  placeholder="mystore.com"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value.trim().toLowerCase())}
                  className={cn(
                    "rounded-xl font-mono text-sm pe-10 h-12",
                    checkState.status === "valid" && "border-emerald-500 focus-visible:ring-emerald-500",
                    (checkState.status === "invalid" || checkState.status === "taken") &&
                      "border-rose-500 focus-visible:ring-rose-500"
                  )}
                />
                <div className="absolute inset-y-0 end-3 flex items-center pointer-events-none">
                  {(isChecking || checkState.status === "checking") && (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  )}
                  {checkState.status === "valid" && (
                    <CheckCircle2 className="size-4 text-emerald-600" />
                  )}
                  {(checkState.status === "invalid" || checkState.status === "taken") && (
                    <XCircle className="size-4 text-rose-600" />
                  )}
                </div>
              </div>

              {/* Feedback messages */}
              {checkState.status === "valid" && (
                <p className="flex items-center gap-1.5 text-sm text-emerald-600">
                  <CheckCircle2 className="size-3.5" />
                  النطاق متاح ويمكن ربطه
                </p>
              )}
              {checkState.status === "invalid" && (
                <p className="flex items-center gap-1.5 text-sm text-rose-600">
                  <AlertCircle className="size-3.5" />
                  {checkState.reason}
                </p>
              )}
              {checkState.status === "taken" && (
                <p className="flex items-center gap-1.5 text-sm text-rose-600">
                  <AlertCircle className="size-3.5" />
                  هذا النطاق مستخدم بالفعل من متجر آخر على كاشو
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setStep("idle")}
                className="rounded-xl gap-2"
              >
                <ArrowRight className="size-4" />
                رجوع
              </Button>
              <Button
                onClick={handleConnect}
                disabled={checkState.status !== "valid"}
                className="rounded-xl gap-2"
              >
                متابعة
                <ChevronRight className="size-4 rotate-180" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── INSTRUCTIONS: DNS setup guide ──────────────────────────────────────────
  if (step === "instructions") {
    return (
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={() => setStep("idle")} className="hover:text-foreground transition-colors">
            النطاق الخاص
          </button>
          <ChevronRight className="size-4 rotate-180" />
          <button onClick={() => setStep("enter")} className="hover:text-foreground transition-colors">
            إضافة نطاق
          </button>
          <ChevronRight className="size-4 rotate-180" />
          <span className="text-foreground font-medium">إعداد DNS</span>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="size-5 text-primary" />
                  إعداد سجلات DNS
                </CardTitle>
                <CardDescription className="mt-1">
                  النطاق:{" "}
                  <span dir="ltr" className="font-mono text-foreground font-medium">
                    {domain}
                  </span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <DnsInstructionsCard domain={domain} />

            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setStep("enter")}
                className="rounded-xl gap-2"
              >
                <ArrowRight className="size-4" />
                رجوع
              </Button>
              <Button
                onClick={handleSaveDomain}
                disabled={isPending}
                className="rounded-xl gap-2"
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                حفظ وتفعيل النطاق
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── CONNECTED: domain is saved ─────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Status hero */}
      <Card
        className={cn(
          "border-border/60 shadow-sm",
          currentStatus === "ACTIVE" && "border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20",
          currentStatus === "FAILED" && "border-rose-200 bg-rose-50/40 dark:bg-rose-950/20",
          currentStatus === "PENDING" && "border-amber-200 bg-amber-50/40 dark:bg-amber-950/20"
        )}
      >
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-2xl",
                  currentStatus === "ACTIVE" && "bg-emerald-500/10 text-emerald-600",
                  currentStatus === "FAILED" && "bg-rose-500/10 text-rose-600",
                  currentStatus === "PENDING" && "bg-amber-500/10 text-amber-600"
                )}
              >
                {currentStatus === "ACTIVE" && <CheckCircle2 className="size-6" />}
                {currentStatus === "FAILED" && <XCircle className="size-6" />}
                {currentStatus === "PENDING" && <Clock3 className="size-6" />}
              </div>
              <div>
                <div dir="ltr" className="font-mono text-lg font-semibold tracking-tight">
                  {currentDomain}
                </div>
                <div className="mt-1">
                  <StatusBadge status={currentStatus} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {currentStatus === "ACTIVE" && (
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="rounded-xl gap-1.5"
                >
                  <a href={`https://${currentDomain}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-3.5" />
                    فتح المتجر
                  </a>
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl gap-1.5"
                onClick={handleRefreshStatus}
                disabled={isRefreshing || isPending}
              >
                <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
                تحديث الحالة
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                onClick={() => setShowDisconnectDialog(true)}
              >
                <Unlink className="size-3.5" />
                إلغاء الربط
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DNS instructions if still pending */}
      {currentStatus === "PENDING" && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">في انتظار التحقق</CardTitle>
            <CardDescription>
              تأكد من إضافة سجل DNS في لوحة تحكم مزوّد نطاقك. بعد الإضافة، هنتحقق تلقائياً.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DnsInstructionsCard domain={currentDomain ?? ""} />
          </CardContent>
        </Card>
      )}

      {/* Change domain */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">تغيير النطاق</CardTitle>
          <CardDescription>هل تريد ربط نطاق مختلف؟</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="rounded-xl gap-2"
            onClick={() => {
              setInputValue("");
              setCheckState({ status: "idle" });
              setStep("enter");
            }}
          >
            <Globe className="size-4" />
            ربط نطاق جديد
          </Button>
        </CardContent>
      </Card>

      {/* Info card */}
      <Card className="border-border/60 shadow-sm bg-primary/5">
        <CardContent className="p-5">
          <div className="flex items-start gap-3 text-sm">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" />
            <div className="space-y-1 text-muted-foreground leading-6">
              <p>
                متجرك لا يزال متاحاً عبر:{" "}
                <a
                  dir="ltr"
                  className="font-mono text-foreground hover:underline"
                  href={`https://${storeSlug}.${ROOT_DOMAIN}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {storeSlug}.{ROOT_DOMAIN}
                </a>
              </p>
              <p>النطاق المخصص يعمل كنطاق إضافي ولا يلغي الرابط الأصلي.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disconnect dialog */}
      <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Unlink className="size-5 text-rose-600" />
              إلغاء ربط النطاق
            </DialogTitle>
            <DialogDescription>
              هل أنت متأكد من إلغاء ربط{" "}
              <span dir="ltr" className="font-mono font-medium text-foreground">
                {currentDomain}
              </span>
              ؟ سيتوقف التوجيه عبر هذا النطاق فوراً.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowDisconnectDialog(false)}
              className="rounded-xl"
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              disabled={isPending}
              className="rounded-xl gap-2"
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Unlink className="size-4" />}
              إلغاء الربط
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
