import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import ReviewTableRow from "./ReviewTableRow";

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

export default function ReviewsTable({
  reviews,
  products,
}: {
  reviews: ReviewRow[];
  products: Product[];
}) {
  return (
    <Card className="overflow-hidden rounded-xl border shadow-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-44 text-right font-semibold">
                  العميل
                </TableHead>
                <TableHead className="text-right font-semibold">
                  المنتج
                </TableHead>
                <TableHead className="text-right font-semibold">
                  التقييم
                </TableHead>
                <TableHead className="min-w-64 text-right font-semibold">
                  المراجعة
                </TableHead>
                <TableHead className="text-right font-semibold">
                  التاريخ
                </TableHead>
                <TableHead className="text-right font-semibold">
                  الإجراءات
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => (
                <ReviewTableRow
                  key={review.id}
                  review={review}
                  products={products}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
