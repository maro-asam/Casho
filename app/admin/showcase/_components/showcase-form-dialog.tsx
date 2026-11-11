"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Link2, Loader2, Unlink } from "lucide-react";
import { toast } from "sonner";

import { lookupShowcaseStoreAction, saveShowcaseSiteAction } from "@/actions/admin/showcase.actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { displayHost } from "@/helpers/BuildStoreURL";
import { uploadImageToCloudinary } from "@/lib/cloudinary-upload";
import { SHOWCASE_CATEGORIES, SHOWCASE_CATEGORY_KEYS } from "@/lib/showcase/catalog";
import { cn } from "@/lib/utils";

export type ShowcaseFormValues = {
  name: string;
  category: string;
  url: string;
  imageUrl: string;
  published: boolean;
  /** The linked Casho store, if any. */
  store: { slug: string; url: string; open: boolean } | null;
};

const EMPTY: ShowcaseFormValues = { name: "", category: "", url: "", imageUrl: "", published: true, store: null };

/** Add (no `id`) or edit one Casho example. */
export function ShowcaseFormDialog({ id, initial, trigger }: { id?: string; initial?: ShowcaseFormValues; trigger: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ShowcaseFormValues>(initial ?? EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [storeRef, setStoreRef] = useState("");
  const [imageMode, setImageMode] = useState<"upload" | "link">("upload");
  const [uploading, setUploading] = useState(false);
  const [looking, startLookup] = useTransition();
  const [saving, startSave] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof ShowcaseFormValues>(key: K, value: ShowcaseFormValues[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const reset = () => {
    setForm(initial ?? EMPTY);
    setErrors({});
    setStoreRef("");
  };

  const linkStore = () =>
    startLookup(async () => {
      const result = await lookupShowcaseStoreAction(storeRef);
      if (!result.found) {
        setErrors((e) => ({ ...e, storeSlug: result.message }));
        return;
      }
      setForm((f) => ({
        ...f,
        name: f.name.trim() ? f.name : result.name.slice(0, 60),
        url: result.url,
        store: { slug: result.slug, url: result.url, open: result.open },
      }));
      setErrors({});
      setStoreRef("");
    });

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      set("imageUrl", await uploadImageToCloudinary(file, "casho/uploads/showcase", 10));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "فشل رفع الصورة");
    } finally {
      setUploading(false);
    }
  }

  const submit = () =>
    startSave(async () => {
      const result = await saveShowcaseSiteAction(id ?? null, {
        name: form.name,
        category: form.category,
        storeSlug: form.store?.slug ?? "",
        url: form.store ? "" : form.url,
        imageUrl: form.imageUrl,
        published: form.published,
      });
      if (!result.success) {
        setErrors(result.fieldErrors ?? {});
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setOpen(false);
      if (!id) reset();
      router.refresh();
    });

  const busy = saving || uploading;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (busy) return;
        setOpen(next);
        if (next) reset();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent dir="rtl" className="max-h-[92svh] overflow-y-auto sm:max-w-lg">
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <DialogHeader>
            <DialogTitle>{id ? "تعديل المثال" : "مثال جديد"}</DialogTitle>
            <DialogDescription>بيظهر في سكشن «مبني بكاشو» في الصفحة الرئيسية، والزائر بيفتح الموقع بضغطة.</DialogDescription>
          </DialogHeader>

          {/* Linked store */}
          <div className="space-y-1.5">
            <Label htmlFor="sc-store">متجر على كاشو (اختياري)</Label>
            {form.store ? (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-muted px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium" dir="ltr">
                    <span className="block text-right">{displayHost(form.store.url)}</span>
                  </p>
                  <p className={cn("text-xs", form.store.open ? "text-muted-foreground" : "text-(--sys-orange)")}>
                    {form.store.open ? "المتجر مفتوح · الرابط بيتحدّث لوحده لو غيّر الدومين" : "المتجر مقفول دلوقتي — المثال مش هيظهر لحد ما يتفتح"}
                  </p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => set("store", null)}>
                  <Unlink className="size-3.5" />
                  فك الربط
                </Button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <Input
                    id="sc-store"
                    dir="ltr"
                    value={storeRef}
                    onChange={(e) => {
                      setStoreRef(e.target.value);
                      setErrors((er) => ({ ...er, storeSlug: "" }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (storeRef.trim()) linkStore();
                      }
                    }}
                    placeholder="nour.casho.store أو nour"
                    aria-invalid={!!errors.storeSlug}
                  />
                  <Button type="button" variant="outline" onClick={linkStore} disabled={!storeRef.trim() || looking}>
                    {looking ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
                    اربط
                  </Button>
                </div>
                <FieldError message={errors.storeSlug} />
                <p className="text-xs text-muted-foreground">لو مربوط بمتجر، الرابط بيمشي ورا دومين المتجر، والمثال بيستخبى لوحده لو المتجر اتقفل.</p>
              </>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="sc-name">اسم المتجر</Label>
              <Input id="sc-name" value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={60} aria-invalid={!!errors.name} />
              <FieldError message={errors.name} />
            </div>
            <div className="space-y-1.5">
              <Label>المجال</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v)} dir="rtl">
                <SelectTrigger className="w-full" aria-invalid={!!errors.category}>
                  <SelectValue placeholder="اختار" />
                </SelectTrigger>
                <SelectContent>
                  {SHOWCASE_CATEGORY_KEYS.map((key) => (
                    <SelectItem key={key} value={key}>
                      {SHOWCASE_CATEGORIES[key].ar}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={errors.category} />
            </div>
          </div>

          {!form.store && (
            <div className="space-y-1.5">
              <Label htmlFor="sc-url">رابط الموقع</Label>
              <Input id="sc-url" dir="ltr" value={form.url} onChange={(e) => set("url", e.target.value)} placeholder="https://" aria-invalid={!!errors.url} />
              <FieldError message={errors.url} />
            </div>
          )}

          {/* Screenshot */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>سكرين شوت الموقع</Label>
              <div className="flex rounded-lg bg-muted p-0.5 text-xs">
                {(["upload", "link"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setImageMode(mode)}
                    className={cn("rounded-md px-2.5 py-1", imageMode === mode ? "bg-background font-medium shadow-sm" : "text-muted-foreground")}
                  >
                    {mode === "upload" ? "رفع" : "رابط"}
                  </button>
                ))}
              </div>
            </div>

            {form.imageUrl ? (
              <div className="group relative overflow-hidden rounded-xl bg-muted ring-1 ring-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.imageUrl} alt="" className="aspect-[16/10] w-full object-cover object-top" />
                <Button type="button" size="sm" variant="secondary" className="absolute end-2 top-2" onClick={() => set("imageUrl", "")} disabled={busy}>
                  غيّر الصورة
                </Button>
              </div>
            ) : imageMode === "upload" ? (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className={cn(
                  "flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 text-sm text-muted-foreground transition-colors hover:bg-muted",
                  errors.imageUrl && "border-(--sys-red)",
                )}
              >
                {uploading ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-6" strokeWidth={1.6} />}
                {uploading ? "بترفع…" : "اختار صورة (لحد ١٠ ميجا)"}
              </button>
            ) : (
              <Input dir="ltr" placeholder="https://…png" onChange={(e) => set("imageUrl", e.target.value.trim())} aria-invalid={!!errors.imageUrl} />
            )}
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
            <FieldError message={errors.imageUrl} />
            <p className="text-xs leading-5 text-muted-foreground">
              صوّر الصفحة الرئيسية بعرض ديسكتوب (١٤٤٠ مثلًا). لو الصورة طويلة (Full page) هتنزل لوحدها لتحت لما الزائر يقف على الكارت.
            </p>
          </div>

          <label className="flex items-center justify-between gap-3 rounded-xl bg-muted px-3 py-2.5 text-sm">
            <span>
              <span className="block font-medium">ظاهر في الصفحة الرئيسية</span>
              <span className="text-xs text-muted-foreground">اقفله لو عايز تجهّزه وتنشره بعدين.</span>
            </span>
            <Switch checked={form.published} onCheckedChange={(v) => set("published", v)} />
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              رجوع
            </Button>
            <Button type="submit" disabled={busy || looking}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {id ? "احفظ" : "أضف المثال"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-(--sys-red)">{message}</p>;
}
