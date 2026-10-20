"use client";

/**
 * MarketingAssistantModal
 *
 * Shown after a product is created. Offers the merchant AI-generated
 * marketing content: viral hooks, social captions, hashtags, video ideas,
 * and ad angles.
 *
 * Props:
 *   productData  — data returned by CreateProductAction on success
 *   onDone       — called when the merchant closes / finishes (triggers navigation)
 */

import { useState, useTransition } from "react";
import {
  Copy,
  Check,
  Sparkles,
  Hash,
  Zap,
  FileText,
  Lightbulb,
  Target,
  ChevronRight,
} from "lucide-react";

import { appleButton } from "@/components/saas-page";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { generateMarketingFromDataAction } from "@/actions/ai/generate-marketing.actions";
import type { MarketingContent } from "@/lib/ai/marketing-assistant";
import { tdir, tr } from "@/lib/i18n/dashboard";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProductDataForMarketing = {
  id:            string;
  name:          string;
  description:   string | null;
  pricePiasters: number;
  categoryName:  string;
};

type Props = {
  productData: ProductDataForMarketing;
  open:        boolean;
  onDone:      () => void;
};

// ─── Tab config ───────────────────────────────────────────────────────────────

type TabId = "hooks" | "captions" | "hashtags" | "ideas" | "angles";

const TABS: { id: TabId; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: "hooks",    get label() { return tr("هوكس"); },      icon: Zap         },
  { id: "captions", get label() { return tr("كابشن"); },     icon: FileText    },
  { id: "hashtags", get label() { return tr("هاشتاج"); },    icon: Hash        },
  { id: "ideas",    get label() { return tr("أفكار"); },     icon: Lightbulb   },
  { id: "angles",   get label() { return tr("زوايا إعلان"); }, icon: Target    },
];

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      type="button"
      aria-label={tr("نسخ")}
      className="apple-press grid size-8 shrink-0 place-items-center rounded-full text-primary opacity-60 transition group-hover:opacity-100 hover:bg-primary/8 focus-visible:opacity-100"
      title={tr("نسخ")}
    >
      {copied ? (
        <Check className="size-4 text-(--sys-green)" strokeWidth={2.4} />
      ) : (
        <Copy className="size-4" />
      )}
    </button>
  );
}

// ─── Content card ─────────────────────────────────────────────────────────────

function ContentCard({ text, index }: { text: string; index: number }) {
  return (
    <div className="group flex items-start gap-3 rounded-2xl bg-(--fill-3) p-3.5">
      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-card text-[12px] font-semibold text-muted-foreground tabular-nums">
        {index + 1}
      </span>
      <p className="flex-1 text-[15px] leading-6 text-foreground">{text}</p>
      <CopyButton text={text} />
    </div>
  );
}

// ─── Hashtag pill ─────────────────────────────────────────────────────────────

function HashtagPill({ tag }: { tag: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(tag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "apple-press inline-flex h-8 items-center rounded-full px-3.5 text-[13px]",
        copied ? "bg-(--sys-green)/14 text-foreground" : "bg-(--fill-3) text-primary hover:bg-(--fill-3)/70",
      )}
    >
      {copied ? <Check className="me-1 inline-block size-3.5 text-(--sys-green)" strokeWidth={2.4} /> : null}
      {tag}
    </button>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonContent() {
  return (
    <div className="space-y-3 p-1">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex gap-3 rounded-2xl bg-(--fill-3) p-3.5"
          style={{ opacity: 1 - i * 0.18 }}
        >
          <div className="h-6 w-6 shrink-0 animate-pulse rounded-full bg-card" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 animate-pulse rounded bg-card" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-card" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MarketingAssistantModal({
  productData,
  open,
  onDone,
}: Props) {
  const [content, setContent]           = useState<MarketingContent | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isPending, startTransition]    = useTransition();

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateMarketingFromDataAction({
        title:         productData.name,
        description:   productData.description,
        pricePiasters: productData.pricePiasters,
        categoryName:  productData.categoryName,
      });

      if (result.ok) {
        setContent(result.content);
        setHasGenerated(true);
      } else {
        setError(result.error);
      }
    });
  }

  // ── Gate screen — shown before generation starts ────────────────────────────
  if (!hasGenerated && !isPending) {
    return (
      <Dialog open={open} onOpenChange={(o) => { if (!o) onDone(); }}>
        <DialogContent
          className="max-w-md rounded-[22px]"
          dir={tdir()}
          aria-describedby="marketing-gate-desc"
        >
          <DialogHeader className="text-center">
            <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary/10">
              <Sparkles className="size-7 text-primary" strokeWidth={1.8} />
            </div>
            <DialogTitle className="text-[20px] leading-[25px] font-semibold">
              {tr("عزّز مبيعاتك بالذكاء الاصطناعي ✨")}
            </DialogTitle>
            <DialogDescription id="marketing-gate-desc" className="text-[15px] leading-[21px]">
              {tr("احصل على")}{" "}
              <span className="font-semibold text-foreground">{tr("هوكس فايرل")}</span>{tr("، كابشن سوشيال ميديا، هاشتاجات، أفكار فيديو، وزوايا إعلانية — كلها مولّدة بالـ AI وجاهزة للنشر الآن.")}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-1 rounded-2xl bg-(--fill-3) p-3.5 text-[15px]">
            <p className="text-foreground">{productData.name}</p>
            <p className="mt-0.5 text-[13px] text-muted-foreground">{productData.categoryName}</p>
          </div>

          {error && (
            <p className="rounded-xl bg-(--sys-red)/10 p-3 text-center text-[13px] text-foreground">
              {error}
            </p>
          )}

          <div className="grid gap-2">
            <button type="button" className={cn(appleButton.filled, "w-full")} onClick={handleGenerate}>
              <Sparkles className="size-4" />
              {tr("ولّد المحتوى التسويقي")}
            </button>
            <button type="button" className={cn(appleButton.plain, "mx-0 h-11 w-full")} onClick={onDone}>
              {tr("الآن لا، أكمل")}
              <ChevronRight className="size-4 ltr:-scale-x-100" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (isPending) {
    return (
      <Dialog open={open}>
        <DialogContent
          className="max-w-md rounded-[22px]"
          dir={tdir()}
          aria-describedby="marketing-loading-desc"
        >
          <div className="flex flex-col items-center gap-5 py-8 text-center">
            <div className="relative">
              <div className="size-16 animate-spin rounded-full border-4 border-primary/15 border-t-primary motion-reduce:animate-none" />
              <Sparkles className="absolute inset-0 m-auto size-7 text-primary" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-[17px] font-semibold" id="marketing-loading-desc">
                {tr("جاري توليد المحتوى…")}
              </p>
              <p className="mt-1 text-[15px] text-muted-foreground">
                {tr("الذكاء الاصطناعي يحلل منتجك ويكتب لك محتوى viral ✨")}
              </p>
            </div>
            <div className="w-full space-y-2">
              <SkeletonContent />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Results screen ──────────────────────────────────────────────────────────
  const tabData: Record<TabId, string[]> = {
    hooks:    content?.hooks        ?? [],
    captions: content?.captions     ?? [],
    hashtags: content?.hashtags     ?? [],
    ideas:    content?.contentIdeas ?? [],
    angles:   content?.adAngles     ?? [],
  };

  function copyAll(items: string[]) {
    navigator.clipboard.writeText(items.join("\n\n"));
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onDone(); }}>
      <DialogContent
        className="flex max-h-[90dvh] max-w-2xl flex-col gap-0 overflow-hidden rounded-[22px] p-0"
        dir={tdir()}
        aria-describedby="marketing-results-desc"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Sparkles className="size-5 text-primary" strokeWidth={1.8} />
            </div>
            <div>
              <h2 className="text-[17px] leading-[22px] font-semibold">
                {tr("محتوى تسويقي لـ «{0}»", productData.name)}
              </h2>
              <p className="text-[13px] text-muted-foreground" id="marketing-results-desc">
                {productData.categoryName}
              </p>
            </div>
          </div>
          <span className="inline-flex h-6 shrink-0 items-center gap-1 rounded-full bg-muted px-2.5 text-[12px] text-muted-foreground">
            <Sparkles className="size-3" /> AI
          </span>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="hooks" className="flex min-h-0 flex-1 flex-col">
          <div className="overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
            <TabsList className="h-auto gap-0.5 rounded-full bg-(--sys-gray)/14 p-[3px]">
              {TABS.map(({ id, label, icon: Icon }) => (
                <TabsTrigger
                  key={id}
                  value={id}
                  className="flex h-8 items-center gap-1.5 rounded-full border-0 px-3 text-[13px] text-foreground/70 shadow-none data-[state=active]:bg-card data-[state=active]:font-semibold data-[state=active]:text-foreground data-[state=active]:shadow-[0_3px_8px_rgba(0,0,0,0.12),0_1px_1px_rgba(0,0,0,0.04)]"
                >
                  <Icon className="size-3" />
                  {label}
                  {tabData[id].length > 0 && (
                    <span className="text-muted-foreground tabular-nums">
                      {tabData[id].length}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {TABS.map(({ id }) => (
            <TabsContent key={id} value={id} className="mt-0 flex-1 overflow-hidden">
              <div className="h-85 overflow-y-auto">
                <div className="p-4">
                  {id === "hashtags" ? (
                    <div className="flex flex-wrap gap-2">
                      {tabData[id].map((tag, i) => (
                        <HashtagPill key={i} tag={tag} />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {tabData[id].map((item, i) => (
                        <ContentCard key={i} text={item} index={i} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Footer actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t-[0.5px] border-border px-5 py-3">
          <div className="flex gap-2">
            <button type="button" className={cn(appleButton.tinted, "text-primary")} onClick={handleGenerate} disabled={isPending}>
              <Sparkles className="size-4" />
              {tr("أعد التوليد")}
            </button>
            <button type="button" className={cn(appleButton.plain, "mx-0")} onClick={() => copyAll(Object.values(tabData).flat())}>
              <Copy className="size-4" />
              {tr("نسخ الكل")}
            </button>
          </div>
          <button type="button" className={cn(appleButton.filled, "h-9 px-4")} onClick={onDone}>
            {tr("انتهيت")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
