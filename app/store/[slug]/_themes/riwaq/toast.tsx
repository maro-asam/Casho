import { Check, X } from "lucide-react";
import { toast, type ExternalToast } from "sonner";
import { st } from "@/lib/i18n/storefront";

// Toasts render outside the store root; these pass Riwaq's ink-slip styling.

const base: ExternalToast = { unstyled: true, className: "rq-toast" };

export const rqToast = {
  success(title: string, opts: ExternalToast = {}) {
    toast.success(st(title), { ...base, icon: <Check className="size-4" />, ...opts });
  },
  error(title: string, opts: ExternalToast = {}) {
    toast.error(st(title), { ...base, className: "rq-toast rq-toast--error", icon: <X className="size-4" />, ...opts });
  },
};
