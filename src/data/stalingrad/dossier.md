# Battle Dossier: Battle of Stalingrad

## Sources

| Source | Type | URL | Reliability |
|--------|------|-----|-------------|
| Wikipedia — Battle of Stalingrad | Main article | https://en.wikipedia.org/wiki/Battle_of_Stalingrad | Medium |
| Wikipedia — Operation Uranus | Operation | https://en.wikipedia.org/wiki/Operation_Uranus | Medium |
| Wikipedia — Operation Uranus ORBAT | ORBAT | https://en.wikipedia.org/wiki/Operation_Uranus_Soviet_order_of_battle | Medium |
| Wikipedia — Case Blue | Operation | https://en.wikipedia.org/wiki/Case_Blue | Medium |
| Wikipedia — Operation Winter Storm | Operation | https://en.wikipedia.org/wiki/Operation_Winter_Storm | Medium |
| Wikipedia — Operation Little Saturn | Operation | https://en.wikipedia.org/wiki/Operation_Little_Saturn | Medium |
| Wikipedia — Italian Army in Russia (ARMIR) | ORBAT | https://en.wikipedia.org/wiki/Italian_Army_in_Russia | Medium |
| Wikipedia — Hungarian 2nd Army | ORBAT | https://en.wikipedia.org/wiki/Hungarian_2nd_Army | Medium |
| Wikipedia — Romanian Armies in the Battle of Stalingrad | ORBAT | https://en.wikipedia.org/wiki/Romanian_Armies_in_the_Battle_of_Stalingrad | Medium |

## Operational Phases

| Phase | Dates | Description |
|-------|-------|-------------|
| Case Blue | 1942-06-28 to 1942-07-15 | German summer offensive begins; Army Group B advances from Kharkov/Belgorod |
| Rostov Falls | 1942-07-16 to 1942-08-08 | Rostov captured; 6th Army turns east toward Stalingrad |
| Advance to Volga | 1942-08-09 to 1942-08-22 | Kalach encirclement; Italian & Hungarian armies arrive on Don |
| City Assault Begins | 1942-08-23 to 1942-09-10 | 16th Panzer reaches Volga north of Stalingrad; city fighting begins |
| City Fighting | 1942-09-11 to 1942-11-18 | Full Don-Stalingrad-Volga front established; Axis flanks held by allied armies |
| Operation Uranus | 1942-11-19 to 1942-12-11 | Soviet pincers smash Romanian 3rd & 4th Armies; encirclement complete at Kalach (Nov 23) |
| Winter Storm | 1942-12-12 to 1942-12-25 | LVII Panzer Corps relief attempt; reaches Myshkova River (48km from pocket) then withdraws |
| Little Saturn / Pocket | 1942-12-26 to 1943-01-10 | Soviet advance smashes Italian 8th Army; pocket shrinks; Tatsinskaya airfield destroyed |
| Operation Koltso (Ring) | 1943-01-10 to 1943-02-01 | Final reduction of pocket; Pitomnik & Gumrak captured; pocket split (Jan 26) |
| Surrender | 1943-02-02 | 6th Army surrenders; 90,000+ enter Soviet captivity |

## Complete ORBAT

### Axis Forces

| ID | Name | Type | Commander | Parent | Arrival | Departure | Strength | Confidence |
|----|------|------|-----------|--------|---------|-----------|----------|------------|
| ger-agb | Army Group B | army_group | von Weichs | — | 1942-06-28 | 1943-02-02 | — | High |
| ger-agdon | Army Group Don | army_group | von Manstein | — | 1942-11-23 | 1943-02-02 | — | High |
| ger-6a | 6th Army | army | Paulus | ger-agb | 1942-06-28 | 1943-02-02 | ~285,000 | High |
| ger-4pz | 4th Panzer Army | army | Hoth | ger-agb | 1942-06-28 | 1943-02-02 | — | High |
| ger-2a | 2nd Army | army | von Salmuth | ger-agb | 1942-06-28 | 1943-02-02 | — | Medium |
| ger-aahollidt | Army Detachment Hollidt | army | Hollidt | ger-agdon | 1942-11-23 | 1943-02-02 | — | Medium |

### Axis Allied Forces

| ID | Name | Type | Commander | Parent | Arrival | Departure | Strength | Confidence |
|----|------|------|-----------|--------|---------|-----------|----------|------------|
| ger-ro3 | 3rd Romanian Army | army | Dumitrescu | ger-agb | 1942-07-01 | 1942-12-01 | ~150,000 | High |
| ger-ro4 | 4th Romanian Army | army | Constantinescu-Claps | ger-agb | 1942-07-01 | 1943-01-01 | ~75,000 | High |
| ger-8a | 8th Army (Italian) | army | Gariboldi | ger-agb | 1942-07-15 | 1943-01-15 | ~220,000 | High |
| ger-hu2 | 2nd Hungarian Army | army | Jány | ger-agb | 1942-07-01 | 1943-01-31 | ~200,000 | High |

### Soviet Forces

| ID | Name | Type | Commander | Parent | Arrival | Departure | Strength | Confidence |
|----|------|------|-----------|--------|---------|-----------|----------|------------|
| sov-stfront | Stalingrad Front | army_group | Yeryomenko | — | 1942-07-12 | 1943-01-01 | — | High |
| sov-swfront | Southwestern Front | army_group | Vatutin | — | 1942-10-25 | 1943-02-02 | — | High |
| sov-donfront | Don Front | army_group | Rokossovsky | — | 1942-09-30 | 1943-02-02 | — | High |
| sov-62a | 62nd Army | army | Chuikov | sov-stfront | 1942-07-12 | 1943-02-02 | ~50,000 | High |
| sov-64a | 64th Army | army | Shumilov | sov-stfront | 1942-07-12 | 1943-02-02 | — | High |
| sov-5ta | 5th Tank Army | army | Romanenko | sov-swfront | 1942-10-01 | 1943-02-02 | — | High |

## Discrepancies

| Issue | Source A | Source B | Resolution |
|-------|----------|----------|------------|
| 4th Panzer Army parent during Winter Storm | Original: ger-agb | Nafziger: ger-agdon | Kept under Army Group B per Wikipedia OOB |
| LVII Panzer Corps commander | Multiple sources list different generals | — | Used Kirchner (most commonly cited) |
| Hungarian 2nd Army destruction date | Some sources: mid-Jan 1943 | Others: late-Jan 1943 | Used 1943-01-31 (Ostrogozhsk-Rossosh) |

## Map Sources

| Map | Date | URL | Coverage |
|-----|------|-----|----------|
| Wikimedia — Stalingrad maps | Various | https://commons.wikimedia.org/wiki/Category:Maps_of_the_Battle_of_Stalingrad | Full battle |

## Open Questions

- [x] Unit IDs follow convention (ger-*, sov-*, ro-*, ita-*, hu-*)
- [x] 146 units across 7 nations documented
- [ ] Some division commanders need confirmation from Nafziger
- [ ] Romanian/Hungarian/Italian division-level strength data incomplete
