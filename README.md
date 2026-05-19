# Casho In-App Notification System

دي implementation كاملة للـ in-app notifications في Casho:

- Prisma `Notification` model + `NotificationType` enum.
- Server Actions للقراءة، العدّ، تعليم مقروء، تعليم الكل، والحذف.
- Helper آمن `createNotification` لا يكسّر الـ business flow لو الإشعار فشل.
- Bell dropdown في Dashboard header + polling كل 30 ثانية.
- صفحة كاملة `/dashboard/notifications` فيها filters وحذف/mark read.
- Wiring جاهز في الأوردرات، طلبات الرصيد، الدعم، الخدمات، وقرارات الأدمن المهمة.

## الملفات الجديدة / المستبدلة

انسخ محتوى الفولدر ده فوق مشروع Casho بنفس المسارات:

```bash
# من داخل فولدر المشروع
cp -R path/to/casho-notifications-system/* .
```

أو افتح الملفات واحدة واحدة وانقل التعديلات لو عندك تغييرات محلية في نفس الملفات.

## أوامر التشغيل

بعد النسخ:

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

لو بتستخدم migrations بدل `db push`:

```bash
npx prisma migrate dev --name add_notifications
npm run dev
```

## أهم أماكن الربط

- `actions/store/orders.actions.ts`
  - ينشئ Notification عند إنشاء أوردر جديد.
  - ينشئ Notification عند تغيير حالة أوردر.

- `actions/balance/topup.actions.ts`
  - إشعار عند إرسال طلب شحن.
  - إشعار عند الموافقة / الرفض.

- `actions/admin/admin-topup.actions.ts`
  - إشعار للتاجر لما الأدمن يعتمد أو يرفض طلب الشحن.

- `actions/support/create-support.actions.ts`
  - إشعار تأكيد للتاجر بعد إرسال طلب دعم.

- `actions/services/*`
  - إشعارات طلبات الخدمات وطلب إزالة Powered by Casho.

- `actions/admin/service-requests.actions.ts`
  - إشعار عند تحديث حالة طلب الخدمة.

- `app/(merchant)/_components/main/DashboardShell.tsx`
  - أضاف زر الإشعارات في الهيدر ورابط الإشعارات في القائمة.

- `app/(merchant)/dashboard/notifications/page.tsx`
  - صفحة الإشعارات الكاملة.

## ملاحظات مهمة

1. الإشعار لا يوقف الأوردر أو الشحن لو فشل. `createNotification` بيعمل catch وبيطبع error فقط.
2. الإشعارات scoped حسب `userId` أو `storeId`، والـ Server Actions بتتأكد إن المستخدم الحالي يملك المتجر.
3. الـ dropdown بيعمل polling كل 30 ثانية، كفاية جدًا للـ MVP. لو حبيت real-time بعدين، ممكن تبدله بـ SSE/WebSocket من غير تغيير الـ DB model.
4. لو عندك TypeScript error بعد النسخ، شغل `npx prisma generate` الأول لأن `NotificationType` و`prisma.notification` مش هيظهروا غير بعد تحديث Prisma Client.
