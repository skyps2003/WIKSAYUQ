import { Request, Response } from 'express';
import { prisma } from '../config/database';

export const createSOS = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { latitud, longitud, tipo_accion } = req.body; // LLAMADA, SMS, etc.

    const gestante = await prisma.gestantes.findUnique({
      where: { perfil_id: user.id }
    });

    if (!gestante) return res.status(404).json({ success: false, message: 'Gestante no encontrada' });

    const embarazo = await prisma.embarazos.findFirst({
      where: { gestante_id: gestante.id, estado: 'ACTIVO' }
    });

    // Transacción para SOS
    const result = await prisma.$transaction(async (tx) => {
      const sosEvent = await tx.eventos_sos.create({
        data: {
          gestante_id: gestante.id,
          embarazo_id: embarazo?.id,
          tipo_accion: tipo_accion || 'BOTON_PANICO',
          latitud: latitud,
          longitud: longitud,
          fecha_evento: new Date()
        }
      });

      if (embarazo) {
        await tx.alertas.create({
          data: {
            embarazo_id: embarazo.id,
            origen: 'SISTEMA',
            nivel: 'CRITICA',
            titulo: 'Emergencia SOS Activada',
            mensaje: 'La gestante presionó el botón de pánico.',
            fecha_generacion: new Date()
          }
        });
      }

      return sosEvent;
    });

    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
