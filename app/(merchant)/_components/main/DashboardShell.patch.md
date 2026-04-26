# DashboardShell patch

في `app/(merchant)/_components/main/DashboardShell.tsx` انقل بوابات الدفع من COMING SOON وخليها لينك شغال.

استبدل العنصر القديم:

```tsx
{
  name: "بوابات الدفع",
  href: "/dashboard/payment-gateways",
  icon: CreditCard,
  disabled: true,
  badge: "Soon",
},
```

بـ:

```tsx
{
  name: "بوابات الدفع",
  href: "/dashboard/payment-methods",
  icon: CreditCard,
},
```

الأفضل تحطه في Section اسمها STORE بدل COMING SOON، مثلًا بعد تخصيص المتجر أو قبل اعدادات SEO.

الملف `app/(merchant)/dashboard/payment-gateways/page.tsx` الموجود في الباندل بيعمل redirect تلقائي للمسار الجديد.
