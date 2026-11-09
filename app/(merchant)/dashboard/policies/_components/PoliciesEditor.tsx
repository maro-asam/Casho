"use client";

import { useId, useState, useTransition } from "react";
import { ChevronDown, ExternalLink, Loader2, RotateCcw, Scale, ShieldCheck, Truck, Undo2 } from "lucide-react";
import { toast } from "sonner";

import {
  ResetStorePolicyAction,
  SaveStorePolicyAction,
  SetRequireTermsAtCheckoutAction,
  SetStorePolicyVisibilityAction,
} from "@/actions/store/policies.actions";
import { appleButton } from "@/components/saas-page";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { dateTimeFormat, numberFormat, tdir, tr, trv } from "@/lib/i18n/dashboard";
import { POLICY_MAX_LENGTH, type PolicyType } from "@/lib/store-policies";
import { cn } from "@/lib/utils";
import { Group, IconTile } from "../../settings/_components/settings-ui";

export type EditablePolicy = {
  type: PolicyType;
  /** What the storefront shows now: the merchant's text, or the filled-in template. */
  body: string;
  isTemplate: boolean;
  hidden: boolean;
  updatedAt: string | null;
  /** The ready-made text for this store, for "restore". */
  template: string;
  /** The page on the storefront. */
  url: string;
};

function policyMeta(type: PolicyType) {
  switch (type) {
    case "returns":
      return {
        title: tr("سياسة الاسترجاع والاستبدال"),
        hint: tr("مدة الإرجاع وشروطه، مين يدفع الشحن، وإمتى العميل يسترد فلوسه."),
        icon: Undo2,
        tint: "bg-(--sys-orange)",
      };
    case "shipping":
      return {
        title: tr("سياسة الشحن والتوصيل"),
        hint: tr("المحافظات اللي بتوصلها، مدة التوصيل، وتكلفة الشحن."),
        icon: Truck,
        tint: "bg-sky-500",
      };
    case "privacy":
      return {
        title: tr("سياسة الخصوصية"),
        hint: tr("البيانات اللي بتجمعها من العملاء، وبتستخدمها في إيه، ومين بيشوفها."),
        icon: ShieldCheck,
        tint: "bg-(--sys-green)",
      };
    case "terms":
      return {
        title: tr("الشروط والأحكام"),
        hint: tr("قواعد الطلب والدفع والإلغاء في متجرك."),
        icon: Scale,
        tint: "bg-(--sys-indigo)",
      };
  }
}

/** The four legal pages (edit, show/hide, restore the template) + the checkout consent switch. */
export default function PoliciesEditor({
  policies: initial,
  requireTermsAtCheckout,
}: {
  policies: EditablePolicy[];
  requireTermsAtCheckout: boolean;
}) {
  const [policies, setPolicies] = useState(initial);
  const [requireTerms, setRequireTerms] = useState(requireTermsAtCheckout);
  const [consentPending, startConsent] = useTransition();

  const patch = (type: PolicyType, next: Partial<EditablePolicy>) =>
    setPolicies((list) => list.map((p) => (p.type === type ? { ...p, ...next } : p)));

  // Consent needs a page to agree to: the terms or the return policy.
  const consentPages = policies.filter((p) => (p.type === "terms" || p.type === "returns") && !p.hidden);

  function toggleConsent(next: boolean) {
    setRequireTerms(next);
    startConsent(async () => {
      const result = await SetRequireTermsAtCheckoutAction(next);
      if (!result.ok) {
        setRequireTerms(!next);
        toast.error(trv(result.message));
        return;
      }
      toast.success(trv(result.message));
    });
  }

  return (
    <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0 space-y-8">
        <Group
          id="pages"
          title={tr("صفحات السياسات")}
          inset={58}
          footer={tr("الصفحات الظاهرة ليها لينكات في فوتر متجرك وفي خريطة الموقع لجوجل. اضغط على أي صفحة عشان تعدّلها.")}
        >
          {policies.map((policy) => (
            <PolicyRow key={policy.type} policy={policy} onChange={(next) => patch(policy.type, next)} />
          ))}
        </Group>

        <Group
          id="checkout-consent"
          title={tr("صفحة إتمام الطلب")}
          footer={
            consentPages.length === 0
              ? tr("اظهر الشروط والأحكام أو سياسة الاسترجاع الأول عشان تقدر تطلب الموافقة عليها.")
              : tr("لو مقفول، بيظهر سطر صغير قبل زرار الطلب إن تأكيد الطلب معناه الموافقة على الشروط.")
          }
        >
          <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4 px-4 py-3">
            <span className="min-w-0">
              <span className="block text-[15px]">{tr("العميل لازم يوافق على الشروط قبل الطلب")}</span>
              <span className="block text-[13px] leading-5 text-muted-foreground">
                {tr("مربع \"قرأت وأوافق\" قبل زرار تأكيد الطلب، والطلب مش بيكمل من غيره. وقت الموافقة بيتسجل على الطلب.")}
              </span>
            </span>
            <Switch
              checked={requireTerms && consentPages.length > 0}
              onCheckedChange={toggleConsent}
              disabled={consentPending || consentPages.length === 0}
              aria-label={tr("العميل لازم يوافق على الشروط قبل الطلب")}
              className="apple-switch shrink-0"
            />
          </label>
        </Group>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-20">
        <section className="apple-card space-y-3 rounded-[14px] p-4">
          <h2 className="text-[15px] font-semibold">{tr("ليه الصفحات دي مهمة؟")}</h2>
          <ul className="space-y-2 text-[13px] leading-5 text-muted-foreground">
            <li>{tr("بوابات الدفع زي Paymob ومنصات الإعلانات زي Google و Meta بتطلبها في المتجر.")}</li>
            <li>{tr("بتطمّن العميل قبل ما يطلب، خصوصًا أول مرة.")}</li>
            <li>{tr("بتحميك لو حصل خلاف على مرتجع أو استرداد.")}</li>
          </ul>
        </section>

        <section className="apple-card space-y-3 rounded-[14px] p-4">
          <h2 className="text-[15px] font-semibold">{tr("إزاي تكتب الصفحة")}</h2>
          <dl className="space-y-2 text-[13px] leading-5">
            <div className="flex gap-3">
              <dt className="w-6 shrink-0 font-mono font-semibold" dir="ltr">#</dt>
              <dd className="text-muted-foreground">{tr("في أول السطر: عنوان قسم")}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-6 shrink-0 font-mono font-semibold" dir="ltr">-</dt>
              <dd className="text-muted-foreground">{tr("في أول السطر: نقطة في قائمة")}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-6 shrink-0 font-mono font-semibold" dir="ltr">↵</dt>
              <dd className="text-muted-foreground">{tr("سطر فاضي: فقرة جديدة")}</dd>
            </div>
          </dl>
        </section>

        <p className="px-4 text-[13px] leading-[18px] text-muted-foreground">
          {tr("النص الجاهز مكتوب على أساس قانون حماية المستهلك رقم 181 لسنة 2018 وقانون حماية البيانات الشخصية رقم 151 لسنة 2020، وبيتملي ببيانات متجرك لوحده. هو نقطة بداية مش استشارة قانونية: راجعه، وعدّل أي حاجة مختلفة عندك زي مدة الإرجاع أو مدة التوصيل.")}
        </p>
      </aside>
    </div>
  );
}

function PolicyRow({ policy, onChange }: { policy: EditablePolicy; onChange: (next: Partial<EditablePolicy>) => void }) {
  const meta = policyMeta(policy.type);
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(policy.body);
  const [confirmReset, setConfirmReset] = useState(false);
  const [saving, startSave] = useTransition();
  const [toggling, startToggle] = useTransition();

  const dirty = draft.trim() !== policy.body.trim();
  const status = policy.hidden
    ? tr("مخفية من المتجر")
    : policy.isTemplate
      ? tr("النص الجاهز")
      : policy.updatedAt
        ? tr("نصك أنت · اتعدّلت {0}", dateTimeFormat({ day: "numeric", month: "short", year: "numeric" }).format(new Date(policy.updatedAt)))
        : tr("نصك أنت");

  function toggleVisible(visible: boolean) {
    onChange({ hidden: !visible });
    startToggle(async () => {
      const result = await SetStorePolicyVisibilityAction(policy.type, visible);
      if (!result.ok) {
        onChange({ hidden: visible });
        toast.error(trv(result.message));
        return;
      }
      toast.success(trv(result.message));
    });
  }

  function save() {
    startSave(async () => {
      const result = await SaveStorePolicyAction(policy.type, draft);
      if (!result.ok) {
        toast.error(trv(result.message));
        return;
      }
      const text = draft.trim();
      if (text) {
        onChange({ body: text, isTemplate: false, updatedAt: result.updatedAt ?? null });
        setDraft(text);
      } else {
        onChange({ body: policy.template, isTemplate: true, updatedAt: null });
        setDraft(policy.template);
      }
      toast.success(trv(result.message));
    });
  }

  function reset() {
    startSave(async () => {
      const result = await ResetStorePolicyAction(policy.type);
      if (!result.ok) {
        toast.error(trv(result.message));
        return;
      }
      onChange({ body: policy.template, isTemplate: true, updatedAt: null });
      setDraft(policy.template);
      setConfirmReset(false);
      toast.success(trv(result.message));
    });
  }

  return (
    <div>
      <div className="flex min-h-11 items-center gap-3 px-4 py-2.5">
        <IconTile icon={meta.icon} tint={meta.tint} />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex min-w-0 flex-1 items-center gap-3 text-start"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[15px]">{meta.title}</span>
            <span className={cn("block truncate text-[13px]", policy.hidden ? "text-(--sys-orange)" : "text-muted-foreground")}>
              {status}
            </span>
          </span>
          <ChevronDown aria-hidden className={cn("size-4 shrink-0 text-muted-foreground/60 transition-transform", open && "rotate-180")} />
        </button>
        <Switch
          checked={!policy.hidden}
          onCheckedChange={toggleVisible}
          disabled={toggling}
          aria-label={tr("إظهار {0} في المتجر", meta.title)}
          className="apple-switch shrink-0"
        />
      </div>

      {open && (
        <div id={panelId} className="space-y-3 px-4 pb-4 sm:ps-[58px]">
          <p className="text-[13px] leading-5 text-muted-foreground">{meta.hint}</p>
          <textarea
            dir="rtl"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={POLICY_MAX_LENGTH}
            rows={16}
            aria-label={meta.title}
            className="block min-h-72 w-full resize-y rounded-[12px] border border-border bg-background px-3.5 py-3 text-[15px] leading-7 font-light outline-none transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={save} disabled={!dirty || saving} className={cn(appleButton.filled, "h-9 px-4 disabled:opacity-50")}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {tr("حفظ")}
            </button>
            {dirty && (
              <button type="button" onClick={() => setDraft(policy.body)} disabled={saving} className={appleButton.tinted}>
                {tr("إلغاء التعديلات")}
              </button>
            )}
            {!policy.isTemplate && (
              <button type="button" onClick={() => setConfirmReset(true)} disabled={saving} className={appleButton.plain}>
                <RotateCcw className="size-4" />
                {tr("رجّع النص الجاهز")}
              </button>
            )}
            {!policy.hidden && (
              <a href={policy.url} target="_blank" rel="noreferrer" className={cn(appleButton.plain, "ms-auto")}>
                {tr("شوفها في المتجر")}
                <ExternalLink className="size-3.5" />
              </a>
            )}
          </div>
          <p className="text-[12px] tabular-nums text-muted-foreground">
            {tr("{0} من {1} حرف", numberFormat().format(draft.length), numberFormat().format(POLICY_MAX_LENGTH))}
          </p>
        </div>
      )}

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent dir={tdir()} className="rounded-[22px]">
          <AlertDialogHeader>
            <AlertDialogTitle>{tr("ترجّع النص الجاهز؟")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tr("نصك في \"{0}\" هيتمسح، والصفحة هتعرض النص الجاهز ببيانات متجرك.", meta.title)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving} className="rounded-full">
              {tr("رجوع")}
            </AlertDialogCancel>
            <button type="button" onClick={reset} disabled={saving} className={appleButton.destructiveFilled}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {tr("رجّع النص الجاهز")}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
