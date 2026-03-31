/**
 * Canonical property list for the Stoneriver HG portfolio (21 properties).
 * Grouped by brand to match Revenue Flash PDF ordering.
 *
 * `rooms` = total physical room inventory per property.
 * Sources: Hotel Statistics reports where available, otherwise derived
 * from Revenue Flash data (rooms_sold / occupancy%).
 */

export interface Property {
  name: string;
  entityName: string;
  group: string;
  state: string;
  rooms: number;
  city: string;
  region: string;
}

export const PROPERTIES: Property[] = [
  // IHG
  { name: 'Candlewood Suites', entityName: 'LeeB4', group: 'IHG', state: 'MS', rooms: 79, city: 'Fulton', region: 'Northeast MS' },
  { name: 'Holiday Inn Express Fulton', entityName: 'Fulton Lodging', group: 'IHG', state: 'MS', rooms: 75, city: 'Fulton', region: 'Northeast MS' },
  { name: 'Holiday Inn Express Memphis Southwind', entityName: 'Royal Living Memphis', group: 'IHG', state: 'MS', rooms: 91, city: 'Southwind', region: 'Northwest MS' },
  { name: 'Holiday Inn Express Tupelo', entityName: 'McClure Street Lodging', group: 'IHG', state: 'MS', rooms: 104, city: 'Tupelo', region: 'Northeast MS' },
  { name: 'Holiday Inn Tupelo', entityName: 'LeeB 1', group: 'IHG', state: 'MS', rooms: 121, city: 'Tupelo', region: 'Northeast MS' },
  { name: 'Holiday Inn Meridian', entityName: '100 HML', group: 'IHG', state: 'MS', rooms: 121, city: 'Meridian', region: 'East Central MS' },
  // Marriott
  { name: 'Four Points Memphis Southwind', entityName: 'Southwind Lodging', group: 'Marriott', state: 'MS', rooms: 93, city: 'Southwind', region: 'Northwest MS' },
  { name: 'TownePlace Suites', entityName: 'Capital Hotels', group: 'Marriott', state: 'MS', rooms: 97, city: 'Olive Branch', region: 'Northwest MS' },
  // Best Western
  { name: 'Best Western Tupelo', entityName: 'BW Tupelo', group: 'Best Western', state: 'MS', rooms: 73, city: 'Tupelo', region: 'Northeast MS' },
  { name: 'SureStay Hotel', entityName: 'JB Lodging', group: 'Best Western', state: 'MS', rooms: 68, city: 'Tupelo', region: 'Northeast MS' },
  { name: 'Best Western Plus Olive Branch', entityName: 'Craft-Goodman', group: 'Best Western', state: 'MS', rooms: 87, city: 'Olive Branch', region: 'Northwest MS' },
  // Hyatt
  { name: 'Hyatt Place Biloxi', entityName: 'The Creeks II', group: 'Hyatt', state: 'MS', rooms: 117, city: 'Biloxi', region: 'Gulf Coast' },
  // Choice
  { name: 'Comfort Inn Tupelo', entityName: 'LeeB2', group: 'Choice', state: 'MS', rooms: 58, city: 'Tupelo', region: 'Northeast MS' },
  // Hilton
  { name: 'HGI Olive Branch', entityName: 'NMS Hotels', group: 'Hilton', state: 'MS', rooms: 121, city: 'Olive Branch', region: 'Northwest MS' },
  { name: 'Home2 Suites By Hilton', entityName: 'Gloster Street Lodging', group: 'Hilton', state: 'MS', rooms: 89, city: 'Tupelo', region: 'Northeast MS' },
  { name: 'Tru By Hilton Tupelo', entityName: 'Lee County Lodging', group: 'Hilton', state: 'MS', rooms: 90, city: 'Tupelo', region: 'Northeast MS' },
  { name: 'Hilton Garden Inn Meridian', entityName: '109 GIML', group: 'Hilton', state: 'MS', rooms: 133, city: 'Meridian', region: 'East Central MS' },
  { name: 'Hampton Inn Meridian', entityName: '103 HAML', group: 'Hilton', state: 'MS', rooms: 116, city: 'Meridian', region: 'East Central MS' },
  { name: 'Hampton Inn Vicksburg', entityName: 'Warren County Lodging', group: 'Hilton', state: 'MS', rooms: 123, city: 'Vicksburg', region: 'West Central MS' },
  { name: 'DoubleTree Biloxi', entityName: 'Biloxi Premiere Lodging', group: 'Hilton', state: 'MS', rooms: 195, city: 'Biloxi', region: 'Gulf Coast' },
  { name: 'Hilton Garden Inn Madison', entityName: 'New Mansdale Lodging', group: 'Hilton', state: 'MS', rooms: 134, city: 'Madison', region: 'Central MS' },
];

/** Quick lookup: property name → total room inventory */
export const ROOM_INVENTORY: Record<string, number> = Object.fromEntries(
  PROPERTIES.map((p) => [p.name, p.rooms]),
);

/** Brand group display order matching the Revenue Flash PDF */
export const GROUP_ORDER = [
  'IHG',
  'Marriott',
  'Best Western',
  'Hyatt',
  'Choice',
  'Hilton',
];

/** Unique cities for filter dropdown */
export const CITIES = [...new Set(PROPERTIES.map((p) => p.city))].sort();

/** Unique regions for filter dropdown */
export const REGIONS = [...new Set(PROPERTIES.map((p) => p.region))].sort();
