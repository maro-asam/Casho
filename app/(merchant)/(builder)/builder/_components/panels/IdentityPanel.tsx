"use client";

import { useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { UpdateStoreIdentityAction } from "@/actions/store/store-identity.actions";
import { appleButton } from "@/components/saas-page";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { uploadImageToCloudinary } from "@/lib/cloudinary-upload";
import { cn } from "@/lib/utils";
import { useBuilder } from "../BuilderContext";
import LogoEditorModal from "../media/LogoEditorModal";
import UnsplashPickerModal from "../media/UnsplashPickerModal";
import { Field, Group, PanelBody, Row, SwitchRow, useAutosave } from "../studio-ui";
import { tr } from "@/lib/i18n/dashboard";

type Identity = {
  logo: string;
  logoRadius: number;
  logoSize: number;
  coverImage: string;
  description: string;
  announcementText: string;
  showStoreName: boolean;
};

const DESCRIPTION_MAX = 1000;
const ANNOUNCEMENT_MAX = 300;

export default function IdentityPanel() {
  const { storeId, storeName, appearance, save } = useBuilder();
  const [identity, setIdentity] = useState<Identity>({
    logo: appearance.logo ?? "",
    logoRadius: appearance.logoRadius,
    logoSize: appearance.logoSize,
    coverImage: appearance.coverImage ?? "",
    description: appearance.description ?? "",
    announcementText: appearance.announcementText ?? "",
    showStoreName: appearance.showStoreName,
  });
  const set = <K extends keyof Identity>(key: K, value: Identity[K]) => setIdentity((s) => ({ ...s, [key]: value }));

  const [uploading, setUploading] = useState<"logo" | "cover" | null>(null);
  const [editorSrc, setEditorSrc] = useState<string | null>(null);
  const [unsplashOpen, setUnsplashOpen] = useState(false);
  const logoInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  useAutosave(identity, (value) => {
    const fd = new FormData();
    fd.set("storeId", storeId);
    fd.set("target", "draft");
    fd.set("logo", value.logo);
    fd.set("logoRadius", String(value.logoRadius));
    fd.set("logoSize", String(value.logoSize));
    fd.set("coverImage", value.coverImage);
    fd.set("description", value.description);
    fd.set("announcementText", value.announcementText);
    fd.set("showStoreName", String(value.showStoreName));
    return save(() => UpdateStoreIdentityAction({ success: false, message: "" }, fd));
  });

  function pickLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) setEditorSrc(URL.createObjectURL(file));
  }

  async function onLogoEdited(_dataUrl: string, blob: Blob) {
    const src = editorSrc;
    setEditorSrc(null);
    setUploading("logo");
    try {
      const url = await uploadImageToCloudinary(new File([blob], "logo.png", { type: "image/png" }), "casho/uploads/logos", 10);
      set("logo", url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tr("فشل رفع اللوجو"));
    } finally {
      setUploading(null);
      if (src?.startsWith("blob:")) URL.revokeObjectURL(src);
    }
  }

  async function pickCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading("cover");
    try {
      set("coverImage", await uploadImageToCloudinary(file, "casho/uploads/covers", 10));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tr("فشل رفع صورة الغلاف"));
    } finally {
      setUploading(null);
    }
  }

  const small = cn(appleButton.tinted, "h-8 px-3 text-[13px]");

  return (
    <PanelBody>
      <input ref={logoInput} type="file" accept="image/*,image/svg+xml" className="hidden" onChange={pickLogo} />
      <input ref={coverInput} type="file" accept="image/*" className="hidden" onChange={pickCover} />

      <Group title={tr("اللوجو")}>
        <div className="flex items-center gap-4 px-4 py-4">
          <div className="grid size-24 shrink-0 place-items-center rounded-2xl bg-(--fill-3)">
            {uploading === "logo" ? (
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            ) : identity.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={identity.logo}
                alt={tr("اللوجو")}
                className="max-h-20 max-w-20 object-contain"
                style={{ width: Math.min(identity.logoSize, 80), height: Math.min(identity.logoSize, 80), borderRadius: identity.logoRadius }}
              />
            ) : (
              <ImagePlus className="size-7 text-primary" strokeWidth={1.6} />
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
            <button type="button" className={cn(small, "text-primary")} onClick={() => logoInput.current?.click()} disabled={uploading !== null}>
              <ImagePlus className="size-4" />
              {identity.logo ? tr("لوجو تاني") : tr("ارفع اللوجو")}
            </button>
            {identity.logo && (
              <div className="flex gap-1.5">
                <button type="button" className={small} onClick={() => setEditorSrc(identity.logo)} disabled={uploading !== null}>
                  <Pencil className="size-3.5" />
                  {tr("قص")}
                </button>
                <button
                  type="button"
                  aria-label={tr("شيل اللوجو")}
                  className={cn(small, "text-(--sys-red)")}
                  onClick={() => set("logo", "")}
                  disabled={uploading !== null}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
        {identity.logo && (
          <>
            <Row label={tr("الحجم")} value={<span className="tabular-nums" dir="ltr">{identity.logoSize}px</span>} />
            <div className="px-4 pb-3">
              <Slider min={32} max={160} step={4} value={[identity.logoSize]} onValueChange={([v]) => set("logoSize", v)} aria-label={tr("حجم اللوجو")} />
            </div>
            <Row label={tr("استدارة الزوايا")} value={<span className="tabular-nums" dir="ltr">{identity.logoRadius}px</span>} />
            <div className="px-4 pb-3">
              <Slider min={0} max={50} step={1} value={[identity.logoRadius]} onValueChange={([v]) => set("logoRadius", v)} aria-label={tr("استدارة الزوايا")} />
            </div>
          </>
        )}
        <SwitchRow
          label={tr("اسم المتجر جنب اللوجو")}
          description={storeName}
          checked={identity.showStoreName}
          onCheckedChange={(v) => set("showStoreName", v)}
        />
      </Group>

      <Group title={tr("صورة الغلاف")} footer={tr("بتظهر في صفحة «من نحن» وفي بعض الثيمات أول الصفحة.")}>
        <div className="p-3">
          {identity.coverImage ? (
            <div className="relative overflow-hidden rounded-xl bg-(--fill-3)">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={identity.coverImage} alt={tr("صورة الغلاف")} className="aspect-video w-full object-cover" />
              {uploading === "cover" && (
                <div className="absolute inset-0 grid place-items-center bg-black/30">
                  <Loader2 className="size-6 animate-spin text-white" />
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => coverInput.current?.click()}
              disabled={uploading !== null}
              className="flex aspect-video w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-(--label-3)/60 bg-(--fill-3)/50 text-primary transition-colors hover:bg-(--fill-3)"
            >
              {uploading === "cover" ? <Loader2 className="size-7 animate-spin" /> : <ImagePlus className="size-7" strokeWidth={1.6} />}
              <span className="text-[15px]">{tr("ارفع صورة الغلاف")}</span>
            </button>
          )}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <button type="button" className={cn(small, "text-primary")} onClick={() => coverInput.current?.click()} disabled={uploading !== null}>
              <ImagePlus className="size-4" />
              {identity.coverImage ? tr("صورة تانية") : tr("من جهازك")}
            </button>
            <button type="button" className={cn(small, "text-primary")} onClick={() => setUnsplashOpen(true)} disabled={uploading !== null}>
              <Camera className="size-4" />
              Unsplash
            </button>
            {identity.coverImage && (
              <button type="button" aria-label={tr("شيل الغلاف")} className={cn(small, "text-(--sys-red)")} onClick={() => set("coverImage", "")}>
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      </Group>

      <Group title={tr("الكلام")}>
        <Field
          label={tr("شريط الإعلان")}
          htmlFor="identity-announcement"
          trailing={<span className="text-[12px] text-muted-foreground tabular-nums">{identity.announcementText.length}/{ANNOUNCEMENT_MAX}</span>}
          hint={tr("سطر واحد فوق المتجر — شحن مجاني، كود خصم، أو عرض. سيبه فاضي عشان يختفي.")}
        >
          <Textarea
            id="identity-announcement"
            rows={2}
            maxLength={ANNOUNCEMENT_MAX}
            value={identity.announcementText}
            onChange={(e) => set("announcementText", e.target.value)}
            placeholder={tr("مثال: شحن مجاني للطلبات فوق 500 جنيه")}
            className="min-h-0 resize-none px-3.5 py-2.5"
          />
        </Field>
        <Field
          label={tr("وصف المتجر")}
          htmlFor="identity-description"
          trailing={<span className="text-[12px] text-muted-foreground tabular-nums">{identity.description.length}/{DESCRIPTION_MAX}</span>}
          hint={tr("بيظهر في الفوتر وصفحة «من نحن». سطرين عن متجرك بيبنوا ثقة.")}
        >
          <Textarea
            id="identity-description"
            rows={4}
            maxLength={DESCRIPTION_MAX}
            value={identity.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder={tr("مثال: متجر متخصص في الملابس الكاجوال بأفضل جودة وسعر")}
            className="resize-none px-3.5 py-2.5"
          />
        </Field>
      </Group>

      <LogoEditorModal open={editorSrc !== null} imageSrc={editorSrc ?? ""} onClose={() => setEditorSrc(null)} onDone={onLogoEdited} />
      <UnsplashPickerModal open={unsplashOpen} onClose={() => setUnsplashOpen(false)} onSelect={(url) => set("coverImage", url)} />
    </PanelBody>
  );
}
