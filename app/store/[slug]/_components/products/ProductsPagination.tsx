import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";

type Props = {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
};

const ProductsPagination = ({
  currentPage,
  totalPages,
  buildHref,
}: Props) => {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex flex-col items-center justify-between gap-4 rounded-md border bg-card p-4 shadow-sm sm:flex-row">
      <p className="text-sm text-muted-foreground">
        الصفحة {currentPage} من {totalPages}
      </p>

      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm" disabled={currentPage === 1}>
          <Link href={buildHref(currentPage - 1)}>
            <ChevronRight className="size-4" />
            السابق
          </Link>
        </Button>

        {start > 1 && (
          <>
            <Button asChild variant="outline" size="sm">
              <Link href={buildHref(1)}>1</Link>
            </Button>
            {start > 2 && <span className="px-1 text-muted-foreground">...</span>}
          </>
        )}

        {pages.map((page) => (
          <Button
            key={page}
            asChild
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
          >
            <Link href={buildHref(page)}>{page}</Link>
          </Button>
        ))}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && (
              <span className="px-1 text-muted-foreground">...</span>
            )}
            <Button asChild variant="outline" size="sm">
              <Link href={buildHref(totalPages)}>{totalPages}</Link>
            </Button>
          </>
        )}

        <Button
          asChild
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages}
        >
          <Link href={buildHref(currentPage + 1)}>
            التالي
            <ChevronLeft className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default ProductsPagination;