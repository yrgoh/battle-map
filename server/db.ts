/**
 * SQLite database module for WWII Battle Map
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'data', 'battle_map.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// ─── Database Schema ─────────────────────────────────────────────────────────

function initTables(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS battles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      date_start TEXT NOT NULL,
      date_end TEXT NOT NULL,
      default_lat REAL DEFAULT 48.71,
      default_lng REAL DEFAULT 44.51,
      default_zoom INTEGER DEFAULT 8,
      data_json TEXT NOT NULL DEFAULT '{}',
      theatre TEXT DEFAULT 'eastern_front',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS battle_units (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      battle_id TEXT NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
      unit_id TEXT NOT NULL,
      name TEXT NOT NULL,
      short_name TEXT,
      commander TEXT,
      side TEXT NOT NULL,
      type TEXT NOT NULL,
      parent_id TEXT,
      nation TEXT NOT NULL,
      color TEXT,
      arrival_date TEXT,
      departure_date TEXT,
      metadata_json TEXT DEFAULT '{}',
      UNIQUE(battle_id, unit_id)
    );
    CREATE TABLE IF NOT EXISTS battle_keyframes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      battle_id TEXT NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
      unit_id TEXT NOT NULL,
      date TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      facing REAL DEFAULT 0,
      confidence TEXT DEFAULT 'medium',
      source_map_id TEXT,
      UNIQUE(battle_id, unit_id, date)
    );
    CREATE TABLE IF NOT EXISTS battle_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      battle_id TEXT NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
      event_id TEXT NOT NULL,
      date TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      type TEXT NOT NULL DEFAULT 'battle',
      related_units_json TEXT DEFAULT '[]',
      UNIQUE(battle_id, event_id)
    );
    CREATE TABLE IF NOT EXISTS battle_historical_maps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      battle_id TEXT NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
      map_id TEXT NOT NULL,
      title TEXT NOT NULL,
      date TEXT,
      image_path TEXT,
      opacity REAL DEFAULT 0.6,
      gcps_json TEXT DEFAULT '[]',
      UNIQUE(battle_id, map_id)
    );
  `);
}

initTables();

// Migration: add theatre column to existing battles table (ignore if exists)
try {
  db.exec(`ALTER TABLE battles ADD COLUMN theatre TEXT DEFAULT 'eastern_front'`);
} catch (_) { /* column already exists */ }
// Migration: add arrival_date and departure_date to battle_units
try {
  db.exec(`ALTER TABLE battle_units ADD COLUMN arrival_date TEXT`);
} catch (_) { /* column already exists */ }
try {
  db.exec(`ALTER TABLE battle_units ADD COLUMN departure_date TEXT`);
} catch (_) { /* column already exists */ }

// ─── Battle Operations ──────────────────────────────────────────────────────

export interface BattleRow {
  id: string;
  name: string;
  dateStart: string;
  dateEnd: string;
  theatre: string;
  defaultLat: number;
  defaultLng: number;
  defaultZoom: number;
  dataJson: string;
}

export function listBattles(): BattleRow[] {
  const stmt = db.prepare('SELECT id, name, date_start as dateStart, date_end as dateEnd, theatre FROM battles ORDER BY date_start');
  return stmt.all() as BattleRow[];
}

export function getBattle(id: string): BattleRow | undefined {
  const stmt = db.prepare(`
    SELECT id, name, date_start as dateStart, date_end as dateEnd,
           theatre, default_lat as defaultLat, default_lng as defaultLng,
           default_zoom as defaultZoom, data_json as dataJson
    FROM battles WHERE id = ?
  `);
  return stmt.get(id) as BattleRow | undefined;
}

export function saveBattle(id: string, name: string, dateStart: string, dateEnd: string,
  defaultLat: number, defaultLng: number, defaultZoom: number, dataJson: string, theatre?: string): void {
  db.prepare(`
    INSERT OR REPLACE INTO battles
      (id, name, date_start, date_end, theatre, default_lat, default_lng, default_zoom, data_json, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(id, name, dateStart, dateEnd, theatre ?? 'eastern_front', defaultLat, defaultLng, defaultZoom, dataJson);
}

export function getBattleUnits(battleId: string): unknown[] {
  const stmt = db.prepare(`
    SELECT unit_id as unitId, name, short_name as shortName, commander,
           side, type, parent_id as parentId, nation, color,
           arrival_date as arrivalDate, departure_date as departureDate,
           metadata_json as metadataJson
    FROM battle_units WHERE battle_id = ? ORDER BY type, name
  `);
  return stmt.all(battleId) as unknown[];
}

export function saveBattleUnit(battleId: string, unitId: string, name: string,
  side: string, type: string, nation: string, parentId: string | null,
  commander?: string, shortName?: string, color?: string,
  arrivalDate?: string, departureDate?: string, metadataJson?: string): void {
  db.prepare(`
    INSERT OR REPLACE INTO battle_units
      (battle_id, unit_id, name, short_name, commander, side, type, parent_id, nation, color, arrival_date, departure_date, metadata_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(battleId, unitId, name, shortName ?? null, commander ?? null, side, type, parentId, nation, color ?? null, arrivalDate ?? null, departureDate ?? null, metadataJson ?? '{}');
}

export function deleteBattleUnit(battleId: string, unitId: string): void {
  db.prepare('DELETE FROM battle_units WHERE battle_id = ? AND unit_id = ?').run(battleId, unitId);
}

export function getBattleKeyframes(battleId: string): unknown[] {
  const stmt = db.prepare(`
    SELECT unit_id as unitId, date, lat, lng, facing, confidence, source_map_id as sourceMapId
    FROM battle_keyframes WHERE battle_id = ? ORDER BY unit_id, date
  `);
  return stmt.all(battleId) as unknown[];
}

export function saveBattleKeyframe(battleId: string, unitId: string, date: string,
  lat: number, lng: number, facing?: number, confidence?: string, sourceMapId?: string): void {
  db.prepare(`
    INSERT OR REPLACE INTO battle_keyframes
      (battle_id, unit_id, date, lat, lng, facing, confidence, source_map_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(battleId, unitId, date, lat, lng, facing ?? 0, confidence ?? 'medium', sourceMapId ?? null);
}

export function deleteBattleKeyframe(battleId: string, unitId: string, date: string): void {
  db.prepare('DELETE FROM battle_keyframes WHERE battle_id = ? AND unit_id = ? AND date = ?').run(battleId, unitId, date);
}

export function getBattleEvents(battleId: string): unknown[] {
  const stmt = db.prepare(`
    SELECT event_id as eventId, date, title, description, lat, lng, type,
           related_units_json as relatedUnitsJson
    FROM battle_events WHERE battle_id = ? ORDER BY date
  `);
  return stmt.all(battleId) as unknown[];
}

export function saveBattleEvent(battleId: string, eventId: string, date: string,
  title: string, lat: number, lng: number, type: string,
  description?: string, relatedUnitsJson?: string): void {
  db.prepare(`
    INSERT OR REPLACE INTO battle_events
      (battle_id, event_id, date, title, description, lat, lng, type, related_units_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(battleId, eventId, date, title, description ?? null, lat, lng, type, relatedUnitsJson ?? '[]');
}

export function deleteBattleEvent(battleId: string, eventId: string): void {
  db.prepare('DELETE FROM battle_events WHERE battle_id = ? AND event_id = ?').run(battleId, eventId);
}

export function getBattleMaps(battleId: string): unknown[] {
  const stmt = db.prepare(`
    SELECT map_id as mapId, title, date, image_path as imagePath, opacity, gcps_json as gcpsJson
    FROM battle_historical_maps WHERE battle_id = ? ORDER BY date
  `);
  return stmt.all(battleId) as unknown[];
}

export function saveBattleMap(battleId: string, mapId: string, title: string,
  imagePath?: string, date?: string, opacity?: number, gcpsJson?: string): void {
  db.prepare(`
    INSERT OR REPLACE INTO battle_historical_maps
      (battle_id, map_id, title, date, image_path, opacity, gcps_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(battleId, mapId, title, date ?? null, imagePath ?? null, opacity ?? 0.6, gcpsJson ?? '[]');
}

export function deleteBattleMap(battleId: string, mapId: string): void {
  db.prepare('DELETE FROM battle_historical_maps WHERE battle_id = ? AND map_id = ?').run(battleId, mapId);
}

export function seedStalingradBattle(): void {
  const existing = db.prepare('SELECT id FROM battles WHERE id = ?').get('stalingrad');
  if (existing) return;

  const inserts = db.transaction(() => {
    db.prepare(`
      INSERT INTO battles (id, name, date_start, date_end, theatre, default_lat, default_lng, default_zoom, data_json)
      VALUES ('stalingrad', 'Battle of Stalingrad', '1942-06-28', '1943-02-02', 'eastern_front', 48.71, 44.51, 8, '{}')
    `).run();

    // Seed all historically accurate units
    const units: Array<[string, string, string | null, string, string, string | null, string, string | null]> = [
      // AXIS — Army Groups
      ['ger-agb', 'Army Group B', 'Heeresgruppe B', 'axis', 'army_group', null, 'germany', 'Field Marshal Maximilian von Weichs'],
      ['ger-agdon', 'Army Group Don', 'Heeresgruppe Don', 'axis', 'army_group', null, 'germany', 'Field Marshal Erich von Manstein'],
      // AXIS — German Armies
      ['ger-6a', '6th Army', '6. Armee', 'axis', 'army', 'ger-agb', 'germany', 'Generaloberst Friedrich Paulus'],
      ['ger-4pz', '4th Panzer Army', '4. Panzerarmee', 'axis', 'army', 'ger-agb', 'germany', 'Generaloberst Hermann Hoth'],
      ['ger-2a', '2nd Army', '2. Armee', 'axis', 'army', 'ger-agb', 'germany', 'General Hans von Salmuth'],
      // AXIS — Allied Armies
      ['ger-ro3', '3rd Romanian Army', 'Armata Română 3', 'axis', 'army', 'ger-agb', 'romania', 'General Petre Dumitrescu'],
      ['ger-ro4', '4th Romanian Army', 'Armata Română 4', 'axis', 'army', 'ger-agb', 'romania', 'General Constantin Constantinescu-Claps'],
      ['ger-8a', '8th Army (Italian)', 'Armata Italiana 8', 'axis', 'army', 'ger-agb', 'italy', 'General Italo Gariboldi'],
      ['ger-hu2', '2nd Hungarian Army', 'Magyar 2. Hadsereg', 'axis', 'army', 'ger-agb', 'hungary', 'Colonel-General Gusztáv Jány'],
      // AXIS — German Corps (6th Army)
      ['ger-li', 'LI Army Corps', 'LI AK', 'axis', 'corps', 'ger-6a', 'germany', 'General Walther von Seydlitz-Kurzbach'],
      ['ger-viii', 'VIII Army Corps', 'VIII AK', 'axis', 'corps', 'ger-6a', 'germany', 'General Walter Heitz'],
      ['ger-xvii', 'XVII Army Corps', 'XVII AK', 'axis', 'corps', 'ger-6a', 'germany', 'General Karl-Adolf Hollidt'],
      ['ger-xxix', 'XXIX Army Corps', 'XXIX AK', 'axis', 'corps', 'ger-6a', 'germany', 'General Hans von Obstfelder'],
      ['ger-xivpz', 'XIV Panzer Corps', 'XIV PzK', 'axis', 'corps', 'ger-6a', 'germany', 'General der Panzertruppe Gustav Fehn'],
      ['ger-48pz', '48th Panzer Corps', 'XLVIII PzK', 'axis', 'corps', 'ger-6a', 'germany', 'General Ferdinand Heim'],
      // AXIS — German Corps (4th Panzer Army)
      ['ger-xxivpz', 'XXIV Panzer Corps', 'XXIV PzK', 'axis', 'corps', 'ger-4pz', 'germany', 'General Willibald von Langermann'],
      ['ger-lvii-pz', 'LVII Panzer Corps', 'LVII PzK', 'axis', 'corps', 'ger-4pz', 'germany', 'General Friedrich Kirchner'],
      // AXIS — German Divisions (XIV PzK)
      ['ger-16pz', '16th Panzer Division', '16. PzDiv', 'axis', 'division', 'ger-xivpz', 'germany', 'General Günther Angern'],
      ['ger-3pd', '3rd Panzer Division', '3. PzDiv', 'axis', 'division', 'ger-xivpz', 'germany', 'General Hermann Breith'],
      ['ger-60mid', '60th Motorized Division', '60. motDiv', 'axis', 'division', 'ger-xivpz', 'germany', 'General Otto Kohlermann'],
      // AXIS — German Divisions (LI AK)
      ['ger-71id', '71st Infantry Division', '71. ID', 'axis', 'division', 'ger-li', 'germany', 'General Alexander von Hartmann'],
      ['ger-295id', '295th Infantry Division', '295. ID', 'axis', 'division', 'ger-li', 'germany', 'General Otto Korfes'],
      ['ger-76id', '76th Infantry Division', '76. ID', 'axis', 'division', 'ger-li', 'germany', 'General Friedrich Svide'],
      ['ger-389id', '389th Infantry Division', '389. ID', 'axis', 'division', 'ger-li', 'germany', 'General Erwin Jänecke'],
      // AXIS — German Divisions (VIII AK)
      ['ger-376id', '376th Infantry Division', '376. ID', 'axis', 'division', 'ger-viii', 'germany', 'General Alexander von Daniels'],
      ['ger-305id', '305th Infantry Division', '305. ID', 'axis', 'division', 'ger-viii', 'germany', 'General Bernhard Steinmetz'],
      // AXIS — German Divisions (XVII AK)
      ['ger-79id', '79th Infantry Division', '79. ID', 'axis', 'division', 'ger-xvii', 'germany', 'General Richard von Schwerin'],
      ['ger-113id', '113th Infantry Division', '113. ID', 'axis', 'division', 'ger-xvii', 'germany', 'General Hans-Heinrich Söth'],
      // AXIS — German Divisions (XXIX AK)
      ['ger-100jgd', '100th Jäger Division', '100. JägDiv', 'axis', 'division', 'ger-xxix', 'germany', 'General Werner Sanne'],
      // AXIS — German Divisions (4th Panzer Army)
      ['ger-24pz', '24th Panzer Division', '24. PzDiv', 'axis', 'division', 'ger-xxivpz', 'germany', 'General Arno von Lenski'],
      ['ger-14pz', '14th Panzer Division', '14. PzDiv', 'axis', 'division', 'ger-xxivpz', 'germany', 'General Hans-Valentin Hube'],
      ['ger-29mot', '29th Motorized Division', '29. motDiv', 'axis', 'division', 'ger-xxivpz', 'germany', 'General Max Fremerey'],
      ['ger-6pz', '6th Panzer Division', '6. PzDiv', 'axis', 'division', 'ger-lvii-pz', 'germany', 'General Erhard Raus'],
      ['ger-23pz', '23rd Panzer Division', '23. PzDiv', 'axis', 'division', 'ger-lvii-pz', 'germany', 'General Nikolaus von Vormann'],
      ['ger-17pz', '17th Panzer Division', '17. PzDiv', 'axis', 'division', 'ger-lvii-pz', 'germany', 'General Fridolin von Senger und Etterlin'],
      // AXIS — Army Detachment Hollidt
      ['ger-aahollidt', 'Army Detachment Hollidt', 'Armee-Abt. Hollidt', 'axis', 'army', 'ger-agdon', 'germany', 'General Karl-Adolf Hollidt'],
      ['ger-11pz', '11th Panzer Division', '11. PzDiv', 'axis', 'division', 'ger-aahollidt', 'germany', 'General Hermann Balck'],
      ['ger-22pz', '22nd Panzer Division', '22. PzDiv', 'axis', 'division', 'ger-48pz', 'germany', 'General Eberhard Rodt'],
      ['ger-62id', '62nd Infantry Division', '62. ID', 'axis', 'division', 'ger-aahollidt', 'germany', 'General Rudolf Sperl'],
      ['ger-294id', '294th Infantry Division', '294. ID', 'axis', 'division', 'ger-aahollidt', 'germany', 'General Johannes Block'],
      ['ger-306id', '306th Infantry Division', '306. ID', 'axis', 'division', 'ger-aahollidt', 'germany', 'General Georg Pfeiffer'],
      // AXIS — Romanian Corps
      ['ro-i', 'Romanian I Corps', 'Corpul I', 'axis', 'corps', 'ger-ro3', 'romania', 'General Teodor Ionescu'],
      ['ro-ii', 'Romanian II Corps', 'Corpul II', 'axis', 'corps', 'ger-ro3', 'romania', 'General Nicolae Dăscălescu'],
      ['ro-vi', 'Romanian VI Corps', 'Corpul VI', 'axis', 'corps', 'ger-ro4', 'romania', 'General Corneliu Dragalina'],
      ['ro-vii', 'Romanian VII Corps', 'Corpul VII', 'axis', 'corps', 'ger-ro4', 'romania', 'General Florea Mitrănescu'],
      // AXIS — Romanian Divisions (3rd Army)
      ['ro-1cav', '1st Romanian Cavalry Division', '1st CavDiv', 'axis', 'division', 'ger-ro3', 'romania', 'General Constantin Brătescu'],
      ['ro-5cav', '5th Romanian Cavalry Division', '5th CavDiv', 'axis', 'division', 'ger-ro3', 'romania', 'General Ilie Crețulescu'],
      ['ro-5inf', '5th Romanian Infantry Division', '5th ID', 'axis', 'division', 'ger-ro3', 'romania', 'General Nicolae Mazarini'],
      ['ro-6inf', '6th Romanian Infantry Division', '6th ID', 'axis', 'division', 'ger-ro3', 'romania', 'General Mihail Lascăr'],
      ['ro-13inf', '13th Romanian Infantry Division', '13th ID', 'axis', 'division', 'ger-ro3', 'romania', 'General Gheorghe Cealâc'],
      ['ro-14inf', '14th Romanian Infantry Division', '14th ID', 'axis', 'division', 'ger-ro3', 'romania', 'General Gheorghe Stavrescu'],
      ['ro-1tk', '1st Romanian Armored Division', '1st TkDiv', 'axis', 'division', 'ger-ro3', 'romania', 'General Radu Korne'],
      ['ro-7cav', '7th Romanian Cavalry Division', '7th CavDiv', 'axis', 'division', 'ger-ro3', 'romania', 'General Gheorghe Popescu'],
      ['ro-7inf', '7th Romanian Infantry Division', '7th ID', 'axis', 'division', 'ro-i', 'romania', 'General Constantin Trestioreanu'],
      ['ro-9inf', '9th Romanian Infantry Division', '9th ID', 'axis', 'division', 'ro-ii', 'romania', 'General Ion Dumitru'],
      ['ro-11inf', '11th Romanian Infantry Division', '11th ID', 'axis', 'division', 'ro-i', 'romania', 'General David Popescu'],
      // AXIS — Romanian Divisions (4th Army)
      ['ro-18inf', '18th Romanian Infantry Division', '18th ID', 'axis', 'division', 'ger-ro4', 'romania', 'General Radu Băldescu'],
      ['ro-20inf', '20th Romanian Infantry Division', '20th ID', 'axis', 'division', 'ger-ro4', 'romania', 'General Nicolae Tătăranu'],
      ['ro-1inf', '1st Romanian Infantry Division', '1st ID', 'axis', 'division', 'ro-vi', 'romania', 'General Ioan Mihăescu'],
      ['ro-2inf', '2nd Romanian Infantry Division', '2nd ID', 'axis', 'division', 'ro-vii', 'romania', 'General Dumitru Tudose'],
      ['ro-4inf', '4th Romanian Infantry Division', '4th ID', 'axis', 'division', 'ro-vii', 'romania', 'General Gheorghe Voinescu'],
      ['ro-8cav', '8th Romanian Cavalry Division', '8th CavDiv', 'axis', 'division', 'ger-ro4', 'romania', 'General Radu Korne'],
      // AXIS — Italian Corps
      ['ita-ii', 'II Corps (Italian)', 'II Corpo', 'axis', 'corps', 'ger-8a', 'italy', 'General Giovanni Zanghieri'],
      ['ita-xxxv', 'XXXV Corps (Italian)', 'XXXV Corpo', 'axis', 'corps', 'ger-8a', 'italy', 'General Francesco Zingales'],
      ['ita-alpine', 'Alpine Corps', 'Corpo Alpino', 'axis', 'corps', 'ger-8a', 'italy', 'General Gabriele Nasci'],
      // AXIS — Italian Divisions
      ['ita-3cav', '3rd Cavalry Division "Amedeo"', '3rd Celere', 'axis', 'division', 'ita-xxxv', 'italy', 'General Ettore de Blasio'],
      ['ita-2inf', '2nd Infantry Division "Sforzesca"', '2a Sforzesca', 'axis', 'division', 'ita-ii', 'italy', 'General Carlo Pellegrini'],
      ['ita-9pasubio', '9th Motorized Division "Pasubio"', '9a Pasubio', 'axis', 'division', 'ita-xxxv', 'italy', 'General Vittorio Giovanelli'],
      ['ita-3inf', '3rd Infantry Division "Ravenna"', '3a Ravenna', 'axis', 'division', 'ita-ii', 'italy', 'General Francesco Dupont'],
      ['ita-5inf', '5th Infantry Division "Cosseria"', '5a Cosseria', 'axis', 'division', 'ita-ii', 'italy', 'General Enrico Gazzale'],
      ['ita-52mot', '52nd Motorized Division "Torino"', '52a Torino', 'axis', 'division', 'ita-xxxv', 'italy', 'General Roberto Lerici'],
      ['ita-2alp', '2nd Alpine Division "Tridentina"', '2a Tridentina', 'axis', 'division', 'ita-alpine', 'italy', 'General Luigi Reverberi'],
      ['ita-3alp', '3rd Alpine Division "Julia"', '3a Julia', 'axis', 'division', 'ita-alpine', 'italy', 'General Umberto Ricagno'],
      ['ita-4alp', '4th Alpine Division "Cuneense"', '4a Cuneense', 'axis', 'division', 'ita-alpine', 'italy', 'General Emilio Battisti'],
      ['ita-156inf', '156th Infantry Division "Vicenza"', '156a Vicenza', 'axis', 'division', 'ger-8a', 'italy', 'General Etelvoldo Pascolini'],
      // AXIS — Hungarian Corps
      ['hu-iii', 'III Corps (Hungarian)', 'III. hadtest', 'axis', 'corps', 'ger-hu2', 'hungary', 'General Géza Lakatos'],
      ['hu-iv', 'IV Corps (Hungarian)', 'IV. hadtest', 'axis', 'corps', 'ger-hu2', 'hungary', 'General József Heszlényi'],
      ['hu-vii', 'VII Corps (Hungarian)', 'VII. hadtest', 'axis', 'corps', 'ger-hu2', 'hungary', 'General Ernő Gyimesi'],
      // AXIS — Hungarian Divisions
      ['hu-1pz', '1st Hungarian Armored Division', '1. páncéloshadosztály', 'axis', 'division', 'ger-hu2', 'hungary', 'General Jenő Major'],
      ['hu-6lt', '6th Hungarian Light Division', '6. könnyűhadosztály', 'axis', 'division', 'hu-iii', 'hungary', 'Colonel Pál Platthy'],
      ['hu-7lt', '7th Hungarian Light Division', '7. könnyűhadosztály', 'axis', 'division', 'hu-iii', 'hungary', 'Colonel István Kudriczy'],
      ['hu-9lt', '9th Hungarian Light Division', '9. könnyűhadosztály', 'axis', 'division', 'hu-iii', 'hungary', 'Colonel János Mindszenty'],
      ['hu-10lt', '10th Hungarian Light Division', '10. könnyűhadosztály', 'axis', 'division', 'hu-iv', 'hungary', 'Colonel Sándor András'],
      ['hu-12lt', '12th Hungarian Light Division', '12. könnyűhadosztály', 'axis', 'division', 'hu-iv', 'hungary', 'Colonel Elemér Sáska'],
      ['hu-16lt', '16th Hungarian Light Division', '16. könnyűhadosztály', 'axis', 'division', 'hu-iv', 'hungary', 'Colonel Béla Lengyel'],
      ['hu-19lt', '19th Hungarian Light Division', '19. könnyűhadosztály', 'axis', 'division', 'hu-vii', 'hungary', 'Colonel Aladár Asztalossy'],
      ['hu-20lt', '20th Hungarian Light Division', '20. könnyűhadosztály', 'axis', 'division', 'hu-vii', 'hungary', 'Colonel Károly Bódy'],
      ['hu-23lt', '23rd Hungarian Light Division', '23. könnyűhadosztály', 'axis', 'division', 'hu-vii', 'hungary', 'Colonel Gusztáv Deseő'],
      // SOVIET — Fronts
      ['sov-stfront', 'Stalingrad Front', 'Stalingrad Front', 'soviet', 'army_group', null, 'ussr', 'General Andrey Yeryomenko'],
      ['sov-swfront', 'Southwestern Front', 'Southwestern Front', 'soviet', 'army_group', null, 'ussr', 'General Nikolai Vatutin'],
      ['sov-donfront', 'Don Front', 'Don Front', 'soviet', 'army_group', null, 'ussr', 'General Konstantin Rokossovsky'],
      // SOVIET — Armies (Stalingrad Front)
      ['sov-62a', '62nd Army', '62nd Army', 'soviet', 'army', 'sov-stfront', 'ussr', 'General Vasily Chuikov'],
      ['sov-64a', '64th Army', '64th Army', 'soviet', 'army', 'sov-stfront', 'ussr', 'General Mikhail Shumilov'],
      ['sov-51a', '51st Army', '51st Army', 'soviet', 'army', 'sov-stfront', 'ussr', 'General Nikolai Trufanov'],
      ['sov-57a', '57th Army', '57th Army', 'soviet', 'army', 'sov-stfront', 'ussr', 'General Fyodor Tolbukhin'],
      ['sov-28a', '28th Army', '28th Army', 'soviet', 'army', 'sov-stfront', 'ussr', 'General Vasily Gerasimenko'],
      // SOVIET — Armies (Southwestern Front)
      ['sov-5ta', '5th Tank Army', '5th Tank Army', 'soviet', 'army', 'sov-swfront', 'ussr', 'General Prokofy Romanenko'],
      ['sov-1ga', '1st Guards Army', '1st Guards Army', 'soviet', 'army', 'sov-swfront', 'ussr', 'General Dmitry Lelyushenko'],
      ['sov-21a', '21st Army', '21st Army', 'soviet', 'army', 'sov-swfront', 'ussr', 'General Ivan Chistyakov'],
      // SOVIET — Armies (Don Front)
      ['sov-24a', '24th Army', '24th Army', 'soviet', 'army', 'sov-donfront', 'ussr', 'General Ivan Galanin'],
      ['sov-65a', '65th Army', '65th Army', 'soviet', 'army', 'sov-donfront', 'ussr', 'General Pavel Batov'],
      ['sov-66a', '66th Army', '66th Army', 'soviet', 'army', 'sov-donfront', 'ussr', 'General Aleksey Zhadov'],
      // SOVIET — Tank/Mechanized Corps
      ['sov-1tc', '1st Tank Corps', '1st Tank Corps', 'soviet', 'corps', 'sov-5ta', 'ussr', 'General Vasily Butkov'],
      ['sov-26tc', '26th Tank Corps', '26th Tank Corps', 'soviet', 'corps', 'sov-5ta', 'ussr', 'General Aleksey Rodin'],
      ['sov-4tc', '4th Tank Corps', '4th Tank Corps', 'soviet', 'corps', 'sov-21a', 'ussr', 'General Andrey Kravchenko'],
      ['sov-4mc', '4th Mechanized Corps', '4th Mech Corps', 'soviet', 'corps', 'sov-51a', 'ussr', 'General Vasily Volsky'],
      ['sov-13tc', '13th Tank Corps', '13th Tank Corps', 'soviet', 'corps', 'sov-57a', 'ussr', 'General Trofim Tanaschishin'],
      // SOVIET — Rifle Divisions (62nd Army)
      ['sov-13grd', '13th Guards Rifle Division', '13th Guards RD', 'soviet', 'division', 'sov-62a', 'ussr', 'General Alexander Rodimtsev'],
      ['sov-284sd', '284th Rifle Division', '284th RD', 'soviet', 'division', 'sov-62a', 'ussr', 'Colonel Nikolay Batyuk'],
      ['sov-138rd', '138th Rifle Division', '138th RD', 'soviet', 'division', 'sov-62a', 'ussr', 'Colonel Ivan Lyudnikov'],
      ['sov-45rd', '45th Rifle Division', '45th RD', 'soviet', 'division', 'sov-62a', 'ussr', 'Colonel Vasily Sokolov'],
      ['sov-95rd', '95th Rifle Division', '95th RD', 'soviet', 'division', 'sov-62a', 'ussr', 'Colonel Vasily Gorishny'],
      ['sov-112rd', '112th Rifle Division', '112th RD', 'soviet', 'division', 'sov-62a', 'ussr', 'Colonel Ivan Ermolkin'],
      // SOVIET — Rifle Divisions (64th Army)
      ['sov-126rd', '126th Rifle Division', '126th RD', 'soviet', 'division', 'sov-64a', 'ussr', 'Colonel Vladimir Sorokin'],
      ['sov-204sd', '204th Rifle Division', '204th RD', 'soviet', 'division', 'sov-64a', 'ussr', 'Colonel Alexander Skvortsov'],
      // SOVIET — Additional Armies (Winter Storm/Little Saturn)
      ['sov-2ga', '2nd Guards Army', '2nd Guards Army', 'soviet', 'army', 'sov-stfront', 'ussr', 'General Rodion Malinovsky'],
      ['sov-3ga', '3rd Guards Army', '3rd Guards Army', 'soviet', 'army', 'sov-swfront', 'ussr', 'General Dmitry Lelyushenko'],
      ['sov-5sha', '5th Shock Army', '5th Shock Army', 'soviet', 'army', 'sov-stfront', 'ussr', 'General Vyacheslav Tsvetayev'],
      ['sov-24tc', '24th Tank Corps', '24th Tank Corps', 'soviet', 'corps', 'sov-3ga', 'ussr', 'General Vasily Badanov'],
    ];

    const insUnit = db.prepare(`
      INSERT INTO battle_units (battle_id, unit_id, name, short_name, side, type, parent_id, nation, commander, metadata_json)
      VALUES ('stalingrad', ?, ?, ?, ?, ?, ?, ?, ?, '{}')
    `);
    for (const [uid, name, sn, side, type, pid, nation, cmd] of units) {
      insUnit.run(uid, name, sn, side, type, pid, nation, cmd);
    }
  });
  inserts();
}

export default db;
