"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { deleteBlogPostAction } from "@/actions/blog/blog.actions";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ActionButton } from "../../_components/action-button";

type BlogActionsProps = { blog: { id: string; slug: string; title: string; published: boolean } };

/** Row actions: edit / view live / delete (confirmed). */
const BlogActions = ({ blog }: BlogActionsProps) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="relative z-10 flex items-center justify-end gap-1">
      <Button asChild variant="ghost" size="icon-sm" aria-label={`تعديل ${blog.title}`}>
        <Link href={`/admin/blog/${blog.slug}/edit`}>
          <Pencil className="size-4" />
        </Link>
      </Button>
      <DropdownMenu dir="rtl" modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="إجراءات أكتر">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {blog.published && (
            <>
              <DropdownMenuItem asChild>
                <a href={`${process.env.NEXT_PUBLIC_APP_URL || "https://casho.store"}/blog/${blog.slug}`} target="_blank" rel="noreferrer">
                  <ExternalLink />
                  شوفه على المدونة
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDelete(true)}>
            <Trash2 />
            حذف
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ActionButton
        action={deleteBlogPostAction.bind(null, blog.id)}
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        confirm={{ title: "تحذف المقال؟", description: `«${blog.title}» هيتحذف نهائيًا من المدونة ومينفعش ترجّعه.`, confirmLabel: "احذف", destructive: true }}
      >
        حذف
      </ActionButton>
    </div>
  );
};

export default BlogActions;
