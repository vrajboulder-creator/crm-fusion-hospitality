-- Allow anon role to insert/update performance data (needed for scanner ingestion via anon key).

DO $$ BEGIN
  CREATE POLICY "anon can insert daily_hotel_performance"
    ON daily_hotel_performance FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "anon can update daily_hotel_performance"
    ON daily_hotel_performance FOR UPDATE
    TO anon, authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- flash_report table
DO $$ BEGIN
  CREATE POLICY "anon can insert flash_report"
    ON flash_report FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "anon can update flash_report"
    ON flash_report FOR UPDATE
    TO anon, authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- engineering_ooo_rooms table
DO $$ BEGIN
  CREATE POLICY "anon can insert engineering_ooo_rooms"
    ON engineering_ooo_rooms FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "anon can update engineering_ooo_rooms"
    ON engineering_ooo_rooms FOR UPDATE
    TO anon, authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
