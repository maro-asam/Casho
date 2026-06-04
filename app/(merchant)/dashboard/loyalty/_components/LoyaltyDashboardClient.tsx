"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Gift, Settings, Users, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UpdateLoyaltySettingsAction, AdjustCustomerPointsAction } from "@/actions/store/loyalty.actions";

type Settings = {
  loyaltyEnabled: boolean;
  loyaltyPointsPerEGP: number;
  loyaltyPointsValuePiasters: number;
  loyaltyMinRedemption: number;
} | null;

type Customer = {
  id: string;
  phone: string;
  name: string | null;
  points: number;
  createdAt: Date;
  _count: { orders: number };
};

export default function LoyaltyDashboardClient({
  settings,
  customers,
}: {
  settings: Settings;
  customers: Customer[];
}) {
  const [isPending, startTransition] = useTransition();
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [adjustPoints, setAdjustPoints] = useState(0);
  const [adjustDesc, setAdjustDesc] = useState("");

  function handleSaveSettings(fd: FormData) {
    startTransition(async () => {
      const res = await UpdateLoyaltySettingsAction(fd);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  }

  function handleAdjust(customerId: string, sign: 1 | -1) {
    if (!adjustPoints || adjustPoints <= 0) { toast.error("أدخل عدد نقاط"); return; }
    startTransition(async () => {
      const res = await AdjustCustomerPointsAction(customerId, sign * adjustPoints, adjustDesc || "تعديل يدوي");
      if (res.success) { toast.success(res.message); setAdjustingId(null); setAdjustPoints(0); setAdjustDesc(""); }
      else toast.error(res.message);
    });
  }

  return (
    <Tabs defaultValue="settings" dir="rtl">
      <TabsList className="rounded-xl mb-4">
        <TabsTrigger value="settings" className="rounded-lg gap-1.5">
          <Settings className="size-3.5" />
          الإعدادات
        </TabsTrigger>
        <TabsTrigger value="customers" className="rounded-lg gap-1.5">
          <Users className="size-3.5" />
          العملاء ({customers.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="settings">
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="size-5 text-primary" />
              إعدادات برنامج الولاء
            </CardTitle>
            <CardDescription>
              حدد كيف يكسب العملاء النقاط وكيف يستردونها
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleSaveSettings} className="space-y-6">
              <div className="flex items-center gap-3">
                <Switch
                  id="loyaltyEnabled"
                  name="loyaltyEnabled"
                  defaultChecked={settings?.loyaltyEnabled ?? false}
                />
                <Label htmlFor="loyaltyEnabled" className="text-sm font-medium">
                  تفعيل نظام النقاط
                </Label>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>نقاط لكل جنيه مصري</Label>
                  <Input
                    name="loyaltyPointsPerEGP"
                    type="number"
                    min="0.1"
                    step="0.1"
                    defaultValue={settings?.loyaltyPointsPerEGP ?? 1}
                    className="rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground">مثال: 1 = نقطة لكل جنيه</p>
                </div>
                <div className="space-y-1.5">
                  <Label>قيمة النقطة (مليم)</Label>
                  <Input
                    name="loyaltyPointsValuePiasters"
                    type="number"
                    min="1"
                    step="1"
                    defaultValue={settings?.loyaltyPointsValuePiasters ?? 1}
                    className="rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground">1 نقطة = كم مليم خصم</p>
                </div>
                <div className="space-y-1.5">
                  <Label>الحد الأدنى للاسترداد (نقطة)</Label>
                  <Input
                    name="loyaltyMinRedemption"
                    type="number"
                    min="1"
                    step="1"
                    defaultValue={settings?.loyaltyMinRedemption ?? 100}
                    className="rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground">أقل عدد نقاط يمكن استردادها</p>
                </div>
              </div>

              <Button type="submit" className="rounded-xl" disabled={isPending}>
                حفظ الإعدادات
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="customers">
        <Card className="rounded-xl">
          <CardContent className="p-0">
            {customers.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-52 text-center p-6">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
                  <Users className="size-6 text-muted-foreground" />
                </div>
                <p className="font-semibold">لا يوجد عملاء بعد</p>
                <p className="mt-1 text-sm text-muted-foreground">سيظهر هنا العملاء الذين لديهم نقاط بعد أول طلب</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">العميل</TableHead>
                    <TableHead className="text-right">الرقم</TableHead>
                    <TableHead className="text-right">الطلبات</TableHead>
                    <TableHead className="text-right">النقاط</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <>
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.name || "—"}</TableCell>
                        <TableCell className="text-muted-foreground font-mono text-sm">{customer.phone}</TableCell>
                        <TableCell>{customer._count.orders}</TableCell>
                        <TableCell>
                          <Badge className="gap-1 rounded-lg bg-amber-500">
                            <Gift className="size-3" />
                            {customer.points.toLocaleString("ar")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl text-xs"
                            onClick={() => setAdjustingId(adjustingId === customer.id ? null : customer.id)}
                          >
                            تعديل
                          </Button>
                        </TableCell>
                      </TableRow>
                      {adjustingId === customer.id && (
                        <TableRow key={`adjust-${customer.id}`}>
                          <TableCell colSpan={5} className="bg-muted/20">
                            <div className="flex flex-wrap items-center gap-2 p-2">
                              <Input
                                type="number"
                                min="1"
                                placeholder="عدد النقاط"
                                value={adjustPoints || ""}
                                onChange={(e) => setAdjustPoints(Number(e.target.value))}
                                className="w-32 rounded-xl"
                              />
                              <Input
                                placeholder="السبب (اختياري)"
                                value={adjustDesc}
                                onChange={(e) => setAdjustDesc(e.target.value)}
                                className="w-48 rounded-xl"
                              />
                              <Button size="sm" className="rounded-xl gap-1 bg-emerald-500" onClick={() => handleAdjust(customer.id, 1)} disabled={isPending}>
                                <Plus className="size-3.5" /> إضافة
                              </Button>
                              <Button size="sm" variant="destructive" className="rounded-xl gap-1" onClick={() => handleAdjust(customer.id, -1)} disabled={isPending}>
                                <Minus className="size-3.5" /> خصم
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
