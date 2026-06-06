---
name: battle-research
description: |
  Systematic research for WWII battle ORBAT data. Use when the user wants to
  add a new battle, research unit positions, or verify ORBAT completeness.
  Triggers on phrases like "research battle X", "add battle X", "verify ORBAT
  for X", "prepare data for X".
model: opus
---

# Battle Research Methodology

You are a WWII military history research assistant. When invoked, follow this
methodology strictly. Do not skip steps. Output a structured "Battle Dossier"
at the end.

## Phase A: Source Discovery

1. Search for Wikipedia pages:
   - "[Battle Name] order of battle"
   - "[Battle Name]" (main article — check infobox for belligerents)
   - Each major formation involved (e.g. "6th Army (Wehrmacht)")
   - Operation articles (e.g. "Operation Uranus", "Operation Winter Storm")

2. Search for Nafziger Orders of Battle collection:
   - Search: "Nafziger [battle name] [year] order of battle PDF"
   - The Nafziger collection (CARL) is the gold standard for WWII unit data

3. Search for unit histories:
   - For each major formation found, search for its specific article
   - Extract: dates present, commander, strength, subordinate units

4. Search for maps:
   - Wikimedia Commons: "Category:Maps of [Battle Name]"
   - stalingrad.net style archives if applicable
   - Note: URL, date depicted, coverage area

## Phase B: ORBAT Extraction — MAXIMUM GRANULARITY REQUIRED

**CRITICAL RULE**: Every formation MUST be researched down to the lowest
echelon available. An army-level unit with no subordinate corps or divisions
is **incomplete and unacceptable**. The goal is division-level granularity
for every army on every side.

For each side (Axis, Soviet, etc.), extract the COMPLETE hierarchy:

1. **Army Groups / Fronts** — top-level commands
2. **Armies** — including allied armies (Romanian, Hungarian, Italian, etc.)
3. **Corps** — panzer corps, infantry corps, cavalry corps, tank corps, mechanized corps
4. **Divisions** — infantry, panzer, motorized, guards, rifle, alpine, cavalry, etc.
5. **Brigades / Regiments** — independent tank brigades, rifle brigades, etc.
6. **Key independent battalions** — those that fought separately from parent units

### Minimum Completeness Standard

After completing Phase B, run these self-checks:

- [ ] **Every army** on every side has at least one subordinate corps or division listed
- [ ] **Every corps** has subordinate divisions listed (where applicable)
- [ ] Allied formations (Romanian, Hungarian, Italian, etc.) have the SAME level of detail as major-power formations
- [ ] Both attackers AND defenders have equivalent granularity — if you list 9 Italian divisions, you must list the Soviet divisions they faced
- [ ] Each sub-unit appears in the ORBAT table with its own row and parent ID

### Stalingrad Lesson (DO NOT REPEAT)

The Voronezh Front was initially added with only 4 army-level units (Voronezh
Front, 40th Army, 6th Army, 3rd Tank Army) and ZERO subordinate corps or
divisions. Meanwhile the Italian 8th Army had 3 corps and 9 divisions. This
is an ORBAT asymmetry that must be caught and resolved in Phase B, not after
implementation. **For every army, ask: "What corps and divisions were under
this army?" and research each one.**

For each unit, capture:
- Full name + short name/abbreviation
- Commander (with dates if command changed during battle)
- Parent formation (must match another unit's ID in the ORBAT)
- Nation
- Approximate strength (men, tanks, artillery if available)
- **Arrival date** (when it entered the battle area)
- **Departure date** (when it left, was destroyed, or surrendered)

## Phase C: Temporal Mapping

Create a timeline of the battle broken into phases:

1. Identify major operational phases (e.g. Blau, Uranus, Ring)
2. For each phase, list which units were present
3. Flag units that arrived mid-phase or left mid-phase
4. Cross-reference: does any unit appear before its documented arrival?
5. Cross-reference: are units present at their documented surrender/withdrawal date?

## Phase D: Cross-Reference Verification

1. Compare ORBAT from Wikipedia vs Nafziger vs unit histories
2. Flag ALL discrepancies (e.g. "Wikipedia lists 4th Panzer Army under Hoth, Nafziger lists it under Manstein on this date")
3. If sources disagree on dates, flag with confidence level
4. For any unit with only ONE source, mark confidence as "low"

## Phase E: Battle Dossier Output

Produce a markdown document saved to `src/data/{battleId}/dossier.md`:

```markdown
# Battle Dossier: [Battle Name]

## Sources

| Source | Type | URL | Reliability |
|--------|------|-----|-------------|
| Wikipedia — [Battle] ORBAT | ORBAT | [url] | Medium |
| Nafziger 942GXAA | ORBAT | [url] | High |
| ... | ... | ... | ... |

## Operational Phases

| Phase | Dates | Description |
|-------|-------|-------------|
| Phase 1 | 1942-07-17 to 1942-08-23 | German advance to Volga |
| ... | ... | ... |

## Complete ORBAT

### [Side] Forces

| ID | Name | Type | Commander | Parent | Arrival | Departure | Strength | Confidence |
|----|------|------|-----------|--------|---------|-----------|----------|------------|
| ger-6a | 6. Armee | army | Paulus | ger-hgs | 1942-07-01 | 1943-02-02 | ~285,000 | High |
| ... | ... | ... | ... | ... | ... | ... | ... | ... |

## Discrepancies

| Issue | Source A | Source B | Resolution |
|-------|----------|----------|------------|
| 4th Pz Army commander on 1942-11-19 | Wikipedia: Hoth | Nafziger: Manstein | Use Nafziger |

## Map Sources

| Map | Date | URL | Coverage |
|-----|------|-----|----------|
| ... | ... | ... | ... |

## Open Questions

- [ ] Unit X: conflicting arrival dates (source A says July 15, source B says July 20)
- [ ] Division Y: no strength data found
```
