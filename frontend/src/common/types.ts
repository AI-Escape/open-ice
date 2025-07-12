export type Task = {
  status: string;
};

export type Criminality =
  | 'Convicted Criminal'
  | 'Pending Criminal Charges'
  | 'Other Immigration Violator'
  | 'Average'
  | 'Total';

export type Agency = 'Average' | 'ICE' | 'CBP' | 'Total';

export type Range = 'month' | 'fy';

export type BookOutReason =
  | 'Bonded Out'
  | 'Bond Set by ICE'
  | 'Bond Set by IJ'
  | 'Order of Recognizance'
  | 'Order of Supervision'
  | 'Paroled'
  | 'Proceedings Terminated'
  | 'Release to Remove'
  | 'Relief Granted by IJ'
  | 'Transfer to U.S. Marshals or other agency'
  | 'Transferred'
  | 'Other'
  | 'Total';

export const AGENCY_COLORS: Record<Agency, string> = {
  Average: '#cccccc',
  ICE: '#d42520',
  CBP: '#688ae8',
  Total: '#cccccc',
};

export const AGENCY_DESCRIPTIONS: Record<Agency, string> = {
  Average: 'Average',
  ICE: 'Immigration and Customs Enforcement (ICE) performs arrests throughout the U.S.',
  CBP: 'Customs and Border Protection (CBP) performs arrests at the border',
  Total: 'Total',
};

export const BOOK_OUT_FRIENDLY_NAMES: Record<BookOutReason, string> = {
  'Bonded Out': 'Bonded Out (will return to court)',
  'Bond Set by ICE': 'Bond Set by ICE (will return to court)',
  'Bond Set by IJ': 'Bond Set by IJ (will return to court)',
  'Order of Recognizance': 'Order of Recognizance (will return to court)',
  'Order of Supervision': 'Order of Supervision (monitored release)',
  Paroled: 'Paroled (temporary release)',
  'Proceedings Terminated': 'Proceedings Terminated (may stay in the U.S.)',
  'Release to Remove': 'Release to Remove (to be deported)',
  'Relief Granted by IJ': 'Relief Granted by IJ (may stay in the U.S.)',
  'Transfer to U.S. Marshals or other agency': 'Transfer to U.S. Marshals or other agency',
  Transferred: 'Transferred (to another facility)',
  Other: 'Other',
  Total: 'Total',
};

export const BOOK_OUT_DETAILS: Record<BookOutReason, string | null> = {
  'Bonded Out': 'will return to court',
  'Bond Set by ICE': 'will return to court',
  'Bond Set by IJ': 'will return to court',
  'Order of Recognizance': 'will return to court',
  'Order of Supervision': 'monitored release',
  Paroled: 'temporary release',
  'Proceedings Terminated': 'may stay in the U.S.',
  'Release to Remove': 'to be deported',
  'Relief Granted by IJ': 'may stay in the U.S.',
  'Transfer to U.S. Marshals or other agency': 'as a criminal or other custody transfer',
  Transferred: 'to another facility',
  Other: null,
  Total: null,
};

export const CRIMINALITY_DESCRIPTIONS: Record<Criminality, string | null> = {
  'Convicted Criminal':
    'People who have been convicted of a crime, with no differentiation between misdemeanors and felonies',
  'Pending Criminal Charges': 'People with pending criminal charges, but have not been convicted',
  'Other Immigration Violator':
    'People who are not U.S. citizens, but have been arrested for a suspected immigration violation',
  Average: null,
  Total: null,
};

export const BOOK_OUT_REASON_COLORS: Record<BookOutReason, string> = {
  // 🟢 Legal relief – best outcomes
  'Proceedings Terminated': '#1c9d91', // teal
  'Relief Granted by IJ': '#2dcfa4', // mint green

  // ✅ Released to community – moderate positive
  'Order of Recognizance': '#688ae8', // soft blue
  'Bonded Out': '#7e63dd', // violet – distinct from recognizance
  'Bond Set by IJ': '#9f8af0', // light purple
  'Bond Set by ICE': '#bbb2e0', // pale lavender (uncertain status)

  // 🟠 Conditional or limited release – mixed outcomes
  'Order of Supervision': '#f0a46e', // orange
  Paroled: '#ffb6a3', // soft salmon

  // ⚠️ Transfers / enforcement
  'Transfer to U.S. Marshals or other agency': '#f76b3c', // bright orange
  Transferred: '#d07a00', // amber

  // ❌ Deportation
  'Release to Remove': '#d42520', // red

  // ⚙️ Catch-alls
  Other: '#cccccc',
  Total: '#cccccc',
};

export const BOOK_OUT_REASON_ORDER: BookOutReason[] = [
  // catch-alls
  'Other',
  'Total',
  // 🟢 Legal wins
  'Proceedings Terminated',
  'Relief Granted by IJ',

  // ✅ Released to community
  'Order of Recognizance',
  'Bonded Out',
  'Bond Set by IJ',
  'Bond Set by ICE',

  // ⚖️ Monitored or humanitarian release
  'Order of Supervision',
  'Paroled',

  // ⚠️ Administrative
  'Transferred',
  'Transfer to U.S. Marshals or other agency',

  // ❌ Enforcement outcome
  'Release to Remove',
];

export type ThreatLevel = 'Level 1' | 'Level 2' | 'Level 3' | 'No Threat' | 'Total';

export const THREAT_LEVEL_COLORS: Record<ThreatLevel, string> = {
  'Level 3': '#688ae8', // blue
  'Level 2': '#f0a46e', // orange
  'Level 1': '#d42520', // red
  'No Threat': '#2ea597', // green
  Total: '#2ea597',
};

export const THREAT_LEVEL_DESCRIPTIONS: Record<ThreatLevel, string> = {
  'Level 1':
    'Level 1 – Highest priority: convicted of an aggravated felony or two + serious felonies; ICE treats as the greatest public-safety threat',
  'Level 2':
    'Level 2 – Moderate priority: convicted of one felony or three + misdemeanors; ICE considers a significant enforcement target',
  'Level 3':
    'Level 3 – Lower priority: at most a single misdemeanor or similarly minor offense; still removable but lowest criminal-threat tier',
  'No Threat':
    'No Threat – No criminal conviction on record; civil immigration violator only (ICE often still issues a civil warrant in these cases)',
  Total: 'Total',
};

export const THREAT_LEVEL_ORDER: ThreatLevel[] = [
  'No Threat',
  'Level 3',
  'Level 2',
  'Level 1',
  'Total',
];

export const CRIMINALITY_COLORS: Record<Criminality, string> = {
  // red
  'Convicted Criminal': '#d42520',
  // medium gray
  'Pending Criminal Charges': '#909090',
  // green
  // 'Other Immigration Violator': '#2ea597',
  // blue
  'Other Immigration Violator': '#688ae8',
  // average
  Average: '#2ea597',
  Total: '#2ea597',
};

export const CRIMINALITY_ORDER: Criminality[] = [
  'Other Immigration Violator',
  'Pending Criminal Charges',
  'Convicted Criminal',
  'Average',
  'Total',
];

export const DISPOSITION_ORDER: Disposition[] = [
  'Expedited Removal (I-860)',
  'Notice to Appear (I-862)',
  'Reinstatement of Deport Order (I-871)',
  'Other',
  'Total',
];

export const FACILITY_ORDER: string[] = ['Adult Individual', 'Family Unit Individual', 'Total'];

export type AverageDailyPopulation = {
  incomplete: boolean;
  started: boolean;
  range: Range;
  timestamp: string;
  agency: Agency;
  criminality: Criminality;
  population: number;
};

export type AverageStayLength = {
  incomplete: boolean;
  started: boolean;
  range: Range;
  timestamp: string;
  agency: Agency;
  criminality: Criminality;
  length_of_stay: number;
};

export type BookOutRelease = {
  incomplete: boolean;
  started: boolean;
  range: Range;
  timestamp: string;
  reason: BookOutReason;
  criminality: Criminality;
  releases: number;
};

export type BookIn = {
  incomplete: boolean;
  started: boolean;
  range: Range;
  timestamp: string;
  agency: Agency;
  bookings: number;
};

export const AGENCY_ORDER: Agency[] = ['ICE', 'CBP', 'Average', 'Total'];

export type Disposition =
  | 'Expedited Removal (I-860)'
  | 'Notice to Appear (I-862)'
  | 'Reinstatement of Deport Order (I-871)'
  | 'Other'
  | 'Total';

export const FACILITY_DESCRIPTIONS: Record<FacilityType, string> = {
  FSC: 'Family Unit Individual',
  Adult: 'Adult Individual',
  Total: 'Total',
};

export const FACILITY_DESCRIPTIONS_DETAILS: Record<string, string> = {
  'Family Unit Individual':
    'A Family Unit Individual is a person who is being held in a facility with their family.',
  'Adult Individual':
    'An Adult Individual is a person who is being held in an adult processing facility.',
  Total: 'Total',
};

export const DISPOSITION_DESCRIPTIONS: Record<Disposition, string> = {
  'Expedited Removal (I-860)':
    'An Expedited Removal (I-860) is a summary removal issued at or near the border via Form I-860 without immigration-court review under INA §235(b)(1).',
  'Notice to Appear (I-862)':
    'A Notice to Appear (I-862) is a charging document that starts formal removal proceedings before an immigration judge.',
  'Reinstatement of Deport Order (I-871)':
    'A Reinstatement of Deport Order (I-871) revives and executes a prior removal order for someone who re-entered the U.S., documented on Form I-871.',
  Other:
    'Other dispositions such as voluntary return, parole, administrative closure, and other releases.',
  Total: 'All processing dispositions combined (FSC + Adult)',
};

export type FacilityType = 'FSC' | 'Adult' | 'Total';

export type ProcessingDisposition = {
  disposition: Disposition;
  facility: FacilityType;
  population: number;
};

export type Facility = {
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  aor: string;
  type_detailed: FacilityType;
  gender?: string;
  fy25_alos: number;
  level_a?: number;
  level_b?: number;
  level_c?: number;
  level_d?: number;
  male_crim?: number;
  male_non_crim?: number;
  female_crim?: number;
  female_non_crim?: number;
  ice_threat_level_1?: number;
  ice_threat_level_2?: number;
  ice_threat_level_3?: number;
  no_ice_threat_level?: number;
  mandatory?: number;
  guaranteed_minimum?: number;
  last_inspection_type?: string;
  last_inspection_end_date?: string;
  pending_fy25_inspection?: string;
  last_inspection_standard?: string;
  last_final_rating?: string;
};
