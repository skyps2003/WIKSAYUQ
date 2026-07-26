import { db } from '../../database';
import NetInfo from '@react-native-community/netinfo';
import * as SecureStore from 'expo-secure-store';
import API_URL from '../../config/api';
import { OfflineDataService } from '../offline-data.service';

type QueueTable = 'controles' | 'citas' | 'vacunas' | 'contactos';

type QueueItem = {
  id: string;
  table_name: QueueTable;
  operation: string;
  data: string;
};

type SaveOrQueueParams = {
  tableName: QueueTable;
  data: Record<string, any>;
};

const ENDPOINTS: Record<QueueTable, string> = {
  controles: '/controles',
  citas: '/citas',
  vacunas: '/vacunas/mis-vacunas',
  contactos: '/contactos',
};

const createLocalId = () => `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export class SyncService {
  static async saveOrQueue({ tableName, data }: SaveOrQueueParams) {
    const netInfo = await NetInfo.fetch();

    if (!netInfo.isConnected || netInfo.isInternetReachable === false) {
      const localId = this.enqueue(tableName, data);
      return { success: true, queued: true, localId };
    }

    try {
      const response = await this.post(tableName, data);
      const json = await response.json();

      if (!response.ok || !json.success) {
        return { success: false, queued: false, message: json.message || 'No se pudo guardar' };
      }

      await this.sync();
      return { success: true, queued: false, data: json.data };
    } catch {
      const localId = this.enqueue(tableName, data);
      return { success: true, queued: true, localId };
    }
  }

  static enqueue(tableName: QueueTable, data: Record<string, any>) {
    const id = createLocalId();
    db.runSync(
      'INSERT INTO sync_queue (id, table_name, operation, data, status, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [id, tableName, 'CREATE', JSON.stringify({ ...data, offline_id: id }), 'PENDING']
    );
    return id;
  }

  static async sync() {
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected || netInfo.isInternetReachable === false) {
      console.log('No internet connection, skipping sync.');
      return;
    }

    console.log('Starting sync process...');
    
    // 1. PUSH: Subir operaciones pendientes de la cola local
    await this.pushPendingChanges();

    // 2. PULL: Bajar cambios recientes del servidor
    await this.pullRecentChanges();

    console.log('Sync process completed.');
  }

  static async pushPendingChanges() {
    const pending = db.getAllSync<QueueItem>('SELECT * FROM sync_queue WHERE status = "PENDING" ORDER BY created_at ASC');
    
    if (pending.length === 0) return;

    for (const item of pending) {
      try {
        console.log(`Pushing ${item.operation} on ${item.table_name}`, item.data);
        const response = await this.post(item.table_name, JSON.parse(item.data));
        const json = await response.json();

        if (!response.ok || !json.success) {
          throw new Error(json.message || 'No se pudo sincronizar');
        }

        if (item.table_name === 'contactos') {
          await OfflineDataService.replaceCachedContact(item.id, json.data);
        }

        db.runSync('UPDATE sync_queue SET status = "SYNCED", error_message = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [item.id]);
      } catch (error) {
        console.error(`Error pushing item ${item.id}`, error);
        const message = error instanceof Error ? error.message : 'Error desconocido';
        db.runSync('UPDATE sync_queue SET status = "PENDING", error_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [message, item.id]);
      }
    }
  }

  static async pullRecentChanges() {
    // Simulación: obtener cambios desde la API basándose en last_sync_date
    console.log('Pulling changes from server...');
    // const changes = await apiClient.get('/sync/pull?lastSync=' + lastSyncDate);
    // Aplicar a SQLite
  }

  private static async post(tableName: QueueTable, data: Record<string, any>) {
    const token = await SecureStore.getItemAsync('userToken');
    return fetch(`${API_URL}${ENDPOINTS[tableName]}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
  }
}
