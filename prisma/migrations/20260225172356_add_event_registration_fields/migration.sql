-- AlterTable
ALTER TABLE "events" ADD COLUMN     "customRegistrationFields" TEXT,
ADD COLUMN     "maxTeamSize" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "minTeamSize" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "registrationType" TEXT NOT NULL DEFAULT 'SOLO',
ADD COLUMN     "teamRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ticketPrice" DECIMAL(10,2);
