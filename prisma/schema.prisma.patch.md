# Prisma patch

افتح `prisma/schema.prisma` وطبّق التعديلات دي:

## 1) داخل model Store

ضيف السطر ده جنب العلاقات الحالية:

```prisma
paymentSettings StorePaymentSettings?
```

## 2) داخل model Order

بعد `paymentMethod String` ضيف الحقول دي:

```prisma
paymentProvider  String?
paymentStatus    String?
paymentReference String?
paidAt           DateTime?
```

## 3) ضيف enum جديد

```prisma
enum KashierMode {
  TEST
  LIVE
}
```

## 4) ضيف model جديد

```prisma
model StorePaymentSettings {
  id      String @id @default(uuid())
  storeId String @unique
  store   Store  @relation(fields: [storeId], references: [id], onDelete: Cascade)

  cashOnDeliveryEnabled Boolean @default(true)

  vodafoneCashEnabled Boolean @default(false)
  vodafoneCashNumber  String?

  instapayEnabled Boolean @default(false)
  instapayAddress String?

  bankTransferEnabled Boolean @default(false)
  bankTransferDetails String?

  kashierEnabled         Boolean     @default(false)
  kashierMode            KashierMode @default(TEST)
  kashierMerchantId      String?
  kashierApiKeyEncrypted String?
  kashierApiKeyHint      String?
  kashierAllowedMethods  String[]    @default([])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([kashierEnabled])
}
```

بعدها شغّل:

```bash
npx prisma generate
npx prisma db push
```

أو لو بتستخدم migrations:

```bash
npx prisma migrate dev --name add-store-payment-methods
```
