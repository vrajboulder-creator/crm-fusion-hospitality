/**
 * Canonical property list for the Stoneriver HG portfolio (21 properties).
 * Grouped by brand to match Revenue Flash PDF ordering.
 */

export interface Property {
  name: string;
  group: string;
  state: string;
}

export const PROPERTIES: Property[] = [
  // IHG
  { name: 'Candlewood Suites', group: 'IHG', state: 'MS' },
  { name: 'Holiday Inn Express Fulton', group: 'IHG', state: 'MS' },
  { name: 'Holiday Inn Express Memphis Southwind', group: 'IHG', state: 'TN' },
  { name: 'Holiday Inn Express Tupelo', group: 'IHG', state: 'MS' },
  { name: 'Holiday Inn Tupelo', group: 'IHG', state: 'MS' },
  { name: 'Holiday Inn Meridian', group: 'IHG', state: 'MS' },
  // Marriott
  { name: 'Four Points Memphis Southwind', group: 'Marriott', state: 'TN' },
  { name: 'TownePlace Suites', group: 'Marriott', state: 'MS' },
  // Best Western
  { name: 'Best Western Tupelo', group: 'Best Western', state: 'MS' },
  { name: 'SureStay Hotel', group: 'Best Western', state: 'MS' },
  { name: 'Best Western Plus Olive Branch', group: 'Best Western', state: 'MS' },
  // Hyatt
  { name: 'Hyatt Place Biloxi', group: 'Hyatt', state: 'MS' },
  // Choice
  { name: 'Comfort Inn Tupelo', group: 'Choice', state: 'MS' },
  // Hilton
  { name: 'HGI Olive Branch', group: 'Hilton', state: 'MS' },
  { name: 'Home2 Suites By Hilton', group: 'Hilton', state: 'MS' },
  { name: 'Tru By Hilton Tupelo', group: 'Hilton', state: 'MS' },
  { name: 'Hilton Garden Inn Meridian', group: 'Hilton', state: 'MS' },
  { name: 'Hampton Inn Meridian', group: 'Hilton', state: 'MS' },
  { name: 'Hampton Inn Vicksburg', group: 'Hilton', state: 'MS' },
  { name: 'DoubleTree Biloxi', group: 'Hilton', state: 'MS' },
  { name: 'Hilton Garden Inn Madison', group: 'Hilton', state: 'MS' },
];

/** Brand group display order matching the Revenue Flash PDF */
export const GROUP_ORDER = [
  'IHG',
  'Marriott',
  'Best Western',
  'Hyatt',
  'Choice',
  'Hilton',
];
