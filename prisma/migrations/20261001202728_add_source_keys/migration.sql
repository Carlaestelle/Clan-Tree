/*
  Warnings:

  - A unique constraint covering the columns `[sourceKey]` on the table `Person` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sourceKey]` on the table `TimelineEvent` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "sourceKey" TEXT;

-- AlterTable
ALTER TABLE "TimelineEvent" ADD COLUMN     "sourceKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Person_sourceKey_key" ON "Person"("sourceKey");

-- CreateIndex
CREATE UNIQUE INDEX "TimelineEvent_sourceKey_key" ON "TimelineEvent"("sourceKey");
