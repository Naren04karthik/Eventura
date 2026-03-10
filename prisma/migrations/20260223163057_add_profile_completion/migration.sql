-- CreateEnum
CREATE TYPE "Branch" AS ENUM ('CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'AIML', 'BBA', 'BCA', 'MBA', 'MCA', 'OTHER');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isProfileComplete" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "gender" TEXT,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "college" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "branch" "Branch" NOT NULL,
    "customBranch" TEXT,
    "collegeId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "profilePhoto" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_userId_key" ON "profiles"("userId");

-- CreateIndex
CREATE INDEX "profiles_userId_idx" ON "profiles"("userId");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
