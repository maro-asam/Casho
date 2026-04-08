"use client";

import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const CopyStoreLinkBtn = ({ storeUrl }: { storeUrl: string }) => {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-background/80 px-4 py-3 text-sm shadow-sm">
      <span className="text-muted-foreground">رابط المتجر:</span>

      <a
        href={storeUrl}
        target="_blank"
        className="rounded-lg bg-primary/5 px-2 py-1 font-medium text-primary hover:underline flex items-center gap-1"
      >
        {storeUrl}
        <ExternalLink className="size-3" />
      </a>

      <button
        onClick={async () => {
          await navigator.clipboard.writeText(storeUrl);
          toast.success("تم نسخ الرابط");
        }}
        className="rounded-lg p-1 hover:bg-primary/10 transition"
      >
        <Copy className="size-4 text-primary" />
      </button>
    </div>
  );
};

export default CopyStoreLinkBtn;
