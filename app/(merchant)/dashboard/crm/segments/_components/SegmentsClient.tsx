"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus, Trash2, RefreshCw, Users, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  CreateSegmentAction,
  DeleteSegmentAction,
  RefreshAutoSegmentsAction,
} from "@/actions/crm/customer-segments.actions";
import { cn } from "@/lib/utils";

type Segment = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  color: string | null;
  createdAt: Date;
  _count: { memberships: number };
};

const PRESET_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#06B6D4", "#6B7280",
];

export function SegmentsClient({ segments }: { segments: Segment[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);

  const [form, setForm] = useState({ name: "", description: "", color: PRESET_COLORS[0] });

  const handleCreate = () => {
    if (!form.name.trim()) { toast.error("اسم الشريحة مطلوب"); return; }
    startTransition(async () => {
      const res = await CreateSegmentAction({ name: form.name, description: form.description, color: form.color });
      if (res.success) {
        toast.success("تم إنشاء الشريحة");
        setCreateOpen(false);
        setForm({ name: "", description: "", color: PRESET_COLORS[0] });
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await DeleteSegmentAction(id);
      if (res.success) { toast.success("تم حذف الشريحة"); router.refresh(); }
      else toast.error(res.message);
    });
  };

  const handleRefreshAuto = () => {
    startTransition(async () => {
      const res = await RefreshAutoSegmentsAction();
      if (res.success) { toast.success("تم تحديث الشرائح التلقائية"); router.refresh(); }
    });
  };

  const auto = segments.filter((s) => s.type === "AUTOMATIC");
  const manual = segments.filter((s) => s.type === "MANUAL");

  return (
    <div className="space-y-6">
      {/* Actions bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="size-4" /> شريحة جديدة
        </Button>
        <Button variant="outline" onClick={handleRefreshAuto} disabled={pending} className="gap-2">
          <RefreshCw className={cn("size-4", pending && "animate-spin")} />
          تحديث الشرائح التلقائية
        </Button>
      </div>

      {/* Auto Segments */}
      {auto.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Zap className="size-4 text-amber-500" />
            <h2 className="text-sm font-semibold">شرائح تلقائية</h2>
            <Badge variant="secondary" className="text-xs">{auto.length}</Badge>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {auto.map((seg) => (
              <SegmentCard key={seg.id} seg={seg} onDelete={handleDelete} pending={pending} />
            ))}
          </div>
        </div>
      )}

      {/* Manual Segments */}
      {manual.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Users className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">شرائح يدوية</h2>
            <Badge variant="secondary" className="text-xs">{manual.length}</Badge>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {manual.map((seg) => (
              <SegmentCard key={seg.id} seg={seg} onDelete={handleDelete} pending={pending} />
            ))}
          </div>
        </div>
      )}

      {segments.length === 0 && (
        <Card className="py-16">
          <div className="flex flex-col items-center gap-3 text-center">
            <Users className="size-12 text-muted-foreground/30" />
            <p className="font-medium">لا توجد شرائح بعد</p>
            <p className="text-sm text-muted-foreground">
              اضغط «تحديث الشرائح التلقائية» لإنشاء شرائح ذكية تلقائياً
            </p>
          </div>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle>إنشاء شريحة جديدة</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label>اسم الشريحة *</Label>
              <Input
                placeholder="مثال: عملاء VIP"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>الوصف</Label>
              <Input
                placeholder="وصف مختصر (اختياري)"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>اللون</Label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                    className={cn(
                      "size-7 rounded-full border-2 transition-transform",
                      form.color === c ? "border-foreground scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>إلغاء</Button>
              <Button onClick={handleCreate} disabled={pending}>
                {pending ? "جاري الحفظ..." : "إنشاء"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SegmentCard({
  seg,
  onDelete,
  pending,
}: {
  seg: Segment;
  onDelete: (id: string) => void;
  pending: boolean;
}) {
  return (
    <Card className="group relative overflow-hidden">
      {/* Color strip */}
      <div
        className="absolute right-0 top-0 h-full w-1 rounded-r-xl"
        style={{ backgroundColor: seg.color ?? "#6366f1" }}
      />
      <CardHeader className="pr-5 pb-2 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold">{seg.name}</CardTitle>
            {seg.description && (
              <p className="mt-0.5 text-xs text-muted-foreground">{seg.description}</p>
            )}
          </div>
          <Badge
            variant="secondary"
            className="shrink-0 text-[10px]"
            style={{
              backgroundColor: `${seg.color ?? "#6366f1"}15`,
              color: seg.color ?? "#6366f1",
            }}
          >
            {seg.type === "AUTOMATIC" ? "تلقائي" : "يدوي"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pr-5 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm">
          <Users className="size-3.5 text-muted-foreground" />
          <span className="font-semibold">{seg._count.memberships}</span>
          <span className="text-muted-foreground text-xs">عميل</span>
        </div>

        {seg.type === "MANUAL" && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="size-7 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive"
                disabled={pending}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent dir="rtl">
              <AlertDialogHeader>
                <AlertDialogTitle>حذف الشريحة</AlertDialogTitle>
                <AlertDialogDescription>
                  سيتم حذف الشريحة «{seg.name}» وإزالة جميع الأعضاء منها. لا يمكن التراجع.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(seg.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  حذف
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardContent>
    </Card>
  );
}
