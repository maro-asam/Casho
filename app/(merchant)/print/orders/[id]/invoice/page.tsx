import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { requireUserId } from "@/actions/auth/require-user-id.actions";
import {
  ORDER_CHANNELS,
  paymentMethodLabel,
} from "@/app/(merchant)/dashboard/orders/_components/order-meta";
import { buildStoreUrl } from "@/helpers/BuildStoreURL";
import { prisma } from "@/lib/prisma";
import { PrintToolbar } from "../../../_components/print-toolbar";
import { lazyIntl, tr } from "@/lib/i18n/dashboard";
import { loadDashboardLocale } from "@/lib/i18n/dashboard/server";

export async function generateMetadata(): Promise<Metadata> {
  await loadDashboardLocale();
  return { title: tr("فاتورة") };
}

const money = lazyIntl.number({ style: "currency", currency: "EGP", maximumFractionDigits: 2 });
const nf = lazyIntl.number();
const dateFormat = lazyIntl.date({ timeZone: "Africa/Cairo", dateStyle: "long" });
const timeFormat = lazyIntl.date({ timeZone: "Africa/Cairo", timeStyle: "short" });

const formatMoney = (piasters: number) => money.format(piasters / 100);
const FEATURE_LABELS: Record<string, string> = { get size() { return tr("المقاس"); }, get color() { return tr("اللون"); } };

function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-6">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="font-medium text-neutral-900">{children}</dd>
    </div>
  );
}

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ print?: string }>;
};

export default async function OrderInvoicePage({ params, searchParams }: PageProps) {
  await loadDashboardLocale();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const userId = await requireUserId();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: {
      id: true,
      name: true,
      slug: true,
      showPoweredByCasho: true,
      poweredByRemovalEnabled: true,
      settings: { select: { logo: true, email: true, whatsappNumber: true } },
    },
  });
  if (!store) notFound();

  const order = await prisma.order.findFirst({
    where: { id, storeId: store.id },
    select: {
      id: true,
      createdAt: true,
      status: true,
      source: true,
      fullName: true,
      phone: true,
      address: true,
      notes: true,
      paymentMethod: true,
      paymentStatus: true,
      paidAt: true,
      subtotal: true,
      shipping: true,
      discount: true,
      total: true,
      couponCode: true,
      shippingMethod: { select: { name: true } },
      items: {
        select: {
          id: true,
          quantity: true,
          price: true,
          selectedFeatures: true,
          product: { select: { name: true, sku: true } },
        },
      },
    },
  });
  if (!order) notFound();

  const invoiceNo = order.id.slice(0, 8).toUpperCase();
  const storeUrl = buildStoreUrl(store.slug).replace(/^https?:\/\//, "");
  const isPaid =
    Boolean(order.paidAt) ||
    order.paymentStatus === "PAID" ||
    order.status === "DELIVERED" ||
    (order.paymentMethod !== "cash_on_delivery" && ["PAID", "SHIPPED"].includes(order.status));
  const canceled = order.status === "CANCELED";
  const showPoweredBy = store.poweredByRemovalEnabled ? store.showPoweredByCasho : true;
  const contact = [store.settings?.whatsappNumber, store.settings?.email].filter(Boolean) as string[];

  return (
    <>
      <PrintToolbar backHref={`/orders/${order.id}`} backLabel={tr("رجوع للطلب")} autoPrint={query?.print === "1"} />

      <article
        className="relative mx-auto max-w-[210mm] bg-white px-10 py-12 text-[13px] leading-6 shadow-sm ring-1 ring-neutral-200 print:max-w-none print:p-0 print:shadow-none print:ring-0 sm:px-14"
        aria-label={tr("فاتورة رقم {0}", invoiceNo)}
      >
        {canceled && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden"
          >
            <span className="-rotate-12 rounded-xl border-4 border-rose-300 px-8 py-2 text-6xl font-black text-rose-300/70">
              {tr("ملغاة")}
            </span>
          </div>
        )}

        {/* Header: seller ←→ document */}
        <header className="flex items-start justify-between gap-8 border-b border-neutral-200 pb-8">
          <div className="flex items-center gap-4">
            {store.settings?.logo && (
              // eslint-disable-next-line @next/next/no-img-element -- plain img prints reliably
              <img src={store.settings.logo} alt="" className="size-14 rounded-lg object-contain" />
            )}
            <div>
              <p className="text-lg font-bold text-neutral-900">{store.name}</p>
              <p className="text-neutral-500" dir="ltr">
                {storeUrl}
              </p>
              {contact.map((line) => (
                <p key={line} className="text-neutral-500" dir="ltr">
                  {line}
                </p>
              ))}
            </div>
          </div>

          <div className="text-end">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">{tr("فاتورة")}</h1>
            <p className="mt-1 font-mono text-sm font-medium text-neutral-600" dir="ltr">
              #{invoiceNo}
            </p>
            <span
              className={
                isPaid
                  ? "mt-3 inline-block rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200"
                  : "mt-3 inline-block rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200"
              }
            >
              {isPaid ? tr("مدفوعة") : order.paymentMethod === "cash_on_delivery" ? tr("الدفع عند الاستلام") : tr("غير مدفوعة")}
            </span>
          </div>
        </header>

        {/* Parties + meta */}
        <section className="grid grid-cols-2 gap-10 py-8">
          <div>
            <h2 className="mb-2 text-xs font-semibold text-neutral-500">{tr("فاتورة إلى")}</h2>
            <p className="text-sm font-semibold text-neutral-900">{order.fullName}</p>
            <p className="text-neutral-700 tabular-nums" dir="ltr">
              {order.phone}
            </p>
            {order.address && <p className="mt-1 whitespace-pre-line text-neutral-700">{order.address}</p>}
          </div>

          <dl className="space-y-1.5 self-start">
            <MetaRow label={tr("تاريخ الفاتورة")}>{dateFormat.format(order.createdAt)}</MetaRow>
            <MetaRow label={tr("الوقت")}>{timeFormat.format(order.createdAt)}</MetaRow>
            <MetaRow label={tr("طريقة الدفع")}>{paymentMethodLabel(order.paymentMethod)}</MetaRow>
            <MetaRow label={tr("القناة")}>{ORDER_CHANNELS[order.source].label}</MetaRow>
            {order.shippingMethod && <MetaRow label={tr("الشحن")}>{order.shippingMethod.name}</MetaRow>}
          </dl>
        </section>

        {/* Line items */}
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-y border-neutral-300 text-xs text-neutral-500">
              <th className="w-10 py-2.5 text-start font-semibold">#</th>
              <th className="py-2.5 text-start font-semibold">{tr("المنتج")}</th>
              <th className="w-20 py-2.5 text-center font-semibold">{tr("الكمية")}</th>
              <th className="w-32 py-2.5 text-end font-semibold">{tr("سعر الوحدة")}</th>
              <th className="w-32 py-2.5 text-end font-semibold">{tr("الإجمالي")}</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => {
              const features = Object.entries((item.selectedFeatures as Record<string, string> | null) ?? {});
              return (
                <tr key={item.id} className="break-inside-avoid border-b border-neutral-200 align-top">
                  <td className="py-3 text-neutral-500 tabular-nums">{nf.format(index + 1)}</td>
                  <td className="py-3">
                    <p className="font-medium text-neutral-900">{item.product.name}</p>
                    {(features.length > 0 || item.product.sku) && (
                      <p className="text-xs text-neutral-500">
                        {features.map(([key, val]) => `${FEATURE_LABELS[key] ?? key}: ${val}`).join(" · ")}
                        {item.product.sku && (
                          <>
                            {features.length > 0 && " · "}
                            SKU <span dir="ltr">{item.product.sku}</span>
                          </>
                        )}
                      </p>
                    )}
                  </td>
                  <td className="py-3 text-center tabular-nums">{nf.format(item.quantity)}</td>
                  <td className="py-3 text-end tabular-nums">{formatMoney(item.price)}</td>
                  <td className="py-3 text-end font-medium tabular-nums">{formatMoney(item.price * item.quantity)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals */}
        <section className="mt-6 flex justify-end">
          <dl className="w-72 space-y-2">
            <MetaRow label={tr("الإجمالي الفرعي")}>
              <span className="tabular-nums">{formatMoney(order.subtotal)}</span>
            </MetaRow>
            <MetaRow label={tr("الشحن")}>
              <span className="tabular-nums">{order.shipping > 0 ? formatMoney(order.shipping) : tr("مجاني")}</span>
            </MetaRow>
            {order.discount > 0 && (
              <MetaRow label={order.couponCode ? tr("الخصم ({0})", order.couponCode) : tr("الخصم")}>
                <span className="tabular-nums">−{formatMoney(order.discount)}</span>
              </MetaRow>
            )}
            <div className="flex items-baseline justify-between gap-6 border-t-2 border-neutral-900 pt-3">
              <dt className="text-sm font-bold text-neutral-900">{tr("الإجمالي المستحق")}</dt>
              <dd className="text-xl font-bold text-neutral-900 tabular-nums">{formatMoney(order.total)}</dd>
            </div>
          </dl>
        </section>

        {order.notes && (
          <section className="mt-8 break-inside-avoid rounded-lg bg-neutral-50 p-4 print:border print:border-neutral-200 print:bg-white">
            <h2 className="mb-1 text-xs font-semibold text-neutral-500">{tr("ملاحظات")}</h2>
            <p className="whitespace-pre-line text-neutral-700">{order.notes}</p>
          </section>
        )}

        <footer className="mt-12 border-t border-neutral-200 pt-6 text-center text-xs text-neutral-500">
          <p className="text-sm font-medium text-neutral-700">{tr("شكرًا لتسوّقك من {0}", store.name)}</p>
          <p className="mt-1">
            {tr("لأي استفسار عن الطلب تواصل معانا واذكر رقم الفاتورة")}{" "}
            <span className="font-mono" dir="ltr">
              #{invoiceNo}
            </span>
          </p>
          {showPoweredBy && <p className="mt-4 text-[11px] text-neutral-400">{tr("اتعملت بواسطة كاشو · casho.store")}</p>}
        </footer>
      </article>
    </>
  );
}
