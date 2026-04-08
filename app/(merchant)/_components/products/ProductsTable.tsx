import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import ProductTableRow from "./ProductTableRow";

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

export default function ProductsTable({ products }: { products: Product[] }) {
  return (
    <Card className="overflow-hidden rounded-lg border shadow-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[280px] text-right font-semibold">
                  المنتج
                </TableHead>
                <TableHead className="text-right font-semibold">
                  التصنيف
                </TableHead>
                <TableHead className="text-right font-semibold">
                  السعر
                </TableHead>
                <TableHead className="text-right font-semibold">
                  الحالة
                </TableHead>
                <TableHead className="text-right font-semibold">مميز</TableHead>
                <TableHead className="text-right font-semibold">
                  الإجراءات
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {products.map((product) => (
                <ProductTableRow key={product.id} product={product} />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
