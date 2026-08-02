import { Request, Response } from 'express';
import { prisma } from '../config/database';

export const getProximaCita = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const gestante = await prisma.gestantes.findUnique({
      where: { perfil_id: user.id }
    });

    if (!gestante) {
      return res.status(404).json({ success: false, message: 'Perfil de gestante no encontrado' });
    }

    const embarazo = await prisma.embarazos.findFirst({
      where: { gestante_id: gestante.id, estado: 'ACTIVO' }
    });

    if (!embarazo) {
      return res.json({ success: true, data: null });
    }

    const proxima = await prisma.citas.findFirst({
      where: {
        embarazo_id: embarazo.id,
        fecha_programada: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())
        },
        estado: { not: 'CANCELADA' }
      },
      include: { establecimientos_salud: true },
      orderBy: { fecha_programada: 'asc' }
    });

    res.json({ success: true, data: proxima });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCitas = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Find the gestante ID for this user profile
    const gestante = await prisma.gestantes.findUnique({
      where: { perfil_id: user.id }
    });

    if (!gestante) {
      return res.status(404).json({ success: false, message: 'Perfil de gestante no encontrado' });
    }

    // Find active embarazo for this gestante
    const embarazo = await prisma.embarazos.findFirst({
      where: { gestante_id: gestante.id, estado: 'ACTIVO' }
    });

    if (!embarazo) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Citas will include controles prenatales and other types
    const citas = await prisma.citas.findMany({
      where: { embarazo_id: embarazo.id },
      include: {
        establecimientos_salud: true,
        embarazos: {
          select: { fecha_ultima_menstruacion: true }
        },
        personal_salud: {
          include: { perfiles: true }
        },
        controles_prenatales: true
      },
      orderBy: { fecha_programada: 'asc' }
    });

    res.status(200).json({ success: true, data: citas });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCita = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { fecha_programada, establecimiento_id, motivo, observaciones, tipo, fum } = req.body;

    const gestante = await prisma.gestantes.findUnique({
      where: { perfil_id: user.id }
    });

    if (!gestante) {
      return res.status(404).json({ success: false, message: 'Perfil de gestante no encontrado' });
    }

    let embarazo = await prisma.embarazos.findFirst({
      where: { gestante_id: gestante.id, estado: 'ACTIVO' }
    });

    if (!embarazo) {
      const fechaUltimaMenstruacion = fum ? new Date(fum) : new Date();
      const fur = !Number.isNaN(fechaUltimaMenstruacion.getTime()) ? fechaUltimaMenstruacion : new Date();
      const fechaProbableParto = new Date(fur);
      fechaProbableParto.setDate(fechaProbableParto.getDate() + 280);

      // Auto-create an active pregnancy for the user if it doesn't exist
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

    // Default to the gestante's assigned establecimiento if not provided
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

    const existing = await prisma.citas.findFirst({
      where: {
        embarazo_id: embarazo.id,
        fecha_programada: fechaCita,
        motivo: motivo,
      }
    });

    if (existing) {
      return res.status(201).json({ success: true, data: existing });
    }

    const nuevaCita = await prisma.citas.create({
      data: {
        embarazo_id: embarazo.id,
        establecimiento_id: estId,
        fecha_programada: fechaCita,
        motivo: motivo || 'Control Prenatal',
        observaciones: observaciones || null,
        tipo: tipo || 'CONTROL_PRENATAL',
        estado: 'PROGRAMADA',
        created_by: user.id
      },
      include: {
        establecimientos_salud: true
      }
    });

    res.status(201).json({ success: true, data: nuevaCita });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
