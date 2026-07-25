import { Request, Response } from 'express';
import { prisma } from '../config/database';

export const getVacunasList = async (req: Request, res: Response) => {
  try {
    const vacunas = await prisma.vacunas.findMany({
      where: { activa: true },
      orderBy: { nombre: 'asc' }
    });
    res.json({ success: true, data: vacunas });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMisVacunas = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    const gestante = await prisma.gestantes.findUnique({
      where: { perfil_id: user.id }
    });

    if (!gestante) return res.status(404).json({ success: false, message: 'Perfil de gestante no encontrado' });

    const embarazo = await prisma.embarazos.findFirst({
      where: { gestante_id: gestante.id, estado: 'ACTIVO' }
    });

    if (!embarazo) return res.json({ success: true, data: [] });

    const vacunas_gestante = await prisma.vacunas_gestante.findMany({
      where: { embarazo_id: embarazo.id },
      include: {
        vacunas: true,
        establecimientos_salud: true
      },
      orderBy: { fecha_aplicacion: 'desc' }
    });

    res.json({ success: true, data: vacunas_gestante });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addMisVacunas = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { nombre_vacuna, descripcion_vacuna, fecha_aplicacion, fecha_programada, establecimiento_id, estado, fum } = req.body;

    if (!nombre_vacuna) {
      return res.status(400).json({ success: false, message: 'El nombre de la vacuna es obligatorio' });
    }

    const gestante = await prisma.gestantes.findUnique({
      where: { perfil_id: user.id }
    });

    if (!gestante) return res.status(404).json({ success: false, message: 'Perfil de gestante no encontrado' });

    let embarazo = await prisma.embarazos.findFirst({
      where: { gestante_id: gestante.id, estado: 'ACTIVO' }
    });

    if (!embarazo) {
      const fechaUltimaMenstruacion = fum ? new Date(fum) : new Date();
      const fur = !Number.isNaN(fechaUltimaMenstruacion.getTime()) ? fechaUltimaMenstruacion : new Date();
      const fechaProbableParto = new Date(fur);
      fechaProbableParto.setDate(fechaProbableParto.getDate() + 280);

      embarazo = await prisma.embarazos.create({
        data: {
          gestante_id: gestante.id,
          fecha_ultima_menstruacion: fur,
          fecha_probable_parto: fechaProbableParto,
          fecha_inicio_seguimiento: new Date(),
          estado: 'ACTIVO'
        }
      });
    }

    let estId = establecimiento_id && establecimiento_id !== 'custom'
      ? establecimiento_id
      : gestante.establecimiento_id;
    if (!estId) {
      const defaultEst = await prisma.establecimientos_salud.findFirst();
      if (!defaultEst) {
        return res.status(400).json({ success: false, message: 'Se requiere un establecimiento de salud' });
      }
      estId = defaultEst.id;
    }

    const vacEstado = estado === 'PENDIENTE' ? 'PENDIENTE' : 'APLICADA';

    const nuevaVacuna = await prisma.vacunas_gestante.create({
      data: {
        embarazo_id: embarazo.id,
        establecimiento_id: estId,
        fecha_aplicacion: vacEstado === 'APLICADA' ? new Date(fecha_aplicacion) : null,
        fecha_programada: vacEstado === 'PENDIENTE' ? new Date(fecha_programada) : null,
        numero_dosis: 1,
        nombre_vacuna,
        descripcion_vacuna: descripcion_vacuna || null,
        estado: vacEstado
      }
    });

    res.status(201).json({ success: true, data: nuevaVacuna });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
