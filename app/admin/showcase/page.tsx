import type { Metadata } from "next";
import { ExternalLink, LayoutTemplate, Plus } from "lucide-react";

import { requireAdmin } from "@/actions/admin/admin-guard.actions";
import { ListCard, PageHeader, Unavailable } from "@/components/saas-page";
import { Button } from "@/components/ui/button";
import { storePublicUrl } from "@/helpers/BuildStoreURL";
import { prisma } from "@/lib/prisma";
import { resizeCloudinary } from "@/lib/showcase/public";
import { isStorefrontOpen } from "@/lib/subscriptions";
import { ShowcaseFormDialog } from "./_components/showcase-form-dialog";
import { ShowcaseRow, type ShowcaseAdminRow } from "./_components/showcase-row";

export const metadata: Metadata = { title: "أمثلة كاشو" };

export default async function AdminShowcasePage() {
  await requireAdmin();
  const rows = await prisma.showcaseSite.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      category: true,
      url: true,
      imageUrl: true,
      published: true,
      store: { select: { slug: true, customDomain: true, customDomainStatus: true, subscriptionStatus: true } },
    },
  });

  const sites: ShowcaseAdminRow[] = rows.map(({ store, ...row }) => {
    const liveUrl = store ? storePublicUrl(store) : row.url;
    return {
      ...row,
      url: liveUrl,
      thumbUrl: resizeCloudinary(row.imageUrl, 320),
      store: store ? { slug: store.slug, url: liveUrl, open: isStorefrontOpen(store.subscriptionStatus) } : null,
    };
  });
  const visible = sites.filter((s) => s.published && (!s.store || s.store.open)).length;

  const addButton = (
    <ShowcaseFormDialog
      trigger={
        <Button size="sm">
          <Plus className="size-4" />
          مثال جديد
        </Button>
      }
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="أمثلة كاشو"
        description={
          sites.length
            ? `${visible} من ${sites.length} ظاهرين في سكشن «مبني بكاشو» في الصفحة الرئيسية. الترتيب هنا هو ترتيبهم هناك.`
            : "متاجر حقيقية معمولة بكاشو بتظهر في الصفحة الرئيسية. السكشن بيستخبى لوحده لو مفيش ولا مثال ظاهر."
        }
        actions={
          <>
            {visible > 0 && (
              <Button size="sm" variant="outline" asChild>
                <a href="/#showcase" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" />
                  شوف السكشن
                </a>
              </Button>
            )}
            {addButton}
          </>
        }
      />

      <ListCard>
        {sites.length === 0 ? (
          <Unavailable
            icon={LayoutTemplate}
            title="مفيش أمثلة لسه"
            description="أضف متجر معمول بكاشو، ارفع سكرين شوت للصفحة الرئيسية بتاعته، وهيظهر للزوار في الصفحة الرئيسية."
            action={addButton}
          />
        ) : (
          <ul className="divide-y divide-border">
            {sites.map((site, i) => (
              <ShowcaseRow key={`${site.id}:${site.published}`} site={site} first={i === 0} last={i === sites.length - 1} />
            ))}
          </ul>
        )}
      </ListCard>
    </div>
  );
}
