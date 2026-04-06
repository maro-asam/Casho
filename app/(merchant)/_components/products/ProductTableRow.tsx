import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Edit, ImageIcon, Star, Trash2 } from "lucide-react";

import { DeleteProductAction } from "@/actions/products/products.actions";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import Image from "next/image";

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  category: {
    name: string;
  };
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(price);
}

export default function ProductTableRow({ product }: { product: Product }) {
  return (
    <TableRow className="transition-colors hover:bg-muted/30">
      <TableCell className="py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
            {product.image ? (
              // لو هتستخدم next/image بدل img ابقى بدله
              <Image
                width={100}
                height={100}
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                <ImageIcon className="size-5" />
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-1">
            <p className="truncate font-semibold text-foreground">
              {product.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              /{product.slug}
            </p>
          </div>
        </div>
      </TableCell>

      <TableCell>
        <Badge variant="outline" className="rounded-md">
          {product.category.name}
        </Badge>
      </TableCell>

      <TableCell className="font-medium">
        {formatPrice(product.price)}
      </TableCell>

      <TableCell>
        {product.isActive ? (
          <Badge className="rounded-md">نشط</Badge>
        ) : (
          <Badge variant="secondary" className="rounded-md">
            غير نشط
          </Badge>
        )}
      </TableCell>

      <TableCell>
        {product.isFeatured ? (
          <Badge variant="outline" className="gap-1 rounded-md">
            <Star className="size-3.5" />
            مميز
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </TableCell>

      <TableCell>
        <div className="flex flex-wrap items-center justify-start gap-2">
          <Button asChild variant="secondary" size="sm" className="rounded-lg">
            <Link href={`/dashboard/products/${product.id}/edit`}>
              <Edit className="me-2 size-4" />
              تعديل
            </Link>
          </Button>

          <form
            action={async () => {
              "use server";
              await DeleteProductAction(product.id);
              revalidatePath("/dashboard/products");
            }}
          >
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              className="rounded-lg"
            >
              <Trash2 className="me-2 size-4" />
              حذف
            </Button>
          </form>
        </div>
      </TableCell>
    </TableRow>
  );
}
