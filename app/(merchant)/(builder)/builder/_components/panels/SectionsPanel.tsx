"use client";

import { useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical, Plus, ScanEye } from "lucide-react";
import { InsertSectionAction, UpdateSectionOrderAction, UpdateThemeSectionsAction } from "@/actions/settings/theme.actions";
import { appleButton } from "@/components/saas-page";
import { DEFAULT_SECTION_ORDER, type HomePageSections, type SectionKey } from "@/types/store-theme.types";
import { cn } from "@/lib/utils";
import { useBuilder } from "../BuilderContext";
import { SECTION_GROUP_LABELS, SECTION_META, SectionThumb, allSectionKeys, isSectionKey, type SectionGroup } from "../section-meta";
import { SectionContentEditor, hasContentEditor } from "../section-editors";
import { Group, IconTile, NavRow, PanelBody, SwitchRow } from "../studio-ui";
import { lazyIntl, tr } from "@/lib/i18n/dashboard";

const nf = lazyIntl.number();

/** Saved order first, then any enabled section that isn't in it yet (same rule as the storefront). */
function resolveOrder(home: HomePageSections): SectionKey[] {
  const base = (home.sectionOrder ?? DEFAULT_SECTION_ORDER).filter(isSectionKey);
  const rest = allSectionKeys().filter((k) => !base.includes(k));
  return [...base, ...rest];
}

function useSections() {
  const { storeId, theme, save } = useBuilder();
  const home = theme.sections.home;
  const [order, setOrder] = useState<SectionKey[]>(() => resolveOrder(home));
  const [visible, setVisible] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(allSectionKeys().map((k) => [k, Boolean(home[k as keyof HomePageSections])])),
  );
  const enabled = order.filter((k) => visible[k]);
  const hidden = order.filter((k) => !visible[k]);

  /** New order for the visible list; hidden sections keep their relative order after them. */
  function reorder(nextEnabled: SectionKey[]) {
    const previous = order;
    const next = [...nextEnabled, ...order.filter((k) => !nextEnabled.includes(k))];
    setOrder(next);
    void save(() => UpdateSectionOrderAction({ storeId, order: next, target: "draft" }), { onError: () => setOrder(previous) });
  }

  function setShown(key: SectionKey, on: boolean) {
    setVisible((v) => ({ ...v, [key]: on }));
    void save(() => UpdateThemeSectionsAction({ storeId, page: "home", updates: { [key]: on }, target: "draft" }), {
      onError: () => setVisible((v) => ({ ...v, [key]: !on })),
    });
  }

  async function add(key: SectionKey) {
    // Right after the last visible section.
    const lastVisible = order.reduce((at, k, i) => (visible[k] ? i : at), -1);
    const without = order.filter((k) => k !== key);
    const index = Math.min(lastVisible + 1, without.length);
    setOrder([...without.slice(0, index), key, ...without.slice(index)]);
    setVisible((v) => ({ ...v, [key]: true }));
    return save(() => InsertSectionAction({ storeId, key, index, target: "draft" }));
  }

  return { order, enabled, hidden, visible, reorder, setShown, add };
}

// ─── List ─────────────────────────────────────────────────────────────────────

function SortableRow({ id, onOpen, onHide }: { id: SectionKey; onOpen: () => void; onHide: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const meta = SECTION_META[id];
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("relative bg-card", isDragging && "z-10 rounded-[14px] shadow-[0_12px_32px_rgba(0,0,0,0.18)]")}
    >
      <div className="flex min-h-14 items-center gap-1 ps-1.5 pe-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={tr("اسحب عشان ترتّب {0}", meta.label)}
          className="grid h-11 w-8 shrink-0 cursor-grab touch-none place-items-center rounded-lg text-(--label-3) hover:text-muted-foreground active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>
        <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg py-2 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <IconTile icon={meta.icon} tint={meta.tint} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] leading-5">{meta.label}</span>
            <span className="block truncate text-[12px] leading-4 text-muted-foreground">{meta.description}</span>
          </span>
        </button>
        <button
          type="button"
          onClick={onHide}
          aria-label={tr("إخفاء {0}", meta.label)}
          className="apple-press grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <EyeOff className="size-4" />
        </button>
      </div>
    </div>
  );
}

function SectionList() {
  const { navigate } = useBuilder();
  const { enabled, reorder, setShown } = useSections();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    reorder(arrayMove(enabled, enabled.indexOf(active.id as SectionKey), enabled.indexOf(over.id as SectionKey)));
  }

  return (
    <PanelBody>
      <p className="-mt-1 px-1 text-[13px] leading-[18px] text-muted-foreground">
        {tr("ده ترتيب صفحتك الرئيسية من فوق لتحت. اسحب عشان ترتّب، أو اضغط على قسم في المعاينة عشان تفتحه.")}
      </p>

      <section className="space-y-1.5">
        <h3 className="px-4 text-[13px] text-muted-foreground">{tr("في صفحتك · {0}", nf.format(enabled.length))}</h3>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={enabled} strategy={verticalListSortingStrategy}>
            <div className="apple-rows overflow-hidden rounded-[14px] bg-card [--row-inset:84px]">
              {enabled.map((key) => (
                <SortableRow key={key} id={key} onOpen={() => navigate("sections", key)} onHide={() => setShown(key, false)} />
              ))}
              {enabled.length === 0 && <p className="px-4 py-6 text-center text-[13px] text-muted-foreground">{tr("الصفحة الرئيسية فاضية — ضيف قسم.")}</p>}
            </div>
          </SortableContext>
        </DndContext>
      </section>

      <button type="button" onClick={() => navigate("sections", "library")} className={cn(appleButton.filled, "w-full")}>
        <Plus className="size-4" strokeWidth={2.4} />
        {tr("إضافة قسم")}
      </button>
      <p className="-mt-3 px-4 text-center text-[12px] leading-[17px] text-muted-foreground">
        {tr("الأقسام المخفية بتفضل بمحتواها، وترجع زي ما هي لما تضيفها تاني.")}
      </p>

    </PanelBody>
  );
}

// ─── Library ──────────────────────────────────────────────────────────────────

function SectionLibrary() {
  const { navigate } = useBuilder();
  const { hidden, add } = useSections();
  const [adding, setAdding] = useState<SectionKey | null>(null);
  const groups = (Object.keys(SECTION_GROUP_LABELS) as SectionGroup[])
    .map((g) => ({ g, keys: hidden.filter((k) => SECTION_META[k].group === g) }))
    .filter((x) => x.keys.length);

  async function pick(key: SectionKey) {
    setAdding(key);
    const ok = await add(key);
    setAdding(null);
    if (ok) navigate("sections", key);
  }

  return (
    <PanelBody>
      <p className="-mt-1 px-1 text-[13px] leading-[18px] text-muted-foreground">
        {tr("اختار قسم يتضاف آخر صفحتك — وبعدها رتّبه وعدّل كلامه.")}
      </p>
      {groups.length === 0 && (
        <p className="rounded-[14px] bg-card px-4 py-8 text-center text-[15px] text-muted-foreground">{tr("كل الأقسام موجودة في صفحتك بالفعل 👌")}</p>
      )}
      {groups.map(({ g, keys }) => (
        <Group key={g} title={SECTION_GROUP_LABELS[g]} plain>
          <div className="grid grid-cols-2 gap-2.5">
            {keys.map((key) => {
              const meta = SECTION_META[key];
              return (
                <button
                  key={key}
                  type="button"
                  disabled={adding !== null}
                  onClick={() => pick(key)}
                  className="apple-press group flex flex-col gap-2 rounded-[14px] bg-card p-2 text-start ring-1 ring-transparent transition-shadow hover:ring-foreground/10 focus-visible:outline-none focus-visible:ring-primary/50 disabled:opacity-60"
                >
                  <SectionThumb id={key} className="bg-(--fill-3)/60" />
                  <span className="px-1 pb-0.5">
                    <span className="flex items-center justify-between gap-1">
                      <span className="truncate text-[13px] leading-[18px] font-medium">{meta.label}</span>
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-110">
                        <Plus className="size-3" strokeWidth={3} />
                      </span>
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-[11px] leading-[15px] text-muted-foreground">{meta.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </Group>
      ))}
    </PanelBody>
  );
}

// ─── Detail ───────────────────────────────────────────────────────────────────

function SectionDetail({ sectionKey }: { sectionKey: SectionKey }) {
  const { navigate, focusRegion } = useBuilder();
  const { enabled, visible, reorder, setShown } = useSections();
  const meta = SECTION_META[sectionKey];
  const on = visible[sectionKey];
  const index = enabled.indexOf(sectionKey);

  function move(by: -1 | 1) {
    const to = index + by;
    if (index < 0 || to < 0 || to >= enabled.length) return;
    reorder(arrayMove(enabled, index, to));
    window.setTimeout(() => focusRegion(sectionKey), 900);
  }

  return (
    <PanelBody>
      <div className="flex items-start gap-3 rounded-[18px] bg-card p-3">
        <SectionThumb id={sectionKey} className="w-28 shrink-0 bg-(--fill-3)/60" />
        <div className="min-w-0 flex-1 space-y-2 pt-0.5">
          <p className="text-[13px] leading-[18px] text-muted-foreground">{meta.description}</p>
          {on && (
            <button type="button" onClick={() => focusRegion(sectionKey)} className={cn(appleButton.plain, "mx-0 -ms-2 h-8 text-[13px]")}>
              <ScanEye className="size-4" />
              {tr("وريني مكانه")}
            </button>
          )}
        </div>
      </div>

      <Group>
        <SwitchRow icon={on ? Eye : EyeOff} tint={on ? "bg-(--sys-green)" : "bg-(--sys-gray)"} label={tr("ظاهر في الصفحة")} checked={on} onCheckedChange={(v) => setShown(sectionKey, v)} />
        {on && enabled.length > 1 && (
          <div className="flex items-center gap-2 px-4 py-2.5">
            <span className="flex-1 text-[15px]">{tr("الترتيب")}</span>
            <span className="text-[13px] text-muted-foreground tabular-nums">{tr("{0} من {1}", nf.format(index + 1), nf.format(enabled.length))}</span>
            <button type="button" aria-label={tr("لفوق")} onClick={() => move(-1)} disabled={index <= 0} className={cn(appleButton.tinted, "size-9 px-0")}>
              <ArrowUp className="size-4" />
            </button>
            <button type="button" aria-label={tr("لتحت")} onClick={() => move(1)} disabled={index >= enabled.length - 1} className={cn(appleButton.tinted, "size-9 px-0")}>
              <ArrowDown className="size-4" />
            </button>
          </div>
        )}
      </Group>

      {hasContentEditor(sectionKey) ? (
        <SectionContentEditor sectionKey={sectionKey} />
      ) : (
        <p className="px-4 text-[13px] leading-[18px] text-muted-foreground">
          {meta.source ? tr("القسم ده بيتملي لوحده من بيانات متجرك.") : tr("القسم ده بيتملي لوحده من منتجاتك.")}
        </p>
      )}

      {meta.source && (
        <Group>
          <NavRow label={meta.source.label} href={meta.source.href} />
        </Group>
      )}

      {on && (
        <button
          type="button"
          onClick={() => {
            setShown(sectionKey, false);
            navigate("sections");
          }}
          className={cn(appleButton.plain, "mx-0 w-full justify-center text-(--sys-red) hover:bg-(--sys-red)/8")}
        >
          {tr("شيل القسم من الصفحة")}
        </button>
      )}
    </PanelBody>
  );
}

export default function SectionsPanel() {
  const { section } = useBuilder();
  if (section === "library") return <SectionLibrary />;
  if (isSectionKey(section)) return <SectionDetail sectionKey={section} />;
  return <SectionList />;
}
