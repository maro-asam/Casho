import { Check, X } from "lucide-react";
import { toast, type ExternalToast } from "sonner";
import { st } from "@/lib/i18n/storefront";

// Toasts render outside the store root; these pass Dune's styling.

const base: ExternalToast = { unstyled: true, className: "dn-toast" };

export const dnToast = {
  success(title: string, opts: ExternalToast = {}) {
    toast.success(st(title), { ...base, icon: <Check className="size-4" />, ...opts });
  },
  error(title: string, opts: ExternalToast = {}) {
    toast.error(st(title), { ...base, className: "dn-toast dn-toast--error", icon: <X className="size-4" />, ...opts });
  },
};
