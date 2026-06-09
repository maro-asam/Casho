"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Tag, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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

import { CreateTagAction, DeleteTagAction } from "@/actions/crm/customer-tags.actions";
import { cn } from "@/lib/utils";

type TagItem = {
  id: string;
  name: string;
  color: string | null;
  createdAt: Date;
  _count: { assignments: number };
};

const PRESET_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#06B6D4", "#6B7280",
  "#F97316", "#14B8A6", "#A855F7", "#0EA5E9",
];

export function TagsClient({ tags }: { tags: TagItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);

  const handleCreate = () => {
    if (!name.trim()) { toast.error("اسم العلامة مطلوب"); return; }
    startTransition(async () => {
      const res = await CreateTagAction(name.trim(), color);
      if (res.success) {
        toast.success("تم إنشاء العلامة");
        setName("");
        setColor(PRESET_COLORS[0]);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await DeleteTagAction(id);
      if (res.success) { toast.success("تم حذف العلامة"); router.refresh(); }
      else toast.error(res.message);
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Create form */}
      <Card className="p-5 lg:col-span-1 h-fit">
        <h2 className="mb-4 text-sm font-semibold">إنشاء علامة جديدة</h2>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>اسم العلامة *</Label>
            <Input
              placeholder="مثال: VIP، عميل جملة"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <div className="space-y-1.5">
            <Label>اللون</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "size-7 rounded-full border-2 transition-all",
                    color === c ? "border-foreground scale-110" : "border-transparent hover:scale-105"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            {/* Preview */}
            {name && (
              <div className="mt-2">
                <span
                  className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: `${color}20`, color }}
                >
                  {name}
                </span>
              </div>
            )}
          </div>
          <Button
            onClick={handleCreate}
            disabled={pending || !name.trim()}
            className="w-full gap-2"
          >
            <Plus className="size-4" />
            {pending ? "جاري الحفظ..." : "إنشاء العلامة"}
          </Button>
        </div>
      </Card>

      {/* Tags grid */}
      <div className="lg:col-span-2">
        {tags.length === 0 ? (
          <Card className="py-16">
            <div className="flex flex-col items-center gap-3 text-center">
              <Tag className="size-12 text-muted-foreground/30" />
              <p className="font-medium">لا توجد علامات بعد</p>
              <p className="text-sm text-muted-foreground">أنشئ أول علامة لتصنيف عملائك</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {tags.map((tag) => (
              <Card key={tag.id} className="group flex items-center gap-3 p-4">
                <div
                  className="size-9 shrink-0 rounded-full"
                  style={{ backgroundColor: `${tag.color ?? "#6366f1"}25` }}
                >
                  <div className="flex h-full items-center justify-center">
                    <div
                      className="size-3 rounded-full"
                      style={{ backgroundColor: tag.color ?? "#6366f1" }}
                    />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold" style={{ color: tag.color ?? undefined }}>
                    {tag.name}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="size-3" />
                    <span>{tag._count.assignments} عميل</span>
                  </div>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                      disabled={pending}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>حذف العلامة</AlertDialogTitle>
                      <AlertDialogDescription>
                        سيتم حذف علامة «{tag.name}» وإزالتها من {tag._count.assignments} عميل. لا يمكن التراجع.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(tag.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        حذف
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
