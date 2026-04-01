-- Flash Report table: daily property snapshot with F&B, room status, AR aging.
-- One row per property per date.

CREATE TABLE IF NOT EXISTS flash_report (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_name TEXT NOT NULL,
  entity_name TEXT,
  property_group TEXT NOT NULL,
  report_date DATE NOT NULL,

  -- Operating metrics
  occupancy_pct NUMERIC(5,2),
  adr NUMERIC(10,2),
  revpar NUMERIC(10,2),
  room_revenue NUMERIC(12,2),
  fb_revenue NUMERIC(12,2),

  -- Room status
  rooms_occupied INTEGER,
  rooms_ooo INTEGER DEFAULT 0,
  rooms_dirty INTEGER DEFAULT 0,
  room_nights_reserved INTEGER,
  no_shows INTEGER DEFAULT 0,

  -- Accounts Receivable aging
  ar_up_to_30 NUMERIC(12,2),
  ar_over_30 NUMERIC(12,2),
  ar_over_60 NUMERIC(12,2),
  ar_over_90 NUMERIC(12,2),
  ar_over_120 NUMERIC(12,2),
  ar_total NUMERIC(12,2),

  -- Metadata
  extracted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(property_name, report_date)
);

CREATE INDEX IF NOT EXISTS idx_fr_date ON flash_report(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_fr_property_date ON flash_report(property_name, report_date DESC);

-- Engineering OOO rooms: one row per room per date.

CREATE TABLE IF NOT EXISTS engineering_ooo_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_name TEXT NOT NULL,
  report_date DATE NOT NULL,
  room_number TEXT NOT NULL,
  date_ooo DATE,
  reason TEXT,
  notes TEXT,
  is_long_term BOOLEAN DEFAULT FALSE,

  -- Metadata
  extracted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(property_name, report_date, room_number, is_long_term)
);

CREATE INDEX IF NOT EXISTS idx_eoo_date ON engineering_ooo_rooms(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_eoo_property ON engineering_ooo_rooms(property_name, report_date DESC);

-- Properties reference table (canonical list with metadata)

CREATE TABLE IF NOT EXISTS property_directory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  entity_name TEXT,
  brand_group TEXT NOT NULL,
  state TEXT,
  city TEXT,
  region TEXT,
  rooms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies: anon can read, service_role can write

ALTER TABLE flash_report ENABLE ROW LEVEL SECURITY;
ALTER TABLE engineering_ooo_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_directory ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "anon read flash_report" ON flash_report FOR SELECT TO anon, authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "service write flash_report" ON flash_report FOR INSERT TO service_role WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "service update flash_report" ON flash_report FOR UPDATE TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "anon read engineering_ooo" ON engineering_ooo_rooms FOR SELECT TO anon, authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "service write engineering_ooo" ON engineering_ooo_rooms FOR INSERT TO service_role WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "service update engineering_ooo" ON engineering_ooo_rooms FOR UPDATE TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "anon read property_directory" ON property_directory FOR SELECT TO anon, authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "service write property_directory" ON property_directory FOR INSERT TO service_role WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
