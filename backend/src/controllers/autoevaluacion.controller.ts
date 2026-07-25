import { Request, Response } from 'express';
import { prisma } from '../config/database';

export const createAutoevaluacion = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { respuestas, latitud, longitud } = req.body;

    const gestante = await prisma.gestantes.findUnique({
      where: { perfil_id: user.id }
    });

    if (!gestante) return res.status(404).json({ success: false, message: 'Gestante no encontrada' });

    const embarazo = await prisma.embarazos.findFirst({
      where: { gestante_id: gestante.id, estado: 'ACTIVO' }
    });

    if (!embarazo) return res.status(400).json({ success: false, message: 'No hay embarazo activo' });

    // Determinar riesgo basado en respuestas hardcodeadas
    const presentaSignosAlarma = respuestas.some((r: any) => r.respuesta === true);
    const nivelResultado = presentaSignosAlarma ? 'CRITICA' : 'INFORMATIVA';

    // Transacción para registrar evaluación y posible alerta
    const result = await prisma.$transaction(async (tx) => {
      const evalData = await tx.autoevaluaciones.create({
        data: {
          embarazo_id: embarazo.id,
          fecha_autoevaluacion: new Date(),
          nivel_resultado: nivelResultado,
          presenta_signos_alarma: presentaSignosAlarma,
          requiere_atencion: presentaSignosAlarma,
          ubicacion_latitud: latitud,
          ubicacion_longitud: longitud
        }
      });

      if (presentaSignosAlarma) {
        await tx.alertas.create({
          data: {
            embarazo_id: embarazo.id,
            autoevaluacion_id: evalData.id,
            origen: 'AUTOEVALUACION',
            nivel: 'CRITICA',
            titulo: 'Alarma detectada en Autoevaluación',
            mensaje: 'La gestante reportó signos de alarma.',
            fecha_generacion: new Date()
          }
        });
      }

      return evalData;
    });

    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
