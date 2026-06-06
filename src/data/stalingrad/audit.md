# Battle Audit: stalingrad

## Research Completeness

- [x] Dossier exists at `src/data/stalingrad/dossier.md`
- [ ] 3+ independent sources consulted for ORBAT (currently all Wikipedia-based)
- [x] All sources listed in dossier with URLs
- [x] All discrepancies between sources documented and resolved

## ORBAT Completeness

- [x] All army groups / fronts present
- [x] All armies present (including allied/minor nation armies)
- [x] All corps present
- [x] All divisions present (at minimum, every division that participated)
- [x] Key independent regiments/battalions for critical engagements
- [x] Commanders listed for every army-level and corps-level unit
- [x] All allied/minor nation formations included (Romanian, Hungarian, Italian)

## Temporal Accuracy

- [x] Every unit has an `arrivalDate` (or defaults to battle start)
- [x] Every unit has a `departureDate` (or defaults to battle end)
- [x] No unit appears before its documented arrival — keyframes start at unit entry dates
- [x] No unit persists past its documented departure/surrender/destruction — `useUnitPositions` filters by departureDate
- [ ] Arrival/departure dates cross-referenced across 2+ sources
- [x] Keyframes align with known operational phase boundaries (16 phases documented)
- [x] **Unit incapacitation verified**: Destroyed/encircled/captured units have `departureDate` set:
  - Romanian 3rd Army + corps + divisions: `departureDate: '1942-11-24'`
  - Romanian 4th Army + corps + divisions: `departureDate: '1942-11-24'`
  - Italian 8th Army: `departureDate: '1942-12-20'`
  - Italian II Corps + divisions: `departureDate: '1942-12-19'`
  - Italian XXXV Corps + divisions: `departureDate: '1942-12-19'`
  - Italian Alpine Corps + divisions: `departureDate: '1943-01-31'`
  - Italian 156th Infantry: `departureDate: '1943-01-31'`
  - Hungarian 2nd Army + corps + divisions: `departureDate: '1943-01-14'`
  - German 6th Army (HQ): `departureDate: '1943-02-02'`
  - German pocket corps (LI, VIII, XVII, XXIX, XIV PzK): `departureDate: '1943-02-02'`
  - German pocket divisions — XIV PzK (16th Pz, 3rd Pz, 60th Mot): `departureDate: '1943-02-02'`
  - German pocket divisions — LI Corps (71st, 295th, 76th, 389th ID): `departureDate: '1943-02-02'`
  - German pocket divisions — VIII Corps (376th, 305th ID): `departureDate: '1943-02-02'`
  - German pocket divisions — XVII Corps (79th, 113th ID): `departureDate: '1943-02-02'`
  - German pocket divisions — XXIX Corps (100th Jäger): `departureDate: '1943-02-02'`
  - German pocket divisions — XXIV PzK/4th Pz Army (24th Pz, 14th Pz, 29th Mot): `departureDate: '1943-02-02'`
- [x] Units that arrived mid-battle have proper keyframe-based rendering
- [x] `useUnitPositions` hook correctly filters out units where `currentDate > departureDate`

## Position Data

- [x] Every unit has at least 1 keyframe per operational phase it participated in
- [ ] Keyframe positions cross-referenced with historical maps
- [x] Front line geometry matches documented phase boundaries
- [ ] Confidence levels assigned to all keyframes (high/medium/low) — currently mostly medium
- [x] 620+ keyframes covering full campaign timeline

## Events

- [x] All major operational phase transitions have events
- [x] Critical moments documented (encirclement closed, surrender, relief attempts)
- [x] Events have accurate lat/lng positions (21 events)

## Historical Maps (optional, for editor)

- [ ] At least one historical map sourced for georeferencing
- [ ] Map dates align with operational phases

## Cross-Battle Consistency

- [x] Unit IDs follow naming convention (ger-*, sov-*, ro-*, ita-*, hu-*)
- [x] Units that appear in multiple battles use the same ID
- [x] Parent/child relationships consistent (hierarchical ORBAT)

## Sign-off

- [x] Dossier reviewed and verified
- [ ] Audit checklist completed
- [x] Battle loads without errors (`GET /api/battles/stalingrad`)
- [x] Timeline scrubbing shows correct unit movement
- [x] All units visible and clickable in the ORBAT panel (UnitTree)

**Auditor**: Claude
**Date**: 2026-05-02
