import type { BattleConfig, Unit, PositionKeyframe, CampaignEvent } from '../types/battle';

const BASE = 'http://localhost:3001';

async function api<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...opts?.headers },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function seedBattle(): Promise<void> {
  await api('/api/battles/seed', { method: 'POST' });
}

export async function exportBattle(id: string): Promise<BattleConfig> {
  const data: any = await api(`/api/battles/${id}/export`, { method: 'POST' });
  return transformExport(data);
}

function transformExport(data: any): BattleConfig {
  const units: Unit[] = (data.units ?? []).map((u: any) => ({
    id: u.unitId,
    name: u.name,
    shortName: u.shortName ?? u.name,
    commander: u.commander ?? undefined,
    side: u.side,
    type: u.type,
    parentId: u.parentId ?? null,
    nation: u.nation,
    color: u.color ?? (u.side === 'soviet' ? '#CC0000' : '#d0d0d0'),
    metadata: u.metadataJson ? JSON.parse(u.metadataJson) : {},
  }));

  const keyframes: PositionKeyframe[] = (data.keyframes ?? []).map((k: any) => ({
    unitId: k.unitId,
    date: k.date,
    lat: k.lat,
    lng: k.lng,
    facing: k.facing ?? 0,
    confidence: k.confidence ?? 'medium',
    sourceMapId: k.sourceMapId ?? null,
  }));

  const events: CampaignEvent[] = (data.events ?? []).map((e: any) => ({
    id: e.eventId,
    date: e.date,
    title: e.title,
    description: e.description ?? '',
    lat: e.lat,
    lng: e.lng,
    type: e.type,
    relatedUnitIds: e.relatedUnitsJson ? JSON.parse(e.relatedUnitsJson) : [],
  }));

  return {
    id: data.id,
    name: data.name,
    dateRange: data.dateRange ?? { start: '1942-06-28', end: '1943-02-02' },
    defaultCenter: data.defaultCenter ?? [48.71, 44.51],
    defaultZoom: data.defaultZoom ?? 8,
    theatre: data.theatre ?? 'eastern_front',
    units,
    events,
    keyframes,
    phases: data.phases ?? [],
    historicalMaps: (data.historicalMaps ?? data.maps ?? []).map((m: any) => ({
      id: m.mapId,
      title: m.title,
      date: m.date ?? '',
      imageUrl: m.imagePath ?? '',
      gcps: m.gcpsJson ? JSON.parse(m.gcpsJson) : [],
      opacity: m.opacity ?? 0.6,
    })),
  };
}

export interface BattleListItem {
  id: string;
  name: string;
  dateStart: string;
  dateEnd: string;
  theatre: string;
}

export async function fetchBattles(): Promise<BattleListItem[]> {
  return api('/api/battles');
}

export async function saveUnit(battleId: string, unit: Unit): Promise<void> {
  await api(`/api/battles/${battleId}/units`, {
    method: 'PUT',
    body: JSON.stringify({
      unitId: unit.id,
      name: unit.name,
      side: unit.side,
      type: unit.type,
      nation: unit.nation,
      parentId: unit.parentId,
      commander: unit.commander,
      shortName: unit.shortName,
      color: unit.color,
      metadataJson: JSON.stringify(unit.metadata),
    }),
  });
}

export async function deleteUnit(battleId: string, unitId: string): Promise<void> {
  await api(`/api/battles/${battleId}/units/${unitId}`, { method: 'DELETE' });
}

export async function saveKeyframe(battleId: string, kf: PositionKeyframe): Promise<void> {
  await api(`/api/battles/${battleId}/keyframes`, {
    method: 'PUT',
    body: JSON.stringify({
      unitId: kf.unitId,
      date: kf.date,
      lat: kf.lat,
      lng: kf.lng,
      facing: kf.facing,
      confidence: kf.confidence,
      sourceMapId: kf.sourceMapId,
    }),
  });
}

export async function deleteKeyframe(battleId: string, unitId: string, date: string): Promise<void> {
  await api(`/api/battles/${battleId}/keyframes/${unitId}/${date}`, { method: 'DELETE' });
}

export async function saveEvent(battleId: string, evt: CampaignEvent): Promise<void> {
  await api(`/api/battles/${battleId}/events`, {
    method: 'PUT',
    body: JSON.stringify({
      eventId: evt.id,
      date: evt.date,
      title: evt.title,
      lat: evt.lat,
      lng: evt.lng,
      type: evt.type,
      description: evt.description,
      relatedUnitsJson: JSON.stringify(evt.relatedUnitIds),
    }),
  });
}
