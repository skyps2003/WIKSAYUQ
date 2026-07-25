import { Request, Response } from 'express';
import { prisma } from '../config/database';

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const gestante = await prisma.gestantes.findUnique({
      where: { perfil_id: user.id },
      include: {
        perfiles: true,
        embarazos: {
          where: { estado: 'ACTIVO' } // assuming there's an estado
        }
      }
    });

    if (!gestante) {
      return res.status(404).json({ success: false, message: 'No se encontró el perfil de gestante', errors: [] });
    }

    res.status(200).json({ success: true, message: 'Perfil de gestante obtenido', data: gestante });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al obtener la gestante', errors: [error.message] });
  }
};

export const getAsignadas = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user; // Este debería ser un PERSONAL_SALUD
    const personalSalud = await prisma.personal_salud.findUnique({
      where: { perfil_id: user.id }
    });

    if (!personalSalud) {
      return res.status(404).json({ success: false, message: 'Perfil de personal de salud no encontrado', errors: [] });
    }

    const asignaciones = await prisma.asignaciones_gestante.findMany({
      where: { personal_salud_id: personalSalud.id, estado: 'ACTIVA' },
      include: {
        gestantes: {
          include: {
            perfiles: true
          }
        }
      }
    });

    const gestantes = asignaciones.map(a => a.gestantes);

    res.status(200).json({ success: true, message: 'Gestantes asignadas obtenidas', data: gestantes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al obtener las gestantes', errors: [error.message] });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const gestante = await prisma.gestantes.findUnique({
      where: { id },
      include: {
        perfiles: true,
        embarazos: true
      }
    });

    if (!gestante) {
      return res.status(404).json({ success: false, message: 'Gestante no encontrada', errors: [] });
    }

    res.status(200).json({ success: true, message: 'Gestante obtenida', data: gestante });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al obtener gestante', errors: [error.message] });
  }
};
