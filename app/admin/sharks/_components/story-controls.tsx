"use client";

import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import type { SharksStoryStatus } from "@prisma/client";

import {
  approveSharksStoryAction,
  moveSharksStoryAction,
  publishSharksStoryAction,
  recordSharksConsentAction,
  revokeSharksConsentAction,
  setSharksVideoPublishedAction,
  unpublishSharksStoryAction,
  updateSharksStoryAction,
} from "@/actions/admin/sharks.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { uploadImageToCloudinary } from "@/lib/cloudinary-upload";
import { STORY_STATUS } from "@/lib/sharks/catalog";
import { parseVideoUrl } from "@/lib/sharks/video";
import { FieldError, useSharksAction } from "./use-sharks-action";

/* ── Content ─────────────────────────────────────────────────────────────── */

export type StoryContent = {
  slug: string;
  title: string;
  businessName: string;
  industry: string;
  summary: string;
  intro: string | null;
  challenge: string | null;
  whySelected: string | null;
  supportProvided: string | null;
  outcomes: string | null;
  founderQuote: string | null;
  founderName: string | null;
  coverImageUrl: string | null;
  logoUrl: string | null;
  videoUrl: string | null;
  videoPosterUrl: string | null;
  showTrack: boolean;
};

type TextKey = Exclude<keyof StoryContent, "showTrack">;

const LONG: { key: TextKey; label: string; hint?: string }[] = [
  { key: "intro", label: "مقدمة" },
  { key: "challenge", label: "التحدي اللي كان قدامهم" },
  { key: "whySelected", label: "ليه اخترناهم" },
  { key: "supportProvided", label: "الدعم اللي اتقدّم فعلًا" },
  { key: "outcomes", label: "اللي وصلوله (اللي متاح نشاركه بس)", hint: "نتايج حقيقية ومتوافق عليها بس. لو مفيش أرقام موثّقة، احكي الرحلة من غير أرقام." },
];

export function StoryEditor({ storyId, content, locked, approved }: { storyId: string; content: StoryContent; locked: boolean; approved: boolean }) {
  const [v, setV] = useState(content);
  const { run, pending, errors } = useSharksAction(updateSharksStoryAction);
  const set = (k: keyof StoryContent, value: string | boolean) => setV((s) => ({ ...s, [k]: value }));
  const text = (k: TextKey) => v[k] ?? "";
  const video = parseVideoUrl(v.videoUrl);

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        run({ storyId, ...Object.fromEntries(Object.entries(v).map(([k, val]) => [k, val ?? ""])) });
      }}
    >
      <fieldset disabled={locked} className="space-y-5 disabled:opacity-60">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="اسم البيزنس" value={text("businessName")} onChange={(x) => set("businessName", x)} error={errors.businessName} />
          <TextField label="المجال" value={text("industry")} onChange={(x) => set("industry", x)} error={errors.industry} />
        </div>
        <TextField label="عنوان القصة" value={text("title")} onChange={(x) => set("title", x)} error={errors.title} />
        <TextField label="الرابط" value={text("slug")} onChange={(x) => set("slug", x)} error={errors.slug} ltr prefix="casho.store/sharks/" />
        <AreaField label="وصف عام (بيظهر في الكارت وأول القصة)" value={text("summary")} onChange={(x) => set("summary", x)} error={errors.summary} rows={3} />
        {LONG.map((f) => (
          <AreaField key={f.key} label={f.label} hint={f.hint} value={text(f.key)} onChange={(x) => set(f.key, x)} error={errors[f.key]} rows={5} />
        ))}
        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <AreaField label="اقتباس من المؤسس (بموافقته بس)" value={text("founderQuote")} onChange={(x) => set("founderQuote", x)} error={errors.founderQuote} rows={2} />
          <TextField label="اسم صاحب الاقتباس" value={text("founderName")} onChange={(x) => set("founderName", x)} error={errors.founderName} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ImageField label="صورة الغلاف" value={text("coverImageUrl")} onChange={(x) => set("coverImageUrl", x)} error={errors.coverImageUrl} />
          <ImageField label="اللوجو" value={text("logoUrl")} onChange={(x) => set("logoUrl", x)} error={errors.logoUrl} />
        </div>

        <div className="space-y-3 rounded-lg border border-border p-4">
          <TextField
            label="رابط الفيديو (YouTube / Vimeo / ملف mp4 أو webm)"
            value={text("videoUrl")}
            onChange={(x) => set("videoUrl", x)}
            error={errors.videoUrl}
            ltr
            hint="الفيديو بيترفع على منصة خارجية (YouTube Shorts أو Cloudinary مثلاً) — مش على السيرفر. تغيير الرابط بيقفل نشر الفيديو لحد ما تفعّله تاني."
          />
          {v.videoUrl && <p className="text-xs text-muted-foreground">{video ? `اتعرف عليه: ${video.kind}` : "رابط مش مدعوم"}</p>}
          <ImageField label="صورة غلاف الفيديو (اختياري)" value={text("videoPosterUrl")} onChange={(x) => set("videoPosterUrl", x)} error={errors.videoPosterUrl} />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <Switch checked={v.showTrack} onCheckedChange={(on) => set("showTrack", on)} />
          اعرض مسار الدعم في القصة
        </label>
      </fieldset>

      {locked ? (
        <p className="text-sm text-muted-foreground">القصة منشورة — شيلها من النشر الأول عشان تعدّلها.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            احفظ المحتوى
          </Button>
          {approved && <p className="text-xs text-muted-foreground">الحفظ هيلغي الاعتماد ويرجّع القصة للمراجعة الداخلية.</p>}
        </div>
      )}
    </form>
  );
}

function TextField({ label, value, onChange, error, ltr, hint, prefix }: { label: string; value: string; onChange: (v: string) => void; error?: string; ltr?: boolean; hint?: string; prefix?: string }) {
  const id = `f-${label}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {hint && <p className="text-xs leading-5 text-muted-foreground">{hint}</p>}
      <div className="flex items-center gap-1" dir={ltr ? "ltr" : undefined}>
        {prefix && <span className="shrink-0 text-xs text-muted-foreground">{prefix}</span>}
        <Input id={id} dir={ltr ? "ltr" : undefined} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={error ? true : undefined} />
      </div>
      <FieldError message={error} />
    </div>
  );
}

function AreaField({ label, value, onChange, error, hint, rows }: { label: string; value: string; onChange: (v: string) => void; error?: string; hint?: string; rows: number }) {
  const id = `f-${label}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {hint && <p className="text-xs leading-5 text-muted-foreground">{hint}</p>}
      <Textarea id={id} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={error ? true : undefined} />
      <FieldError message={error} />
    </div>
  );
}

/** URL field + upload through the existing signed Cloudinary uploader. */
function ImageField({ label, value, onChange, error }: { label: string; value: string; onChange: (v: string) => void; error?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const id = `f-${label}`;

  async function upload(file: File) {
    setBusy(true);
    try {
      onChange(await uploadImageToCloudinary(file, "casho/uploads/sharks", 8));
      toast.success("الصورة اترفعت");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل رفع الصورة");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input id={id} dir="ltr" value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://" aria-invalid={error ? true : undefined} />
        <Button type="button" variant="outline" size="icon" aria-label={`ارفع ${label}`} disabled={busy} onClick={() => input.current?.click()}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        </Button>
        <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      </div>
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="h-24 w-auto rounded-md border border-border object-cover" />
      )}
      <FieldError message={error} />
    </div>
  );
}

/* ── Workflow ────────────────────────────────────────────────────────────── */

export function StoryWorkflow({
  storyId,
  status,
  moves,
  canApprove,
  canPublish,
}: {
  storyId: string;
  status: SharksStoryStatus;
  moves: SharksStoryStatus[];
  canApprove: { ok: boolean; reason?: string };
  canPublish: { ok: boolean; reason?: string };
}) {
  const move = useSharksAction(moveSharksStoryAction);
  const approve = useSharksAction(approveSharksStoryAction);
  const publish = useSharksAction(publishSharksStoryAction);
  const unpublish = useSharksAction(unpublishSharksStoryAction);
  const [confirm, setConfirm] = useState<"publish" | "unpublish" | null>(null);
  const busy = move.pending || approve.pending || publish.pending || unpublish.pending;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {status === "IN_REVIEW" && (
          <Button size="sm" disabled={busy || !canApprove.ok} onClick={() => approve.run({ storyId })}>
            اعتمد للنشر
          </Button>
        )}
        {(status === "APPROVED" || status === "UNPUBLISHED") && (
          <Button size="sm" disabled={busy || !canPublish.ok} onClick={() => setConfirm("publish")}>
            انشر القصة
          </Button>
        )}
        {status === "PUBLISHED" && (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => setConfirm("unpublish")}>
            شيلها من النشر
          </Button>
        )}
        {moves.map((to) => (
          <Button key={to} size="sm" variant={to === "ARCHIVED" ? "ghost" : "secondary"} disabled={busy} onClick={() => move.run({ storyId, status: to })}>
            {to === "ARCHIVED" ? "أرشفة" : `انقلها لـ «${STORY_STATUS[to].ar}»`}
          </Button>
        ))}
      </div>
      {status === "IN_REVIEW" && !canApprove.ok && <p className="text-xs text-muted-foreground">مينفعش تتعتمد: {canApprove.reason}</p>}
      {(status === "APPROVED" || status === "UNPUBLISHED") && !canPublish.ok && <p className="text-xs text-muted-foreground">مينفعش تتنشر: {canPublish.reason}</p>}

      <Dialog open={!!confirm} onOpenChange={(o) => !o && !busy && setConfirm(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>{confirm === "publish" ? "تنشر القصة؟" : "تشيل القصة من النشر؟"}</DialogTitle>
            <DialogDescription>
              {confirm === "publish"
                ? "القصة هتظهر للكل على casho.store/sharks. الفيديو ليه زرار منفصل."
                : "القصة هتختفي من الموقع فورًا. الطلب والسجل والموافقة مش هيتمسحوا."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirm(null)} disabled={busy}>
              رجوع
            </Button>
            <Button
              variant={confirm === "unpublish" ? "destructive" : "default"}
              disabled={busy}
              onClick={() => {
                (confirm === "publish" ? publish : unpublish).run({ storyId });
                setConfirm(null);
              }}
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              تأكيد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Consent ─────────────────────────────────────────────────────────────── */

export function ConsentForm({ storyId }: { storyId: string }) {
  const [givenBy, setGivenBy] = useState("");
  const [method, setMethod] = useState("");
  const [scope, setScope] = useState("");
  const [givenAt, setGivenAt] = useState("");
  const { run, pending, errors } = useSharksAction(recordSharksConsentAction);

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        run({ storyId, givenBy, method, scope, givenAt });
      }}
    >
      <p className="text-xs leading-5 text-muted-foreground">
        سجّل موافقة صاحب البيزنس على نشر القصة (والصور والفيديو لو فيه). موافقته وقت التقديم على «التواصل بخصوص النشر» مش كفاية.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="c-by">مين وافق</Label>
          <Input id="c-by" value={givenBy} onChange={(e) => setGivenBy(e.target.value)} placeholder="الاسم والصفة" />
          <FieldError message={errors.givenBy} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-at">تاريخ الموافقة</Label>
          <Input id="c-at" type="date" dir="ltr" value={givenAt} onChange={(e) => setGivenAt(e.target.value)} />
          <FieldError message={errors.givenAt} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="c-method">الوسيلة</Label>
        <Input id="c-method" value={method} onChange={(e) => setMethod(e.target.value)} placeholder="نموذج موقّع، رسالة إيميل، رسالة واتساب محفوظة…" />
        <FieldError message={errors.method} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="c-scope">نطاق الموافقة</Label>
        <Textarea id="c-scope" rows={3} value={scope} onChange={(e) => setScope(e.target.value)} placeholder="القصة المكتوبة؟ الصور؟ الفيديو؟ الأرقام؟ القنوات؟" />
        <FieldError message={errors.scope} />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        سجّل الموافقة
      </Button>
    </form>
  );
}

export function RevokeConsentButton({ storyId, published }: { storyId: string; published: boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const { run, pending, errors } = useSharksAction(revokeSharksConsentAction, () => setOpen(false));
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        الموافقة اتسحبت
      </Button>
      <Dialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تسجيل سحب الموافقة</DialogTitle>
            <DialogDescription>
              {published ? "القصة هتتشال من الموقع فورًا، والفيديو هيتقفل." : "القصة هترجع لمستنية موافقة."} الطلب والسجل مش هيتمسحوا.
            </DialogDescription>
          </DialogHeader>
          <Textarea aria-label="السبب" placeholder="السبب" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
          <FieldError message={errors.reason} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              رجوع
            </Button>
            <Button variant="destructive" disabled={pending} onClick={() => run({ storyId, reason })}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              تأكيد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function VideoPublishSwitch({ storyId, published, disabledReason }: { storyId: string; published: boolean; disabledReason: string | null }) {
  const { run, pending } = useSharksAction(setSharksVideoPublishedAction);
  return (
    <div className="space-y-1">
      <label className="flex items-center gap-2 text-sm">
        <Switch checked={published} disabled={pending || (!published && !!disabledReason)} onCheckedChange={(on) => run({ storyId, published: on })} />
        الفيديو يظهر مع القصة المنشورة
      </label>
      {!published && disabledReason && <p className="text-xs text-muted-foreground">{disabledReason}</p>}
    </div>
  );
}
