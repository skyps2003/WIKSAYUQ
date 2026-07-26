import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('wiksayuq.db');

export const initDB = () => {
  // Configuración inicial y creación de tablas
  db.execSync(`
    PRAGMA journal_mode = WAL;
    
    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      table_name TEXT NOT NULL,
      operation TEXT NOT NULL, -- CREATE, UPDATE, DELETE
      data TEXT NOT NULL,      -- JSON de los datos
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

    -- Aquí se añadirían el resto de tablas locales...
  `);

  try {
    db.execSync('ALTER TABLE sync_queue ADD COLUMN error_message TEXT;');
  } catch {}

  try {
    db.execSync('ALTER TABLE sync_queue ADD COLUMN updated_at DATETIME;');
  } catch {}
};

export const saveCachedData = (cacheKey: string, data: unknown) => {
  db.runSync(
    'INSERT OR REPLACE INTO offline_cache (cache_key, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
    [cacheKey, JSON.stringify(data)]
  );
};

export const getCachedData = <T>(cacheKey: string, fallback: T): T => {
  try {
    const row = db.getFirstSync<{ data: string }>('SELECT data FROM offline_cache WHERE cache_key = ?', [cacheKey]);
    return row ? JSON.parse(row.data) as T : fallback;
  } catch {
    return fallback;
  }
};
