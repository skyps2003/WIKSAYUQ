import { BaseRepository, createLocalId } from '../storage';

export interface Cita {
  id: string;
  gestante_id?: string;
  fecha_programada: string;
  establecimiento_id?: string;
  motivo?: string;
  tipo?: string;
  created_at?: string;
  updated_at?: string;
  sync_status: string;
}

export class CitaRepository extends BaseRepository<Cita> {
  protected tableName = 'citas';

  async createLocal(data: Partial<Cita>): Promise<Cita> {
    const now = new Date().toISOString();
    const record: Cita = {
      id: createLocalId(),
      tipo: 'OTRO',
      ...data,
      sync_status: 'PENDING',
      created_at: now,
      updated_at: now,
    } as Cita;
    await this.upsert(record);
    return record;
  }

  async getProximas(): Promise<Cita[]> {
    const all = await this.getAll();
    const now = new Date().toISOString();
    return all
      .filter((c) => c.fecha_programada >= now)
      .sort((a, b) => a.fecha_programada.localeCompare(b.fecha_programada));
  }
}

export const citaRepo = new CitaRepository();
