"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Gift, Megaphone, Plus, UserPlus } from "lucide-react";
import { SetPopupActiveAction } from "@/actions/store/popups.actions";
import { appleButton } from "@/components/saas-page";
import { Switch } from "@/components/ui/switch";
import { POPUP_TEMPLATES, POPUP_TYPE_META, triggerLabel } from "@/lib/popups/popup-config";
import { cn } from "@/lib/utils";
import { useBuilder, type StudioPopup } from "../BuilderContext";
import { PopupRowActions } from "../popups/popup-row-actions";
import { upcomingSeasons } from "../seasons";
import { Group, IconTile, LiveNote, PanelBody } from "../studio-ui";
import { lazyIntl, tr } from "@/lib/i18n/dashboard";

const nf = lazyIntl.number();
const pf = lazyIntl.number({ style: "percent", maximumFractionDigits: 1 });
const df = lazyIntl.date({ timeZone: "Africa/Cairo", day: "numeric", month: "short" });
const TYPE_ICONS = { discount: Gift, lead: UserPlus, announcement: Megaphone } as const;
const TYPE_TINTS = { discount: "bg-(--sys-red)", lead: "bg-(--sys-green)", announcement: "bg-primary" } as const;

/** Studio URL that opens the popup editor (it lives on top of the Studio). */
const editorHref = (params: Record<string, string>) => `/builder?${new URLSearchParams({ panel: "popups", ...params })}`;

function state(p: StudioPopup, now: number) {
  if (!p.isActive) return { label: tr("متوقفة"), dot: "bg-(--sys-gray)" };
  if (p.startsAt && new Date(p.startsAt).getTime() > now) return { label: tr("تبدأ {0}", df.format(new Date(p.startsAt))), dot: "bg-primary" };
  if (p.endsAt && new Date(p.endsAt).getTime() <= now) return { label: tr("انتهت"), dot: "bg-(--sys-orange)" };
  return { label: tr("شغّالة"), dot: "bg-(--sys-green)" };
}

function PopupRow({ item, storeId, topOrder, previewing, onPreview }: {
  item: StudioPopup;
  storeId: string;
  topOrder: string[] | null;
  previewing: boolean;
  onPreview: () => void;
}) {
  const { save } = useBuilder();
  const [active, setActive] = useState(item.isActive);
  const [now] = useState(() => Date.now());
  const Icon = TYPE_ICONS[item.popup.type];
  const s = state({ ...item, isActive: active }, now);

  return (
    <div className={cn("space-y-2.5 px-4 py-3", previewing && "bg-primary/6")}>
      <div className="flex items-start gap-3">
        <IconTile icon={Icon} tint={TYPE_TINTS[item.popup.type]} className="mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] leading-5">{item.name}</p>
          <p className="truncate text-[12px] leading-4 text-muted-foreground">
            {POPUP_TYPE_META[item.popup.type].label} · {triggerLabel(item.popup.config.trigger)}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-[12px] text-foreground/75">
            <span aria-hidden className={cn("size-1.5 rounded-full", s.dot)} />
            {s.label}
            {item.views > 0 && (
              <span className="text-muted-foreground tabular-nums">
                · {tr("{0} مشاهدة · {1} تحويل", nf.format(item.views), pf.format(item.conversions / item.views))}
              </span>
            )}
          </p>
        </div>
        <Switch
          checked={active}
          aria-label={tr("تشغيل {0}", item.name)}
          className="mt-0.5"
          onCheckedChange={(next) => {
            setActive(next);
            void save(() => SetPopupActiveAction(item.id, storeId, next), {
              success: next ? tr("\"{0}\" شغّالة في المتجر", item.name) : tr("\"{0}\" اتوقفت", item.name),
              onError: () => setActive(!next),
            });
          }}
        />
      </div>
      <div className="flex items-center gap-1.5 ps-[41px]">
        <button type="button" onClick={onPreview} className={cn(appleButton.tinted, "h-8 px-3 text-[13px]", previewing ? "bg-primary/12 text-primary" : "text-primary")}>
          {previewing ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          {previewing ? tr("اقفل المعاينة") : tr("جرّب في المعاينة")}
        </button>
        <Link href={editorHref({ popup: item.id })} scroll={false} className={cn(appleButton.tinted, "h-8 px-3 text-[13px]")}>
          {tr("تعديل")}
        </Link>
        <span className="flex-1" />
        <PopupRowActions popupId={item.id} storeId={storeId} name={item.name} editHref={editorHref({ popup: item.id })} topOrder={topOrder} />
      </div>
    </div>
  );
}

export default function PopupsPanel() {
  const { popups, storeId, previewPopup } = useBuilder();
  const [previewing, setPreviewing] = useState<string | null>(null);
  const totals = popups.reduce((t, p) => ({ views: t.views + p.views, conversions: t.conversions + p.conversions }), { views: 0, conversions: 0 });
  const topOrder = (id: string) => (popups[0]?.id === id ? null : [id, ...popups.map((p) => p.id).filter((x) => x !== id)]);
  const now = new Date();
  const seasons = upcomingSeasons(now);

  function togglePreview(item: StudioPopup) {
    if (previewing === item.id) {
      previewPopup(null);
      setPreviewing(null);
    } else {
      previewPopup(item.popup);
      setPreviewing(item.id);
    }
  }

  return (
    <PanelBody>
      <LiveNote />
      <p className="px-1 text-[13px] leading-[18px] text-muted-foreground">
        {tr("نافذة واحدة بس بتظهر للزائر في الزيارة، والأولوية للي فوق. مش بتظهر أبدًا وقت الدفع.")}
      </p>

      {popups.length > 0 && totals.views > 0 && (
        <dl className="grid grid-cols-3 overflow-hidden rounded-[14px] bg-card text-center">
          {[
            [tr("مشاهدات"), nf.format(totals.views)],
            [tr("تحويلات"), nf.format(totals.conversions)],
            [tr("معدل التحويل"), pf.format(totals.conversions / totals.views)],
          ].map(([label, value]) => (
            <div key={label} className="px-2 py-3 [&+&]:border-s-[0.5px] [&+&]:border-border">
              <dt className="text-[11px] text-muted-foreground">{label}</dt>
              <dd className="text-[17px] font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {popups.length > 0 && (
        <Group title={tr("نوافذك")}>
          {popups.map((item) => (
            <PopupRow
              key={item.id}
              item={item}
              storeId={storeId}
              topOrder={topOrder(item.id)}
              previewing={previewing === item.id}
              onPreview={() => togglePreview(item)}
            />
          ))}
        </Group>
      )}

      <Link href={editorHref({ popup: "new" })} scroll={false} className={cn(appleButton.filled, "w-full")}>
        <Plus className="size-4" strokeWidth={2.4} />
        {tr("نافذة جديدة")}
      </Link>

      <Group title={tr("ابدأ من قالب جاهز")} footer={tr("كل قالب متظبط على أفضل توقيت لنوعه — عدّل الكلام بس.")}>
        {POPUP_TEMPLATES.map((t) => {
          const Icon = TYPE_ICONS[t.type];
          return (
            <Link
              key={t.id}
              href={editorHref({ popup: "new", template: t.id })}
              scroll={false}
              className="flex min-h-11 items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/50"
            >
              <IconTile icon={Icon} tint={TYPE_TINTS[t.type]} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] leading-5">{t.name}</span>
                <span className="block truncate text-[12px] leading-4 text-muted-foreground">{t.description}</span>
              </span>
              <Plus className="size-4 shrink-0 text-primary" />
            </Link>
          );
        })}
      </Group>

      {seasons.length > 0 && (
        <Group title={tr("مواسم جاية")} footer={tr("جهّز العرض بدري — النافذة بتشتغل وتقف لوحدها في ميعادها.")}>
          {seasons.map((s) => {
            const live = s.daysLeft <= 0;
            const href = editorHref({
              popup: "new",
              template: "campaign",
              name: s.name,
              starts: new Date(Math.max(now.getTime(), s.start.getTime() - 2 * 86400_000)).toISOString(),
              ends: s.end.toISOString(),
            });
            return (
              <Link key={s.id} href={href} scroll={false} className="flex min-h-14 items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/50">
                <span className="grid w-11 shrink-0 place-items-center rounded-[10px] bg-(--fill-3) py-1 text-center">
                  <span className="text-[15px] leading-5 font-semibold tabular-nums">{live ? tr("الآن") : nf.format(s.daysLeft)}</span>
                  {!live && <span className="text-[10px] leading-3 text-muted-foreground">{tr("يوم")}</span>}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] leading-5">
                    {s.name}
                    <span className="ms-1.5 text-[12px] text-muted-foreground">
                      {s.approx && tr("حوالي ")}
                      {df.format(s.start)}
                    </span>
                  </span>
                  <span className="block truncate text-[12px] leading-4 text-muted-foreground">{s.tip}</span>
                </span>
                <span className="shrink-0 text-[13px] text-primary">{tr("جهّز عرض")}</span>
              </Link>
            );
          })}
        </Group>
      )}
    </PanelBody>
  );
}
