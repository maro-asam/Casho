"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";

import { updateServiceRequestStatusAction } from "@/actions/admin/service-requests.actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ServiceRequestStatusValue =
  | "PENDING"
  | "CONTACTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELED";

const statusOptions: {
  value: ServiceRequestStatusValue;
  label: string;
}[] = [
  { value: "PENDING", label: "جديد" },
  { value: "CONTACTED", label: "تم التواصل" },
  { value: "IN_PROGRESS", label: "جاري التنفيذ" },
  { value: "COMPLETED", label: "مكتمل" },
  { value: "CANCELED", label: "ملغي" },
];

export default function ServiceRequestStatusSelect({
  requestId,
  value,
}: {
  requestId: string;
  value: ServiceRequestStatusValue;
}) {
  const [state, formAction, isPending] = useActionState(
    updateServiceRequestStatusAction,
    null,
  );

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }

    if (state?.success) {
      toast.success("تم تحديث الحالة");
    }
  }, [state]);

  return (
    <form action={formAction} className="w-[180px]">
      <input type="hidden" name="requestId" value={requestId} />

      <input type="hidden" name="status" value={value} id={`status-${requestId}`} />

      <div className="relative">
        <Select
          defaultValue={value}
          disabled={isPending}
          onValueChange={(nextValue) => {
            const input = document.getElementById(
              `status-${requestId}`,
            ) as HTMLInputElement | null;

            if (!input) return;

            input.value = nextValue;
            input.form?.requestSubmit();
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="اختر الحالة" />
          </SelectTrigger>

          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isPending ? (
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : null}
      </div>
    </form>
  );
}