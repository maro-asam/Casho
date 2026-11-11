-- Casho examples on the landing page, managed at /admin/showcase.
CREATE TABLE "ShowcaseSite" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "storeId" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShowcaseSite_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ShowcaseSite_published_sortOrder_idx" ON "ShowcaseSite"("published", "sortOrder");
CREATE INDEX "ShowcaseSite_storeId_idx" ON "ShowcaseSite"("storeId");

ALTER TABLE "ShowcaseSite" ADD CONSTRAINT "ShowcaseSite_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;
