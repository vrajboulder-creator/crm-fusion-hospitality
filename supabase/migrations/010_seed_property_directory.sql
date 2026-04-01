-- Seed property_directory with all 21 Fusion Hospitality properties.

INSERT INTO property_directory (name, entity_name, brand_group, state, city, region, rooms) VALUES
  ('Candlewood Suites', 'LeeB4', 'IHG', 'MS', 'Fulton', 'Northeast MS', 79),
  ('Holiday Inn Express Fulton', 'Fulton Lodging', 'IHG', 'MS', 'Fulton', 'Northeast MS', 75),
  ('Holiday Inn Express Memphis Southwind', 'Royal Living Memphis', 'IHG', 'MS', 'Southwind', 'Northwest MS', 91),
  ('Holiday Inn Express Tupelo', 'McClure Street Lodging', 'IHG', 'MS', 'Tupelo', 'Northeast MS', 104),
  ('Holiday Inn Tupelo', 'LeeB 1', 'IHG', 'MS', 'Tupelo', 'Northeast MS', 121),
  ('Holiday Inn Meridian', '100 HML', 'IHG', 'MS', 'Meridian', 'East Central MS', 121),
  ('Four Points Memphis Southwind', 'Southwind Lodging', 'Marriott', 'MS', 'Southwind', 'Northwest MS', 93),
  ('TownePlace Suites', 'Capital Hotels', 'Marriott', 'MS', 'Olive Branch', 'Northwest MS', 97),
  ('Best Western Tupelo', 'BW Tupelo', 'Best Western', 'MS', 'Tupelo', 'Northeast MS', 73),
  ('SureStay Hotel', 'JB Lodging', 'Best Western', 'MS', 'Tupelo', 'Northeast MS', 68),
  ('Best Western Plus Olive Branch', 'Craft-Goodman', 'Best Western', 'MS', 'Olive Branch', 'Northwest MS', 87),
  ('Hyatt Place Biloxi', 'The Creeks II', 'Hyatt', 'MS', 'Biloxi', 'Gulf Coast', 117),
  ('Comfort Inn Tupelo', 'LeeB2', 'Choice', 'MS', 'Tupelo', 'Northeast MS', 58),
  ('HGI Olive Branch', 'NMS Hotels', 'Hilton', 'MS', 'Olive Branch', 'Northwest MS', 121),
  ('Home2 Suites By Hilton', 'Gloster Street Lodging', 'Hilton', 'MS', 'Tupelo', 'Northeast MS', 89),
  ('Tru By Hilton Tupelo', 'Lee County Lodging', 'Hilton', 'MS', 'Tupelo', 'Northeast MS', 90),
  ('Hilton Garden Inn Meridian', '109 GIML', 'Hilton', 'MS', 'Meridian', 'East Central MS', 133),
  ('Hampton Inn Meridian', '103 HAML', 'Hilton', 'MS', 'Meridian', 'East Central MS', 116),
  ('Hampton Inn Vicksburg', 'Warren County Lodging', 'Hilton', 'MS', 'Vicksburg', 'West Central MS', 123),
  ('DoubleTree Biloxi', 'Biloxi Premiere Lodging', 'Hilton', 'MS', 'Biloxi', 'Gulf Coast', 195),
  ('Hilton Garden Inn Madison', 'New Mansdale Lodging', 'Hilton', 'MS', 'Madison', 'Central MS', 134)
ON CONFLICT (name) DO UPDATE SET
  entity_name = EXCLUDED.entity_name,
  brand_group = EXCLUDED.brand_group,
  city = EXCLUDED.city,
  region = EXCLUDED.region,
  rooms = EXCLUDED.rooms;
