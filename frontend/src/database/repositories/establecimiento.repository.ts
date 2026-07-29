import { BaseRepository } from '../storage';

export interface Establecimiento {
  id: string;
  nombre: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  telefono?: string;
  horario?: string;
  created_at?: string;
  updated_at?: string;
}

export class EstablecimientoRepository extends BaseRepository<Establecimiento> {
  protected tableName = 'establecimientos';
}

export const establecimientoRepo = new EstablecimientoRepository();
