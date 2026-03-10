/*
  Warnings:

  - You are about to drop the column `tempPassword` on the `admin_requests` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "admin_requests" DROP COLUMN "tempPassword",
ADD COLUMN     "passwordHash" TEXT;
