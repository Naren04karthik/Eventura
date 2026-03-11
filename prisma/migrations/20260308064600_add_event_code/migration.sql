-- AlterTable
-- Add eventCode column with a temporary default
ALTER TABLE "events" ADD COLUMN "eventCode" TEXT;

-- Generate unique 6-digit codes for existing events
DO $$
DECLARE
  event_record RECORD;
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  FOR event_record IN SELECT id FROM events WHERE "eventCode" IS NULL LOOP
    LOOP
      -- Generate a random 6-digit code
      new_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
      
      -- Check if code already exists
      SELECT EXISTS(SELECT 1 FROM events WHERE "eventCode" = new_code) INTO code_exists;
      
      -- If unique, update and exit loop
      IF NOT code_exists THEN
        UPDATE events SET "eventCode" = new_code WHERE id = event_record.id;
        EXIT;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- Make eventCode required and unique
ALTER TABLE "events" ALTER COLUMN "eventCode" SET NOT NULL;
ALTER TABLE "events" ADD CONSTRAINT "events_eventCode_key" UNIQUE ("eventCode");

-- CreateIndex
CREATE INDEX "events_eventCode_idx" ON "events"("eventCode");
