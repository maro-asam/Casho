import Image from "next/image";
import { Star, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import ReviewFormDialog from "./ReviewFormDialog";
import ReviewDeleteButton from "./ReviewDeleteButton";
import { cn } from "@/lib/utils";

type ReviewRow = {
  id: string;
  productId: string;
  customerName: string;
  customerAvatar: string | null;
  rating: number;
  title: string | null;
  content: string;
  verifiedPurchase: boolean;
  reviewDate: Date;
  product: { id: string; name: string };
};

type Product = { id: string; name: string };

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            "size-3.5",
            s <= rating
              ? "fill-amber-400 text-amber-400"
              : "fill-muted text-muted",
          )}
        />
      ))}
      <span className="ms-1 text-xs font-medium text-muted-foreground">
        {rating}/5
      </span>
    </div>
  );
}

function Avatar({
  src,
  name,
}: {
  src: string | null;
  name: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={36}
        height={36}
        className="size-9 rounded-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }
  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function ReviewTableRow({
  review,
  products,
}: {
  review: ReviewRow;
  products: Product[];
}) {
  const reviewDate = new Date(review.reviewDate).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <TableRow className="transition-colors hover:bg-muted/30">
      {/* Customer */}
      <TableCell className="py-4">
        <div className="flex items-center gap-3">
          <Avatar src={review.customerAvatar} name={review.customerName} />
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">
              {review.customerName}
            </p>
            {review.verifiedPurchase && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="size-3" />
                مشتري موثق
              </span>
            )}
          </div>
        </div>
      </TableCell>

      {/* Product */}
      <TableCell>
        <Badge variant="outline" className="max-w-36 truncate rounded-lg text-xs">
          {review.product.name}
        </Badge>
      </TableCell>

      {/* Rating */}
      <TableCell>
        <StarRow rating={review.rating} />
      </TableCell>

      {/* Review content */}
      <TableCell className="max-w-64">
        {review.title && (
          <p className="mb-0.5 truncate text-sm font-medium">{review.title}</p>
        )}
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {review.content}
        </p>
      </TableCell>

      {/* Date */}
      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
        {reviewDate}
      </TableCell>

      {/* Actions */}
      <TableCell>
        <div className="flex items-center gap-1 whitespace-nowrap">
          <ReviewFormDialog mode="edit" products={products} review={review} />
          <ReviewDeleteButton
            reviewId={review.id}
            customerName={review.customerName}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}
