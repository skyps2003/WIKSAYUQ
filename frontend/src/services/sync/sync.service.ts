import { getDB } from '../../database';
import NetInfo from '@react-native-community/netinfo';
import API_URL from '../../config/api';
import { getItemAsync } from '../../utils/webStorage';
import { controlRepo } from '../../database/repositories/control.repository';
import { citaRepo } from '../../database/repositories/cita.repository';
import { vacunaRepo } from '../../database/repositories/vacuna.repository';
import { contactoRepo } from '../../database/repositories/contacto.repository';
import { establecimientoRepo } from '../../database/repositories/establecimiento.repository';
import { fetchWithTimeout, readApiResponse } from '../../utils/fetchWithTimeout';

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

const REPOS = {
  controles: controlRepo,
  citas: citaRepo,
  vacunas: vacunaRepo,
  contactos: contactoRepo,
} as const;

export class SyncService {
  static async saveOrQueue({ tableName, data }: SaveOrQueueParams) {
    const repo = REPOS[tableName];
    const localId = createLocalId();
    const now = new Date().toISOString();

    const { fum, ...dbData } = data;

    const localRecord = {
      id: localId,
      ...dbData,
      sync_status: 'PENDING' as const,
      created_at: now,
      updated_at: now,
    };

    await repo.upsert(localRecord as any);
    this.enqueue(tableName, data, localId);

    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected && netInfo.isInternetReachable !== false) {
      try {
        const response = await this.post(tableName, data);
        const json = await readApiResponse<any>(response);
        if (response.ok && json.success) {
          await repo.markSynced(localId, { ...json.data, sync_status: 'SYNCED' });
          return { success: true, synced: true, data: json.data, localId };
        }
      } catch {
        return { success: true, synced: false, localId };
      }
    }

    return { success: true, synced: false, localId };
  }

  static enqueue(tableName: QueueTable, data: Record<string, any>, localId: string) {
    const db = getDB();
    if (!db) return;
    db.runSync(
      'INSERT OR REPLACE INTO sync_queue (id, table_name, operation, data, status, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [localId, tableName, 'CREATE', JSON.stringify({ ...data, offline_id: localId }), 'PENDING']
    );
  }

  static async sync() {
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected || netInfo.isInternetReachable === false) {
      return;
    }

    await this.pushPendingChanges();
    await this.pullAll();
  }

  static async pushPendingChanges() {
    const db = getDB();
    if (!db) return;
    const pending = db.getAllSync<QueueItem>('SELECT * FROM sync_queue WHERE status = "PENDING" ORDER BY created_at ASC');
    if (pending.length === 0) return;

    for (const item of pending) {
      try {
        const response = await this.post(item.table_name, JSON.parse(item.data));
        const json = await readApiResponse<any>(response);
        if (!response.ok || !json.success) {
          throw new Error(json.message || 'No se pudo sincronizar');
        }

        const repo = REPOS[item.table_name];
        await repo.markSynced(item.id, json.data);

        db.runSync('DELETE FROM sync_queue WHERE id = ?', [item.id]);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        db.runSync('UPDATE sync_queue SET error_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [message, item.id]);
      }
    }
  }

  static async pullAll() {
    const token = await getItemAsync('userToken');
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    const endpoints = [
      { url: '/controles', repo: controlRepo, map: mapControl },
      { url: '/citas', repo: citaRepo, map: mapCita },
      { url: '/vacunas/mis-vacunas', repo: vacunaRepo, map: mapVacuna },
      { url: '/contactos', repo: contactoRepo, map: mapContacto },
      { url: '/establecimientos', repo: establecimientoRepo, map: mapEstablecimiento },
    ];

    for (const ep of endpoints) {
      try {
        const res = await fetchWithTimeout(`${API_URL}${ep.url}`, { headers, timeout: 15000 });
        const json = await readApiResponse<any>(res);
        if (res.ok && json.success && Array.isArray(json.data)) {
          const records = json.data.map(ep.map);
          await ep.repo.upsertMany(records as any);
        }
      } catch (e) {
        console.warn(`Sync pull failed for ${ep.url}:`, e);
      }
    }
  }

  static async pullAllFromBackground() {
    await this.pullAll();
  }

  private static async post(tableName: QueueTable, data: Record<string, any>) {
    const token = await getItemAsync('userToken');
    return fetchWithTimeout(`${API_URL}${ENDPOINTS[tableName]}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
      timeout: 20000,
    });
  }
}

const mapControl = (item: any) => ({
  id: String(item.id),
  gestante_id: item.gestante_id,
  fecha_control: item.fecha_control,
  establecimiento_id: item.establecimiento_id,
  peso_kg: item.peso_kg ? parseFloat(item.peso_kg) : undefined,
  presion_sistolica: item.presion_sistolica,
  presion_diastolica: item.presion_diastolica,
  semana_gestacion: item.semanas_gestacion || 0,
  created_at: item.created_at,
  updated_at: item.updated_at,
  sync_status: 'SYNCED',
});

const mapCita = (item: any) => ({
  id: String(item.id),
  gestante_id: item.gestante_id,
  fecha_programada: item.fecha_programada,
  establecimiento_id: item.establecimiento_id,
  motivo: item.motivo,
  tipo: item.tipo || 'OTRO',
  created_at: item.created_at,
  updated_at: item.updated_at,
  sync_status: 'SYNCED',
});

const mapVacuna = (item: any) => ({
  id: String(item.id),
  gestante_id: item.gestante_id,
  nombre_vacuna: item.nombre_vacuna,
  descripcion_vacuna: item.descripcion_vacuna,
  estado: item.estado || 'PENDIENTE',
  fecha_aplicacion: item.fecha_aplicacion,
  fecha_programada: item.fecha_programada,
  establecimiento_id: item.establecimiento_id,
  created_at: item.created_at,
  updated_at: item.updated_at,
  sync_status: 'SYNCED',
});

const mapContacto = (item: any) => ({
  id: String(item.id),
  gestante_id: item.gestante_id,
  nombres: item.nombres,
  parentesco: item.parentesco,
  telefono_principal: item.telefono_principal || item.telefono,
  es_contacto_principal: item.es_contacto_principal ? 1 : (item.es_principal ? 1 : 0),
  created_at: item.created_at,
  updated_at: item.updated_at,
  sync_status: 'SYNCED',
});

const mapEstablecimiento = (item: any) => ({
  id: String(item.id),
  nombre: item.nombre,
  direccion: item.direccion,
  latitud: item.latitud ? parseFloat(item.latitud) : undefined,
  longitud: item.longitud ? parseFloat(item.longitud) : undefined,
  telefono: item.telefono,
  horario: item.horario,
  created_at: item.created_at,
  updated_at: item.updated_at,
});
