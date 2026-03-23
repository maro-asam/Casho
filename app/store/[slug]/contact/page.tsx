import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Phone, MapPin, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";

type StoreContactRouteProps = {
  params: Promise<{ slug: string }>;
};

export default async function StoreContactRoute({
  params,
}: StoreContactRouteProps) {
  const { slug } = await params;

  if (!slug) return notFound();

  const store = await prisma.store.findUnique({
    where: { slug },
    select: {
      name: true,
      slug: true,
      subscriptionStatus: true,
      // ضيفهم بعدين في الموديل لو مش موجودين
      phone: true,
      email: true,
      address: true,
    },
  });

  if (!store) return notFound();

  if (store.subscriptionStatus !== "active") {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="border rounded-22xl p-10 text-center">
          <h1 className="text-2xl font-bold mb-4">المتجر غير مفعل</h1>
          <p className="text-gray-500">
            لازم صاحب المتجر يفعل الاشتراك الأول
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="wrapper py-12 space-y-10" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            تواصل مع {store.name}
          </h1>
          <p className="text-muted-foreground">
            لو عندك أي سؤال أو استفسار، إحنا معاك
          </p>
        </div>

        <Link
          href={`/store/${store.slug}`}
          className="flex items-center gap-2 text-primary hover:underline"
        >
          الرجوع للمتجر
          <ArrowRight />
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Contact Info */}
        <div className="border rounded-22xl p-6 space-y-5 bg-background">
          <h2 className="text-xl font-semibold">بيانات التواصل</h2>

          <div className="space-y-4 text-muted-foreground">
            {store.phone && (
              <div className="flex items-center gap-3">
                <Phone className="text-primary" />
                <span>{store.phone}</span>
              </div>
            )}

            {store.email && (
              <div className="flex items-center gap-3">
                <Mail className="text-primary" />
                <span>{store.email}</span>
              </div>
            )}

            {store.address && (
              <div className="flex items-center gap-3">
                <MapPin className="text-primary" />
                <span>{store.address}</span>
              </div>
            )}

            {!store.phone && !store.email && !store.address && (
              <p>لا توجد بيانات تواصل حالياً</p>
            )}
          </div>
        </div>

        {/* Contact Form */}
        <form
          action="#"
          className="border rounded-22xl p-6 space-y-4 bg-background"
        >
          <h2 className="text-xl font-semibold">ابعتلنا رسالة</h2>

          <input
            type="text"
            name="name"
            placeholder="اسمك"
            className="w-full border rounded-xl px-4 py-3 outline-none focus:border-primary"
            required
          />

          <input
            type="email"
            name="email"
            placeholder="ايميلك"
            className="w-full border rounded-xl px-4 py-3 outline-none focus:border-primary"
            required
          />

          <textarea
            name="message"
            placeholder="اكتب رسالتك هنا..."
            rows={4}
            className="w-full border rounded-xl px-4 py-3 outline-none focus:border-primary"
            required
          />

          <button
            type="submit"
            className="w-full bg-primary text-white py-3 rounded-xl font-medium hover:opacity-90 transition"
          >
            ارسال الرسالة
          </button>
        </form>
      </div>
    </div>
  );
}