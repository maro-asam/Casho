"use client";

import { useState } from "react";
import { Copy, CheckCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  rawKey: string;
  name: string;
  onClose: () => void;
}

export default function KeyRevealDialog({ open, rawKey, name, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(rawKey);
    setCopied(true);
    toast.success("تم نسخ المفتاح");
    setTimeout(() => setCopied(false), 3000);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>مفتاح API جديد</span>
          </DialogTitle>
          <DialogDescription>
            تم إنشاء مفتاح <strong>{name}</strong> بنجاح.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-2 rounded-xl border bg-amber-500/5 p-3">
            <AlertTriangle className="size-4 shrink-0 text-amber-600" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              هذا المفتاح لن يُعرض مرة أخرى. انسخه الآن واحتفظ به في مكان آمن.
            </p>
          </div>

          {/* Key display */}
          <div className="group relative rounded-xl border bg-muted/40 p-3 font-mono text-sm" dir="ltr">
            <p className="break-all pr-8 text-xs sm:text-sm">{rawKey}</p>
            <button
              onClick={handleCopy}
              className="absolute left-2 top-2.5 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title="نسخ"
            >
              {copied ? (
                <CheckCheck className="size-4 text-emerald-500" />
              ) : (
                <Copy className="size-4" />
              )}
            </button>
          </div>

          {/* Usage example */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">مثال الاستخدام:</p>
            <div className="rounded-xl border bg-muted/40 px-3 py-2 font-mono text-xs" dir="ltr">
              <span className="text-muted-foreground">curl </span>
              <span className="text-foreground">https://app.casho.store/api/v1/orders</span>
              <br />
              <span className="text-muted-foreground">{"  "}-H </span>
              <span className="text-emerald-600 dark:text-emerald-400">
                &quot;Authorization: Bearer {rawKey.slice(0, 20)}...&quot;
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>حسناً، احتفظت بالمفتاح</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
