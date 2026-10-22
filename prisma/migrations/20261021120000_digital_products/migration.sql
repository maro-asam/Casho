-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "isDigital" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "digitalUrl" TEXT,
ADD COLUMN     "digitalFileName" TEXT;
