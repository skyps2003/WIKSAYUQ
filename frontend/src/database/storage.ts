import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';

const isWeb = Platform.OS === 'web';

let _db: SQLite.SQLiteDatabase | null = null;

const memoryStore = new Map<string, any[]>();

const getDB = (): SQLite.SQLiteDatabase | null => {
  if (isWeb) return null;
  if (!_db) {
    try {
      _db = SQLite.openDatabaseSync('wiksayuq.db');
    } catch {
      return null;
    }
  }
  return _db;
};

export abstract class BaseRepository<T extends { id: string }> {
  protected abstract tableName: string;

  async getAll(): Promise<T[]> {
    if (isWeb) return memoryStore.get(this.tableName) || [];
    const db = getDB();
    if (!db) return [];
    try {
      return db.getAllSync<T>(`SELECT * FROM ${this.tableName} ORDER BY created_at DESC`);
    } catch {
      return [];
    }
  }

  async getById(id: string): Promise<T | null> {
    if (isWeb) {
      const items = memoryStore.get(this.tableName) || [];
      return items.find((i) => i.id === id) || null;
    }
    const db = getDB();
    if (!db) return null;
    try {
      return db.getFirstSync<T>(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]) || null;
    } catch {
      return null;
    }
  }

  async upsert(record: T): Promise<void> {
    const keys = Object.keys(record as any);
    const cols = keys.join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map((k) => (record as any)[k]);

    if (isWeb) {
      const items = memoryStore.get(this.tableName) || [];
      const idx = items.findIndex((i) => i.id === record.id);
      if (idx >= 0) items[idx] = record;
      else items.push(record);
      memoryStore.set(this.tableName, items);
      return;
    }

    const db = getDB();
    if (!db) return;
    try {
      db.runSync(
        `INSERT OR REPLACE INTO ${this.tableName} (${cols}) VALUES (${placeholders})`,
        values
      );
    } catch (e) {
      console.error(`Error upserting into ${this.tableName}:`, e);
    }
  }

  async upsertMany(records: T[]): Promise<void> {
    for (const r of records) await this.upsert(r);
  }

  async delete(id: string): Promise<void> {
    if (isWeb) {
      const items = memoryStore.get(this.tableName) || [];
      memoryStore.set(this.tableName, items.filter((i) => i.id !== id));
      return;
    }
    const db = getDB();
    if (!db) return;
    try {
      db.runSync(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
    } catch (e) {
      console.error(`Error deleting from ${this.tableName}:`, e);
    }
  }

  async getByStatus(status: string): Promise<T[]> {
    if (isWeb) {
      const items = memoryStore.get(this.tableName) || [];
      return items.filter((i) => (i as any).sync_status === status);
    }
    const db = getDB();
    if (!db) return [];
    try {
      return db.getAllSync<T>(`SELECT * FROM ${this.tableName} WHERE sync_status = ? ORDER BY created_at ASC`, [status]);
    } catch {
      return [];
    }
  }

  async markSynced(id: string, serverData?: Partial<T>): Promise<void> {
    if (isWeb) {
      const items = memoryStore.get(this.tableName) || [];
      const idx = items.findIndex((i) => i.id === id);
      if (idx >= 0) {
        items[idx] = { ...items[idx], ...serverData, sync_status: 'SYNCED' };
        memoryStore.set(this.tableName, items);
      }
      return;
    }
    const db = getDB();
    if (!db) return;
    const sets = serverData
      ? Object.keys(serverData).map((k) => `${k} = ?`).join(', ') + ', '
      : '';
    const serverValues = serverData ? Object.values(serverData) : [];
    try {
      db.runSync(
        `UPDATE ${this.tableName} SET ${sets}sync_status = 'SYNCED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [...serverValues, id]
      );
    } catch (e) {
      console.error(`Error marking synced in ${this.tableName}:`, e);
    }
  }

  async getPendingSync(): Promise<T[]> {
    return this.getByStatus('PENDING');
  }

  async count(): Promise<number> {
    if (isWeb) return (memoryStore.get(this.tableName) || []).length;
    const db = getDB();
    if (!db) return 0;
    try {
      const row = db.getFirstSync<{ count: number }>(`SELECT COUNT(*) as count FROM ${this.tableName}`);
      return row?.count || 0;
    } catch {
      return 0;
    }
  }
}

export const createLocalId = () => `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
