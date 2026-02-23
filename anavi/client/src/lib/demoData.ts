export type DemoPersona = 'originator' | 'investor' | 'developer' | 'institutional';

export interface DemoRelationship {
  id: string;
  name: string;
  company: string;
  type: string;
  sector: string;
  region: string;
  dealRange: string;
  verificationLevel: number;
  custodyHash: string;
  registeredAt: string;
  lastActivity: string;
  earnings: number;
  matchCount: number;
  status: 'active' | 'pending' | 'verified';
}

export interface DemoIntent {
  id: string;
  title: string;
  type: 'buy' | 'sell' | 'invest' | 'raise';
  sector: string;
  dealSize: string;
  region: string;
  status: 'active' | 'paused' | 'matched';
  matchCount: number;
  createdAt: string;
  confidentiality: 'full' | 'partial';
}

export interface DemoMatch {
  id: string;
  counterpartyAlias: string;
  intentTitle: string;
  compatibilityScore: number;
  sector: string;
  dealSize: string;
  status: 'pending' | 'interested' | 'mutual_interest' | 'deal_room_created';
  matchedAt: string;
  highlights: string[];
}

export interface DemoDealRoom {
  id: string;
  title: string;
  counterparty: string;
  status: 'nda_pending' | 'active' | 'diligence' | 'completed';
  dealValue: string;
  documentsCount: number;
  lastActivity: string;
  createdAt: string;
  participants: number;
}

export interface DemoNotification {
  id: string;
  type: 'match_found' | 'deal_update' | 'payout_received' | 'compliance_alert' | 'relationship_verified';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface DemoPayout {
  id: string;
  amount: string;
  type: string;
  status: 'completed' | 'pending' | 'processing';
  dealReference: string;
  date: string;
}

export interface DemoStats {
  trustScore: number;
  verificationTier: string;
  totalRelationships: number;
  activeIntents: number;
  totalMatches: number;
  activeDealRooms: number;
  lifetimeAttribution: string;
  pendingPayouts: string;
  nextPayout: string;
  monthlyTrend: number;
}

export interface DemoData {
  persona: DemoPersona;
  user: {
    name: string;
    email: string;
    company: string;
    role: string;
    avatar: string;
    joinedAt: string;
  };
  relationships: DemoRelationship[];
  intents: DemoIntent[];
  matches: DemoMatch[];
  dealRooms: DemoDealRoom[];
  notifications: DemoNotification[];
  payouts: DemoPayout[];
  stats: DemoStats;
}

function hash(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  const hex = Math.abs(h).toString(16).padStart(8, '0');
  return (hex + hex + hex + hex + hex + hex + hex + hex).slice(0, 64);
}

function daysAgo(d: number): string {
  const date = new Date();
  date.setDate(date.getDate() - d);
  return date.toISOString();
}

function hoursAgo(h: number): string {
  const date = new Date();
  date.setHours(date.getHours() - h);
  return date.toISOString();
}

// ─────────────────────────────────────────────────────────
// Persona 1: Marcus Chen — Deal Originator
// ─────────────────────────────────────────────────────────

const marcusChen: DemoData = {
  persona: 'originator',
  user: {
    name: 'Marcus Chen',
    email: 'marcus.chen@chenpartners.com',
    company: 'Chen & Partners Advisory',
    role: 'Managing Partner',
    avatar: 'MC',
    joinedAt: '2024-03-15T00:00:00Z',
  },
  relationships: [
    { id: 'r1', name: 'James Whitfield', company: 'Trafigura Energy Trading', type: 'buyer', sector: 'Oil & Gas', region: 'Europe', dealRange: '$50M–$200M', verificationLevel: 3, custodyHash: hash('whitfield-trafigura'), registeredAt: daysAgo(340), lastActivity: hoursAgo(4), earnings: 142000, matchCount: 5, status: 'verified' },
    { id: 'r2', name: 'Elena Volkov', company: 'Gazprom Capital Markets', type: 'seller', sector: 'LNG', region: 'Middle East', dealRange: '$100M–$500M', verificationLevel: 2, custodyHash: hash('volkov-gazprom'), registeredAt: daysAgo(290), lastActivity: hoursAgo(18), earnings: 89000, matchCount: 3, status: 'verified' },
    { id: 'r3', name: 'David Okafor', company: 'African Energy Fund', type: 'investor', sector: 'Oil & Gas', region: 'Africa', dealRange: '$25M–$150M', verificationLevel: 3, custodyHash: hash('okafor-aef'), registeredAt: daysAgo(260), lastActivity: daysAgo(2), earnings: 215000, matchCount: 7, status: 'verified' },
    { id: 'r4', name: 'Sophie Laurent', company: 'TotalEnergies Trading', type: 'buyer', sector: 'Refined Products', region: 'Europe', dealRange: '$10M–$80M', verificationLevel: 2, custodyHash: hash('laurent-total'), registeredAt: daysAgo(220), lastActivity: hoursAgo(8), earnings: 67000, matchCount: 2, status: 'active' },
    { id: 'r5', name: 'Raj Patel', company: 'Reliance Industries', type: 'buyer', sector: 'Oil & Gas', region: 'Asia', dealRange: '$100M–$500M', verificationLevel: 3, custodyHash: hash('patel-reliance'), registeredAt: daysAgo(190), lastActivity: daysAgo(1), earnings: 310000, matchCount: 8, status: 'verified' },
    { id: 'r6', name: 'Maria Gonzalez', company: 'Pemex International', type: 'seller', sector: 'Oil & Gas', region: 'Latin America', dealRange: '$50M–$300M', verificationLevel: 2, custodyHash: hash('gonzalez-pemex'), registeredAt: daysAgo(160), lastActivity: daysAgo(5), earnings: 48000, matchCount: 1, status: 'active' },
    { id: 'r7', name: 'Henrik Larsson', company: 'Stena Bulk AB', type: 'seller', sector: 'Oil & Gas', region: 'Europe', dealRange: '$20M–$120M', verificationLevel: 3, custodyHash: hash('larsson-stena'), registeredAt: daysAgo(130), lastActivity: hoursAgo(12), earnings: 178000, matchCount: 4, status: 'verified' },
    { id: 'r8', name: 'Ahmed Faris', company: 'ADNOC Distribution', type: 'buyer', sector: 'LNG', region: 'Middle East', dealRange: '$200M–$1B', verificationLevel: 3, custodyHash: hash('faris-adnoc'), registeredAt: daysAgo(95), lastActivity: hoursAgo(2), earnings: 0, matchCount: 6, status: 'active' },
  ],
  intents: [
    { id: 'i1', title: 'VLCC Cargo — 2M BBL Crude Oil', type: 'sell', sector: 'Oil & Gas', dealSize: '$140M–$160M', region: 'Europe', status: 'active', matchCount: 12, createdAt: daysAgo(14), confidentiality: 'full' },
    { id: 'i2', title: 'LNG Spot Cargo — Q3 Delivery', type: 'sell', sector: 'LNG', dealSize: '$80M–$120M', region: 'Asia', status: 'active', matchCount: 8, createdAt: daysAgo(7), confidentiality: 'full' },
    { id: 'i3', title: 'Refined Products Off-take Agreement', type: 'buy', sector: 'Refined Products', dealSize: '$30M–$50M', region: 'Europe', status: 'matched', matchCount: 4, createdAt: daysAgo(45), confidentiality: 'partial' },
    { id: 'i4', title: 'West African Crude FOB Cargo', type: 'sell', sector: 'Oil & Gas', dealSize: '$90M–$110M', region: 'Africa', status: 'active', matchCount: 6, createdAt: daysAgo(3), confidentiality: 'full' },
    { id: 'i5', title: 'Fuel Oil Bunker Supply Contract', type: 'buy', sector: 'Oil & Gas', dealSize: '$15M–$25M', region: 'Asia', status: 'paused', matchCount: 2, createdAt: daysAgo(60), confidentiality: 'partial' },
  ],
  matches: [
    { id: 'm1', counterpartyAlias: 'Verified Buyer #A7X2', intentTitle: 'VLCC Cargo — 2M BBL Crude Oil', compatibilityScore: 94, sector: 'Oil & Gas', dealSize: '$140M–$160M', status: 'mutual_interest', matchedAt: hoursAgo(6), highlights: ['Rotterdam delivery match', 'May 2026 timeline aligned', 'Credit-verified counterparty'] },
    { id: 'm2', counterpartyAlias: 'Institutional Fund #K9R1', intentTitle: 'VLCC Cargo — 2M BBL Crude Oil', compatibilityScore: 87, sector: 'Oil & Gas', dealSize: '$140M–$160M', status: 'interested', matchedAt: daysAgo(1), highlights: ['Volume capacity confirmed', 'Repeat crude buyer', 'European refinery network'] },
    { id: 'm3', counterpartyAlias: 'Trading House #M3P5', intentTitle: 'LNG Spot Cargo — Q3 Delivery', compatibilityScore: 91, sector: 'LNG', dealSize: '$80M–$120M', status: 'pending', matchedAt: hoursAgo(3), highlights: ['Asian demand corridor', 'JKM-indexed pricing', 'Regas terminal access'] },
    { id: 'm4', counterpartyAlias: 'Energy Co. #D2F8', intentTitle: 'Refined Products Off-take', compatibilityScore: 78, sector: 'Refined Products', dealSize: '$30M–$50M', status: 'deal_room_created', matchedAt: daysAgo(12), highlights: ['ARA hub delivery', 'Long-term contract interest'] },
    { id: 'm5', counterpartyAlias: 'Sovereign Buyer #Q6N4', intentTitle: 'VLCC Cargo — 2M BBL Crude Oil', compatibilityScore: 82, sector: 'Oil & Gas', dealSize: '$140M–$160M', status: 'pending', matchedAt: daysAgo(2), highlights: ['State oil company', 'Term contract potential'] },
    { id: 'm6', counterpartyAlias: 'Commodity Trader #W1Y7', intentTitle: 'West African Crude FOB Cargo', compatibilityScore: 89, sector: 'Oil & Gas', dealSize: '$90M–$110M', status: 'interested', matchedAt: hoursAgo(8), highlights: ['WAF cargo specialist', 'Dated Brent pricing', 'Existing terminal infrastructure'] },
    { id: 'm7', counterpartyAlias: 'Refinery Group #L4B9', intentTitle: 'LNG Spot Cargo — Q3 Delivery', compatibilityScore: 76, sector: 'LNG', dealSize: '$80M–$120M', status: 'pending', matchedAt: daysAgo(3), highlights: ['South Korean importer', 'DES basis'] },
    { id: 'm8', counterpartyAlias: 'National Oil Co. #H8C3', intentTitle: 'West African Crude FOB Cargo', compatibilityScore: 72, sector: 'Oil & Gas', dealSize: '$90M–$110M', status: 'pending', matchedAt: daysAgo(4), highlights: ['Government-backed entity', 'Nigerian crude experience'] },
  ],
  dealRooms: [
    { id: 'dr1', title: 'VLCC Crude — Rotterdam Delivery', counterparty: 'Verified Buyer #A7X2', status: 'active', dealValue: '$148M', documentsCount: 12, lastActivity: hoursAgo(2), createdAt: daysAgo(5), participants: 4 },
    { id: 'dr2', title: 'Refined Products Off-take — ARA Hub', counterparty: 'Energy Co. #D2F8', status: 'diligence', dealValue: '$42M', documentsCount: 8, lastActivity: hoursAgo(18), createdAt: daysAgo(20), participants: 3 },
    { id: 'dr3', title: 'Nigeria Crude FOB — Previous Deal', counterparty: 'Trading House #B2X1', status: 'completed', dealValue: '$96M', documentsCount: 24, lastActivity: daysAgo(30), createdAt: daysAgo(90), participants: 5 },
  ],
  notifications: [
    { id: 'n1', type: 'match_found', title: '94% Match Found', message: 'A verified buyer matches your VLCC crude cargo intent. Rotterdam delivery, May 2026 timeline.', createdAt: hoursAgo(6), read: false },
    { id: 'n2', type: 'deal_update', title: 'NDA Executed — VLCC Deal Room', message: 'All parties have signed the NDA. Deal room documents are now accessible.', createdAt: hoursAgo(12), read: false },
    { id: 'n3', type: 'payout_received', title: 'Attribution Payout: $42,000', message: 'Referral commission for Refined Products Off-take deal credited to your account.', createdAt: daysAgo(1), read: true },
    { id: 'n4', type: 'match_found', title: 'New LNG Match — 91% Score', message: 'Trading house with Asian regas terminal access matches your LNG spot cargo intent.', createdAt: hoursAgo(3), read: false },
    { id: 'n5', type: 'compliance_alert', title: 'Tier 2 Verification Renewed', message: 'Your enhanced verification status has been renewed for another 12 months.', createdAt: daysAgo(2), read: true },
    { id: 'n6', type: 'deal_update', title: 'Document Upload — Crude Deal Room', message: 'Counterparty uploaded vessel nomination details for the VLCC cargo.', createdAt: hoursAgo(2), read: false },
    { id: 'n7', type: 'match_found', title: 'WAF Crude Match — 89% Score', message: 'Commodity trader specializing in West African crude matched to your FOB cargo.', createdAt: hoursAgo(8), read: false },
    { id: 'n8', type: 'payout_received', title: 'Milestone Bonus: $18,000', message: 'You\'ve reached $3M in lifetime attribution. Tier bonus applied.', createdAt: daysAgo(5), read: true },
    { id: 'n9', type: 'relationship_verified', title: 'Relationship Verified — ADNOC', message: 'Ahmed Faris at ADNOC Distribution has been verified and custody-stamped.', createdAt: daysAgo(3), read: true },
    { id: 'n10', type: 'deal_update', title: 'Diligence Phase Started', message: 'Refined Products deal room has moved to active diligence phase.', createdAt: daysAgo(7), read: true },
  ],
  payouts: [
    { id: 'p1', amount: '42000', type: 'referral_commission', status: 'completed', dealReference: 'Refined Products Off-take — ARA', date: daysAgo(1) },
    { id: 'p2', amount: '18000', type: 'milestone_bonus', status: 'completed', dealReference: 'Lifetime Attribution Tier Bonus', date: daysAgo(5) },
    { id: 'p3', amount: '96000', type: 'referral_commission', status: 'completed', dealReference: 'Nigeria Crude FOB — Q4 2025', date: daysAgo(45) },
    { id: 'p4', amount: '148000', type: 'referral_commission', status: 'pending', dealReference: 'VLCC Crude — Rotterdam (projected)', date: daysAgo(0) },
    { id: 'p5', amount: '67000', type: 'referral_commission', status: 'processing', dealReference: 'LNG Spot Cargo — Milestone 1', date: daysAgo(10) },
  ],
  stats: {
    trustScore: 88,
    verificationTier: 'Tier 2 Enhanced',
    totalRelationships: 47,
    activeIntents: 4,
    totalMatches: 12,
    activeDealRooms: 2,
    lifetimeAttribution: '$3.2M',
    pendingPayouts: '$215,000',
    nextPayout: '$148,000',
    monthlyTrend: 3,
  },
};

// ─────────────────────────────────────────────────────────
// Persona 2: Sarah Mitchell — Investor / Family Office
// ─────────────────────────────────────────────────────────

const sarahMitchell: DemoData = {
  persona: 'investor',
  user: {
    name: 'Sarah Mitchell',
    email: 'sarah@mitchellcapital.com',
    company: 'Mitchell Family Capital',
    role: 'Chief Investment Officer',
    avatar: 'SM',
    joinedAt: '2024-06-01T00:00:00Z',
  },
  relationships: [
    { id: 'r1', name: 'Marco Ferretti', company: 'Enel Green Power', type: 'developer', sector: 'Solar', region: 'Europe', dealRange: '$30M–$150M', verificationLevel: 3, custodyHash: hash('ferretti-enel'), registeredAt: daysAgo(280), lastActivity: hoursAgo(6), earnings: 0, matchCount: 4, status: 'verified' },
    { id: 'r2', name: 'Ingrid Bjørnstad', company: 'Equinor Renewables', type: 'developer', sector: 'Wind', region: 'Europe', dealRange: '$50M–$300M', verificationLevel: 3, custodyHash: hash('bjornstad-equinor'), registeredAt: daysAgo(240), lastActivity: daysAgo(2), earnings: 0, matchCount: 2, status: 'verified' },
    { id: 'r3', name: 'Thomas Brandt', company: 'RWE Clean Energy', type: 'developer', sector: 'Solar', region: 'Europe', dealRange: '$40M–$200M', verificationLevel: 2, custodyHash: hash('brandt-rwe'), registeredAt: daysAgo(200), lastActivity: hoursAgo(12), earnings: 0, matchCount: 3, status: 'active' },
    { id: 'r4', name: 'Priya Sharma', company: 'Tata Power Solar', type: 'developer', sector: 'Solar', region: 'Asia', dealRange: '$20M–$100M', verificationLevel: 2, custodyHash: hash('sharma-tata'), registeredAt: daysAgo(170), lastActivity: daysAgo(5), earnings: 0, matchCount: 1, status: 'active' },
    { id: 'r5', name: 'Carlos Mendez', company: 'Acciona Energía', type: 'developer', sector: 'Wind', region: 'Latin America', dealRange: '$60M–$250M', verificationLevel: 3, custodyHash: hash('mendez-acciona'), registeredAt: daysAgo(140), lastActivity: daysAgo(1), earnings: 0, matchCount: 5, status: 'verified' },
    { id: 'r6', name: 'Li Wei', company: 'LONGi Green Energy', type: 'seller', sector: 'Solar', region: 'Asia', dealRange: '$10M–$80M', verificationLevel: 2, custodyHash: hash('wei-longi'), registeredAt: daysAgo(110), lastActivity: hoursAgo(20), earnings: 0, matchCount: 2, status: 'active' },
    { id: 'r7', name: 'Robert Hayes', company: 'NextEra Partners', type: 'developer', sector: 'Solar', region: 'North America', dealRange: '$100M–$500M', verificationLevel: 3, custodyHash: hash('hayes-nextera'), registeredAt: daysAgo(80), lastActivity: hoursAgo(8), earnings: 0, matchCount: 6, status: 'verified' },
    { id: 'r8', name: 'Fatima Al-Sayed', company: 'Masdar Capital', type: 'investor', sector: 'Solar', region: 'Middle East', dealRange: '$50M–$200M', verificationLevel: 3, custodyHash: hash('alsayed-masdar'), registeredAt: daysAgo(50), lastActivity: daysAgo(3), earnings: 0, matchCount: 3, status: 'verified' },
    { id: 'r9', name: 'Johan Eriksson', company: 'Vattenfall Wind', type: 'developer', sector: 'Wind', region: 'Europe', dealRange: '$80M–$400M', verificationLevel: 2, custodyHash: hash('eriksson-vattenfall'), registeredAt: daysAgo(30), lastActivity: hoursAgo(16), earnings: 0, matchCount: 1, status: 'active' },
    { id: 'r10', name: 'Diana Restrepo', company: 'Celsia Solar', type: 'developer', sector: 'Solar', region: 'Latin America', dealRange: '$15M–$60M', verificationLevel: 2, custodyHash: hash('restrepo-celsia'), registeredAt: daysAgo(15), lastActivity: daysAgo(4), earnings: 0, matchCount: 0, status: 'pending' },
  ],
  intents: [
    { id: 'i1', title: 'RTB Solar — Southern Europe', type: 'invest', sector: 'Solar', dealSize: '€50M–€80M', region: 'Europe', status: 'active', matchCount: 11, createdAt: daysAgo(21), confidentiality: 'full' },
    { id: 'i2', title: 'Onshore Wind Portfolio — Nordics', type: 'invest', sector: 'Wind', dealSize: '€100M–€200M', region: 'Europe', status: 'active', matchCount: 6, createdAt: daysAgo(14), confidentiality: 'full' },
    { id: 'i3', title: 'BESS Co-Investment — ERCOT Market', type: 'invest', sector: 'Energy Storage', dealSize: '$30M–$60M', region: 'North America', status: 'active', matchCount: 4, createdAt: daysAgo(7), confidentiality: 'partial' },
    { id: 'i4', title: 'Green Hydrogen — Pilot Projects', type: 'invest', sector: 'Hydrogen', dealSize: '€10M–€30M', region: 'Europe', status: 'paused', matchCount: 2, createdAt: daysAgo(30), confidentiality: 'full' },
    { id: 'i5', title: 'Solar + Storage — Iberian Peninsula', type: 'invest', sector: 'Solar', dealSize: '€40M–€70M', region: 'Europe', status: 'matched', matchCount: 7, createdAt: daysAgo(40), confidentiality: 'full' },
    { id: 'i6', title: 'Utility-Scale Solar — India', type: 'invest', sector: 'Solar', dealSize: '$20M–$50M', region: 'Asia', status: 'active', matchCount: 3, createdAt: daysAgo(10), confidentiality: 'partial' },
  ],
  matches: [
    { id: 'm1', counterpartyAlias: 'RTB Developer #E4S2', intentTitle: 'RTB Solar — Southern Europe', compatibilityScore: 93, sector: 'Solar', dealSize: '€62M', status: 'mutual_interest', matchedAt: hoursAgo(4), highlights: ['85MW RTB project, Spain', '13.8% target IRR', 'Grid connection secured', 'PPA in advanced negotiation'] },
    { id: 'm2', counterpartyAlias: 'Wind Developer #N7W3', intentTitle: 'Onshore Wind Portfolio — Nordics', compatibilityScore: 88, sector: 'Wind', dealSize: '€145M', status: 'interested', matchedAt: daysAgo(1), highlights: ['320MW portfolio, Sweden', 'COD Q4 2026', 'Corporate PPA signed'] },
    { id: 'm3', counterpartyAlias: 'Solar Portfolio #P1X6', intentTitle: 'RTB Solar — Southern Europe', compatibilityScore: 85, sector: 'Solar', dealSize: '€54M', status: 'pending', matchedAt: hoursAgo(8), highlights: ['72MW across 3 sites, Portugal', 'Construction-ready permits'] },
    { id: 'm4', counterpartyAlias: 'Storage Developer #B5T9', intentTitle: 'BESS Co-Investment — ERCOT', compatibilityScore: 81, sector: 'Energy Storage', dealSize: '$48M', status: 'pending', matchedAt: daysAgo(2), highlights: ['200MWh BESS, Texas', 'ERCOT ancillary services revenue'] },
    { id: 'm5', counterpartyAlias: 'Integrated RE #F3A8', intentTitle: 'Solar + Storage — Iberian Peninsula', compatibilityScore: 90, sector: 'Solar', dealSize: '€58M', status: 'deal_room_created', matchedAt: daysAgo(10), highlights: ['65MW solar + 30MWh storage', 'Spain, Andalusia', 'Merchant + PPA hybrid revenue'] },
    { id: 'm6', counterpartyAlias: 'Indian Developer #G9K2', intentTitle: 'Utility-Scale Solar — India', compatibilityScore: 77, sector: 'Solar', dealSize: '$35M', status: 'pending', matchedAt: daysAgo(3), highlights: ['150MW utility-scale, Rajasthan', 'SECI allocation secured'] },
    { id: 'm7', counterpartyAlias: 'Nordic Wind Co. #H2L5', intentTitle: 'Onshore Wind Portfolio — Nordics', compatibilityScore: 79, sector: 'Wind', dealSize: '€180M', status: 'pending', matchedAt: daysAgo(4), highlights: ['450MW pipeline, Norway & Finland', 'Early-stage development'] },
    { id: 'm8', counterpartyAlias: 'Solar EPC #J6V1', intentTitle: 'RTB Solar — Southern Europe', compatibilityScore: 72, sector: 'Solar', dealSize: '€71M', status: 'pending', matchedAt: daysAgo(5), highlights: ['95MW, Italy', 'Includes agricultural dual-use'] },
    { id: 'm9', counterpartyAlias: 'RE Platform #C8M4', intentTitle: 'Solar + Storage — Iberian Peninsula', compatibilityScore: 86, sector: 'Solar', dealSize: '€49M', status: 'interested', matchedAt: daysAgo(6), highlights: ['55MW solar + 25MWh storage', 'Portugal, Alentejo'] },
    { id: 'm10', counterpartyAlias: 'BESS Specialist #T4Q7', intentTitle: 'BESS Co-Investment — ERCOT', compatibilityScore: 74, sector: 'Energy Storage', dealSize: '$52M', status: 'pending', matchedAt: daysAgo(7), highlights: ['250MWh standalone BESS', 'Revenue stacking model'] },
  ],
  dealRooms: [
    { id: 'dr1', title: 'RTB Solar 85MW — Andalusia, Spain', counterparty: 'RTB Developer #E4S2', status: 'active', dealValue: '€62M', documentsCount: 18, lastActivity: hoursAgo(4), createdAt: daysAgo(8), participants: 5 },
    { id: 'dr2', title: 'Solar + Storage — Iberian Portfolio', counterparty: 'Integrated RE #F3A8', status: 'diligence', dealValue: '€58M', documentsCount: 14, lastActivity: daysAgo(1), createdAt: daysAgo(15), participants: 4 },
    { id: 'dr3', title: 'Nordic Wind 280MW — Completed', counterparty: 'Vattenfall Wind', status: 'completed', dealValue: '€122M', documentsCount: 42, lastActivity: daysAgo(60), createdAt: daysAgo(180), participants: 7 },
  ],
  notifications: [
    { id: 'n1', type: 'match_found', title: '93% Match — RTB Solar Spain', message: '85MW ready-to-build solar project in Andalusia matches your Southern Europe intent. 13.8% target IRR.', createdAt: hoursAgo(4), read: false },
    { id: 'n2', type: 'deal_update', title: 'Financial Model Uploaded', message: 'RTB Developer shared the updated financial model for the 85MW Andalusia project.', createdAt: hoursAgo(6), read: false },
    { id: 'n3', type: 'match_found', title: 'Nordic Wind Match — 88% Score', message: '320MW onshore wind portfolio in Sweden. COD Q4 2026, corporate PPA already signed.', createdAt: daysAgo(1), read: false },
    { id: 'n4', type: 'deal_update', title: 'Diligence Milestone — Iberian Solar', message: 'Technical due diligence report for the Solar + Storage portfolio has been completed.', createdAt: daysAgo(1), read: true },
    { id: 'n5', type: 'compliance_alert', title: 'ESG Screening Passed', message: 'The Andalusia RTB Solar project has passed preliminary ESG and environmental screening.', createdAt: daysAgo(2), read: true },
    { id: 'n6', type: 'match_found', title: 'BESS Match — ERCOT Market', message: '200MWh battery storage project in Texas. Ancillary services revenue model.', createdAt: daysAgo(2), read: true },
    { id: 'n7', type: 'deal_update', title: 'NDA Countersigned', message: 'Counterparty has countersigned the NDA for the Andalusia RTB Solar deal room.', createdAt: daysAgo(3), read: true },
    { id: 'n8', type: 'relationship_verified', title: 'New Verified Contact', message: 'Robert Hayes at NextEra Partners has been verified. 6 potential matches identified.', createdAt: daysAgo(4), read: true },
    { id: 'n9', type: 'payout_received', title: 'Co-Investment Carry: €180,000', message: 'Carry distribution from Nordic Wind 280MW completed deal. Credited to your account.', createdAt: daysAgo(15), read: true },
    { id: 'n10', type: 'match_found', title: 'Indian Solar Opportunity', message: '150MW utility-scale solar in Rajasthan. SECI allocation secured. 77% compatibility.', createdAt: daysAgo(3), read: true },
    { id: 'n11', type: 'deal_update', title: 'Iberian Portfolio — LOI Stage', message: 'Letter of Intent template has been uploaded to the deal room for review.', createdAt: daysAgo(5), read: true },
    { id: 'n12', type: 'compliance_alert', title: 'AML Check Complete', message: 'Annual AML/KYC refresh for Mitchell Family Capital has been approved.', createdAt: daysAgo(10), read: true },
  ],
  payouts: [
    { id: 'p1', amount: '180000', type: 'carry_distribution', status: 'completed', dealReference: 'Nordic Wind 280MW', date: daysAgo(15) },
    { id: 'p2', amount: '95000', type: 'co_invest_return', status: 'completed', dealReference: 'Portuguese Solar 45MW', date: daysAgo(60) },
    { id: 'p3', amount: '62000', type: 'carry_distribution', status: 'processing', dealReference: 'Iberian Solar + Storage', date: daysAgo(0) },
    { id: 'p4', amount: '340000', type: 'capital_return', status: 'pending', dealReference: 'Andalusia RTB Solar (projected)', date: daysAgo(0) },
  ],
  stats: {
    trustScore: 76,
    verificationTier: 'Tier 2 Enhanced',
    totalRelationships: 34,
    activeIntents: 5,
    totalMatches: 11,
    activeDealRooms: 2,
    lifetimeAttribution: '$1.8M',
    pendingPayouts: '€402,000',
    nextPayout: '€62,000',
    monthlyTrend: 5,
  },
};

// ─────────────────────────────────────────────────────────
// Persona 3: Ahmed Al-Rashidi — Project Developer
// ─────────────────────────────────────────────────────────

const ahmedAlRashidi: DemoData = {
  persona: 'developer',
  user: {
    name: 'Ahmed Al-Rashidi',
    email: 'ahmed@rashididev.ae',
    company: 'Al-Rashidi Development Corp.',
    role: 'Chief Development Officer',
    avatar: 'AA',
    joinedAt: '2024-09-01T00:00:00Z',
  },
  relationships: [
    { id: 'r1', name: 'James Morrison', company: 'BlackRock Infrastructure', type: 'investor', sector: 'Solar', region: 'Middle East', dealRange: '$50M–$500M', verificationLevel: 3, custodyHash: hash('morrison-blackrock'), registeredAt: daysAgo(180), lastActivity: hoursAgo(3), earnings: 0, matchCount: 4, status: 'verified' },
    { id: 'r2', name: 'Khalid bin Faisal', company: 'ACWA Power', type: 'developer', sector: 'Solar', region: 'Middle East', dealRange: '$100M–$1B', verificationLevel: 3, custodyHash: hash('faisal-acwa'), registeredAt: daysAgo(160), lastActivity: daysAgo(1), earnings: 0, matchCount: 2, status: 'verified' },
    { id: 'r3', name: 'Christina Papadopoulos', company: 'EIB Clean Energy', type: 'investor', sector: 'Solar', region: 'Europe', dealRange: '$30M–$200M', verificationLevel: 3, custodyHash: hash('papadopoulos-eib'), registeredAt: daysAgo(140), lastActivity: hoursAgo(8), earnings: 0, matchCount: 3, status: 'verified' },
    { id: 'r4', name: 'Takeshi Yamamoto', company: 'JBIC Infrastructure', type: 'investor', sector: 'Solar', region: 'Asia', dealRange: '$50M–$300M', verificationLevel: 2, custodyHash: hash('yamamoto-jbic'), registeredAt: daysAgo(120), lastActivity: daysAgo(3), earnings: 0, matchCount: 1, status: 'active' },
    { id: 'r5', name: 'Omar Haddad', company: 'TAQA Power', type: 'buyer', sector: 'Solar', region: 'Middle East', dealRange: '$100M–$500M', verificationLevel: 3, custodyHash: hash('haddad-taqa'), registeredAt: daysAgo(100), lastActivity: hoursAgo(5), earnings: 0, matchCount: 5, status: 'verified' },
    { id: 'r6', name: 'Michael Strauss', company: 'KfW IPEX-Bank', type: 'investor', sector: 'Solar', region: 'Europe', dealRange: '$40M–$250M', verificationLevel: 2, custodyHash: hash('strauss-kfw'), registeredAt: daysAgo(80), lastActivity: daysAgo(7), earnings: 0, matchCount: 2, status: 'active' },
    { id: 'r7', name: 'Nadia Benmoussa', company: 'MASEN (Morocco)', type: 'buyer', sector: 'Solar', region: 'Africa', dealRange: '$50M–$200M', verificationLevel: 2, custodyHash: hash('benmoussa-masen'), registeredAt: daysAgo(60), lastActivity: daysAgo(2), earnings: 0, matchCount: 1, status: 'active' },
    { id: 'r8', name: 'Richard Park', company: 'Samsung C&T EPC', type: 'seller', sector: 'Solar', region: 'Asia', dealRange: '$30M–$150M', verificationLevel: 3, custodyHash: hash('park-samsung'), registeredAt: daysAgo(40), lastActivity: hoursAgo(12), earnings: 0, matchCount: 3, status: 'verified' },
    { id: 'r9', name: 'Fatima Zahra', company: 'Abu Dhabi Fund for Development', type: 'investor', sector: 'Solar', region: 'Middle East', dealRange: '$20M–$100M', verificationLevel: 3, custodyHash: hash('zahra-adfd'), registeredAt: daysAgo(25), lastActivity: daysAgo(4), earnings: 0, matchCount: 2, status: 'verified' },
    { id: 'r10', name: 'Andrew Campbell', company: 'IFC — World Bank Group', type: 'investor', sector: 'Solar', region: 'Middle East', dealRange: '$30M–$200M', verificationLevel: 3, custodyHash: hash('campbell-ifc'), registeredAt: daysAgo(10), lastActivity: hoursAgo(16), earnings: 0, matchCount: 0, status: 'pending' },
  ],
  intents: [
    { id: 'i1', title: 'RTB Solar + BESS — Abu Dhabi 185MW', type: 'raise', sector: 'Solar', dealSize: '$180M', region: 'Middle East', status: 'active', matchCount: 8, createdAt: daysAgo(28), confidentiality: 'full' },
    { id: 'i2', title: 'Solar EPC Partnership — Phase 2', type: 'buy', sector: 'Solar', dealSize: '$45M–$60M', region: 'Middle East', status: 'active', matchCount: 4, createdAt: daysAgo(14), confidentiality: 'partial' },
    { id: 'i3', title: 'BESS Standalone — Dubai 50MWh', type: 'raise', sector: 'Energy Storage', dealSize: '$35M', region: 'Middle East', status: 'active', matchCount: 3, createdAt: daysAgo(7), confidentiality: 'full' },
    { id: 'i4', title: 'Green Hydrogen Pilot — Oman', type: 'raise', sector: 'Hydrogen', dealSize: '$25M', region: 'Middle East', status: 'paused', matchCount: 1, createdAt: daysAgo(45), confidentiality: 'full' },
    { id: 'i5', title: 'Solar O&M Services — GCC Region', type: 'sell', sector: 'Solar', dealSize: '$8M–$15M/yr', region: 'Middle East', status: 'active', matchCount: 5, createdAt: daysAgo(10), confidentiality: 'partial' },
  ],
  matches: [
    { id: 'm1', counterpartyAlias: 'Infrastructure Fund #Q2R8', intentTitle: 'RTB Solar + BESS — Abu Dhabi 185MW', compatibilityScore: 92, sector: 'Solar', dealSize: '$180M', status: 'mutual_interest', matchedAt: hoursAgo(5), highlights: ['$500M+ clean energy mandate', 'MENA allocation capacity', 'Previous Abu Dhabi investments'] },
    { id: 'm2', counterpartyAlias: 'DFI Lender #K5M1', intentTitle: 'RTB Solar + BESS — Abu Dhabi 185MW', compatibilityScore: 88, sector: 'Solar', dealSize: '$180M', status: 'interested', matchedAt: daysAgo(1), highlights: ['Concessional financing available', 'Climate fund allocation', 'Project finance expertise'] },
    { id: 'm3', counterpartyAlias: 'Family Office #A9F3', intentTitle: 'RTB Solar + BESS — Abu Dhabi 185MW', compatibilityScore: 84, sector: 'Solar', dealSize: '$180M', status: 'deal_room_created', matchedAt: daysAgo(5), highlights: ['$650M AUM, renewables focus', 'Co-invest structure preferred'] },
    { id: 'm4', counterpartyAlias: 'Sovereign Fund #G7N4', intentTitle: 'RTB Solar + BESS — Abu Dhabi 185MW', compatibilityScore: 80, sector: 'Solar', dealSize: '$180M', status: 'pending', matchedAt: daysAgo(3), highlights: ['GCC-based sovereign wealth', 'ESG mandate alignment'] },
    { id: 'm5', counterpartyAlias: 'EPC Contractor #V6T2', intentTitle: 'Solar EPC Partnership — Phase 2', compatibilityScore: 91, sector: 'Solar', dealSize: '$55M', status: 'mutual_interest', matchedAt: hoursAgo(10), highlights: ['Tier 1 EPC with GCC experience', 'LONGi panel supply chain', 'On-time delivery track record'] },
    { id: 'm6', counterpartyAlias: 'Asian Bank #L3W8', intentTitle: 'RTB Solar + BESS — Abu Dhabi 185MW', compatibilityScore: 76, sector: 'Solar', dealSize: '$180M', status: 'pending', matchedAt: daysAgo(6), highlights: ['JBIC co-financing eligible', 'Japanese technology mandate'] },
    { id: 'm7', counterpartyAlias: 'BESS Investor #D8P5', intentTitle: 'BESS Standalone — Dubai 50MWh', compatibilityScore: 85, sector: 'Energy Storage', dealSize: '$35M', status: 'interested', matchedAt: daysAgo(2), highlights: ['Pure-play storage investor', 'Revenue stacking model expertise'] },
    { id: 'm8', counterpartyAlias: 'O&M Provider #X1C7', intentTitle: 'Solar O&M Services — GCC Region', compatibilityScore: 73, sector: 'Solar', dealSize: '$12M/yr', status: 'pending', matchedAt: daysAgo(4), highlights: ['Regional O&M fleet', '2GW under management'] },
  ],
  dealRooms: [
    { id: 'dr1', title: 'Abu Dhabi 185MW Solar + BESS — Equity Raise', counterparty: 'Family Office #A9F3', status: 'active', dealValue: '$180M', documentsCount: 22, lastActivity: hoursAgo(3), createdAt: daysAgo(12), participants: 6 },
    { id: 'dr2', title: 'Phase 2 EPC — Al-Rashidi Solar Park', counterparty: 'EPC Contractor #V6T2', status: 'nda_pending', dealValue: '$55M', documentsCount: 4, lastActivity: hoursAgo(10), createdAt: daysAgo(3), participants: 3 },
    { id: 'dr3', title: 'Ras Al Khaimah 60MW Solar — Closed', counterparty: 'GCC Infrastructure Fund', status: 'completed', dealValue: '$52M', documentsCount: 38, lastActivity: daysAgo(90), createdAt: daysAgo(240), participants: 8 },
  ],
  notifications: [
    { id: 'n1', type: 'match_found', title: '92% Match — Infrastructure Fund', message: 'Major infrastructure fund with $500M+ clean energy mandate matches your 185MW Abu Dhabi capital raise.', createdAt: hoursAgo(5), read: false },
    { id: 'n2', type: 'deal_update', title: 'Due Diligence Package Requested', message: 'Family Office #A9F3 has requested the full technical DD package for the 185MW project.', createdAt: hoursAgo(8), read: false },
    { id: 'n3', type: 'match_found', title: 'EPC Match — 91% Compatibility', message: 'Tier 1 EPC contractor with GCC track record matched to your Phase 2 partnership intent.', createdAt: hoursAgo(10), read: false },
    { id: 'n4', type: 'deal_update', title: 'Financial Close Update', message: 'Abu Dhabi 185MW deal room: lender term sheet comparison uploaded by advisory team.', createdAt: daysAgo(1), read: true },
    { id: 'n5', type: 'compliance_alert', title: 'Environmental Impact Report Filed', message: 'EIA for the 185MW Abu Dhabi project has been submitted to the regulatory authority.', createdAt: daysAgo(2), read: true },
    { id: 'n6', type: 'match_found', title: 'BESS Investor — 85% Score', message: 'Pure-play storage investor interested in your Dubai 50MWh BESS project.', createdAt: daysAgo(2), read: true },
    { id: 'n7', type: 'relationship_verified', title: 'IFC Contact Verified', message: 'Andrew Campbell at IFC — World Bank Group has been verified and custody-stamped.', createdAt: daysAgo(3), read: true },
    { id: 'n8', type: 'deal_update', title: 'NDA Sent — EPC Deal Room', message: 'NDA documents have been sent to EPC Contractor #V6T2 for review.', createdAt: daysAgo(3), read: true },
    { id: 'n9', type: 'payout_received', title: 'Development Fee: $120,000', message: 'Milestone payment for Ras Al Khaimah 60MW project development fee.', createdAt: daysAgo(10), read: true },
    { id: 'n10', type: 'match_found', title: 'Sovereign Fund Interest', message: 'GCC sovereign wealth fund with ESG mandate expressed interest in your solar portfolio.', createdAt: daysAgo(3), read: true },
  ],
  payouts: [
    { id: 'p1', amount: '120000', type: 'development_fee', status: 'completed', dealReference: 'Ras Al Khaimah 60MW Solar', date: daysAgo(10) },
    { id: 'p2', amount: '340000', type: 'development_fee', status: 'completed', dealReference: 'RAK Solar — Final Milestone', date: daysAgo(60) },
    { id: 'p3', amount: '500000', type: 'equity_proceeds', status: 'pending', dealReference: 'Abu Dhabi 185MW (projected)', date: daysAgo(0) },
    { id: 'p4', amount: '85000', type: 'advisory_fee', status: 'processing', dealReference: 'EPC Phase 2 Advisory', date: daysAgo(5) },
  ],
  stats: {
    trustScore: 72,
    verificationTier: 'Tier 2 Enhanced',
    totalRelationships: 28,
    activeIntents: 4,
    totalMatches: 8,
    activeDealRooms: 2,
    lifetimeAttribution: '$960K',
    pendingPayouts: '$585,000',
    nextPayout: '$500,000',
    monthlyTrend: 4,
  },
};

// ─────────────────────────────────────────────────────────
// Persona 4: Blackwood Capital — Institutional
// ─────────────────────────────────────────────────────────

const blackwoodCapital: DemoData = {
  persona: 'institutional',
  user: {
    name: 'Victoria Blackwood',
    email: 'v.blackwood@blackwoodcapital.com',
    company: 'Blackwood Capital Partners',
    role: 'Managing Director, Private Markets',
    avatar: 'VB',
    joinedAt: '2024-01-10T00:00:00Z',
  },
  relationships: [
    { id: 'r1', name: 'Alexander Volkov', company: 'Gazprom Neft Trading', type: 'seller', sector: 'Oil & Gas', region: 'Europe', dealRange: '$100M–$1B', verificationLevel: 3, custodyHash: hash('volkov-gneft'), registeredAt: daysAgo(400), lastActivity: hoursAgo(2), earnings: 420000, matchCount: 12, status: 'verified' },
    { id: 'r2', name: 'Chen Wei Lin', company: 'CITIC Capital', type: 'investor', sector: 'Infrastructure', region: 'Asia', dealRange: '$200M–$2B', verificationLevel: 3, custodyHash: hash('lin-citic'), registeredAt: daysAgo(380), lastActivity: hoursAgo(6), earnings: 310000, matchCount: 8, status: 'verified' },
    { id: 'r3', name: 'Hans Müller', company: 'Allianz Global Investors', type: 'investor', sector: 'Real Estate', region: 'Europe', dealRange: '$100M–$500M', verificationLevel: 3, custodyHash: hash('muller-allianz'), registeredAt: daysAgo(350), lastActivity: daysAgo(1), earnings: 185000, matchCount: 6, status: 'verified' },
    { id: 'r4', name: 'Laura Henriksen', company: 'Norges Bank Investment', type: 'investor', sector: 'Solar', region: 'Europe', dealRange: '$500M–$5B', verificationLevel: 3, custodyHash: hash('henriksen-nbim'), registeredAt: daysAgo(320), lastActivity: hoursAgo(10), earnings: 0, matchCount: 4, status: 'verified' },
    { id: 'r5', name: 'Rajesh Gupta', company: 'Edelweiss Alternative Assets', type: 'investor', sector: 'Infrastructure', region: 'Asia', dealRange: '$50M–$300M', verificationLevel: 2, custodyHash: hash('gupta-edelweiss'), registeredAt: daysAgo(290), lastActivity: daysAgo(2), earnings: 156000, matchCount: 5, status: 'verified' },
    { id: 'r6', name: 'Maria Santos', company: 'BTG Pactual Asset Management', type: 'investor', sector: 'Real Estate', region: 'Latin America', dealRange: '$30M–$200M', verificationLevel: 3, custodyHash: hash('santos-btg'), registeredAt: daysAgo(260), lastActivity: daysAgo(3), earnings: 92000, matchCount: 3, status: 'verified' },
    { id: 'r7', name: 'Abdullah Al-Otaibi', company: 'ADIA Infrastructure', type: 'investor', sector: 'Infrastructure', region: 'Middle East', dealRange: '$200M–$2B', verificationLevel: 3, custodyHash: hash('otaibi-adia'), registeredAt: daysAgo(230), lastActivity: hoursAgo(4), earnings: 0, matchCount: 7, status: 'verified' },
    { id: 'r8', name: 'Katherine Frost', company: 'CPP Investments', type: 'investor', sector: 'Infrastructure', region: 'North America', dealRange: '$100M–$1B', verificationLevel: 3, custodyHash: hash('frost-cpp'), registeredAt: daysAgo(200), lastActivity: hoursAgo(14), earnings: 275000, matchCount: 9, status: 'verified' },
    { id: 'r9', name: 'Pierre Duval', company: 'Meridiam Infrastructure', type: 'developer', sector: 'Infrastructure', region: 'Europe', dealRange: '$50M–$500M', verificationLevel: 3, custodyHash: hash('duval-meridiam'), registeredAt: daysAgo(170), lastActivity: daysAgo(1), earnings: 130000, matchCount: 4, status: 'verified' },
    { id: 'r10', name: 'Yuki Tanaka', company: 'MUFG Bank Infrastructure', type: 'investor', sector: 'Infrastructure', region: 'Asia', dealRange: '$100M–$1B', verificationLevel: 2, custodyHash: hash('tanaka-mufg'), registeredAt: daysAgo(140), lastActivity: daysAgo(5), earnings: 0, matchCount: 2, status: 'active' },
    { id: 'r11', name: 'Charles Worthington', company: 'AustralianSuper', type: 'investor', sector: 'Infrastructure', region: 'Asia', dealRange: '$200M–$2B', verificationLevel: 3, custodyHash: hash('worthington-aussuper'), registeredAt: daysAgo(110), lastActivity: hoursAgo(8), earnings: 0, matchCount: 6, status: 'verified' },
    { id: 'r12', name: 'Isabella Rossi', company: 'CDP Equity (Italy)', type: 'investor', sector: 'Infrastructure', region: 'Europe', dealRange: '$100M–$500M', verificationLevel: 3, custodyHash: hash('rossi-cdp'), registeredAt: daysAgo(80), lastActivity: daysAgo(4), earnings: 0, matchCount: 3, status: 'verified' },
    { id: 'r13', name: 'David Okonkwo', company: 'Africa Finance Corp', type: 'investor', sector: 'Infrastructure', region: 'Africa', dealRange: '$30M–$200M', verificationLevel: 2, custodyHash: hash('okonkwo-afc'), registeredAt: daysAgo(50), lastActivity: daysAgo(6), earnings: 0, matchCount: 1, status: 'active' },
    { id: 'r14', name: 'Sven Johansson', company: 'EQT Infrastructure', type: 'investor', sector: 'Infrastructure', region: 'Europe', dealRange: '$200M–$1B', verificationLevel: 3, custodyHash: hash('johansson-eqt'), registeredAt: daysAgo(30), lastActivity: hoursAgo(16), earnings: 0, matchCount: 2, status: 'verified' },
    { id: 'r15', name: 'Rachel Kim', company: 'GIC Real Estate', type: 'investor', sector: 'Real Estate', region: 'Asia', dealRange: '$100M–$1B', verificationLevel: 3, custodyHash: hash('kim-gic'), registeredAt: daysAgo(15), lastActivity: daysAgo(1), earnings: 0, matchCount: 0, status: 'pending' },
  ],
  intents: [
    { id: 'i1', title: 'Core Infrastructure — OECD Markets', type: 'invest', sector: 'Infrastructure', dealSize: '$200M–$500M', region: 'Europe', status: 'active', matchCount: 14, createdAt: daysAgo(60), confidentiality: 'full' },
    { id: 'i2', title: 'Value-Add Real Estate — European Logistics', type: 'invest', sector: 'Real Estate', dealSize: '€150M–€300M', region: 'Europe', status: 'active', matchCount: 9, createdAt: daysAgo(45), confidentiality: 'full' },
    { id: 'i3', title: 'Renewable Energy Platform — Global', type: 'invest', sector: 'Solar', dealSize: '$300M–$800M', region: 'Europe', status: 'active', matchCount: 11, createdAt: daysAgo(30), confidentiality: 'full' },
    { id: 'i4', title: 'Digital Infrastructure — Data Centers', type: 'invest', sector: 'Infrastructure', dealSize: '$100M–$250M', region: 'North America', status: 'active', matchCount: 7, createdAt: daysAgo(21), confidentiality: 'full' },
    { id: 'i5', title: 'Emerging Market Infrastructure', type: 'invest', sector: 'Infrastructure', dealSize: '$50M–$150M', region: 'Asia', status: 'active', matchCount: 5, createdAt: daysAgo(14), confidentiality: 'partial' },
    { id: 'i6', title: 'Distressed Debt — Energy Sector', type: 'invest', sector: 'Oil & Gas', dealSize: '$75M–$200M', region: 'North America', status: 'active', matchCount: 3, createdAt: daysAgo(7), confidentiality: 'full' },
    { id: 'i7', title: 'Co-Investment — Healthcare RE', type: 'invest', sector: 'Real Estate', dealSize: '€50M–€100M', region: 'Europe', status: 'paused', matchCount: 2, createdAt: daysAgo(90), confidentiality: 'full' },
  ],
  matches: [
    { id: 'm1', counterpartyAlias: 'Infra Platform #R3T6', intentTitle: 'Core Infrastructure — OECD Markets', compatibilityScore: 96, sector: 'Infrastructure', dealSize: '$340M', status: 'deal_room_created', matchedAt: daysAgo(5), highlights: ['Pan-European toll road portfolio', '8.2% net IRR track record', 'Inflation-linked revenues'] },
    { id: 'm2', counterpartyAlias: 'Logistics REIT #U8V2', intentTitle: 'Value-Add Real Estate — European Logistics', compatibilityScore: 93, sector: 'Real Estate', dealSize: '€220M', status: 'mutual_interest', matchedAt: hoursAgo(4), highlights: ['Last-mile logistics, Germany & Netherlands', '85% occupancy with upside', 'Value-add capex plan'] },
    { id: 'm3', counterpartyAlias: 'RE Platform #W4Y1', intentTitle: 'Renewable Energy Platform — Global', compatibilityScore: 91, sector: 'Solar', dealSize: '$520M', status: 'deal_room_created', matchedAt: daysAgo(3), highlights: ['1.2GW operational + 3GW pipeline', 'Multi-country platform', 'Contracted revenue base'] },
    { id: 'm4', counterpartyAlias: 'Data Center Dev #Z7A5', intentTitle: 'Digital Infrastructure — Data Centers', compatibilityScore: 89, sector: 'Infrastructure', dealSize: '$180M', status: 'interested', matchedAt: daysAgo(1), highlights: ['Hyperscale campus, Virginia', 'Pre-leased to Tier 1 cloud', '15-year power contracts'] },
    { id: 'm5', counterpartyAlias: 'Airport Concession #B2D9', intentTitle: 'Core Infrastructure — OECD Markets', compatibilityScore: 87, sector: 'Infrastructure', dealSize: '$280M', status: 'pending', matchedAt: daysAgo(2), highlights: ['Regional airport, Southern Europe', '30-year concession', 'Post-COVID recovery trajectory'] },
    { id: 'm6', counterpartyAlias: 'Wind Platform #E5G3', intentTitle: 'Renewable Energy Platform — Global', compatibilityScore: 85, sector: 'Wind', dealSize: '$410M', status: 'interested', matchedAt: daysAgo(4), highlights: ['Offshore wind development rights', 'North Sea, pre-construction', 'Government subsidy secured'] },
    { id: 'm7', counterpartyAlias: 'EM Infra Fund #H1J8', intentTitle: 'Emerging Market Infrastructure', compatibilityScore: 82, sector: 'Infrastructure', dealSize: '$120M', status: 'deal_room_created', matchedAt: daysAgo(7), highlights: ['Indian highway portfolio', 'Toll-based revenue', 'IFC co-lending facility'] },
    { id: 'm8', counterpartyAlias: 'Logistics Dev #K4N6', intentTitle: 'Value-Add Real Estate — European Logistics', compatibilityScore: 80, sector: 'Real Estate', dealSize: '€175M', status: 'pending', matchedAt: daysAgo(5), highlights: ['Cold chain logistics, Nordics', 'E-commerce fulfillment centers'] },
    { id: 'm9', counterpartyAlias: 'Energy Debt #M9P2', intentTitle: 'Distressed Debt — Energy Sector', compatibilityScore: 78, sector: 'Oil & Gas', dealSize: '$140M', status: 'pending', matchedAt: daysAgo(3), highlights: ['Senior secured notes', 'Permian Basin operator', '3x asset coverage'] },
    { id: 'm10', counterpartyAlias: 'Solar Dev #Q3S7', intentTitle: 'Renewable Energy Platform — Global', compatibilityScore: 76, sector: 'Solar', dealSize: '$680M', status: 'pending', matchedAt: daysAgo(6), highlights: ['US utility-scale solar pipeline', 'ITC-eligible projects', 'Mixed greenfield + operational'] },
  ],
  dealRooms: [
    { id: 'dr1', title: 'Pan-European Toll Road Portfolio', counterparty: 'Infra Platform #R3T6', status: 'active', dealValue: '$340M', documentsCount: 34, lastActivity: hoursAgo(3), createdAt: daysAgo(10), participants: 8 },
    { id: 'dr2', title: 'Renewable Energy Platform — 1.2GW', counterparty: 'RE Platform #W4Y1', status: 'diligence', dealValue: '$520M', documentsCount: 28, lastActivity: daysAgo(1), createdAt: daysAgo(14), participants: 7 },
    { id: 'dr3', title: 'Indian Highway Portfolio', counterparty: 'EM Infra Fund #H1J8', status: 'nda_pending', dealValue: '$120M', documentsCount: 6, lastActivity: daysAgo(2), createdAt: daysAgo(7), participants: 4 },
    { id: 'dr4', title: 'Nordic Wind Farm — 450MW', counterparty: 'Nordic Infrastructure Partners', status: 'completed', dealValue: '€380M', documentsCount: 56, lastActivity: daysAgo(45), createdAt: daysAgo(200), participants: 10 },
    { id: 'dr5', title: 'London Logistics Hub — Phase 1', counterparty: 'UK Logistics REIT', status: 'completed', dealValue: '£145M', documentsCount: 41, lastActivity: daysAgo(90), createdAt: daysAgo(280), participants: 6 },
    { id: 'dr6', title: 'Australian Data Centers', counterparty: 'APAC Digital Infra', status: 'completed', dealValue: 'A$210M', documentsCount: 38, lastActivity: daysAgo(120), createdAt: daysAgo(300), participants: 5 },
  ],
  notifications: [
    { id: 'n1', type: 'match_found', title: '96% Match — European Toll Roads', message: 'Pan-European toll road portfolio with inflation-linked revenues. 8.2% net IRR track record.', createdAt: daysAgo(5), read: true },
    { id: 'n2', type: 'match_found', title: '93% Match — Logistics Portfolio', message: 'Last-mile logistics portfolio across Germany and Netherlands. 85% occupancy with value-add upside.', createdAt: hoursAgo(4), read: false },
    { id: 'n3', type: 'deal_update', title: 'CIM Uploaded — Toll Road Portfolio', message: 'Confidential Information Memorandum for the Pan-European Toll Road portfolio is now available.', createdAt: hoursAgo(8), read: false },
    { id: 'n4', type: 'deal_update', title: 'Technical DD Complete — RE Platform', message: 'Independent engineer report for the 1.2GW renewable energy platform has been finalized.', createdAt: daysAgo(1), read: true },
    { id: 'n5', type: 'match_found', title: 'Data Center Match — 89%', message: 'Hyperscale data center campus in Virginia. Pre-leased to Tier 1 cloud provider, 15-year power contracts.', createdAt: daysAgo(1), read: false },
    { id: 'n6', type: 'payout_received', title: 'Distribution: $420,000', message: 'Q4 distribution from Nordic Wind Farm investment. Performance above underwriting.', createdAt: daysAgo(8), read: true },
    { id: 'n7', type: 'compliance_alert', title: 'Annual Compliance Review — Passed', message: 'Blackwood Capital\'s annual institutional compliance review has been approved. Tier 3 status maintained.', createdAt: daysAgo(10), read: true },
    { id: 'n8', type: 'deal_update', title: 'NDA Sent — Indian Highways', message: 'NDA documents sent to EM Infra Fund counterparty for the Indian highway portfolio.', createdAt: daysAgo(2), read: true },
    { id: 'n9', type: 'relationship_verified', title: 'New Verified LP Contact', message: 'Rachel Kim at GIC Real Estate has been verified. High-conviction real estate investor.', createdAt: daysAgo(3), read: true },
    { id: 'n10', type: 'payout_received', title: 'Carry Distribution: £275,000', message: 'Performance carry from London Logistics Hub Phase 1 exit. 2.1x MOIC achieved.', createdAt: daysAgo(20), read: true },
    { id: 'n11', type: 'match_found', title: 'Offshore Wind — 85% Match', message: 'North Sea offshore wind development rights. Government subsidy secured, pre-construction stage.', createdAt: daysAgo(4), read: true },
    { id: 'n12', type: 'deal_update', title: 'IC Memo Prepared', message: 'Investment committee memo for the Renewable Energy Platform deal has been circulated internally.', createdAt: daysAgo(3), read: true },
  ],
  payouts: [
    { id: 'p1', amount: '420000', type: 'distribution', status: 'completed', dealReference: 'Nordic Wind Farm 450MW — Q4', date: daysAgo(8) },
    { id: 'p2', amount: '275000', type: 'carry_distribution', status: 'completed', dealReference: 'London Logistics Hub Phase 1', date: daysAgo(20) },
    { id: 'p3', amount: '185000', type: 'distribution', status: 'completed', dealReference: 'Australian Data Centers — H2', date: daysAgo(45) },
    { id: 'p4', amount: '340000', type: 'distribution', status: 'processing', dealReference: 'Pan-European Toll Roads (est.)', date: daysAgo(0) },
    { id: 'p5', amount: '520000', type: 'capital_return', status: 'pending', dealReference: 'RE Platform 1.2GW (projected)', date: daysAgo(0) },
  ],
  stats: {
    trustScore: 91,
    verificationTier: 'Tier 3 Institutional',
    totalRelationships: 87,
    activeIntents: 19,
    totalMatches: 43,
    activeDealRooms: 3,
    lifetimeAttribution: '$14.2M',
    pendingPayouts: '$860,000',
    nextPayout: '$340,000',
    monthlyTrend: 2,
  },
};

// ─────────────────────────────────────────────────────────
// Export helper
// ─────────────────────────────────────────────────────────

const DEMO_DATA: Record<DemoPersona, DemoData> = {
  originator: marcusChen,
  investor: sarahMitchell,
  developer: ahmedAlRashidi,
  institutional: blackwoodCapital,
};

export function getDemoData(persona: DemoPersona): DemoData {
  return DEMO_DATA[persona];
}

export const PERSONA_CARDS: {
  id: DemoPersona;
  name: string;
  role: string;
  company: string;
  icon: string;
  headline: string;
  stats: string[];
}[] = [
  {
    id: 'originator',
    name: 'Marcus Chen',
    role: 'Deal Originator',
    company: 'Chen & Partners Advisory',
    icon: 'Handshake',
    headline: 'Protects 47 relationships and has earned $3.2M in lifetime attribution across oil & gas, LNG, and refined products.',
    stats: ['Trust Score: 88', '$3.2M Attribution', '12 Active Matches'],
  },
  {
    id: 'investor',
    name: 'Sarah Mitchell',
    role: 'Investor / Family Office',
    company: 'Mitchell Family Capital',
    icon: 'TrendingUp',
    headline: 'CIO deploying $650M AUM with a focus on ready-to-build renewable energy across Europe and emerging markets.',
    stats: ['Trust Score: 76', '$650M AUM', '11 Matched Opportunities'],
  },
  {
    id: 'developer',
    name: 'Ahmed Al-Rashidi',
    role: 'Project Developer',
    company: 'Al-Rashidi Development Corp.',
    icon: 'Building2',
    headline: 'Developing 185MW RTB solar + BESS in Abu Dhabi, raising $180M in capital with 8 verified matches.',
    stats: ['Trust Score: 72', '$180M Capital Raise', '8 Capital Matches'],
  },
  {
    id: 'institutional',
    name: 'Victoria Blackwood',
    role: 'Institutional Allocator',
    company: 'Blackwood Capital Partners',
    icon: 'Landmark',
    headline: 'Managing $2.4B AUM across infrastructure, real estate, and renewables with $380K in diligence savings via ANAVI.',
    stats: ['Trust Score: 91', '$2.4B AUM', '43 Active Matches'],
  },
];
