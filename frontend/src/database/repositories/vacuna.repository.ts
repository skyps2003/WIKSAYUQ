import { BaseRepository, createLocalId } from '../storage';

export interface Vacuna {
  id: string;
  gestante_id?: string;
  nombre_vacuna: string;
  descripcion_vacuna?: string;
  estado: string;
  fecha_aplicacion?: string;
  fecha_programada?: string;
  establecimiento_id?: string;
  created_at?: string;
  updated_at?: string;
  sync_status: string;
}

export class VacunaRepository extends BaseRepository<Vacuna> {
  protected tableName = 'vacunas';

  async createLocal(data: Partial<Vacuna>): Promise<Vacuna> {
    const now = new Date().toISOString();
    const record: Vacuna = {
      id: createLocalId(),
      estado: 'PENDIENTE',
      ...data,
      sync_status: 'PENDING',
      created_at: now,
      updated_at: now,
    } as Vacuna;
    await this.upsert(record);
    return record;
  }
}

export const vacunaRepo = new VacunaRepository();
