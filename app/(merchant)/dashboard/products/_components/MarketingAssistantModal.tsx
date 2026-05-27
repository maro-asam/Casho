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
  Loader2,
  Hash,
  Zap,
  FileText,
  Lightbulb,
  Target,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { generateMarketingFromDataAction } from "@/actions/ai/generate-marketing.actions";
import type { MarketingContent } from "@/lib/ai/marketing-assistant";

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
  { id: "hooks",    label: "هوكس",      icon: Zap         },
  { id: "captions", label: "كابشن",     icon: FileText    },
  { id: "hashtags", label: "هاشتاج",    icon: Hash        },
  { id: "ideas",    label: "أفكار",     icon: Lightbulb   },
  { id: "angles",   label: "زوايا إعلان", icon: Target    },
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
      className="shrink-0 rounded-lg p-1.5 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-muted hover:text-foreground"
      title="نسخ"
    >
      {copied ? (
        <Check className="size-3.5 text-green-500" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </button>
  );
}

// ─── Content card ─────────────────────────────────────────────────────────────

function ContentCard({ text, index }: { text: string; index: number }) {
  return (
    <div className="group flex items-start gap-3 rounded-xl border bg-card p-3.5 transition hover:border-primary/30 hover:bg-primary/5">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {index + 1}
      </span>
      <p className="flex-1 text-sm leading-relaxed text-foreground">{text}</p>
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
      onClick={handleCopy}
      className={cn(
        "rounded-full border px-3 py-1 text-sm transition",
        copied
          ? "border-green-500/40 bg-green-500/10 text-green-600"
          : "border-border bg-muted/40 text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
      )}
    >
      {copied ? <Check className="inline-block size-3 me-1" /> : null}
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
          className="flex gap-3 rounded-xl border p-3.5"
          style={{ opacity: 1 - i * 0.18 }}
        >
          <div className="h-6 w-6 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
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
          className="max-w-md rounded-2xl"
          dir="rtl"
          aria-describedby="marketing-gate-desc"
        >
          <DialogHeader className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
              <Sparkles className="size-7 text-white" />
            </div>
            <DialogTitle className="text-lg">
              عزّز مبيعاتك بالذكاء الاصطناعي ✨
            </DialogTitle>
            <DialogDescription id="marketing-gate-desc" className="leading-6">
              احصل على{" "}
              <span className="font-semibold text-foreground">هوكس فايرل</span>،
              كابشن سوشيال ميديا، هاشتاجات، أفكار فيديو، وزوايا إعلانية — كلها
              مولّدة بالـ AI وجاهزة للنشر الآن.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-1 rounded-xl border border-border/60 bg-muted/30 p-3.5 text-sm">
            <p className="font-medium text-foreground">{productData.name}</p>
            <p className="mt-0.5 text-muted-foreground">{productData.categoryName}</p>
          </div>

          {error && (
            <p className="rounded-xl bg-destructive/10 p-3 text-center text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="grid gap-2">
            <Button
              className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
              onClick={handleGenerate}
            >
              <Sparkles className="me-2 size-4" />
              ولّد المحتوى التسويقي
            </Button>
            <Button
              variant="ghost"
              className="w-full rounded-xl text-muted-foreground"
              onClick={onDone}
            >
              الآن لا، أكمل
              <ChevronRight className="ms-1.5 size-4" />
            </Button>
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
          className="max-w-md rounded-2xl"
          dir="rtl"
          aria-describedby="marketing-loading-desc"
        >
          <div className="flex flex-col items-center gap-5 py-8 text-center">
            <div className="relative">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-purple-500/20 border-t-purple-500" />
              <Sparkles className="absolute inset-0 m-auto size-7 text-purple-500" />
            </div>
            <div>
              <p className="text-base font-semibold" id="marketing-loading-desc">
                جاري توليد المحتوى…
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                الذكاء الاصطناعي يحلل منتجك ويكتب لك محتوى viral ✨
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
        className="flex max-h-[90dvh] max-w-2xl flex-col gap-0 rounded-2xl p-0"
        dir="rtl"
        aria-describedby="marketing-results-desc"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
              <Sparkles className="size-4.5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold leading-none">
                محتوى تسويقي لـ «{productData.name}»
              </h2>
              <p className="mt-1 text-xs text-muted-foreground" id="marketing-results-desc">
                {productData.categoryName}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="shrink-0 border-purple-500/30 bg-purple-500/5 text-purple-600"
          >
            <Sparkles className="me-1 size-3" /> AI Generated
          </Badge>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="hooks" className="flex min-h-0 flex-1 flex-col">
          <div className="border-b px-5 pt-3">
            <TabsList className="h-auto gap-1 bg-transparent p-0">
              {TABS.map(({ id, label, icon: Icon }) => (
                <TabsTrigger
                  key={id}
                  value={id}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Icon className="size-3" />
                  {label}
                  {tabData[id].length > 0 && (
                    <span className="ms-0.5 rounded-full bg-current/15 px-1 text-[10px] font-bold">
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
        <div className="flex items-center justify-between border-t px-5 py-3">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg text-xs"
              onClick={handleGenerate}
              disabled={isPending}
            >
              <Sparkles className="me-1.5 size-3" />
              أعد التوليد
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-lg text-xs text-muted-foreground"
              onClick={() => copyAll(
                Object.values(tabData).flat(),
              )}
            >
              <Copy className="me-1.5 size-3" />
              نسخ الكل
            </Button>
          </div>
          <Button
            size="sm"
            className="rounded-lg text-xs"
            onClick={onDone}
          >
            انتهيت
            <ArrowRight className="ms-1.5 size-3" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
