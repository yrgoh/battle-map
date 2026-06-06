import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import {
  listBattles, getBattle, saveBattle,
  getBattleUnits, saveBattleUnit, deleteBattleUnit,
  getBattleKeyframes, saveBattleKeyframe, deleteBattleKeyframe,
  getBattleEvents, saveBattleEvent, deleteBattleEvent,
  getBattleMaps, saveBattleMap, deleteBattleMap,
  seedStalingradBattle,
} from './db.js';

// ─── Config ───────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env['PORT'] ?? '3002', 10);

// ─── App ─────────────────────────────────────────────────────────────────────
const app = express();

app.use(cors());
app.use(compression());
app.use(express.json());

// ─── Battle / Editor API Routes ──────────────────────────────────────────────

// GET /api/battles — list all battles
app.get('/api/battles', (_req, res) => {
  try {
    const battles = listBattles();
    res.json(battles);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/battles/:id — full battle config
app.get('/api/battles/:id', (req, res) => {
  try {
    const battle = getBattle(req.params.id);
    if (!battle) return res.status(404).json({ error: 'Battle not found' });
    const units = getBattleUnits(req.params.id);
    const keyframes = getBattleKeyframes(req.params.id);
    const events = getBattleEvents(req.params.id);
    const maps = getBattleMaps(req.params.id);
    let dataJson: Record<string, unknown> = {};
    try { dataJson = JSON.parse(battle.dataJson ?? '{}'); } catch (_) { /* ignore */ }
    const phases = dataJson.phases ?? [];
    res.json({
      id: battle.id, name: battle.name,
      dateRange: { start: battle.dateStart, end: battle.dateEnd },
      theatre: battle.theatre,
      defaultCenter: [battle.defaultLat, battle.defaultLng],
      defaultZoom: battle.defaultZoom,
      units, keyframes, events, historicalMaps: maps, phases,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/battles/:id — save/update a battle
app.put('/api/battles/:id', (req, res) => {
  try {
    const { name, dateStart, dateEnd, defaultLat, defaultLng, defaultZoom, dataJson } = req.body;
    saveBattle(req.params.id, name, dateStart, dateEnd, defaultLat, defaultLng, defaultZoom, dataJson ?? '{}');
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/battles/seed — seed default stalingrad data
app.post('/api/battles/seed', (_req, res) => {
  try {
    seedStalingradBattle();
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/battles/:id/units
app.get('/api/battles/:id/units', (req, res) => {
  try {
    res.json(getBattleUnits(req.params.id));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/battles/:id/units
app.put('/api/battles/:id/units', (req, res) => {
  try {
    const { unitId, name, side, type, nation, parentId, commander, shortName, color, arrivalDate, departureDate, metadataJson } = req.body;
    saveBattleUnit(req.params.id, unitId, name, side, type, nation, parentId ?? null, commander, shortName, color, arrivalDate, departureDate, metadataJson);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/battles/:id/units/:unitId
app.delete('/api/battles/:id/units/:unitId', (req, res) => {
  try {
    deleteBattleUnit(req.params.id, req.params.unitId);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/battles/:id/keyframes
app.get('/api/battles/:id/keyframes', (req, res) => {
  try {
    res.json(getBattleKeyframes(req.params.id));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/battles/:id/keyframes
app.put('/api/battles/:id/keyframes', (req, res) => {
  try {
    const { unitId, date, lat, lng, facing, confidence, sourceMapId } = req.body;
    saveBattleKeyframe(req.params.id, unitId, date, lat, lng, facing, confidence, sourceMapId);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/battles/:id/keyframes/:unitId/:date
app.delete('/api/battles/:id/keyframes/:unitId/:date', (req, res) => {
  try {
    deleteBattleKeyframe(req.params.id, req.params.unitId, req.params.date);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/battles/:id/events
app.get('/api/battles/:id/events', (req, res) => {
  try {
    res.json(getBattleEvents(req.params.id));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/battles/:id/events
app.put('/api/battles/:id/events', (req, res) => {
  try {
    const { eventId, date, title, lat, lng, type, description, relatedUnitsJson } = req.body;
    saveBattleEvent(req.params.id, eventId, date, title, lat, lng, type, description, relatedUnitsJson);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/battles/:id/events/:eventId
app.delete('/api/battles/:id/events/:eventId', (req, res) => {
  try {
    deleteBattleEvent(req.params.id, req.params.eventId);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/battles/:id/maps
app.get('/api/battles/:id/maps', (req, res) => {
  try {
    res.json(getBattleMaps(req.params.id));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/battles/:id/maps
app.put('/api/battles/:id/maps', (req, res) => {
  try {
    const { mapId, title, imagePath, date, opacity, gcpsJson } = req.body;
    saveBattleMap(req.params.id, mapId, title, imagePath, date, opacity, gcpsJson);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/battles/:id/maps/:mapId
app.delete('/api/battles/:id/maps/:mapId', (req, res) => {
  try {
    deleteBattleMap(req.params.id, req.params.mapId);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/battles/:id/export — export full battle as JSON download
app.post('/api/battles/:id/export', (req, res) => {
  try {
    const battle = getBattle(req.params.id);
    if (!battle) return res.status(404).json({ error: 'not found' });
    const units = getBattleUnits(req.params.id);
    const keyframes = getBattleKeyframes(req.params.id);
    const events = getBattleEvents(req.params.id);
    const maps = getBattleMaps(req.params.id);
    let dataJson: Record<string, unknown> = {};
    try { dataJson = JSON.parse(battle.dataJson ?? '{}'); } catch (_) { /* ignore */ }
    const phases = dataJson.phases ?? [];
    res.json({
      id: battle.id, name: battle.name,
      dateRange: { start: battle.dateStart, end: battle.dateEnd },
      theatre: battle.theatre,
      defaultCenter: [battle.defaultLat, battle.defaultLng],
      defaultZoom: battle.defaultZoom,
      units, keyframes, events, historicalMaps: maps, phases,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/health
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[battle-map server] Running on http://localhost:${PORT}`);
});
