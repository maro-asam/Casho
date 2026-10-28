"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bot, Check, Copy, Loader2, MessageCircle, PhoneCall, RefreshCw, Send, Truck, Undo2 } from "lucide-react";
import { toast } from "sonner";

import {
  RegenerateConfirmItCallbackAction,
  SaveConfirmItAction,
  TestConfirmItAction,
  ToggleConfirmItAction,
  UninstallConfirmItAction,
} from "@/actions/apps/confirm-it.actions";
import { Card, Row, Rows, StatusText, appleButton } from "@/components/saas-page";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { lazyIntl, tdir, tr, trv } from "@/lib/i18n/dashboard";

export type InstalledConfirmIt = {
  isActive: boolean;
  webhookUrl: string;
  codOnly: boolean;
  apiKeyHint: string | null;
  callbackUrl: string | null;
  lastSyncAt: string | null;
  lastError: string | null;
};

const dateTime = lazyIntl.date({ dateStyle: "medium", timeStyle: "short" });

const FEATURES = [
  { icon: MessageCircle, get title() { return tr("رسالة تأكيد على واتساب"); }, get text() { return tr("كل طلب جديد بيوصل العميل رسالة باسمه وتفاصيل طلبه يأكد أو يلغي بضغطة."); } },
  { icon: PhoneCall, get title() { return tr("مكالمة لو مردّش"); }, get text() { return tr("لو العميل ماقراش الرسالة، Confirm It بيكلمه بصوت AI طبيعي."); } },
  { icon: Undo2, get title() { return tr("متابعة الإلغاء"); }, get text() { return tr("لو لغى، بيسأله عن السبب — والسبب بيوصلك على الطلب هنا."); } },
  { icon: Truck, get title() { return tr("شحن تلقائي"); }, get text() { return tr("بعد التأكيد يقدر يعمل الشحنة عند Bosta وAramex وغيرهم من لوحته."); } },
];

const STEPS = [
  () => tr("اعمل حساب على Confirm It واختار ربط «موقع مخصص (Custom site)»."),
  () => tr("انسخ رابط الـ Webhook (والمفتاح لو موجود) من لوحة Confirm It وحطهم هنا، ودوس تثبيت."),
  () => tr("انسخ «رابط الرد» اللي هيظهر هنا وحطه في Confirm It، عشان التأكيد أو الإلغاء يتسجل على الطلب عندك."),
  () => tr("دوس «إرسال طلب تجريبي» واتأكد إنه وصل لوحة Confirm It."),
];

export default function ConfirmItClient({ installed }: { installed: InstalledConfirmIt | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [codOnly, setCodOnly] = useState(installed?.codOnly ?? true);
  const [confirmUninstall, setConfirmUninstall] = useState(false);
  const [copied, setCopied] = useState(false);

  function run(key: string, action: () => Promise<{ success: boolean; message: string }>, after?: () => void) {
    setBusy(key);
    startTransition(async () => {
      const res = await action();
      if (res.success) {
        toast.success(trv(res.message));
        after?.();
        router.refresh();
      } else {
        toast.error(trv(res.message));
      }
      setBusy(null);
    });
  }

  function save(formData: FormData) {
    if (codOnly) formData.set("codOnly", "on");
    run("save", () => SaveConfirmItAction(formData));
  }

  async function copyCallback() {
    if (!installed?.callbackUrl) return;
    await navigator.clipboard.writeText(installed.callbackUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const spinner = (key: string) => busy === key && <Loader2 className="size-4 animate-spin" />;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-6">
        {installed && (
          <Card
            title={tr("الحالة")}
            action={
              <Switch
                checked={installed.isActive}
                disabled={pending}
                onCheckedChange={(on) => run("toggle", () => ToggleConfirmItAction(on))}
                aria-label={tr("تشغيل Confirm It")}
              />
            }
          >
            <Rows>
              <Row label={tr("الطلبات الجديدة")}>
                {installed.isActive ? tr("بتتبعت لـ Confirm It أول ما توصل") : tr("متوقفة — مش بتتبعت")}
              </Row>
              <Row label={tr("آخر تواصل")}>{installed.lastSyncAt ? dateTime.format(new Date(installed.lastSyncAt)) : tr("لسه")}</Row>
              {installed.lastError && (
                <Row label={tr("آخر خطأ")}>
                  <StatusText tone="danger" className="whitespace-normal text-start" >
                    <span dir="ltr" className="break-all">{installed.lastError}</span>
                  </StatusText>
                </Row>
              )}
            </Rows>
            <div className="flex flex-wrap gap-2 px-5 pb-5">
              <button type="button" disabled={pending} onClick={() => run("test", TestConfirmItAction)} className={appleButton.tinted}>
                {spinner("test") || <Send className="size-4" />}
                {tr("إرسال طلب تجريبي")}
              </button>
            </div>
          </Card>
        )}

        <Card
          title={installed ? tr("إعدادات الربط") : tr("ثبّت Confirm It على متجرك")}
          subtitle={tr("البيانات دي من لوحة تحكم Confirm It — صفحة ربط الموقع المخصص.")}
        >
          <form action={save} className="space-y-5 px-5 pb-5">
            <div className="space-y-2">
              <Label htmlFor="ci-webhook">{tr("رابط الـ Webhook")}</Label>
              <Input
                id="ci-webhook"
                name="webhookUrl"
                type="url"
                required
                dir="ltr"
                inputMode="url"
                placeholder="https://…"
                defaultValue={installed?.webhookUrl ?? ""}
                className="h-11 rounded-[12px]"
              />
              <p className="text-[13px] text-muted-foreground">{tr("كل طلب جديد بيتبعت على الرابط ده.")}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ci-key">
                {tr("مفتاح API")} <span className="font-normal text-muted-foreground">{tr("(اختياري)")}</span>
              </Label>
              <Input
                id="ci-key"
                name="apiKey"
                type="password"
                dir="ltr"
                autoComplete="off"
                placeholder={installed?.apiKeyHint ? tr("محفوظ {0} — سيبه فاضي عشان يفضل زي ما هو", installed.apiKeyHint) : ""}
                className="h-11 rounded-[12px]"
              />
            </div>

            <label className="flex items-start justify-between gap-4 rounded-[12px] bg-(--fill-3) px-4 py-3">
              <span className="space-y-0.5">
                <span className="block text-[15px]">{tr("طلبات الدفع عند الاستلام بس")}</span>
                <span className="block text-[13px] text-muted-foreground">
                  {tr("الطلبات المدفوعة أونلاين مش محتاجة تأكيد. اقفلها لو عايز كل الطلبات تتبعت.")}
                </span>
              </span>
              <Switch checked={codOnly} onCheckedChange={setCodOnly} aria-label={tr("طلبات الدفع عند الاستلام بس")} />
            </label>

            <button type="submit" disabled={pending} className={appleButton.filled}>
              {spinner("save")}
              {installed ? tr("حفظ") : tr("تثبيت")}
            </button>
          </form>
        </Card>

        {installed?.callbackUrl && (
          <Card
            title={tr("رابط الرد (Callback)")}
            subtitle={tr("حطه في Confirm It: لما العميل يأكد أو يلغي، الطلب بيتحدث عندك هنا لوحده وبيوصلك إشعار.")}
          >
            <div className="space-y-3 px-5 pb-5">
              <div className="flex items-center gap-2 rounded-[12px] bg-(--fill-3) p-1.5 ps-3">
                <code dir="ltr" className="min-w-0 flex-1 truncate text-[13px]">
                  {installed.callbackUrl}
                </code>
                <button type="button" onClick={copyCallback} className={cn(appleButton.tinted, "bg-card")}>
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {copied ? tr("اتنسخ") : tr("نسخ")}
                </button>
              </div>
              <p className="text-[13px] leading-[18px] text-muted-foreground" dir="ltr">
                POST {"{"} &quot;order_id&quot;: &quot;…&quot;, &quot;status&quot;: &quot;confirmed&quot; | &quot;cancelled&quot;, &quot;reason&quot;: &quot;…&quot; {"}"}
              </p>
              <button
                type="button"
                disabled={pending}
                onClick={() => run("regen", RegenerateConfirmItCallbackAction)}
                className={appleButton.plain}
              >
                {spinner("regen") || <RefreshCw className="size-4" />}
                {tr("اعمل رابط جديد")}
              </button>
            </div>
          </Card>
        )}

        {installed && (
          <Card title={tr("إلغاء التثبيت")} subtitle={tr("الطلبات هتبطل تتبعت، ورابط الرد هيوقف. الطلبات اللي اتأكدت قبل كده مش بتتأثر.")}>
            <div className="px-5 pb-5">
              <button type="button" disabled={pending} onClick={() => setConfirmUninstall(true)} className={appleButton.destructive}>
                {tr("إلغاء تثبيت Confirm It")}
              </button>
            </div>
          </Card>
        )}
      </div>

      <aside className="space-y-6">
        <Card title={tr("بيعمل إيه؟")} icon={Bot}>
          <ul className="space-y-4 px-5 pb-5">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex gap-3">
                <f.icon className="mt-0.5 size-[18px] shrink-0 text-[#128C7E]" strokeWidth={1.8} />
                <div className="space-y-0.5">
                  <p className="text-[15px] font-semibold">{f.title}</p>
                  <p className="text-[13px] leading-[18px] text-muted-foreground">{f.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title={tr("خطوات الربط")}>
          <ol className="space-y-3 px-5 pb-5">
            {STEPS.map((step, i) => (
              <li key={i} className="flex gap-3 text-[13px] leading-[19px]">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-[12px] font-semibold text-primary">
                  {i + 1}
                </span>
                <span>{step()}</span>
              </li>
            ))}
          </ol>
          <p className="border-t-[0.5px] border-border px-5 py-3 text-[12px] leading-[17px] text-muted-foreground">
            {tr("وهو شغال، Casho مش بيبعت رسالة التأكيد بتاعته للطلبات اللي بتروح لـ Confirm It — عشان العميل مايوصلوش رسالتين.")}
          </p>
        </Card>
      </aside>

      <AlertDialog open={confirmUninstall} onOpenChange={(open) => !pending && setConfirmUninstall(open)}>
        <AlertDialogContent dir={tdir()} className="rounded-[22px]">
          <AlertDialogHeader>
            <AlertDialogTitle>{tr("تلغي تثبيت Confirm It؟")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tr("الإعدادات ورابط الرد هيتمسحوا. لو رجعت ثبته تاني هتحتاج تحط الرابط الجديد في Confirm It.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending} className="rounded-full">
              {tr("رجوع")}
            </AlertDialogCancel>
            <button
              type="button"
              disabled={pending}
              onClick={() => run("uninstall", UninstallConfirmItAction, () => setConfirmUninstall(false))}
              className={appleButton.destructiveFilled}
            >
              {spinner("uninstall")}
              {tr("إلغاء التثبيت")}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
