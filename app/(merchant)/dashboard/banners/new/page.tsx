import { requireAuth } from "@/actions/auth/require.actions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { CreateBannerAction } from "@/actions/admin/banner.actions";

export default async function NewBannerRoute() {
  const userId = await requireAuth();

  const store = await prisma.store.findFirst({
    where: { userId },
    select: { id: true },
  });

  if (!store) {
    return <div className="wrapper py-10">لم يتم العثور على متجر</div>;
  }

  return (
    <div className="wrapper py-10 max-w-lg" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle>إنشاء بانر جديد</CardTitle>
          <CardDescription>أضف بانر جديد لعرضه في متجرك.</CardDescription>
        </CardHeader>

        <CardContent>
          <form
            action={async (formData) => {
              "use server";
              const title = formData.get("title") as string;
              const image = formData.get("image") as string;

              await CreateBannerAction(store.id, title, image);

              redirect("/dashboard/banners");
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="title">اسم البانر</Label>
              <Input
                id="title"
                name="title"
                required
                placeholder="مثال: تخفيضات الصيف"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">صورة البانر</Label>
              <Input
                id="image"
                name="image"
                required
                placeholder="مثال: https://example.com/image.jpg"
              />
            </div>

            <Button type="submit" className="w-full">
              إنشاء البانر
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
