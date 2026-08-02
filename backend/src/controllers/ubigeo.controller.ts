import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { APURIMAC_DEPARTMENT, APURIMAC_PROVINCES, getApurimacDistricts } from '../data/apurimac-ubigeo';

export const getDepartamentos = async (req: Request, res: Response) => {
  // La aplicaciÃ³n trabaja en ApurÃ­mac. Esta referencia estable no debe quedar
  // bloqueada si el proveedor de base de datos estÃ¡ iniciando o sin conexiones.
  if (req.query.local === 'true') {
    return res.json({ success: true, data: [APURIMAC_DEPARTMENT] });
  }
  try {
    const departamentos = await prisma.departamentos.findMany({
      orderBy: { nombre: 'asc' }
    });
    res.json({ success: true, data: departamentos });
  } catch (error) {
    console.error('Error fetching departamentos:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
};

export const getProvincias = async (req: Request, res: Response) => {
  try {
    const { departamento_id } = req.params;
    if (departamento_id === APURIMAC_DEPARTMENT.id) {
      return res.json({ success: true, data: APURIMAC_PROVINCES, source: 'reference' });
    }
    const provincias = await prisma.provincias.findMany({
      where: { departamento_id },
      orderBy: { nombre: 'asc' }
    });
    res.json({ success: true, data: provincias });
  } catch (error) {
    console.error('Error fetching provincias:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
};

export const getDistritos = async (req: Request, res: Response) => {
  try {
    const { provincia_id } = req.params;
    const referenceDistricts = getApurimacDistricts(provincia_id);
    if (referenceDistricts.length > 0) {
      return res.json({ success: true, data: referenceDistricts, source: 'reference' });
    }
    const distritos = await prisma.distritos.findMany({
      where: { provincia_id },
      orderBy: { nombre: 'asc' }
    });
    res.json({ success: true, data: distritos });
  } catch (error) {
    console.error('Error fetching distritos:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
};

export const getComunidades = async (req: Request, res: Response) => {
  try {
    const { distrito_id } = req.params;
    const comunidades = await prisma.comunidades.findMany({
      where: { distrito_id },
      orderBy: { nombre: 'asc' }
    });
    res.json({ success: true, data: comunidades });
  } catch (error) {
    console.error('Error fetching comunidades:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
};

export const getCentrosSalud = async (req: Request, res: Response) => {
  try {
    const { distrito_id } = req.params;
    const centros = await prisma.establecimientos_salud.findMany({
      where: {
        comunidades: {
          distrito_id
        }
      },
      orderBy: { nombre: 'asc' }
    });
    res.json({ success: true, data: centros });
  } catch (error) {
    console.error('Error fetching centros salud:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
};
