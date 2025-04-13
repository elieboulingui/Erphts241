-- AlterTable
ALTER TABLE "ActivityLog" ADD COLUMN     "favoriteId" TEXT;

-- CreateIndex
CREATE INDEX "ActivityLog_favoriteId_idx" ON "ActivityLog"("favoriteId");

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_favoriteId_fkey" FOREIGN KEY ("favoriteId") REFERENCES "Favorite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
