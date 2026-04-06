"use client";

import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    slug: string;
  };
};

type ExportInvoiceButtonProps = {
  order: {
    id: string;
    createdAt: Date | string;
    fullName: string;
    phone: string;
    address: string;
    paymentMethod: string;
    subtotal: number;
    shipping: number;
    total: number;
    status: string;
    store: {
      name: string;
      slug: string;
    };
    items: OrderItem[];
  };
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
  }).format(price / 100);
}

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(date));
}

function getPaymentMethodLabel(method: string) {
  switch (method) {
    case "cash_on_delivery":
      return "الدفع عند الاستلام";
    case "instapay":
      return "إنستاباي";
    case "vodafone_cash":
      return "فودافون كاش";
    case "bank_transfer":
      return "تحويل بنكي";
    default:
      return method;
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "PENDING":
      return "معلق";
    case "PAID":
      return "مدفوع";
    case "SHIPPED":
      return "تم الشحن";
    case "DELIVERED":
      return "تم التوصيل";
    case "CANCELED":
      return "ملغي";
    default:
      return status;
  }
}

export default function ExportInvoiceButton({
  order,
}: ExportInvoiceButtonProps) {
  const handleExportInvoice = () => {
    const invoiceWindow = window.open("", "_blank", "width=900,height=1200");

    if (!invoiceWindow) return;

    const itemsRows = order.items
      .map((item, index) => {
        const total = item.price * item.quantity;

        return `
          <tr>
            <td>${index + 1}</td>
            <td>${item.product.name}</td>
            <td>${item.quantity}</td>
            <td>${formatPrice(item.price)}</td>
            <td>${formatPrice(total)}</td>
          </tr>
        `;
      })
      .join("");

    invoiceWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <title>فاتورة الطلب #${order.id.slice(0, 8)}</title>
          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 32px;
              font-family: Arial, "Tahoma", sans-serif;
              background: #ffffff;
              color: #111827;
              direction: rtl;
            }

            .invoice {
              max-width: 900px;
              margin: 0 auto;
              border: 1px solid #e5e7eb;
              border-radius: 20px;
              overflow: hidden;
            }

            .header {
              padding: 28px;
              background: linear-gradient(135deg, #f8fafc, #eef2ff);
              border-bottom: 1px solid #e5e7eb;
            }

            .header-top {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              gap: 20px;
              flex-wrap: wrap;
            }

            .brand h1 {
              margin: 0 0 8px;
              font-size: 28px;
              color: #111827;
            }

            .brand p {
              margin: 0;
              color: #6b7280;
              font-size: 14px;
            }

            .badge {
              display: inline-block;
              padding: 8px 14px;
              border-radius: 999px;
              background: #eef2ff;
              color: #4338ca;
              font-size: 14px;
              font-weight: 700;
            }

            .section {
              padding: 24px 28px;
              border-bottom: 1px solid #f1f5f9;
            }

            .section:last-child {
              border-bottom: none;
            }

            .section-title {
              margin: 0 0 16px;
              font-size: 18px;
              font-weight: 700;
            }

            .grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 14px;
            }

            .info-box {
              border: 1px solid #e5e7eb;
              border-radius: 14px;
              padding: 14px;
              background: #fafafa;
            }

            .info-label {
              margin-bottom: 6px;
              font-size: 13px;
              color: #6b7280;
            }

            .info-value {
              font-size: 15px;
              font-weight: 700;
              color: #111827;
              word-break: break-word;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              overflow: hidden;
              border-radius: 14px;
              border: 1px solid #e5e7eb;
            }

            thead {
              background: #f8fafc;
            }

            th, td {
              padding: 14px 12px;
              text-align: right;
              border-bottom: 1px solid #e5e7eb;
              font-size: 14px;
            }

            th {
              font-weight: 700;
              color: #374151;
            }

            tbody tr:last-child td {
              border-bottom: none;
            }

            .summary {
              width: 100%;
              max-width: 360px;
              margin-inline-start: auto;
              display: grid;
              gap: 10px;
            }

            .summary-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 14px 16px;
              border: 1px solid #e5e7eb;
              border-radius: 14px;
              background: #fff;
            }

            .summary-row.total {
              background: #eef2ff;
              border-color: #c7d2fe;
              font-weight: 800;
              font-size: 16px;
            }

            .footer {
              padding: 24px 28px;
              text-align: center;
              color: #6b7280;
              font-size: 13px;
            }

            @media print {
              body {
                padding: 0;
              }

              .invoice {
                border: none;
                border-radius: 0;
              }
            }

            @media (max-width: 700px) {
              .grid {
                grid-template-columns: 1fr;
              }

              th, td {
                font-size: 12px;
                padding: 10px 8px;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice">
            <div class="header">
              <div class="header-top">
                <div class="brand">
                  <h1>فاتورة طلب</h1>
                  <p>المتجر: ${order.store.name}</p>
                </div>

                <div class="badge">#${order.id.slice(0, 8)}</div>
              </div>
            </div>

            <div class="section">
              <h2 class="section-title">بيانات الطلب</h2>
              <div class="grid">
                <div class="info-box">
                  <div class="info-label">رقم الطلب</div>
                  <div class="info-value">#${order.id.slice(0, 8)}</div>
                </div>

                <div class="info-box">
                  <div class="info-label">تاريخ الطلب</div>
                  <div class="info-value">${formatDate(order.createdAt)}</div>
                </div>

                <div class="info-box">
                  <div class="info-label">حالة الطلب</div>
                  <div class="info-value">${getStatusLabel(order.status)}</div>
                </div>

                <div class="info-box">
                  <div class="info-label">طريقة الدفع</div>
                  <div class="info-value">${getPaymentMethodLabel(order.paymentMethod)}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <h2 class="section-title">بيانات العميل</h2>
              <div class="grid">
                <div class="info-box">
                  <div class="info-label">الاسم</div>
                  <div class="info-value">${order.fullName}</div>
                </div>

                <div class="info-box">
                  <div class="info-label">رقم الهاتف</div>
                  <div class="info-value">${order.phone}</div>
                </div>

                <div class="info-box" style="grid-column: 1 / -1;">
                  <div class="info-label">العنوان</div>
                  <div class="info-value">${order.address}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <h2 class="section-title">المنتجات</h2>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>المنتج</th>
                    <th>الكمية</th>
                    <th>سعر القطعة</th>
                    <th>الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRows}
                </tbody>
              </table>
            </div>

            <div class="section">
              <h2 class="section-title">الملخص المالي</h2>
              <div class="summary">
                <div class="summary-row">
                  <span>المجموع الفرعي</span>
                  <strong>${formatPrice(order.subtotal)}</strong>
                </div>

                <div class="summary-row">
                  <span>الشحن</span>
                  <strong>${formatPrice(order.shipping)}</strong>
                </div>

                <div class="summary-row total">
                  <span>الإجمالي النهائي</span>
                  <strong>${formatPrice(order.total)}</strong>
                </div>
              </div>
            </div>

            <div class="footer">
              شكراً لثقتك بنا
            </div>
          </div>

          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    invoiceWindow.document.close();
  };

  return (
    <Button onClick={handleExportInvoice} className="rounded-md">
      <FileDown className="ms-2 h-4 w-4" />
      تصدير فاتورة
    </Button>
  );
}
