import { useState, useMemo, useCallback } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import type { Unit, BattleConfig } from '../../types/battle';
import { useMapSelection } from '../../hooks/useMapSelection';
import { useTimeline } from '../../hooks/useTimeline';

const TYPE_ORDER: Record<string, number> = {
  army_group: 0,
  army: 1,
  corps: 2,
  division: 3,
  regiment: 4,
  battalion: 5,
  company: 6,
};

function sortUnits(units: Unit[]): Unit[] {
  return [...units].sort((a, b) => {
    const ta = TYPE_ORDER[a.type] ?? 99;
    const tb = TYPE_ORDER[b.type] ?? 99;
    if (ta !== tb) return ta - tb;
    return a.name.localeCompare(b.name);
  });
}

function SideBadge({ side }: { side: string }) {
  const color = side === 'axis' ? '#8B4513' : '#CC0000';
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: color,
        marginRight: 6,
      }}
    />
  );
}

function getDirectChildren(unitId: string, allUnits: Unit[]): Unit[] {
  return sortUnits(allUnits.filter((u) => u.parentId === unitId));
}

function hasChildren(unitId: string, allUnits: Unit[]): boolean {
  return allUnits.some((u) => u.parentId === unitId);
}

function UnitTreeNode({
  unit,
  allUnits,
  depth,
  expanded,
  toggle,
  onSelect,
}: {
  unit: Unit;
  allUnits: Unit[];
  depth: number;
  expanded: Set<string>;
  toggle: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  const { selectedUnitId } = useMapSelection();
  const children = getDirectChildren(unit.id, allUnits);
  const hasAny = hasChildren(unit.id, allUnits);
  const isExpanded = expanded.has(unit.id);
  const isSelected = selectedUnitId === unit.id;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 8px',
          paddingLeft: 8 + depth * 16,
          background: isSelected ? '#1a5276' : 'transparent',
          color: isSelected ? '#fff' : '#ddd',
          borderRadius: 4,
        }}
      >
        {/* Chevron is independently clickable for toggle */}
        <span
          onClick={(e) => {
            e.stopPropagation();
            if (hasAny) toggle(unit.id);
          }}
          style={{
            cursor: hasAny ? 'pointer' : 'default',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 18,
            height: 18,
            flexShrink: 0,
          }}
        >
          {hasAny ? (
            isExpanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )
          ) : null}
        </span>
        {/* Unit name row — click to select */}
        <span
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSelect(unit.id);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            flex: 1,
          }}
        >
          <SideBadge side={unit.side} />
          <span style={{ fontWeight: isSelected ? 'bold' : 'normal', fontSize: '0.9em' }}>
            {unit.shortName ?? unit.name}
          </span>
        </span>
      </div>
      {isExpanded &&
        children.map((child) => (
          <UnitTreeNode
            key={child.id}
            unit={child}
            allUnits={allUnits}
            depth={depth + 1}
            expanded={expanded}
            toggle={toggle}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
}

function getUnitZoom(type: string): number {
  switch (type) {
    case 'army_group': return 7;
    case 'army': return 8;
    case 'corps': return 9;
    case 'division': return 11;
    case 'regiment': return 13;
    case 'battalion': return 14;
    default: return 10;
  }
}

export function UnitTree({ battle }: { battle: BattleConfig }) {
  const { selectUnit, navigateTo } = useMapSelection();
  const { currentDate } = useTimeline();

  // Auto-expand army group, army, and corps levels so the hierarchy is immediately visible
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const u of battle.units) {
      if (u.type === 'army_group' || u.type === 'army' || u.type === 'corps') {
        initial.add(u.id);
      }
    }
    return initial;
  });

  const allUnits = battle.units;
  const unitIds = new Set(allUnits.map((u) => u.id));
  const roots = sortUnits(allUnits.filter((u) => !u.parentId || !unitIds.has(u.parentId)));

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // When a unit is clicked in the OOB panel, select it AND navigate the map
  const handleUnitClick = useCallback((unitId: string) => {
    try {
      selectUnit(unitId);

      // Find the unit to get its type for proper zoom
      const unit = allUnits.find((u) => u.id === unitId);
      if (!unit) return;

      // Find the unit's position at the current timeline date (or nearest keyframe)
      const unitKfs = battle.keyframes
        .filter((kf) => kf.unitId === unitId)
        .sort((a, b) => a.date.localeCompare(b.date));

      if (unitKfs.length === 0) return;

      const current = currentDate.toISOString().slice(0, 10);
      let bestKf = unitKfs[0];
      for (const kf of unitKfs) {
        if (kf.date <= current) bestKf = kf;
        else break;
      }

      const zoom = getUnitZoom(unit.type);
      navigateTo(bestKf.lat, bestKf.lng, zoom);
    } catch (err) {
      // Silently ignore errors from navigation
    }
  }, [selectUnit, navigateTo, allUnits, battle.keyframes, currentDate]);

  return (
    <div style={{ overflowY: 'auto', flex: 1 }}>
      <div
        style={{
          padding: '8px 12px',
          fontSize: '0.75em',
          textTransform: 'uppercase',
          color: '#888',
          fontWeight: 'bold',
        }}
      >
        Order of Battle
      </div>
      {roots.map((unit) => (
        <UnitTreeNode
          key={unit.id}
          unit={unit}
          allUnits={allUnits}
          depth={0}
          expanded={expanded}
          toggle={toggle}
          onSelect={handleUnitClick}
        />
      ))}
    </div>
  );
}

export function UnitDetail({ battle }: { battle: BattleConfig }) {
  const { selectedUnitId } = useMapSelection();
  const unit = useMemo(
    () => battle.units.find((u) => u.id === selectedUnitId),
    [battle.units, selectedUnitId]
  );

  if (!unit) {
    return (
      <div style={{ padding: 16, color: '#888', fontSize: '0.9em' }}>
        Select a unit to view details.
      </div>
    );
  }

  // Find subordinates
  const subordinates = useMemo(() => battle.units.filter((u) => u.parentId === unit.id), [battle.units, unit.id]);

  return (
    <div style={{ padding: 12, borderTop: '1px solid #333', maxHeight: 300, overflowY: 'auto' }}>
      <div style={{ fontSize: '1.1em', fontWeight: 'bold', marginBottom: 4 }}>{unit.name}</div>
      {unit.shortName && unit.shortName !== unit.name && (
        <div style={{ fontSize: '0.85em', color: '#aaa', marginBottom: 8 }}>{unit.shortName}</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.9em' }}>
        {unit.commander && (
          <div>
            <span style={{ color: '#888' }}>Commander:</span>{' '}
            <span style={{ color: '#fff' }}>{unit.commander}</span>
          </div>
        )}
        <div>
          <span style={{ color: '#888' }}>Type:</span>{' '}
          <span style={{ color: '#fff' }}>{unit.type.replace('_', ' ')}</span>
        </div>
        <div>
          <span style={{ color: '#888' }}>Side:</span>{' '}
          <span style={{ color: unit.side === 'axis' ? '#e8a87c' : '#ff6b6b' }}>
            {unit.side === 'axis' ? 'Axis' : 'Soviet'}
          </span>
        </div>
        <div>
          <span style={{ color: '#888' }}>Nation:</span>{' '}
          <span style={{ color: '#fff', textTransform: 'capitalize' }}>{unit.nation}</span>
        </div>
        {unit.metadata.strength && (
          <div>
            <span style={{ color: '#888' }}>Strength:</span>{' '}
            <span style={{ color: '#fff' }}>~{unit.metadata.strength.toLocaleString()}</span>
          </div>
        )}
        {unit.metadata.tanks && (
          <div>
            <span style={{ color: '#888' }}>Tanks:</span>{' '}
            <span style={{ color: '#fff' }}>{unit.metadata.tanks}</span>
          </div>
        )}
        {unit.metadata.artillery && (
          <div>
            <span style={{ color: '#888' }}>Artillery:</span>{' '}
            <span style={{ color: '#fff' }}>{unit.metadata.artillery}</span>
          </div>
        )}
        {unit.metadata.casualties && (
          <div>
            <span style={{ color: '#888' }}>Casualties:</span>{' '}
            <span style={{ color: '#ff6b6b' }}>~{unit.metadata.casualties.toLocaleString()}</span>
          </div>
        )}
        {unit.metadata.notes && (
          <div style={{ marginTop: 8, padding: 8, background: '#1a1a2e', borderRadius: 4, fontSize: '0.85em', color: '#ccc' }}>
            {unit.metadata.notes}
          </div>
        )}
      </div>

      {subordinates.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: '0.8em', color: '#888', marginBottom: 4, textTransform: 'uppercase', fontWeight: 'bold' }}>
            Subordinates ({subordinates.length})
          </div>
          {sortUnits(subordinates).map((s) => (
            <div key={s.id} style={{ fontSize: '0.85em', padding: '2px 0', color: '#ddd' }}>
              {s.name} {s.commander && `— ${s.commander}`}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function UnitPanel({ battle }: { battle: BattleConfig }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: 280, background: '#0f0f23', color: '#eee', borderRight: '1px solid #333' }}>
      <UnitTree battle={battle} />
      <UnitDetail battle={battle} />
    </div>
  );
}
