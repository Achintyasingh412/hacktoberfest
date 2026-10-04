import { ResourceInfo, TimeSlot, Resident, Booking, AuditLogEntry } from '../types';

export const TIME_SLOTS: TimeSlot[] = [
  { id: '17:00-18:00', label: '5:00 PM - 6:00 PM', startHour: 17, endHour: 18 },
  { id: '18:00-19:00', label: '6:00 PM - 7:00 PM', startHour: 18, endHour: 19 },
  { id: '19:00-20:00', label: '7:00 PM - 8:00 PM', startHour: 19, endHour: 20 },
  { id: '20:00-21:00', label: '8:00 PM - 9:00 PM', startHour: 20, endHour: 21 },
  { id: '21:00-22:00', label: '9:00 PM - 10:00 PM', startHour: 21, endHour: 22 },
  { id: '22:00-23:00', label: '10:00 PM - 11:00 PM', startHour: 22, endHour: 23 },
];

export const STRICT_RESOURCES: ResourceInfo[] = [
  {
    id: 'tt-racket-1',
    name: 'Table Tennis Racket #1',
    category: 'Table Tennis',
    icon: '🏓',
    description: 'Butterfly Stayer 3000 inverted rubber paddle with reinforced edge tape.',
    curfewRule: 'Must be returned to the Common Room Cabinet by 11:05 PM sharp.',
    depositRule: 'Damage to rubber surface incurs a 2-credit deduction and common room duty.',
  },
  {
    id: 'tt-racket-2',
    name: 'Table Tennis Racket #2',
    category: 'Table Tennis',
    icon: '🏓',
    description: 'Stiga Pro Carbon offensive blade with high-spin smooth tack.',
    curfewRule: 'Balls must be kept in the mesh pouch; no stepping on loose balls.',
    depositRule: 'Must be handed over directly to the next booked resident or security desk.',
  },
  {
    id: 'badminton-a',
    name: 'Badminton Court A',
    category: 'Badminton',
    icon: '🏸',
    description: 'Primary indoor wooden court with competition nylon netting.',
    curfewRule: 'Non-marking court shoes strictly mandatory. Lights dim automatically at 11:15 PM.',
    depositRule: 'Singles or doubles allowed; maximum 6 spectators on side benches.',
  },
  {
    id: 'badminton-b',
    name: 'Badminton Court B',
    category: 'Badminton',
    icon: '🏸',
    description: 'Secondary court adjacent to south wing with synthetic shock-absorbing mat.',
    curfewRule: 'Strict curfew at 11:00 PM. No barefoot play under any circumstances.',
    depositRule: 'Shuttlecocks must be cleared from the girders before leaving.',
  },
  {
    id: 'basketball-hoop',
    name: 'Basketball & Hoop',
    category: 'Courts',
    icon: '🏀',
    description: 'Outdoor floodlit half-court with Spalding composite leather ball #7.',
    curfewRule: 'No dribbling through hostel corridors after 10:00 PM. Ball must be returned to locker.',
    depositRule: 'Do not hang on rims. Warden will seize unattended basketballs without warning.',
  },
  {
    id: 'bluetooth-speaker',
    name: 'Bluetooth Music Speaker',
    category: 'Audio',
    icon: '🔊',
    description: 'JBL Charge 5 rugged portable bass speaker for open courtyard activities.',
    curfewRule: 'Volume capped at 65 dB after 9:30 PM. Complete radio silence after 10:30 PM (study hours).',
    depositRule: 'Waterproof check required upon return. Keep AUX cable in the zipper pouch.',
  },
];

export const INITIAL_RESIDENTS: Resident[] = [];

export const TODAY_STR = new Date().toISOString().split('T')[0];

export const INITIAL_BOOKINGS: Booking[] = [];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'audit-genesis',
    timestamp: new Date().toISOString(),
    action: 'CONFLICT_RESOLVED',
    userId: 'SYSTEM',
    userName: 'Hostel Administration',
    resourceId: 'badminton-a',
    resourceName: 'Hostel Nexus Facilities',
    slotLabel: 'Semester Session',
    date: TODAY_STR,
    details: 'Hostel Nexus Amenity & Conflict Accord initialized. Dynamic student registration active. Permanent immutable ledger verified.',
    creditsChanged: 0,
    hash: '0x00000000genesis',
  },
];
