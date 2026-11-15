import Link from "next/link";
import { ChevronLeft, MessageCircle, Phone } from "lucide-react";
import { Dot, initialOf, type PillTone } from "@/components/saas-page";
import { ACTIVATION_LABELS, ACTIVATION_STEPS, type CallReason } from "@/lib/sales/call-list";
import type { CallListItem } from "@/lib/sales/call-list-queries";
import { fmtNum, fmtPounds, fmtWhen, whatsappLink } from "@/lib/sales/format";
import { cn } from "@/lib/utils";

/** Short names for the filter chips and the overview card. */
export const CALL_REASON_LABELS: Record<CallReason, string> = {
  TRIAL_ENDING: "تجربة بتخلص",
  STORE_CLOSED: "متجر اتقفل",
  NEW_SIGNUP: "تسجيل جديد",
  RENEWAL_AT_RISK: "تجديد في خطر",
  TRIAL_ENDED: "تجربة خلصت",
  STALLED: "واقف في التجهيز",
  NO_STORE: "من غير متجر",
};

const REASON_TONE: Record<CallReason, PillTone> = {
  TRIAL_ENDING: "warning",
  STORE_CLOSED: "danger",
  NEW_SIGNUP: "success",
  RENEWAL_AT_RISK: "warning",
  TRIAL_ENDED: "danger",
  STALLED: "info",
  NO_STORE: "neutral",
};

/** What the row says, and the WhatsApp opener that goes with it. */
function callCopy(item: CallListItem, repName: string, now: Date) {
  const { call, store, customer } = item;
  const first = customer.name?.trim().split(/\s+/)[0];
  const hi = `أهلًا${first ? ` ${first}` : ""}، معاك ${repName} من كاشو.`;
  const storeName = store ? `متجر ${store.name}` : "متجرك";
  const when = fmtWhen(call.at, now);
  const next = store?.activation.next;

  switch (call.reason) {
    case "NEW_SIGNUP":
      return {
        line: `سجّل ${when} — رحّب بيه`,
        message: `${hi} مبروك على ${storeName}! أنا المسؤول عن حسابك، ولو محتاج مساعدة في إضافة المنتجات أو تجهيز الدفع والشحن كلّمني في أي وقت.`,
      };
    case "TRIAL_ENDING":
      return {
        line: `التجربة بتخلص ${when}`,
        message: `${hi} تجربة ${storeName} بتخلص ${when}. لو حابب أساعدك تختار الباقة المناسبة وتشحن رصيدك عشان المتجر ميقفلش، أنا موجود.`,
      };
    case "TRIAL_ENDED":
      return {
        line: `التجربة خلصت ${when} ومدفعش`,
        message: `${hi} تجربة ${storeName} خلصت والمتجر واقف دلوقتي. لو عندك أي سؤال عن الباقات أو محتاج مساعدة ترجّعه يشتغل، كلّمني.`,
      };
    case "STORE_CLOSED":
      return {
        line: `المتجر اتقفل ${when} — الرصيد مكفاش التجديد`,
        message: `${hi} ${storeName} اتقفل مؤقتًا لأن الرصيد مكفاش التجديد. اشحن رصيدك ويرجع يستقبل طلبات على طول — ولو محتاج مساعدة في الشحن أنا موجود.`,
      };
    case "RENEWAL_AT_RISK":
      return call.autoRenewOff
        ? {
            line: `التجديد التلقائي مقفول — الاشتراك بيخلص ${when}`,
            message: `${hi} اشتراك ${storeName} بيخلص ${when} والتجديد التلقائي مقفول، فالمتجر هيقفل لو متجددش. لو محتاج مساعدة أنا موجود.`,
          }
        : {
            line: `التجديد ${when} والرصيد ناقص ${fmtPounds(call.shortfall ?? 0)}`,
            message: `${hi} اشتراك ${storeName} بيتجدد ${when} والرصيد ناقص ${fmtPounds(call.shortfall ?? 0)}. اشحن قبل الميعاد عشان المتجر ميقفلش.`,
          };
    case "STALLED":
      return {
        line: next ? `لسه محتاج ${ACTIVATION_LABELS[next].todo}` : "محتاج متابعة",
        message: `${hi} حبيت أطمن عليك وعلى ${storeName}${next ? ` — لو محتاج مساعدة ${ACTIVATION_LABELS[next].offer} أنا موجود` : ""}.`,
      };
    case "NO_STORE":
      return {
        line: `سجّل ${when} ومعملش متجر`,
        message: `${hi} شفت إنك سجّلت على كاشو بس لسه مكملتش المتجر. محتاج مساعدة نبدأ سوا؟`,
      };
  }
}

/** Four dots, one per setup step — filled when done. */
function ActivationDots({ steps }: { steps: Record<(typeof ACTIVATION_STEPS)[number], boolean> }) {
  const done = ACTIVATION_STEPS.filter((s) => steps[s]).length;
  return (
    <span className="inline-flex items-center gap-1.5" title={ACTIVATION_STEPS.map((s) => `${steps[s] ? "✓" : "○"} ${ACTIVATION_LABELS[s].done}`).join("\n")}>
      <span aria-hidden className="inline-flex gap-[3px]">
        {ACTIVATION_STEPS.map((s) => (
          <span key={s} className={cn("size-1.5 rounded-full", steps[s] ? "bg-(--sys-green)" : "bg-(--label-3)/60")} />
        ))}
      </span>
      <span className="font-normal">
        التجهيز {fmtNum(done)} من {fmtNum(ACTIVATION_STEPS.length)}
      </span>
    </span>
  );
}

const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

export function CallRows({ rows, repName, now = new Date() }: { rows: CallListItem[]; repName: string; now?: Date }) {
  return (
    <ul className="apple-rows pb-2 [--row-inset:72px]">
      {rows.map((item) => {
        const { customer, store, call } = item;
        const title = store?.name ?? customer.name ?? customer.email;
        const copy = callCopy(item, repName, now);
        const phone = customer.phone_number;
        return (
          <li key={item.id} className="relative flex items-center gap-3 px-5 py-3">
            <span
              aria-hidden
              className="grid size-10 shrink-0 place-items-center rounded-full bg-linear-to-b from-[#a1a1a6] to-[#8e8e93] text-[15px] font-semibold text-white"
            >
              {initialOf(title)}
            </span>
            <div className="min-w-0 flex-1">
              <Link
                href={`/sales/customers/${customer.id}`}
                className="block truncate text-[15px] font-semibold after:absolute after:inset-0 hover:underline"
              >
                {title}
              </Link>
              {/* The dot sits on the first line when the reason wraps on a phone. */}
              <p className="flex items-start gap-1.5 text-[13px] leading-[18px] text-foreground/80">
                <Dot tone={REASON_TONE[call.reason]} className="mt-[5px]" />
                {copy.line}
              </p>
              {store && !item.acquiredAt && (
                <p className="text-[12px] text-muted-foreground">
                  <ActivationDots steps={store.activation.steps} />
                </p>
              )}
            </div>
            {phone ? (
              <div className="relative z-10 flex shrink-0 items-center gap-1.5">
                <a
                  href={telHref(phone)}
                  aria-label={`اتصل بـ ${title}`}
                  className="apple-press grid size-9 place-items-center rounded-full bg-(--fill-3) text-foreground/80 hover:text-foreground"
                >
                  <Phone className="size-4" />
                </a>
                <a
                  href={whatsappLink(phone, copy.message)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`كلّم ${title} على واتساب`}
                  className="apple-press inline-flex h-9 items-center gap-1.5 rounded-full bg-(--sys-green)/12 px-3.5 text-[14px] font-semibold text-[#248a3d] hover:bg-(--sys-green)/18 dark:text-(--sys-green)"
                >
                  <MessageCircle className="size-4" />
                  <span className="hidden sm:inline">واتساب</span>
                </a>
              </div>
            ) : (
              <ChevronLeft aria-hidden className="size-4 shrink-0 text-(--label-3)" strokeWidth={2.2} />
            )}
          </li>
        );
      })}
    </ul>
  );
}
