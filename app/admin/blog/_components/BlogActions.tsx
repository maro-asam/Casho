"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, Pencil, Trash2, Loader2, TriangleAlert } from "lucide-react";


import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { deleteBlogPostAction } from "@/actions/blog/blog.actions";

type BlogActionsProps = {
  blog: {
    id: string;
    slug: string;
    title: string;
  };
};

const BlogActions = ({ blog }: BlogActionsProps) => {
  const router = useRouter();

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await deleteBlogPostAction(blog.id);

      setIsDeleteOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/blog/${blog.slug}`}>
            <Eye className="size-4" />
          </Link>
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsEditOpen(true)}
        >
          <Pencil className="size-4" />
        </Button>

        <Button
          variant="destructive"
          size="icon"
          onClick={() => setIsDeleteOpen(true)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {/* Edit Modal */}

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>تعديل المقال</DialogTitle>

            <DialogDescription>
              سيتم تحويلك لصفحة التعديل الخاصة بالمقال.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border bg-muted/40 p-4 text-sm">
            <span className="font-medium">العنوان:</span> {blog.title}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              إلغاء
            </Button>

            <Button asChild>
              <Link href={`/admin/blog/${blog.slug}/edit`}>متابعة التعديل</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <TriangleAlert className="size-5" />
              حذف المقال
            </DialogTitle>

            <DialogDescription>
              هذا الإجراء لا يمكن التراجع عنه.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm dark:border-red-900 dark:bg-red-950/30">
            هل أنت متأكد من حذف:
            <div className="mt-2 font-semibold">{blog.title}</div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              disabled={isPending}
            >
              إلغاء
            </Button>

            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="me-2 size-4 animate-spin" />
                  جاري الحذف...
                </>
              ) : (
                "تأكيد الحذف"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BlogActions;
