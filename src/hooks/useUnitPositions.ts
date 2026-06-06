import { useMemo } from 'react';
import type { BattleConfig, PositionKeyframe, Unit } from '../types/battle';

export type UnitStatus = 'active' | 'under_attack' | 'dying' | 'eliminated';

export interface InterpolatedPosition {
  unitId: string;
  lat: number;
  lng: number;
  facing: number;
  confidence: 'high' | 'medium' | 'low';
  status: UnitStatus;
}

/** A destruction vector links an enemy unit to a destroyed unit at its moment of annihilation. */
export interface DestructionVector {
  fromUnitId: string;
  toUnitId: string;
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  /** How fresh the destruction is — 'dying' = recent pulse, 'eliminated' = fading ghost */
  phase: 'dying' | 'eliminated';
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Return a Date offset by `days` from the given ISO date string.
 * e.g. offsetDate('1942-11-24', 3) => Date for 1942-11-27
 */
function offsetDate(isoDate: string, days: number): Date {
  const d = new Date(isoDate + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d;
}

// High-echelon HQs don't move continuously — snap to nearest keyframe
const SNAP_TYPES = new Set(['army_group', 'army']);

/** Days before departureDate when unit enters "under_attack" warning state */
const UNDER_ATTACK_DAYS = 2;
/** Days after departureDate the unit stays in pulsing "dying" state */
const DYING_DAYS = 4;
/** Days after departureDate the unit stays as a faded "eliminated" ghost marker */
const ELIMINATED_DAYS = 25;

// Total: unit visible for ~31 days after destruction before vanishing

export function useUnitPositions(
  battle: BattleConfig,
  currentDate: Date,
): {
  positions: Map<string, InterpolatedPosition>;
  destructionVectors: DestructionVector[];
} {
  return useMemo(() => {
    const result = new Map<string, InterpolatedPosition>();
    const destructionVectors: DestructionVector[] = [];
    const keyframesByUnit = new Map<string, PositionKeyframe[]>();

    // Build lookup tables
    const unitById = new Map<string, Unit>();
    const snapUnitIds = new Set<string>();
    const hasExplicitDeparture = new Set<string>(); // units with departureDate explicitly set
    const unitTemporalBounds = new Map<string, { arrival: string; departure: string }>();
    for (const unit of battle.units) {
      unitById.set(unit.id, unit);
      if (SNAP_TYPES.has(unit.type)) snapUnitIds.add(unit.id);
      if (unit.departureDate) hasExplicitDeparture.add(unit.id);
      unitTemporalBounds.set(unit.id, {
        arrival: unit.arrivalDate ?? battle.dateRange.start,
        departure: unit.departureDate ?? battle.dateRange.end,
      });
    }

    const current = toDateKey(currentDate);

    // Determine status for each unit based on temporal bounds
    const unitStatuses = new Map<string, UnitStatus>();
    for (const [unitId, bounds] of unitTemporalBounds) {
      if (current < bounds.arrival) {
        unitStatuses.set(unitId, 'active'); // will be skipped by keyframe check
        continue;
      }
      const depDate = new Date(bounds.departure + 'T00:00:00');
      const underAttackStart = offsetDate(bounds.departure, -UNDER_ATTACK_DAYS);
      const dyingEnd = offsetDate(bounds.departure, DYING_DAYS);
      const eliminatedEnd = offsetDate(bounds.departure, DYING_DAYS + ELIMINATED_DAYS);

      // Only apply departure logic if unit has an explicitly set departureDate
      // (units lasting the whole battle without one stay active)
      if (!hasExplicitDeparture.has(unitId)) {
        unitStatuses.set(unitId, 'active');
      } else if (currentDate >= underAttackStart && currentDate < depDate) {
        unitStatuses.set(unitId, 'under_attack');
      } else if (currentDate >= depDate && currentDate < dyingEnd) {
        unitStatuses.set(unitId, 'dying');
      } else if (currentDate >= dyingEnd && currentDate < eliminatedEnd) {
        unitStatuses.set(unitId, 'eliminated');
      } else if (currentDate >= eliminatedEnd) {
        unitStatuses.set(unitId, 'active'); // skipped below — fully gone
      } else {
        unitStatuses.set(unitId, 'active');
      }
    }

    // Fully gone units (past eliminatedEnd) — skip entirely
    const goneUnitIds = new Set<string>();
    for (const [unitId, bounds] of unitTemporalBounds) {
      if (!hasExplicitDeparture.has(unitId)) continue;
      const eliminatedEnd = offsetDate(bounds.departure, DYING_DAYS + ELIMINATED_DAYS);
      if (currentDate >= eliminatedEnd) {
        goneUnitIds.add(unitId);
      }
    }

    // Group keyframes by unit
    for (const kf of battle.keyframes) {
      const arr = keyframesByUnit.get(kf.unitId) ?? [];
      arr.push(kf);
      keyframesByUnit.set(kf.unitId, arr);
    }

    // Compute positions
    for (const [unitId, kfs] of keyframesByUnit) {
      // Skip units that haven't arrived yet or are fully gone
      if (goneUnitIds.has(unitId)) continue;

      const status = unitStatuses.get(unitId) ?? 'active';
      const bounds = unitTemporalBounds.get(unitId);

      kfs.sort((a, b) => a.date.localeCompare(b.date));

      let before: PositionKeyframe | null = null;
      let after: PositionKeyframe | null = null;

      for (const kf of kfs) {
        if (kf.date <= current) before = kf;
        if (kf.date >= current && !after) after = kf;
      }

      if (!before && !after) continue;
      // Unit hasn't entered theatre yet — don't render
      if (!before) continue;

      // For destroyed units, clamp position to the last keyframe (don't interpolate past death)
      if (status === 'dying' || status === 'eliminated') {
        const lastKf = kfs[kfs.length - 1];
        result.set(unitId, {
          unitId,
          lat: lastKf.lat,
          lng: lastKf.lng,
          facing: lastKf.facing ?? 0,
          confidence: lastKf.confidence,
          status,
        });
        continue;
      }

      // High-echelon HQs: snap to nearest keyframe
      if (snapUnitIds.has(unitId)) {
        const kf = before;
        result.set(unitId, {
          unitId,
          lat: kf.lat,
          lng: kf.lng,
          facing: kf.facing ?? 0,
          confidence: kf.confidence,
          status,
        });
        continue;
      }

      if (!after) {
        result.set(unitId, {
          unitId,
          lat: before!.lat,
          lng: before!.lng,
          facing: before!.facing ?? 0,
          confidence: before!.confidence,
          status,
        });
        continue;
      }
      if (before.date === after.date) {
        const kf = after;
        result.set(unitId, {
          unitId,
          lat: kf.lat,
          lng: kf.lng,
          facing: kf.facing ?? 0,
          confidence: kf.confidence,
          status,
        });
        continue;
      }

      // Linear interpolation
      const t1 = new Date(before.date + 'T00:00:00').getTime();
      const t2 = new Date(after.date + 'T00:00:00').getTime();
      const t = currentDate.getTime();
      const ratio = Math.max(0, Math.min(1, (t - t1) / (t2 - t1)));

      result.set(unitId, {
        unitId,
        lat: before.lat + (after.lat - before.lat) * ratio,
        lng: before.lng + (after.lng - before.lng) * ratio,
        facing: (before.facing ?? 0) + ((after.facing ?? 0) - (before.facing ?? 0)) * ratio,
        confidence: before.confidence === 'low' || after.confidence === 'low' ? 'low' : before.confidence,
        status,
      });
    }

    // ─── Compute destruction vectors ───────────────────────────────────────
    // For each dying/eliminated unit, find the nearest enemy unit to show who destroyed them
    for (const [unitId, pos] of result) {
      if (pos.status !== 'dying' && pos.status !== 'eliminated') continue;
      const unit = unitById.get(unitId);
      if (!unit) continue;

      // Find nearest enemy unit (opposite side) with a visible position
      let nearestEnemyId: string | null = null;
      let nearestDist = Infinity;
      let nearestPos: InterpolatedPosition | null = null;

      for (const [eId, ePos] of result) {
        if (eId === unitId) continue;
        const eUnit = unitById.get(eId);
        if (!eUnit || eUnit.side === unit.side) continue;
        if (ePos.status === 'dying' || ePos.status === 'eliminated') continue; // dead enemies can't kill

        const dist = Math.hypot(pos.lat - ePos.lat, pos.lng - ePos.lng);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestEnemyId = eId;
          nearestPos = ePos;
        }
      }

      // Only draw vector if enemy is within ~100km (roughly 1 degree lat/lng)
      if (nearestEnemyId && nearestPos && nearestDist < 1.0) {
        destructionVectors.push({
          fromUnitId: nearestEnemyId,
          toUnitId: unitId,
          fromLat: nearestPos.lat,
          fromLng: nearestPos.lng,
          toLat: pos.lat,
          toLng: pos.lng,
          phase: pos.status,
        });
      }
    }

    return { positions: result, destructionVectors };
  }, [battle.keyframes, battle.units, currentDate]);
}
