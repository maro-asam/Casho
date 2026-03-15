import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/actions/auth/require.actions";

import { Button } from "@/components/ui/button";

import {
  DeleteBannerAction,
  GetBannersAction,
} from "@/actions/admin/banner.actions";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import Image from "next/image";

export default async function BannersPage() {
  const userId = await requireAuth();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true, name: true },
  });

  if (!store) {
    return <div className="wrapper py-10">لم يتم العثور على متجر</div>;
  }

  const banners = await GetBannersAction(store.id);
  console.log(banners);
  return (
    <div className="wrapper py-10" dir="rtl">
      {/* الهيدر */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold">البانرز</h1>
          <p className="text-sm text-muted-foreground">
            متجر: <span className="font-medium">{store.name}</span>
          </p>
        </div>

        <Button asChild>
          <Link href="/dashboard/banners/new">+ إضافة بانر</Link>
        </Button>
      </div>

      {banners.length === 0 ? (
        <div className="border rounded-2xl p-10 text-center opacity-80">
          No banners yet
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {banners.map((c) => (
            <Card key={c.id}>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="font-semibold text-lg">{c.title}</div>
                  <Image
                    src={c.image}
                    alt={c.title}
                    width={100}
                    height={100}
                    className="rounded-lg"
                  />
                </div>
              </CardContent>

              <CardFooter>
                <form
                  action={async () => {
                    "use server";
                    await DeleteBannerAction(c.id, store.id);
                  }}

                  className="w-full"
                >
                  <Button type="submit" variant="destructive" className="w-full">
                    حذف
                  </Button>
                </form>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
