"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Loader2, Minus, Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { createApiKey } from "@/actions/api-keys/manage.actions";
import { Card, LargeTitle, SegmentedButtons, appleButton } from "@/components/saas-page";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { SCOPE_GROUPS, scopeSummary, scopesFrom, type Access } from "../_lib/scopes";
import { KeyReveal } from "./key-reveal";
import { tr } from "@/lib/i18n/dashboard";

const BASE_PATH = "/api-keys";
const IP_RE = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$|^[0-9a-f:]+(\/\d{1,3})?$/i;

export function CreateKeyForm({ storeId, baseUrl }: { storeId: string; baseUrl: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [fullAccess, setFullAccess] = useState(false);
  const [access, setAccess] = useState<Record<string, Access>>({ orders: "read", products: "read" });
  const [ips, setIps] = useState<string[]>([]);
  const [ipDraft, setIpDraft] = useState("");
  const [created, setCreated] = useState<{ key: string; name: string } | null>(null);

  const scopes = fullAccess ? [] : scopesFrom(access);
  const ipValid = IP_RE.test(ipDraft.trim());

  function addIp() {
    const ip = ipDraft.trim();
    if (!IP_RE.test(ip)) return;
    if (!ips.includes(ip)) setIps((list) => [...list, ip]);
    setIpDraft("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(tr("الرجاء إدخال اسم للمفتاح"));
      return;
    }
    if (!fullAccess && scopes.length === 0) {
      toast.error(tr("اختار صلاحية واحدة على الأقل"));
      return;
    }
    if (ipDraft.trim() && !ipValid) {
      toast.error(tr("ده مش عنوان IP صحيح."));
      return;
    }
    // A typed-but-not-added address still counts.
    const allowed = ipValid && !ips.includes(ipDraft.trim()) ? [...ips, ipDraft.trim()] : ips;
    startTransition(async () => {
      try {
        const { key } = await createApiKey(storeId, name.trim(), scopes, allowed);
        setCreated({ key, name: name.trim() });
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : tr("حدث خطأ"));
      }
    });
  }

  const back = (
    <Link
      href={BASE_PATH}
      className="apple-press -ms-1.5 mb-1 inline-flex h-8 items-center gap-0.5 rounded-full pe-2.5 ps-1 text-[15px] text-primary hover:bg-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ChevronRight className="size-5 ltr:-scale-x-100" strokeWidth={2.2} />
      {tr("مفاتيح API")}
    </Link>
  );

  // One-time reveal replaces the form: the raw key never leaves this screen.
  if (created) {
    return (
      <div className="mx-auto max-w-xl space-y-6 pt-4">
        <div className="apple-card p-6 sm:p-8">
          <KeyReveal rawKey={created.key} name={created.name} baseUrl={baseUrl} />
        </div>
        <Link href={BASE_PATH} className={cn(appleButton.filled, "h-[50px] w-full text-[17px]")}>
          {tr("نسخته، تمام")}
        </Link>
      </div>
    );
  }

  const rowCls = "flex min-h-11 items-center gap-3 px-4";
  const group = "apple-rows overflow-hidden rounded-[14px] bg-(--fill-3)/50 [--row-inset:16px]";

  return (
    <form onSubmit={submit} className="apple-form min-w-0 space-y-6">
      <LargeTitle
        eyebrow={back}
        title={<span className="line-clamp-2 break-words">{name.trim() || tr("مفتاح جديد")}</span>}
        subtitle={tr("المفتاح هيظهر مرة واحدة بس بعد ما تعمله — احتفظ بيه في مكان آمن.")}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card title={tr("الاسم")} subtitle={tr("عشان تعرف المفتاح ده بتاع أنهي نظام.")}>
            <div className="px-5 pb-5">
              <label htmlFor="key-name" className={cn(rowCls, "rounded-[14px] bg-(--fill-3)/50")}>
                <span className="shrink-0 text-[15px]">{tr("اسم المفتاح")}</span>
                <input
                  id="key-name"
                  value={name}
                  maxLength={60}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={tr("مثال: نظام ERP الخارجي")}
                  autoComplete="off"
                  className="h-11 min-w-0 flex-1 bg-transparent text-end text-[15px] outline-none placeholder:text-(--label-3)"
                />
              </label>
            </div>
          </Card>

          <Card title={tr("الصلاحيات")} subtitle={tr("ادّي المفتاح أقل حاجة يحتاجها النظام — تقدر تعمل مفتاح تاني لنظام تاني.")}>
            <div className="space-y-3 px-5 pb-5">
              <div className={group}>
                <label className={cn(rowCls, "cursor-pointer py-2")}>
                  <span className="flex-1">
                    <span className="block text-[15px]">{tr("كل الصلاحيات")}</span>
                    <span className="block text-[12px] text-muted-foreground">{tr("وأي صلاحية هنضيفها بعدين. مش مستحسن للأنظمة الخارجية.")}</span>
                  </span>
                  <Switch checked={fullAccess} onCheckedChange={setFullAccess} className="apple-switch" />
                </label>
                {!fullAccess &&
                  SCOPE_GROUPS.map((g) => (
                    <div key={g.key} className={cn(rowCls, "justify-between py-1.5")}>
                      <span className="text-[15px]">{g.label}</span>
                      <SegmentedButtons
                        label={g.label}
                        value={access[g.key] ?? "none"}
                        onChange={(v) => setAccess((a) => ({ ...a, [g.key]: v }))}
                        options={[
                          ["none", tr("بدون")],
                          ["read", tr("قراءة")],
                          ...(g.write ? ([["write", tr("قراءة وكتابة")]] as const) : []),
                        ]}
                      />
                    </div>
                  ))}
              </div>
            </div>
          </Card>

          <Card title={tr("عناوين IP المسموحة")} subtitle={tr("اختياري — لو ضفت عناوين، المفتاح هيشتغل منها بس.")}>
            <div className="space-y-2 px-5 pb-5">
              <div className={group}>
                {ips.map((ip) => (
                  <div key={ip} className={cn(rowCls)}>
                    <button
                      type="button"
                      aria-label={tr("شيل {0}", ip)}
                      onClick={() => setIps((list) => list.filter((x) => x !== ip))}
                      className="apple-press grid size-[22px] shrink-0 place-items-center rounded-full bg-(--sys-red) text-white"
                    >
                      <Minus className="size-3.5" strokeWidth={3} />
                    </button>
                    <code dir="ltr" className="flex-1 font-mono text-[15px] rtl:text-right">
                      {ip}
                    </code>
                  </div>
                ))}
                <div className={rowCls}>
                  <button
                    type="button"
                    onClick={addIp}
                    disabled={!ipValid}
                    aria-label={tr("ضيف العنوان")}
                    className="apple-press grid size-[22px] shrink-0 place-items-center rounded-full bg-(--sys-green) text-white disabled:opacity-40"
                  >
                    <Plus className="size-3.5" strokeWidth={3} />
                  </button>
                  <input
                    dir="ltr"
                    value={ipDraft}
                    onChange={(e) => setIpDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addIp();
                      }
                    }}
                    placeholder="203.0.113.10"
                    aria-label={tr("عنوان IP")}
                    autoComplete="off"
                    className="h-11 min-w-0 flex-1 bg-transparent font-mono text-[15px] outline-none placeholder:text-(--label-3) rtl:text-right"
                  />
                </div>
              </div>
              <p className="px-4 text-[13px] text-muted-foreground">
                {ipDraft.trim() && !ipValid ? tr("ده مش عنوان IP صحيح.") : tr("سيبها فاضية عشان يشتغل من أي مكان.")}
              </p>
            </div>
          </Card>
        </div>

        <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <Card title={tr("الملخص")}>
            <div className="space-y-3 px-5 pb-5">
              <div className="flex items-start gap-3 rounded-2xl bg-(--fill-3)/60 p-4">
                <span className="grid size-7 shrink-0 place-items-center rounded-[7px] bg-(--sys-green) text-white">
                  <ShieldCheck className="size-4" />
                </span>
                <div className="min-w-0 space-y-1 text-[13px] leading-[18px]">
                  <p className="text-[15px] font-medium">{name.trim() || tr("مفتاح جديد")}</p>
                  <p className="text-muted-foreground">{scopes.length || fullAccess ? scopeSummary(scopes) : tr("مفيش صلاحيات لسه")}</p>
                  <p className="text-muted-foreground">
                    {ips.length ? tr("من {0} عنوان بس", ips.length) : tr("من أي عنوان IP")}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="pointer-events-none sticky bottom-4 z-20 flex justify-center pb-[env(safe-area-inset-bottom)]">
        <div className="apple-glass pointer-events-auto flex items-center gap-1 rounded-full p-1.5">
          <Link href={BASE_PATH} className={cn(appleButton.plain, "mx-0 h-10 px-4")}>
            {tr("إلغاء")}
          </Link>
          <button type="submit" disabled={pending} className={cn(appleButton.filled, "h-10")}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {tr("إنشاء المفتاح")}
          </button>
        </div>
      </div>
    </form>
  );
}
