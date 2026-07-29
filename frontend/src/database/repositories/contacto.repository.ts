import { BaseRepository, createLocalId } from '../storage';

export interface Contacto {
  id: string;
  gestante_id?: string;
  nombre: string;
  parentesco?: string;
  telefono: string;
  es_principal?: number;
  created_at?: string;
  updated_at?: string;
  sync_status: string;
}

export class ContactoRepository extends BaseRepository<Contacto> {
  protected tableName = 'contactos';

  async createLocal(data: Partial<Contacto>): Promise<Contacto> {
    const now = new Date().toISOString();
    const record: Contacto = {
      id: createLocalId(),
      es_principal: 0,
      ...data,
      sync_status: 'PENDING',
      created_at: now,
      updated_at: now,
    } as Contacto;
    await this.upsert(record);
    return record;
  }

  async getPrincipales(): Promise<Contacto[]> {
    const all = await this.getAll();
    return all.filter((c) => c.es_principal === 1);
  }
}

export const contactoRepo = new ContactoRepository();

export const getAllContactos = async (): Promise<Contacto[]> => {
  return contactoRepo.getAll();
};
