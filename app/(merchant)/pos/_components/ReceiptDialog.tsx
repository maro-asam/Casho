"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, MessageCircle, Printer, X } from "lucide-react";
import { GetPOSOrderAction } from "@/actions/pos/pos.actions";

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
    const dateStr = new Date(order.createdAt).toLocaleString("ar-EG", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });

    const itemsHtml = order.items.map((item) => {
      const lineTotal = (item.price * item.quantity - (item.discountAmount ?? 0)) / 100;
      const unitPrice = (item.price / 100).toFixed(2);
      return `
        <tr>
          <td style="padding:3px 0;word-break:break-word">${item.product.name}</td>
          <td style="text-align:center;padding:3px 4px;white-space:nowrap">${item.quantity} × ${unitPrice}</td>
          <td style="text-align:left;padding:3px 0;white-space:nowrap;font-weight:600">${lineTotal.toFixed(2)}</td>
        </tr>
        ${(item.discountAmount ?? 0) > 0 ? `<tr><td colspan="3" style="color:#16a34a;font-size:10px;padding-bottom:2px">خصم سطر: −${((item.discountAmount ?? 0) / 100).toFixed(2)} ج</td></tr>` : ""}
      `;
    }).join("");

    const subtotalVal = order.items.reduce((s, i) => s + i.price * i.quantity, 0) / 100;
    const totalVal = order.total / 100;
    const discountVal = order.discount / 100;

    const paymentsHtml = order.splitPayments.length > 0
      ? order.splitPayments.map((p) => `
          <tr>
            <td>${paymentLabels[p.paymentMethod] ?? p.paymentMethod}</td>
            <td style="text-align:left;font-weight:600">${(p.amount / 100).toFixed(2)} ج</td>
          </tr>`).join("")
      : `<tr>
           <td>${paymentLabels[order.paymentMethod] ?? order.paymentMethod}</td>
           <td style="text-align:left;font-weight:600">${totalVal.toFixed(2)} ج</td>
         </tr>`;

    const customerHtml = order.fullName && order.fullName !== "عميل نقدي" ? `
      <div style="margin:8px 0;padding:6px 0;border-top:1px dashed #999;border-bottom:1px dashed #999;font-size:11px">
        <div><span style="color:#666">العميل: </span>${order.fullName}</div>
        ${order.phone && order.phone !== "-" ? `<div><span style="color:#666">الهاتف: </span>${order.phone}</div>` : ""}
      </div>` : "";

    const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>فاتورة #${receiptNo}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Cairo', Arial, sans-serif;
      font-size: 12px;
      color: #111;
      background: #fff;
      padding: 12px;
      direction: rtl;
    }
    .receipt {
      width: 72mm;
      margin: 0 auto;
    }
    /* ── Header ── */
    .header {
      text-align: center;
      padding-bottom: 10px;
      border-bottom: 2px solid #111;
      margin-bottom: 8px;
    }
    .store-name {
      font-size: 20px;
      font-weight: 900;
      letter-spacing: 0.5px;
    }
    .receipt-title {
      font-size: 11px;
      color: #555;
      margin-top: 2px;
    }
    /* ── Meta ── */
    .meta {
      display: flex;
      justify-content: space-between;
      font-size: 10.5px;
      color: #444;
      margin-bottom: 8px;
      gap: 4px;
    }
    .meta-block { line-height: 1.7; }
    /* ── Divider ── */
    .dashed { border-top: 1px dashed #aaa; margin: 7px 0; }
    .solid  { border-top: 2px solid #111; margin: 7px 0; }
    /* ── Items table ── */
    .items {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-bottom: 4px;
    }
    .items thead th {
      font-size: 10px;
      font-weight: 700;
      color: #555;
      padding: 2px 0 4px;
      border-bottom: 1px solid #ddd;
    }
    .items thead th:last-child { text-align: left; }
    .items thead th:nth-child(2) { text-align: center; }
    /* ── Totals ── */
    .totals {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .totals td { padding: 2px 0; }
    .totals td:last-child { text-align: left; }
    .total-row td {
      font-size: 16px;
      font-weight: 900;
      padding-top: 5px;
    }
    /* ── Payments ── */
    .payments {
      width: 100%;
      border-collapse: collapse;
      font-size: 11.5px;
    }
    .payments td { padding: 2px 0; }
    .payments td:last-child { text-align: left; }
    /* ── Footer ── */
    .footer {
      text-align: center;
      margin-top: 10px;
      font-size: 10.5px;
      color: #666;
      line-height: 1.8;
      border-top: 2px solid #111;
      padding-top: 8px;
    }
    .barcode-text {
      font-family: 'Courier New', monospace;
      font-size: 13px;
      letter-spacing: 3px;
      color: #222;
      margin: 4px 0;
    }
    @media print {
      body { padding: 0; }
      .receipt { width: 100%; }
    }
  </style>
</head>
<body>
  <div class="receipt">

    <!-- Header -->
    <div class="header">
      <div class="store-name">${store.name}</div>
      <div class="receipt-title">فاتورة بيع — نقطة البيع</div>
    </div>

    <!-- Meta -->
    <div class="meta">
      <div class="meta-block">
        <div>رقم الفاتورة</div>
        <div>التاريخ</div>
        <div>الكاشير</div>
      </div>
      <div class="meta-block" style="text-align:left;font-weight:600">
        <div>#${receiptNo}</div>
        <div>${dateStr}</div>
        <div>${cashierName}</div>
      </div>
    </div>

    ${customerHtml}

    <div class="dashed"></div>

    <!-- Items -->
    <table class="items">
      <thead>
        <tr>
          <th style="text-align:right">الصنف</th>
          <th>الكمية × السعر</th>
          <th style="text-align:left">الإجمالي</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="solid"></div>

    <!-- Totals -->
    <table class="totals">
      <tr>
        <td style="color:#555">المجموع قبل الخصم</td>
        <td>${subtotalVal.toFixed(2)} ج</td>
      </tr>
      ${discountVal > 0 ? `
      <tr>
        <td style="color:#16a34a">الخصم</td>
        <td style="color:#16a34a">−${discountVal.toFixed(2)} ج</td>
      </tr>` : ""}
      <tr class="total-row">
        <td>الإجمالي</td>
        <td>${totalVal.toFixed(2)} ج</td>
      </tr>
    </table>

    <div class="dashed"></div>

    <!-- Payments -->
    <table class="payments">
      ${paymentsHtml}
    </table>

    <!-- Footer -->
    <div class="footer">
      <div class="barcode-text">|||  #${receiptNo}  |||</div>
      <div>شكراً لتسوقكم معنا</div>
      <div>يسعدنا خدمتكم دائماً</div>
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
    const items = order.items.map((i) => `• ${i.product.name} ×${i.quantity} = ${(i.price * i.quantity / 100).toFixed(0)} ج`).join("\n");
    const msg = encodeURIComponent(
      `🧾 فاتورة #${orderId.slice(-6).toUpperCase()}\n` +
      `👤 ${order.fullName}\n\n` +
      `${items}\n\n` +
      `━━━━━━━━━━━━\n` +
      `💰 الإجمالي: ${(order.total / 100).toFixed(0)} ج\n` +
      `📅 ${new Date(order.createdAt).toLocaleString("ar-EG")}`,
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  const paymentLabels: Record<string, string> = {
    cash: "نقداً",
    card: "بطاقة",
    vodafone_cash: "فودافون كاش",
    instapay: "انستاباي",
    bank_transfer: "تحويل بنكي",
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm" dir="rtl">
        {/* Success header */}
        <div className="flex flex-col items-center gap-2 pb-2">
          <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100">
            <Check className="size-6 text-emerald-600" />
          </div>
          <p className="text-base font-bold text-emerald-600">تم البيع بنجاح!</p>
        </div>

        {/* Receipt */}
        <div
          ref={printRef}
          className="receipt rounded-lg border border-dashed border-border p-4 bg-muted/20 text-sm space-y-2"
        >
          <div className="center bold text-base">{store.name}</div>
          <div className="center text-xs text-muted-foreground">
            فاتورة #{orderId.slice(-6).toUpperCase()}
          </div>
          <div className="center text-xs text-muted-foreground">
            {new Date().toLocaleString("ar-EG")}
          </div>
          <div className="line" />

          {order ? (
            <>
              {order.items.map((item) => (
                <div key={item.id} className="row">
                  <span className="flex-1">{item.product.name} ×{item.quantity}</span>
                  <span>{(item.price * item.quantity / 100).toFixed(0)} ج</span>
                </div>
              ))}

              <div className="line" />

              {order.discount > 0 && (
                <div className="row text-emerald-600">
                  <span>الخصم</span>
                  <span>−{(order.discount / 100).toFixed(0)} ج</span>
                </div>
              )}

              <div className="row total">
                <span>الإجمالي</span>
                <span>{(order.total / 100).toFixed(0)} ج</span>
              </div>

              <div className="line" />

              {order.splitPayments.length > 0 ? (
                order.splitPayments.map((p, i) => (
                  <div key={i} className="row text-xs">
                    <span>{paymentLabels[p.paymentMethod] ?? p.paymentMethod}</span>
                    <span>{(p.amount / 100).toFixed(0)} ج</span>
                  </div>
                ))
              ) : (
                <div className="row text-xs">
                  <span>{paymentLabels[order.paymentMethod] ?? order.paymentMethod}</span>
                  <span>{(order.total / 100).toFixed(0)} ج</span>
                </div>
              )}

              <div className="line" />
              <div className="center text-xs text-muted-foreground">
                الكاشير: {cashierName}
              </div>
              <div className="center text-xs text-muted-foreground">
                شكراً لتسوقكم معنا 🙏
              </div>
            </>
          ) : (
            <div className="text-center text-muted-foreground text-xs">جاري التحميل...</div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 gap-1.5" onClick={handlePrint}>
            <Printer className="size-4" />
            طباعة
          </Button>
          {store.settings?.whatsappNumber && (
            <Button
              variant="outline"
              className="flex-1 gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              onClick={handleWhatsApp}
            >
              <MessageCircle className="size-4" />
              واتساب
            </Button>
          )}
          <Button className="flex-1 gap-1.5" onClick={onClose}>
            <X className="size-4" />
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
