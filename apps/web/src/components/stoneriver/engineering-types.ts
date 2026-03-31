/**
 * Types for the Engineering Flash dashboard.
 */

export interface OOORoom {
  hotel: string;
  propertyName: string;
  roomNumber: string;
  dateOOO: string;
  reason: string;
  notes: string;
  isLongTerm: boolean;
}

export interface EngineeringFlashData {
  reportDate: string;
  oooRooms: OOORoom[];
  longTermRooms: OOORoom[];
}
