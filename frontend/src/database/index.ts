import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;
const isWeb = Platform.OS === 'web';

const inMemoryCache = new Map<string, string>();

export const getDB = (): SQLite.SQLiteDatabase | null => {
  if (isWeb) return null;
  if (!_db) {
    try {
      _db = SQLite.openDatabaseSync('wiksayuq.db');
    } catch (e) {
      console.warn('SQLite not available:', e);
      return null;
    }
  }
  return _db;
};

export const initDB = () => {
  const db = getDB();
  if (!db) return;
  db.execSync(`
    PRAGMA journal_mode = WAL;
    
    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      table_name TEXT NOT NULL,
      operation TEXT NOT NULL,
      data TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS offline_cache (
      cache_key TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS conversaciones (
      id TEXT PRIMARY KEY,
      gestante_id TEXT,
      personal_salud_id TEXT,
      activa INTEGER DEFAULT 1,
      created_at DATETIME,
      updated_at DATETIME,
      sync_status TEXT DEFAULT 'SYNCED'
    );

    CREATE TABLE IF NOT EXISTS mensajes (
      id TEXT PRIMARY KEY,
      conversacion_id TEXT,
      remitente_perfil_id TEXT,
      contenido TEXT,
      leido INTEGER DEFAULT 0,
      fecha_lectura DATETIME,
      created_at DATETIME,
      updated_at DATETIME,
      sync_status TEXT DEFAULT 'SYNCED'
    );

    CREATE TABLE IF NOT EXISTS controles (
      id TEXT PRIMARY KEY,
      gestante_id TEXT,
      fecha_control TEXT,
      establecimiento_id TEXT,
      peso_kg REAL,
      presion_sistolica INTEGER,
      presion_diastolica INTEGER,
      semana_gestacion INTEGER,
      created_at TEXT,
      updated_at TEXT,
      sync_status TEXT DEFAULT 'PENDING'
    );

    CREATE TABLE IF NOT EXISTS citas (
      id TEXT PRIMARY KEY,
      gestante_id TEXT,
      fecha_programada TEXT,
      establecimiento_id TEXT,
      motivo TEXT,
      tipo TEXT DEFAULT 'OTRO',
      created_at TEXT,
      updated_at TEXT,
      sync_status TEXT DEFAULT 'PENDING'
    );

    CREATE TABLE IF NOT EXISTS vacunas (
      id TEXT PRIMARY KEY,
      gestante_id TEXT,
      nombre_vacuna TEXT,
      descripcion_vacuna TEXT,
      estado TEXT DEFAULT 'PENDIENTE',
      fecha_aplicacion TEXT,
      fecha_programada TEXT,
      establecimiento_id TEXT,
      created_at TEXT,
      updated_at TEXT,
      sync_status TEXT DEFAULT 'PENDING'
    );

    CREATE TABLE IF NOT EXISTS contactos (
      id TEXT PRIMARY KEY,
      gestante_id TEXT,
      nombre TEXT,
      parentesco TEXT,
      telefono TEXT,
      es_principal INTEGER DEFAULT 0,
      created_at TEXT,
      updated_at TEXT,
      sync_status TEXT DEFAULT 'PENDING'
    );

    CREATE TABLE IF NOT EXISTS establecimientos (
      id TEXT PRIMARY KEY,
      nombre TEXT,
      direccion TEXT,
      latitud REAL,
      longitud REAL,
      telefono TEXT,
      horario TEXT,
      created_at TEXT,
      updated_at TEXT
    );
  `);

  try {
    db.execSync('ALTER TABLE sync_queue ADD COLUMN error_message TEXT;');
  } catch {}

  try {
    db.execSync('ALTER TABLE sync_queue ADD COLUMN updated_at DATETIME;');
  } catch {}
};

export const saveCachedData = (cacheKey: string, data: unknown) => {
  if (isWeb) {
    inMemoryCache.set(cacheKey, JSON.stringify(data));
    return;
  }
  const db = getDB();
  if (!db) return;
  db.runSync(
    'INSERT OR REPLACE INTO offline_cache (cache_key, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
    [cacheKey, JSON.stringify(data)]
  );
};

export const getCachedData = <T>(cacheKey: string, fallback: T): T => {
  if (isWeb) {
    const cached = inMemoryCache.get(cacheKey);
    return cached ? JSON.parse(cached) as T : fallback;
  }
  try {
    const db = getDB();
    if (!db) return fallback;
    const row = db.getFirstSync<{ data: string }>('SELECT data FROM offline_cache WHERE cache_key = ?', [cacheKey]);
    return row ? JSON.parse(row.data) as T : fallback;
  } catch {
    return fallback;
  }
};
