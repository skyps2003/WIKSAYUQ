import { Request, Response } from 'express';
import { prisma } from '../config/database';

export const getConversaciones = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const isGestante = user.rol === 'GESTANTE';
    
    let filter = {};
    if (isGestante) {
      const gestante = await prisma.gestantes.findUnique({ where: { perfil_id: user.id } });
      if (!gestante) return res.status(404).json({ success: false, message: 'Gestante no encontrada' });
      filter = { gestante_id: gestante.id };
    } else {
      const personal = await prisma.personal_salud.findUnique({ where: { perfil_id: user.id } });
      if (!personal) return res.status(404).json({ success: false, message: 'Personal no encontrado' });
      filter = { personal_salud_id: personal.id };
    }

    const conversaciones = await prisma.conversaciones.findMany({
      where: { ...filter, activa: true },
      include: {
        mensajes: {
          orderBy: { created_at: 'desc' },
          take: 1
        }
      }
    });

    res.status(200).json({ success: true, data: conversaciones });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMensajes = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const mensajes = await prisma.mensajes.findMany({
      where: { conversacion_id: id },
      orderBy: { created_at: 'asc' }
    });

    res.status(200).json({ success: true, data: mensajes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createMensaje = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { contenido } = req.body;
    const user = (req as any).user;

    const mensaje = await prisma.mensajes.create({
      data: {
        conversacion_id: id,
        remitente_perfil_id: user.id,
        contenido
      }
    });

    res.status(201).json({ success: true, data: mensaje });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
