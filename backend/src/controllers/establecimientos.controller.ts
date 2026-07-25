import { Request, Response } from 'express';
import { prisma } from '../config/database';

export const getEstablecimientos = async (req: Request, res: Response) => {
  try {
    const establecimientos = await prisma.establecimientos_salud.findMany({
      where: {
        activo: true
      },
      select: {
        id: true,
        nombre: true,
        tipo: true,
        categoria: true,
        direccion: true,
        telefono: true,
        telefono_emergencia: true,
        latitud: true,
        longitud: true,
        horario_atencion: true,
        atiende_emergencias: true
      }
    });

    res.json({ success: true, data: establecimientos });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
