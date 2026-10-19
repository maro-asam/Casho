"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, MessageCircle, Printer, X } from "lucide-react";
import { GetPOSOrderAction } from "@/actions/pos/pos.actions";
import { intlLocale, tdir, tr } from "@/lib/i18n/dashboard";

type Order = Awaited<ReturnType<typeof GetPOSOrderAction>>;

type Props = {
  open: boolean;
  onClose: () => void;
  orderId: string;
  store: { name: string; settings: { whatsappNumber: string | null } | null };
  cashierName: string;
};

export default function ReceiptDialog({ open, onClose, orderId, store, cashierName }: Props) {
  const [order, setOrder] = useState<Order | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    GetPOSOrderAction(orderId).then(setOrder);
  }, [open, orderId]);

  const handlePrint = () => {
    if (!order) return;

    const receiptNo = orderId.slice(-6).toUpperCase();
    const esc = (v: string) => v.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
    const branchHtml = order.branch
      ? `<div style="text-align:center;font-size:11px">${esc(order.branch.name)}${order.branch.address ? ` — ${esc(order.branch.address)}` : ""}${order.branch.phone ? `<br/>${esc(order.branch.phone)}` : ""}</div>`
      : "";
    const dateStr = new Date(order.createdAt).toLocaleString(intlLocale(), {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });

    // Printed receipt follows the dashboard language (direction + labels).
    const dir = tdir();
    const end = dir === "rtl" ? "left" : "right";
    const start = dir === "rtl" ? "right" : "left";
    const cur = tr("ج");

    const itemsHtml = order.items.map((item) => {
      const lineTotal = (item.price * item.quantity - (item.discountAmount ?? 0)) / 100;
      const unitPrice = (item.price / 100).toFixed(2);
      const lineDiscount = (item.discountAmount ?? 0) > 0
        ? `<tr><td colspan="3" style="color:#16a34a;font-size:10px;padding-bottom:2px">${tr("خصم سطر: −{0} {1}", ((item.discountAmount ?? 0) / 100).toFixed(2), cur)}</td></tr>`
        : "";
      return `
        <tr>
          <td style="padding:3px 0;word-break:break-word">${esc(item.product.name)}</td>
          <td style="text-align:center;padding:3px 4px;white-space:nowrap">${item.quantity} × ${unitPrice}</td>
          <td style="text-align:${end};padding:3px 0;white-space:nowrap;font-weight:600">${lineTotal.toFixed(2)}</td>
        </tr>
        ${lineDiscount}
      `;
    }).join("");

    const subtotalVal = order.items.reduce((s, i) => s + i.price * i.quantity, 0) / 100;
    const totalVal = order.total / 100;
    const discountVal = order.discount / 100;

    const paymentRow = (label: string, amount: number) =>
      `<tr><td>${esc(label)}</td><td style="text-align:${end};font-weight:600">${amount.toFixed(2)} ${cur}</td></tr>`;
    const paymentsHtml = order.splitPayments.length > 0
      ? order.splitPayments.map((p) => paymentRow(paymentLabels[p.paymentMethod] ?? p.paymentMethod, p.amount / 100)).join("")
      : paymentRow(paymentLabels[order.paymentMethod] ?? order.paymentMethod, totalVal);

    const phoneHtml = order.phone && order.phone !== "-"
      ? `<div><span style="color:#666">${tr("الهاتف:")} </span>${esc(order.phone)}</div>`
      : "";
    const customerHtml = order.fullName && order.fullName !== "عميل نقدي"
      ? `<div style="margin:8px 0;padding:6px 0;border-top:1px dashed #999;border-bottom:1px dashed #999;font-size:11px">
          <div><span style="color:#666">${tr("العميل:")} </span>${esc(order.fullName)}</div>
          ${phoneHtml}
        </div>`
      : "";
    const discountHtml = discountVal > 0
      ? `<tr><td style="color:#16a34a">${tr("الخصم")}</td><td style="color:#16a34a">−${discountVal.toFixed(2)} ${cur}</td></tr>`
      : "";

    const html = `<!DOCTYPE html>
<html dir="${dir}" lang="${dir === "rtl" ? "ar" : "en"}">
<head>
  <meta charset="UTF-8">
  <title>${tr("فاتورة #{0}", receiptNo)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Cairo', Arial, sans-serif; font-size: 12px; color: #111; background: #fff; padding: 12px; direction: ${dir}; }
    .receipt { width: 72mm; margin: 0 auto; }
    .header { text-align: center; padding-bottom: 10px; border-bottom: 2px solid #111; margin-bottom: 8px; }
    .store-name { font-size: 20px; font-weight: 900; letter-spacing: 0.5px; }
    .receipt-title { font-size: 11px; color: #555; margin-top: 2px; }
    .meta { display: flex; justify-content: space-between; font-size: 10.5px; color: #444; margin-bottom: 8px; gap: 4px; }
    .meta-block { line-height: 1.7; }
    .dashed { border-top: 1px dashed #aaa; margin: 7px 0; }
    .solid  { border-top: 2px solid #111; margin: 7px 0; }
    .items { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 4px; }
    .items thead th { font-size: 10px; font-weight: 700; color: #555; padding: 2px 0 4px; border-bottom: 1px solid #ddd; }
    .items thead th:last-child { text-align: ${end}; }
    .items thead th:nth-child(2) { text-align: center; }
    .totals { width: 100%; border-collapse: collapse; font-size: 12px; }
    .totals td { padding: 2px 0; }
    .totals td:last-child { text-align: ${end}; }
    .total-row td { font-size: 16px; font-weight: 900; padding-top: 5px; }
    .payments { width: 100%; border-collapse: collapse; font-size: 11.5px; }
    .payments td { padding: 2px 0; }
    .payments td:last-child { text-align: ${end}; }
    .footer { text-align: center; margin-top: 10px; font-size: 10.5px; color: #666; line-height: 1.8; border-top: 2px solid #111; padding-top: 8px; }
    .barcode-text { font-family: 'Courier New', monospace; font-size: 13px; letter-spacing: 3px; color: #222; margin: 4px 0; }
    @media print { body { padding: 0; } .receipt { width: 100%; } }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="store-name">${esc(store.name)}</div>
      ${branchHtml}
      <div class="receipt-title">${tr("فاتورة بيع — نقطة البيع")}</div>
    </div>
    <div class="meta">
      <div class="meta-block">
        <div>${tr("رقم الفاتورة")}</div>
        <div>${tr("التاريخ")}</div>
        <div>${tr("الكاشير")}</div>
      </div>
      <div class="meta-block" style="text-align:${end};font-weight:600">
        <div>#${receiptNo}</div>
        <div>${dateStr}</div>
        <div>${esc(cashierName)}</div>
      </div>
    </div>
    ${customerHtml}
    <div class="dashed"></div>
    <table class="items">
      <thead>
        <tr>
          <th style="text-align:${start}">${tr("الصنف")}</th>
          <th>${tr("الكمية × السعر")}</th>
          <th style="text-align:${end}">${tr("الإجمالي")}</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    <div class="solid"></div>
    <table class="totals">
      <tr><td style="color:#555">${tr("المجموع قبل الخصم")}</td><td>${subtotalVal.toFixed(2)} ${cur}</td></tr>
      ${discountHtml}
      <tr class="total-row"><td>${tr("الإجمالي")}</td><td>${totalVal.toFixed(2)} ${cur}</td></tr>
    </table>
    <div class="dashed"></div>
    <table class="payments">${paymentsHtml}</table>
    <div class="footer">
      <div class="barcode-text">|||  #${receiptNo}  |||</div>
      <div>${tr("شكراً لتسوقكم معنا")}</div>
      <div>${tr("يسعدنا خدمتكم دائماً")}</div>
    </div>
  </div>
</body>
</html>`;

    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) { document.body.removeChild(iframe); return; }

    doc.write(html);
    doc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 500);
  };

  const handleWhatsApp = () => {
    if (!order) return;
    const phone = store.settings?.whatsappNumber?.replace(/\D/g, "");
    if (!phone) return;
    const items = order.items.map((i) => tr("• {0} ×{1} = {2} ج", i.product.name, i.quantity, (i.price * i.quantity / 100).toFixed(0))).join("\n");
    const msg = encodeURIComponent(
      tr("🧾 فاتورة #{0}\n", orderId.slice(-6).toUpperCase()) +
      `👤 ${order.fullName}\n\n` +
      `${items}\n\n` +
      `━━━━━━━━━━━━\n` +
      tr("💰 الإجمالي: {0} ج\n", (order.total / 100).toFixed(0)) +
      `📅 ${new Date(order.createdAt).toLocaleString(intlLocale())}`,
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  const paymentLabels: Record<string, string> = {
    cash: tr("نقداً"),
    card: tr("بطاقة"),
    vodafone_cash: tr("فودافون كاش"),
    instapay: tr("انستاباي"),
    bank_transfer: tr("تحويل بنكي"),
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm" dir={tdir()}>
        {/* Success header */}
        <div className="flex flex-col items-center gap-2 pb-2">
          <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100">
            <Check className="size-6 text-emerald-600" />
          </div>
          <p className="text-base font-bold text-emerald-600">{tr("تم البيع بنجاح!")}</p>
        </div>

        {/* Receipt */}
        <div
          ref={printRef}
          className="receipt rounded-lg border border-dashed border-border p-4 bg-muted/20 text-sm space-y-2"
        >
          <div className="center bold text-base">{store.name}</div>
          {order?.branch && <div className="center text-xs text-muted-foreground">{order.branch.name}</div>}
          <div className="center text-xs text-muted-foreground">
            {tr("فاتورة #{0}", orderId.slice(-6).toUpperCase())}
          </div>
          <div className="center text-xs text-muted-foreground">
            {new Date().toLocaleString(intlLocale())}
          </div>
          <div className="line" />

          {order ? (
            <>
              {order.items.map((item) => (
                <div key={item.id} className="row">
                  <span className="flex-1">{item.product.name} ×{item.quantity}</span>
                  <span>{tr("{0} ج", (item.price * item.quantity / 100).toFixed(0))}</span>
                </div>
              ))}

              <div className="line" />

              {order.discount > 0 && (
                <div className="row text-emerald-600">
                  <span>{tr("الخصم")}</span>
                  <span>{tr("−{0} ج", (order.discount / 100).toFixed(0))}</span>
                </div>
              )}

              <div className="row total">
                <span>{tr("الإجمالي")}</span>
                <span>{tr("{0} ج", (order.total / 100).toFixed(0))}</span>
              </div>

              <div className="line" />

              {order.splitPayments.length > 0 ? (
                order.splitPayments.map((p, i) => (
                  <div key={i} className="row text-xs">
                    <span>{paymentLabels[p.paymentMethod] ?? p.paymentMethod}</span>
                    <span>{tr("{0} ج", (p.amount / 100).toFixed(0))}</span>
                  </div>
                ))
              ) : (
                <div className="row text-xs">
                  <span>{paymentLabels[order.paymentMethod] ?? order.paymentMethod}</span>
                  <span>{tr("{0} ج", (order.total / 100).toFixed(0))}</span>
                </div>
              )}

              <div className="line" />
              <div className="center text-xs text-muted-foreground">
                {tr("الكاشير: {0}", cashierName)}
              </div>
              <div className="center text-xs text-muted-foreground">
                {tr("شكراً لتسوقكم معنا 🙏")}
              </div>
            </>
          ) : (
            <div className="text-center text-muted-foreground text-xs">{tr("جاري التحميل...")}</div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 gap-1.5" onClick={handlePrint}>
            <Printer className="size-4" />
            {tr("طباعة")}
          </Button>
          {store.settings?.whatsappNumber && (
            <Button
              variant="outline"
              className="flex-1 gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              onClick={handleWhatsApp}
            >
              <MessageCircle className="size-4" />
              {tr("واتساب")}
            </Button>
          )}
          <Button className="flex-1 gap-1.5" onClick={onClose}>
            <X className="size-4" />
            {tr("إغلاق")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
