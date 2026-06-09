"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Phone,
  Mail,
  MapPin,
  Cake,
  Edit2,
  Save,
  X,
  Trash2,
  Wallet,
  Send,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

import { UpdateCRMCustomerAction } from "@/actions/crm/customers.actions";
import type { CustomerStatus } from "@prisma/client";
import { AddCustomerNoteAction, DeleteCustomerNoteAction } from "@/actions/crm/customer-notes.actions";
import { AddWalletBalanceAction, DeductWalletBalanceAction } from "@/actions/crm/customer-wallet.actions";
import { AssignTagAction, RemoveTagAction } from "@/actions/crm/customer-tags.actions";
import Image from "next/image";
import { CustomerStatusBadge, CustomerHealthBadge } from "../../../_components/CustomerHealthBadge";
import { CustomerTimelineTab } from "./CustomerTimelineTab";
import { formatMoneyFromPiasters } from "@/lib/subscriptions";
import { cn } from "@/lib/utils";

type Tag = { id: string; name: string; color: string | null };
type Note = { id: string; content: string; authorName: string | null; createdAt: Date };
type WalletTx = { id: string; type: string; amount: number; balanceBefore: number; balanceAfter: number; description: string | null; createdAt: Date };
type Order = { id: string; total: number; status: string; createdAt: Date; source: string; items: { product: { name: string } | null; quantity: number }[] };
type TimelineEvent = { id: string; eventType: string; title: string; description: string | null; metadata: Record<string, unknown> | null; referenceId: string | null; createdAt: Date };

interface Props {
  customer: {
    id: string;
    name: string | null;
    phone: string;
    email: string | null;
    address: string | null;
    birthday: Date | null;
    notes: string | null;
    status: string;
    points: number;
    walletBalance: number;
    createdAt: Date;
    totalSpend: number;
    orderCount: number;
    avgOrderValue: number;
    lifetimeValue: number;
    lastOrderDate: Date | null;
    avgDaysBetweenOrders: number | null;
    healthScore: { score: number; category: "HEALTHY" | "ACTIVE" | "AT_RISK" | "LOST"; recencyScore: number; frequencyScore: number; monetaryScore: number };
    tags: { tag: Tag }[];
    staffNotes: Note[];
    walletTransactions: WalletTx[];
    topProducts: { productId: string; _sum: { quantity: number | null }; product: { id: string; name: string; image: string } | null }[];
  };
  orders: Order[];
  allTags: Tag[];
  insights: { type: "info" | "warning" | "success"; text: string }[];
  timelineEvents: TimelineEvent[];
}

export function CustomerProfileClient({ customer, orders, allTags, insights, timelineEvents }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [walletAmount, setWalletAmount] = useState("");
  const [walletNote, setWalletNote] = useState("");
  const [walletMode, setWalletMode] = useState<"add" | "deduct">("add");

  // Edit form state
  const [editData, setEditData] = useState({
    name: customer.name ?? "",
    email: customer.email ?? "",
    address: customer.address ?? "",
    birthday: customer.birthday ? new Date(customer.birthday).toISOString().split("T")[0] : "",
    notes: customer.notes ?? "",
    status: customer.status,
  });

  const handleSaveProfile = () => {
    startTransition(async () => {
      const res = await UpdateCRMCustomerAction(customer.id, {
        ...editData,
        status: editData.status as CustomerStatus,
        birthday: editData.birthday || null,
      });
      if (res.success) {
        toast.success("تم حفظ البيانات");
        setIsEditing(false);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    startTransition(async () => {
      const res = await AddCustomerNoteAction(customer.id, noteText);
      if (res.success) {
        toast.success("تم إضافة الملاحظة");
        setNoteText("");
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleDeleteNote = (noteId: string) => {
    startTransition(async () => {
      const res = await DeleteCustomerNoteAction(noteId);
      if (res.success) {
        toast.success("تم حذف الملاحظة");
        router.refresh();
      }
    });
  };

  const handleWalletAction = () => {
    const amount = Math.round(parseFloat(walletAmount) * 100);
    if (!amount || amount <= 0) { toast.error("أدخل مبلغاً صحيحاً"); return; }

    startTransition(async () => {
      const fn = walletMode === "add" ? AddWalletBalanceAction : DeductWalletBalanceAction;
      const res = await fn(customer.id, amount, walletNote || undefined);
      if (res.success) {
        toast.success(walletMode === "add" ? "تم إضافة الرصيد" : "تم خصم الرصيد");
        setWalletAmount("");
        setWalletNote("");
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleAssignTag = (tagId: string) => {
    startTransition(async () => {
      const res = await AssignTagAction(customer.id, tagId);
      if (res.success) router.refresh();
      else toast.error(res.message);
    });
  };

  const handleRemoveTag = (tagId: string) => {
    startTransition(async () => {
      const res = await RemoveTagAction(customer.id, tagId);
      if (res.success) router.refresh();
    });
  };

  const assignedTagIds = new Set(customer.tags.map((t) => t.tag.id));
  const availableTags = allTags.filter((t) => !assignedTagIds.has(t.id));

  const statusOrderMap: Record<string, string> = {
    PENDING: "قيد الانتظار",
    PAID: "مدفوع",
    SHIPPED: "جارٍ الشحن",
    DELIVERED: "مُسلَّم",
    CANCELED: "ملغي",
  };

  const insightColors = {
    info: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  };

  return (
    <div className="space-y-6">
      {/* Smart Insights */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {insights.map((ins, i) => (
            <div
              key={i}
              className={cn("rounded-lg border px-3.5 py-2.5 text-sm", insightColors[ins.type])}
            >
              {ins.text}
            </div>
          ))}
        </div>
      )}

      {/* Profile Card */}
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4 pb-4">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
              {(customer.name ?? customer.phone)[0]}
            </div>
            <div>
              {isEditing ? (
                <Input
                  value={editData.name}
                  onChange={(e) => setEditData((d) => ({ ...d, name: e.target.value }))}
                  className="h-8 text-lg font-bold"
                  placeholder="اسم العميل"
                />
              ) : (
                <h2 className="text-lg font-bold">{customer.name ?? "بدون اسم"}</h2>
              )}
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <CustomerStatusBadge status={isEditing ? editData.status : customer.status} />
                {customer.tags.map((t) => (
                  <span
                    key={t.tag.id}
                    onClick={() => handleRemoveTag(t.tag.id)}
                    className="cursor-pointer rounded-full px-2 py-0.5 text-xs font-medium transition-opacity hover:opacity-70"
                    style={{ backgroundColor: `${t.tag.color ?? "#6366f1"}20`, color: t.tag.color ?? "#6366f1" }}
                    title="انقر لإزالة"
                  >
                    {t.tag.name} ×
                  </span>
                ))}
                {availableTags.length > 0 && (
                  <select
                    className="h-5 cursor-pointer rounded border-dashed bg-transparent text-xs text-muted-foreground"
                    value=""
                    onChange={(e) => e.target.value && handleAssignTag(e.target.value)}
                  >
                    <option value="">+ علامة</option>
                    {availableTags.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button size="sm" onClick={handleSaveProfile} disabled={pending}>
                  <Save className="size-3.5 ml-1" /> حفظ
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="size-3.5" />
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                <Edit2 className="size-3.5 ml-1" /> تعديل
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {isEditing ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">البريد الإلكتروني</Label>
                <Input
                  value={editData.email}
                  onChange={(e) => setEditData((d) => ({ ...d, email: e.target.value }))}
                  placeholder="example@email.com"
                  type="email"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">العنوان</Label>
                <Input
                  value={editData.address}
                  onChange={(e) => setEditData((d) => ({ ...d, address: e.target.value }))}
                  placeholder="القاهرة، مصر"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">تاريخ الميلاد</Label>
                <Input
                  type="date"
                  value={editData.birthday}
                  onChange={(e) => setEditData((d) => ({ ...d, birthday: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">الحالة</Label>
                <Select
                  value={editData.status}
                  onValueChange={(v) => setEditData((d) => ({ ...d, status: v }))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">نشط</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                    <SelectItem value="INACTIVE">غير نشط</SelectItem>
                    <SelectItem value="BLOCKED">محظور</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">ملاحظة سريعة</Label>
                <Input
                  value={editData.notes}
                  onChange={(e) => setEditData((d) => ({ ...d, notes: e.target.value }))}
                  placeholder="ملاحظة سريعة عن العميل"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="size-3.5 shrink-0 text-muted-foreground" />
                <span dir="ltr">{customer.phone}</span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{customer.email}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{customer.address}</span>
                </div>
              )}
              {customer.birthday && (
                <div className="flex items-center gap-2 text-sm">
                  <Cake className="size-3.5 shrink-0 text-muted-foreground" />
                  <span>{new Date(customer.birthday).toLocaleDateString("ar-EG")}</span>
                </div>
              )}
            </div>
          )}

          {customer.notes && !isEditing && (
            <div className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              {customer.notes}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "الطلبات", value: customer.orderCount.toString() },
          { label: "إجمالي الإنفاق", value: formatMoneyFromPiasters(customer.totalSpend) },
          { label: "متوسط الطلب", value: formatMoneyFromPiasters(customer.avgOrderValue) },
          { label: "نقاط الولاء", value: customer.points.toLocaleString("ar-EG") },
          { label: "رصيد المحفظة", value: formatMoneyFromPiasters(customer.walletBalance) },
          { label: "درجة الصحة", value: String(customer.healthScore.score) },
        ].map((s) => (
          <Card key={s.label} className="p-3.5 text-center">
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
            <p className="mt-0.5 text-lg font-bold">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Health Score Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">درجة الصحة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex size-16 shrink-0 flex-col items-center justify-center rounded-full border-4 border-primary/30">
              <span className="text-2xl font-bold">{customer.healthScore.score}</span>
            </div>
            <div className="flex-1 space-y-2">
              {[
                { label: "الحداثة (40%)", value: customer.healthScore.recencyScore },
                { label: "التكرار (30%)", value: customer.healthScore.frequencyScore },
                { label: "القيمة (30%)", value: customer.healthScore.monetaryScore },
              ].map((m) => (
                <div key={m.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{m.label}</span>
                    <span className="font-medium">{m.value}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${m.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <CustomerHealthBadge
              category={customer.healthScore.category}
              score={customer.healthScore.score}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="timeline">
        <TabsList className="w-full justify-start flex-wrap">
          <TabsTrigger value="timeline">السجل ({timelineEvents.length})</TabsTrigger>
          <TabsTrigger value="orders">الطلبات ({customer.orderCount})</TabsTrigger>
          <TabsTrigger value="wallet">المحفظة</TabsTrigger>
          <TabsTrigger value="notes">الملاحظات ({customer.staffNotes.length})</TabsTrigger>
          <TabsTrigger value="products">المنتجات المفضلة</TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="mt-4">
          <CustomerTimelineTab events={timelineEvents} />
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="mt-4">
          {orders.length === 0 ? (
            <div className="rounded-xl border py-10 text-center text-sm text-muted-foreground">
              لا يوجد طلبات لهذا العميل
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map((order) => (
                <Card key={order.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">#{order.id.slice(0, 8)}</span>
                        <Badge
                          variant={order.status === "DELIVERED" ? "default" : order.status === "CANCELED" ? "destructive" : "secondary"}
                          className="text-[10px]"
                        >
                          {statusOrderMap[order.status] ?? order.status}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {order.source === "POS" ? "POS" : order.source === "INSTAGRAM" ? "انستجرام" : "أونلاين"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {order.items.slice(0, 2).map((i) => `${i.product?.name ?? "منتج"} ×${i.quantity}`).join("، ")}
                        {order.items.length > 2 && ` +${order.items.length - 2}`}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-primary">{formatMoneyFromPiasters(order.total)}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString("ar-EG")}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Wallet Tab */}
        <TabsContent value="wallet" className="mt-4 space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wallet className="size-4 text-primary" />
                <span className="font-medium">رصيد المحفظة</span>
              </div>
              <span className="text-xl font-bold text-primary">
                {formatMoneyFromPiasters(customer.walletBalance)}
              </span>
            </div>
            <Separator className="mb-3" />
            <div className="space-y-2.5">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={walletMode === "add" ? "default" : "outline"}
                  onClick={() => setWalletMode("add")}
                  className="flex-1"
                >
                  إضافة رصيد
                </Button>
                <Button
                  size="sm"
                  variant={walletMode === "deduct" ? "destructive" : "outline"}
                  onClick={() => setWalletMode("deduct")}
                  className="flex-1"
                >
                  خصم رصيد
                </Button>
              </div>
              <Input
                placeholder="المبلغ بالجنيه"
                type="number"
                min="0"
                step="0.01"
                value={walletAmount}
                onChange={(e) => setWalletAmount(e.target.value)}
              />
              <Input
                placeholder="سبب العملية (اختياري)"
                value={walletNote}
                onChange={(e) => setWalletNote(e.target.value)}
              />
              <Button
                size="sm"
                className="w-full"
                onClick={handleWalletAction}
                disabled={pending || !walletAmount}
                variant={walletMode === "deduct" ? "destructive" : "default"}
              >
                {walletMode === "add" ? "إضافة" : "خصم"}
              </Button>
            </div>
          </Card>

          {customer.walletTransactions.length > 0 && (
            <div className="space-y-1.5">
              {customer.walletTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                  <div>
                    <p className="text-xs font-medium">{tx.description ?? tx.type}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString("ar-EG")}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      tx.type === "CREDIT" || tx.type === "REFUND" || tx.type === "REWARD"
                        ? "text-emerald-600"
                        : "text-rose-600"
                    )}
                  >
                    {tx.type === "CREDIT" || tx.type === "REFUND" || tx.type === "REWARD" ? "+" : "-"}
                    {formatMoneyFromPiasters(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="mt-4 space-y-4">
          <Card className="p-4">
            <div className="flex gap-2">
              <Textarea
                placeholder="أضف ملاحظة عن هذا العميل..."
                className="min-h-20 resize-none text-sm"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
            </div>
            <Button
              size="sm"
              className="mt-2 gap-1.5"
              onClick={handleAddNote}
              disabled={pending || !noteText.trim()}
            >
              <Send className="size-3.5" />
              إضافة ملاحظة
            </Button>
          </Card>

          {customer.staffNotes.length === 0 ? (
            <div className="rounded-xl border py-8 text-center text-sm text-muted-foreground">
              لا توجد ملاحظات بعد
            </div>
          ) : (
            <div className="space-y-2">
              {customer.staffNotes.map((note) => (
                <Card key={note.id} className="p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm">{note.content}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {note.authorName ?? "موظف"} •{" "}
                        {new Date(note.createdAt).toLocaleDateString("ar-EG")}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteNote(note.id)}
                      disabled={pending}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Top Products Tab */}
        <TabsContent value="products" className="mt-4">
          {customer.topProducts.length === 0 ? (
            <div className="rounded-xl border py-10 text-center text-sm text-muted-foreground">
              لا يوجد بيانات مشتريات
            </div>
          ) : (
            <div className="space-y-2">
              {customer.topProducts.map((p, i) => (
                <Card key={p.productId} className="flex items-center gap-3 p-3.5">
                  <span className="w-6 text-center text-sm font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  {p.product?.image && (
                    <Image
                      src={p.product.image}
                      alt={p.product.name}
                      width={36}
                      height={36}
                      className="size-9 rounded object-cover"
                    />
                  )}
                  <p className="flex-1 text-sm font-medium">{p.product?.name ?? "منتج محذوف"}</p>
                  <span className="text-xs text-muted-foreground">
                    {p._sum.quantity ?? 0} وحدة
                  </span>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
