import { Request, Response } from 'express';
import { prisma } from '../config/database';

export const getControles = async (req: Request, res: Response) => {
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
      return res.status(200).json({ success: true, data: [] });
    }

    const controles = await prisma.controles_prenatales.findMany({
      where: { embarazo_id: embarazo.id },
      include: {
        establecimientos_salud: true,
        citas: true
      },
      orderBy: { fecha_control: 'asc' }
    });

    res.status(200).json({ success: true, data: controles });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createControl = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { fecha_control, establecimiento_id, peso_kg, presion_sistolica, presion_diastolica, observaciones, fum } = req.body;
    const fechaControl = new Date(fecha_control);
    const fechaUltimaMenstruacion = fum ? new Date(fum) : null;

    if (Number.isNaN(fechaControl.getTime())) {
      return res.status(400).json({ success: false, message: 'Fecha de control inválida' });
    }

    const gestante = await prisma.gestantes.findUnique({
      where: { perfil_id: user.id }
    });

    if (!gestante) return res.status(404).json({ success: false, message: 'Perfil de gestante no encontrado' });

    let embarazo = await prisma.embarazos.findFirst({
      where: { gestante_id: gestante.id, estado: 'ACTIVO' }
    });

    if (!embarazo) {
      const fur = fechaUltimaMenstruacion && !Number.isNaN(fechaUltimaMenstruacion.getTime())
        ? fechaUltimaMenstruacion
        : fechaControl;
      const fechaProbableParto = new Date(fur);
      fechaProbableParto.setDate(fechaProbableParto.getDate() + 280);

      embarazo = await prisma.embarazos.create({
        data: {
          gestante_id: gestante.id,
          fecha_ultima_menstruacion: fur,
          fecha_probable_parto: fechaProbableParto,
          fecha_inicio_seguimiento: fechaControl,
          estado: 'ACTIVO'
        }
      });
    } else if (fechaUltimaMenstruacion && !Number.isNaN(fechaUltimaMenstruacion.getTime())) {
      const currentFur = new Date(embarazo.fecha_ultima_menstruacion);
      if (currentFur.toDateString() !== fechaUltimaMenstruacion.toDateString()) {
        const fechaProbableParto = new Date(fechaUltimaMenstruacion);
        fechaProbableParto.setDate(fechaProbableParto.getDate() + 280);

        embarazo = await prisma.embarazos.update({
          where: { id: embarazo.id },
          data: {
            fecha_ultima_menstruacion: fechaUltimaMenstruacion,
            fecha_probable_parto: fechaProbableParto
          }
        });
      }
    }

    let estId = establecimiento_id && establecimiento_id !== 'custom'
      ? establecimiento_id
      : gestante.establecimiento_id;
    if (!estId) {
      const defaultEst = await prisma.establecimientos_salud.findFirst();
      if (!defaultEst) return res.status(400).json({ success: false, message: 'Se requiere un establecimiento de salud' });
      estId = defaultEst.id;
    }

    const personalSalud = await prisma.personal_salud.findFirst();

    // Determinar numero de control
    const count = await prisma.controles_prenatales.count({
      where: { embarazo_id: embarazo.id }
    });

    // Calcular semanas de gestacion desde FUR
    const semanasGestacion = Math.max(0, Math.floor(
      (fechaControl.getTime() - new Date(embarazo.fecha_ultima_menstruacion).getTime()) / (1000 * 60 * 60 * 24 * 7)
    ));

    // Create a cita linked to this control for the calendar
    const cita = await prisma.citas.create({
      data: {
        embarazo_id: embarazo.id,
        establecimiento_id: estId,
        tipo: 'CONTROL_PRENATAL',
        fecha_programada: fechaControl,
        estado: 'REALIZADA',
        fecha_realizacion: fechaControl,
        motivo: 'Control Prenatal',
        created_by: user.id
      }
    });

    const existing = await prisma.controles_prenatales.findFirst({
      where: {
        embarazo_id: embarazo.id,
        fecha_control: new Date(fecha_control),
      }
    });

    if (existing) {
      return res.status(201).json({ success: true, data: existing });
    }

    const control = await prisma.controles_prenatales.create({
      data: {
        embarazos: { connect: { id: embarazo.id } },
        citas: { connect: { id: cita.id } },
        personal_salud: personalSalud ? { connect: { id: personalSalud.id } } : undefined,
        establecimientos_salud: { connect: { id: estId } },
        numero_control: count + 1,
        fecha_control: fechaControl,
        semanas_gestacion: semanasGestacion,
        peso_kg: peso_kg ? parseFloat(peso_kg) : null,
        presion_sistolica: presion_sistolica ? parseInt(presion_sistolica) : null,
        presion_diastolica: presion_diastolica ? parseInt(presion_diastolica) : null,
        observaciones: observaciones || null,
        estado: 'REALIZADO'
      }
    });

    res.status(201).json({ success: true, data: control });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: 'No se pudo guardar el control prenatal' });
  }
};
