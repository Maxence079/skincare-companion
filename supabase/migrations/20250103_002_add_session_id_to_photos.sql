-- Add session_id column to skin_photos if it doesn't exist

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'skin_photos' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE skin_photos ADD COLUMN session_id TEXT;
    RAISE NOTICE 'Added session_id column to skin_photos';
  ELSE
    RAISE NOTICE 'session_id column already exists in skin_photos';
  END IF;
END $$;
