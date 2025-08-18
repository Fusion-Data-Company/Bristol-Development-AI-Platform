// Competitor Watch Configuration

export interface DatasetConfig {
  type: 'arcgis' | 'socrata' | 'html' | 'rss';
  label: string;
  url: string;
  dateField?: string;
  idField?: string;
  addressField?: string;
  parcelField?: string;
  titleTemplate?: string;
}

export interface AgendaConfig {
  type: 'civicclerk' | 'civicplus' | 'granicus' | 'rss' | 'html';
  url: string;
  label: string;
}

export interface JurisdictionConfig {
  key: string;
  label: string;
  state: string;
  bbox?: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  datasets?: DatasetConfig[];
  agendas?: AgendaConfig[];
  envNotices?: string[];
  active?: boolean;
  scrapeFrequency?: number; // minutes
}

// Known competitors to track
export const COMPETITOR_ENTITIES = [
  // Major National Players
  { name: 'Alliance Residential', type: 'company', keywords: ['Alliance', 'AMLI'] },
  { name: 'Greystar', type: 'company', keywords: ['Greystar', 'Greystar Real Estate'] },
  { name: 'Camden Property Trust', type: 'company', keywords: ['Camden', 'CPT'], cik: '0000906345' },
  { name: 'Lincoln Property Company', type: 'company', keywords: ['Lincoln Property', 'LPC'] },
  { name: 'Wood Partners', type: 'company', keywords: ['Wood Partners', 'Wood Residential'] },
  { name: 'Trammell Crow Residential', type: 'company', keywords: ['Trammell Crow', 'TCR', 'Alexan'] },
  { name: 'Related Companies', type: 'company', keywords: ['Related', 'Related Companies'] },
  { name: 'Hines', type: 'company', keywords: ['Hines', 'Hines Interests'] },
  { name: 'AvalonBay Communities', type: 'company', keywords: ['AvalonBay', 'AVB'], cik: '0000915912' },
  { name: 'Equity Residential', type: 'company', keywords: ['Equity Residential', 'EQR'], cik: '0000906107' },
  
  // Regional Players
  { name: 'Chartwell Residential', type: 'company', keywords: ['Chartwell'] },
  { name: 'Harlan Company', type: 'company', keywords: ['Harlan'] },
  { name: 'Southern Land Company', type: 'company', keywords: ['Southern Land', 'SLC'] },
  { name: 'Boyle Investment Company', type: 'company', keywords: ['Boyle Investment'] },
  { name: 'Southeast Venture', type: 'company', keywords: ['Southeast Venture', 'SEV'] },
];

// Jurisdictions to monitor
export const JURISDICTIONS: JurisdictionConfig[] = [
  {
    key: 'tn_nashville',
    label: 'Nashville/Davidson County, TN',
    state: 'TN',
    bbox: [-87.0547, 35.9896, -86.5155, 36.4053],
    datasets: [
      {
        type: 'arcgis',
        label: 'Building Permit Applications',
        url: 'https://maps.nashville.gov/arcgis/rest/services/OpenDataNashville/BuildingPermitApplications/MapServer/0',
        dateField: 'date_entered',
        addressField: 'address',
        parcelField: 'parcel_number',
        titleTemplate: '${permit_type} - ${description}'
      }
    ],
    agendas: [
      {
        type: 'html',
        url: 'https://www.nashville.gov/departments/planning/boards/planning-commission/meeting-documents',
        label: 'Metro Planning Commission'
      }
    ],
    envNotices: [
      'https://www.tn.gov/environment/ppo-public-participation/ppo-public-participation/ppo-air.html',
      'https://www.tn.gov/environment/ppo-public-participation/ppo-public-participation/ppo-general.html'
    ],
    active: true,
    scrapeFrequency: 180 // 3 hours
  },
  {
    key: 'tn_franklin',
    label: 'Franklin, TN',
    state: 'TN',
    bbox: [-87.0203, 35.8553, -86.7943, 36.0301],
    agendas: [
      {
        type: 'civicclerk',
        url: 'https://franklintn.portal.civicclerk.com/',
        label: 'Franklin Planning Commission'
      }
    ],
    active: true,
    scrapeFrequency: 360 // 6 hours
  },
  {
    key: 'tn_williamson',
    label: 'Williamson County, TN',
    state: 'TN',
    bbox: [-87.1549, 35.7152, -86.5850, 36.0678],
    agendas: [
      {
        type: 'civicplus',
        url: 'https://www.williamsoncounty-tn.gov/AgendaCenter/Planning-Commission-8/',
        label: 'Williamson County Planning'
      }
    ],
    active: true,
    scrapeFrequency: 360 // 6 hours
  },
  {
    key: 'tn_rutherford',
    label: 'Rutherford County, TN',
    state: 'TN',
    bbox: [-86.6456, 35.7152, -86.0757, 36.0678],
    agendas: [
      {
        type: 'html',
        url: 'https://www.rutherfordcountytn.gov/planning-engineering/planning-commission',
        label: 'Rutherford County Planning'
      }
    ],
    active: true,
    scrapeFrequency: 360 // 6 hours
  }
];

// SEC CIK numbers for public companies
export const SEC_CIKS = [
  '0000906345', // Camden Property Trust
  '0000915912', // AvalonBay Communities  
  '0000906107', // Equity Residential
  '0000898173', // Mid-America Apartment Communities
  '0001070750', // UDR Inc
];

// Search queries for market intelligence
export const SEARCH_QUERIES = {
  permits: [
    'multifamily permit',
    'apartment construction',
    'residential development',
    'mixed-use development'
  ],
  entities: [
    'LLC formation',
    'development entity',
    'property acquisition'
  ],
  regulatory: [
    'zoning change',
    'rezoning application',
    'site plan approval',
    'development agreement'
  ]
};