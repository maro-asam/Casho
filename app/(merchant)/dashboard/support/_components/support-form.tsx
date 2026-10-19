"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { createSupportRequest } from "@/actions/support/create-support.actions";

import { SendHorizonal, Loader2} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { tr } from "@/lib/i18n/dashboard";

export default function SupportForm() {
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createSupportRequest(formData);

      if (result?.success) {
        toast.success(tr("تم إرسال الطلب بنجاح"));
      } else {
        toast.error(result?.message || tr("حدث خطأ أثناء الإرسال"));
      }
    });
  }

  return (
    <Card className="overflow-hidden ">
      <CardContent className="space-y-6 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge className="rounded-xl bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10">
            {tr("دعم فني")}
          </Badge>

          <Badge variant="outline" className="rounded-xl px-3 py-1 text-xs">
            {tr("الرد خلال 24 ساعة")}
          </Badge>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{tr("إرسال طلب دعم")}</h1>

          <p className="text-sm leading-7 text-muted-foreground">
            {tr("اشرح المشكلة أو الطلب الذي تحتاجه وسيقوم فريق Casho بمراجعته في أسرع وقت ممكن.")}
          </p>
        </div>

        <form action={handleSubmit} className="space-y-5">
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium">{tr("عنوان المشكلة")}</label>

            <Input
              name="title"
              placeholder={tr("مثال: مشكلة في استقبال الطلبات")}
              required
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium">{tr("تفاصيل الطلب")}</label>

            <Textarea
              name="message"
              placeholder={tr("اكتب كل التفاصيل المتعلقة بالمشكلة أو الطلب...")}
              className="min-h-40 resize-none"
              required
            />
          </div>

          <div className="flex justify-start">
            <Button type="submit" className="px-6" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="me-2 size-4 animate-spin" />
                  {tr("جاري الإرسال...")}
                </>
              ) : (
                <>
                  <SendHorizonal className="me-2 size-4" />
                  {tr("إرسال الطلب")}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
