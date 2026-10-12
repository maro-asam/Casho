import { Check, X } from "lucide-react";
import { toast, type ExternalToast } from "sonner";

// Toasts render outside the store root; these pass Cello's styling.

const base: ExternalToast = { unstyled: true, className: "ce-toast" };

export const ceToast = {
  success(title: string, opts: ExternalToast = {}) {
    toast.success(title, { ...base, icon: <Check className="size-4" />, ...opts });
  },
  error(title: string, opts: ExternalToast = {}) {
    toast.error(title, { ...base, className: "ce-toast ce-toast--error", icon: <X className="size-4" />, ...opts });
  },
};
