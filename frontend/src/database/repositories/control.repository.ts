import { BaseRepository, createLocalId } from '../storage';

export interface Control {
  id: string;
  gestante_id?: string;
  fecha_control: string;
  establecimiento_id?: string;
  peso_kg?: number;
  presion_sistolica?: number;
  presion_diastolica?: number;
  semana_gestacion?: number;
  created_at?: string;
  updated_at?: string;
  sync_status: string;
}

export class ControlRepository extends BaseRepository<Control> {
  protected tableName = 'controles';

  async createLocal(data: Partial<Control>): Promise<Control> {
    const now = new Date().toISOString();
    const record: Control = {
      id: createLocalId(),
      ...data,
      sync_status: 'PENDING',
      created_at: now,
      updated_at: now,
    } as Control;
    await this.upsert(record);
    return record;
  }
}

export const controlRepo = new ControlRepository();
