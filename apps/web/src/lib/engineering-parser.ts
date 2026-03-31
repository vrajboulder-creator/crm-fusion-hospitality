/**
 * Parses Engineering Flash xlsx text (tab-separated, multi-sheet)
 * into structured OOO room data.
 */

import type { OOORoom, EngineeringFlashData } from '../components/stoneriver/engineering-types';

/** Map hotel short names from Engineering Flash to canonical property names */
const HOTEL_MAP: Record<string, string> = {
  'bw tupelo': 'Best Western Tupelo',
  'hie fulton': 'Holiday Inn Express Fulton',
  'hi tupelo': 'Holiday Inn Tupelo',
  'holiday inn tupelo': 'Holiday Inn Tupelo',
  'comfort inn tupelo': 'Comfort Inn Tupelo',
  'candlewood tupelo': 'Candlewood Suites',
  'hie tupelo': 'Holiday Inn Express Tupelo',
  'tru tupelo': 'Tru By Hilton Tupelo',
  'home 2 suites': 'Home2 Suites By Hilton',
  'home2 suites tupelo': 'Home2 Suites By Hilton',
  'hyatt biloxi': 'Hyatt Place Biloxi',
  'hyatt place biloxi': 'Hyatt Place Biloxi',
  'townplace olive branch': 'TownePlace Suites',
  'tps olive branch': 'TownePlace Suites',
  'hgi olive branch': 'HGI Olive Branch',
  'hilton garden inn olive branch': 'HGI Olive Branch',
  'bw plus ob': 'Best Western Plus Olive Branch',
  'hgi madison': 'Hilton Garden Inn Madison',
  'holiday inn meridian': 'Holiday Inn Meridian',
  'hampton inn meridian': 'Hampton Inn Meridian',
  'hgi meridian': 'Hilton Garden Inn Meridian',
  'hampton inn vicksburg': 'Hampton Inn Vicksburg',
  'doubletree biloxi': 'DoubleTree Biloxi',
  'fp southwind': 'Four Points Memphis Southwind',
  'hie southwind': 'Holiday Inn Express Memphis Southwind',
  'hie memphis southwind': 'Holiday Inn Express Memphis Southwind',
  'four points memphis southwind': 'Four Points Memphis Southwind',
  'surestay tupelo': 'SureStay Hotel',
};

function resolveHotel(hotel: string): string {
  return HOTEL_MAP[hotel.toLowerCase().trim()] ?? hotel;
}

function parseRooms(lines: string[], isLongTerm: boolean): OOORoom[] {
  const rooms: OOORoom[] = [];

  for (const line of lines) {
    const cells = line.split('\t');
    const hotel = cells[0]?.trim() ?? '';
    const roomNum = cells[1]?.trim() ?? '';
    const dateOOO = cells[2]?.trim() ?? '';
    const reason = cells[3]?.trim() ?? '';
    const notes = cells[4]?.trim() ?? '';

    // Skip header, title, and empty rows
    if (!hotel || hotel === 'Hotel' || hotel === 'Engineering Flash' || hotel === 'Hotels') continue;
    if (!roomNum) continue;

    rooms.push({
      hotel,
      propertyName: resolveHotel(hotel),
      roomNumber: roomNum,
      dateOOO,
      reason,
      notes,
      isLongTerm,
    });
  }

  return rooms;
}

export function parseEngineeringFlash(text: string, reportDate: string): EngineeringFlashData {
  // Split into sheets by "=== Sheet:" markers
  const sheets = text.split(/=== Sheet:\s*/);
  let oooRooms: OOORoom[] = [];
  let longTermRooms: OOORoom[] = [];

  for (const sheet of sheets) {
    const firstLine = sheet.split('\n')[0]?.trim() ?? '';
    const lines = sheet.split('\n').slice(1);

    if (firstLine.includes('Long Term OOO')) {
      longTermRooms = parseRooms(lines, true);
    } else if (firstLine.includes('OOO Rooms')) {
      oooRooms = parseRooms(lines, false);
    }
  }

  return { reportDate, oooRooms, longTermRooms };
}
