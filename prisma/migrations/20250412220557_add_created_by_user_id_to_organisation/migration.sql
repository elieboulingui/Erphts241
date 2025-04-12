-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "createdByUserId" TEXT;

-- AlterTable
ALTER TABLE "Organisation" ADD COLUMN     "createdByUserId" TEXT;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
