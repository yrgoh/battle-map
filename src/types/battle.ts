export type Side = 'axis' | 'soviet';

export type UnitType =
  | 'army_group'
  | 'army'
  | 'corps'
  | 'division'
  | 'regiment'
  | 'battalion'
  | 'company';

export interface UnitMetadata {
  strength?: number;
  tanks?: number;
  artillery?: number;
  aircraft?: number;
  casualties?: number;
  notes?: string;
  wikipediaUrl?: string;
}

export interface Unit {
  id: string;
  name: string;
  shortName?: string;
  commander?: string;
  side: Side;
  type: UnitType;
  parentId: string | null;
  nation: string;
  color: string;
  symbol?: string;
  /** ISO date when the unit entered the theatre (defaults to battle start) */
  arrivalDate?: string;
  /** ISO date when the unit was destroyed, encircled, or withdrew (defaults to battle end) */
  departureDate?: string;
  metadata: UnitMetadata;
}

export interface FormationShape {
  type: 'point' | 'line' | 'wedge' | 'polygon';
  offsets: [number, number][];
}

export interface PositionKeyframe {
  unitId: string;
  date: string; // ISO date: "1942-07-17"
  lat: number;
  lng: number;
  facing?: number; // bearing in degrees (0 = north)
  formation?: FormationShape;
  confidence: 'high' | 'medium' | 'low';
  sourceMapId: string | null;
}

export interface CampaignEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  type: 'battle' | 'movement' | 'surrender' | 'relief' | 'airdrop' | 'encirclement';
  relatedUnitIds: string[];
}

export interface GroundControlPoint {
  pixelX: number;
  pixelY: number;
  lat: number;
  lng: number;
}

export interface HistoricalMap {
  id: string;
  title: string;
  date: string; // approximate date the map represents
  imageUrl: string;
  gcps: GroundControlPoint[];
  opacity: number;
}

// ─── Battle Phase Data (frontline geometry over time) ─────────────────────

export interface FrontSector {
  name: string;
  path: Array<[number, number]>;
  color: string;
  dashArray?: string;
}

export interface BattleArrow {
  path: Array<[number, number]>;
  color: string;
}

export interface BattlePhase {
  date: string;
  frontLine?: Array<[number, number]>;
  sectors?: FrontSector[];
  pocketRing?: Array<[number, number]>;
  pocketNorth?: Array<[number, number]>;
  arrows?: BattleArrow[];
  description?: string;
}

// ─── Battle Config ───────────────────────────────────────────────────────

export interface BattleSummary {
  id: string;
  name: string;
  dateStart: string;
  dateEnd: string;
  theatre: string;
}

export interface BattleConfig {
  id: string;
  name: string;
  dateRange: { start: string; end: string };
  defaultCenter: [number, number];
  defaultZoom: number;
  theatre?: string;
  units: Unit[];
  events: CampaignEvent[];
  historicalMaps: HistoricalMap[];
  keyframes: PositionKeyframe[];
  phases: BattlePhase[];
}
