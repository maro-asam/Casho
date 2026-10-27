"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { SetOrderEmailSettingAction, type OrderEmailSetting } from "@/actions/store/settings.actions";
import { Switch } from "@/components/ui/switch";
import { tr, trv } from "@/lib/i18n/dashboard";
import { Group } from "./settings-ui";

type Values = Record<OrderEmailSetting, boolean>;

/** The two order-email switches — optimistic, rolled back on failure. */
export default function OrderEmailSettings({ ownerEmail, initial }: { ownerEmail: string; initial: Values }) {
  const [values, setValues] = useState(initial);
  const [pending, startTransition] = useTransition();

  function toggle(setting: OrderEmailSetting, next: boolean) {
    setValues((v) => ({ ...v, [setting]: next }));
    startTransition(async () => {
      const result = await SetOrderEmailSettingAction(setting, next);
      if (!result.ok) {
        setValues((v) => ({ ...v, [setting]: !next }));
        toast.error(trv(result.message));
        return;
      }
      toast.success(trv(result.message));
    });
  }

  const rows: { setting: OrderEmailSetting; title: string; description: string }[] = [
    {
      setting: "emailNewOrders",
      title: tr("إيميل بكل طلب جديد"),
      description: tr("يوصلك على {0} أول ما طلب جديد يتأكد.", ownerEmail),
    },
    {
      setting: "emailStoreAlerts",
      title: tr("تنبيهات المتجر"),
      description: tr("لما منتج يقرب يخلص أو يخلص، ولما دفع أونلاين ميكمّلش — مرة واحدة بالكتير لكل منتج في اليوم."),
    },
    {
      setting: "emailCustomerOrders",
      title: tr("إيميلات للعميل"),
      description: tr("تأكيد الطلب، وتحديث لما يتدفع أو يتشحن أو يتسلّم أو يتلغى — للعملاء اللي كتبوا إيميلهم."),
    },
  ];

  return (
    <Group
      id="emails"
      title={tr("إيميلات الطلبات")}
      footer={tr("إيميلات العميل بتتبعت باسم متجرك، ولو كاتب إيميل تواصل في بيانات المتجر، ردود العملاء بتوصلك عليه.")}
    >
      {rows.map((row) => (
        <label key={row.setting} className="flex min-h-11 cursor-pointer items-center justify-between gap-4 px-4 py-3">
          <span className="min-w-0">
            <span className="block text-[15px]">{row.title}</span>
            <span className="block text-[13px] leading-5 text-muted-foreground">{row.description}</span>
          </span>
          <Switch
            checked={values[row.setting]}
            onCheckedChange={(next) => toggle(row.setting, next)}
            disabled={pending}
            aria-label={row.title}
            className="apple-switch shrink-0"
          />
        </label>
      ))}
    </Group>
  );
}
