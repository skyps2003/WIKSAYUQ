import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getContactos = async (req: AuthRequest, res: Response) => {
  try {
    const perfilId = req.user?.id;
    if (!perfilId) return res.status(401).json({ success: false, message: 'No autorizado' });

    const gestante = await prisma.gestantes.findUnique({
      where: { perfil_id: perfilId }
    });

    if (!gestante) {
      return res.status(404).json({ success: false, message: 'Gestante no encontrada' });
    }

    const contactos = await prisma.contactos_emergencia.findMany({
      where: { gestante_id: gestante.id, activo: true },
      orderBy: [
        { es_contacto_principal: 'desc' },
        { created_at: 'desc' }
      ]
    });

    res.json({ success: true, data: contactos });
  } catch (error) {
    console.error('Error fetching contactos:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

export const createContacto = async (req: AuthRequest, res: Response) => {
  try {
    const perfilId = req.user?.id;
    const { nombres, parentesco, telefono_principal } = req.body;

    if (!perfilId) return res.status(401).json({ success: false, message: 'No autorizado' });
    if (!nombres || !telefono_principal) {
      return res.status(400).json({ success: false, message: 'Nombre y teléfono son requeridos' });
    }

    const gestante = await prisma.gestantes.findUnique({
      where: { perfil_id: perfilId }
    });

    if (!gestante) {
      return res.status(404).json({ success: false, message: 'Gestante no encontrada' });
    }

    // Prevención de duplicados por reintentos de sincronización
    const existing = await prisma.contactos_emergencia.findFirst({
      where: { 
        gestante_id: gestante.id, 
        nombres, 
        telefono_principal, 
        activo: true 
      }
    });

    if (existing) {
      return res.status(201).json({ success: true, data: existing });
    }

    // Verificar si es el primer contacto
    const count = await prisma.contactos_emergencia.count({
      where: { gestante_id: gestante.id, activo: true }
    });
    
    const esPrincipal = count === 0;

    const nuevoContacto = await prisma.contactos_emergencia.create({
      data: {
        gestante_id: gestante.id,
        nombres,
        parentesco: parentesco || 'Familiar',
        telefono_principal,
        tipo_contacto: 'FAMILIAR',
        es_contacto_principal: esPrincipal
      }
    });

    res.status(201).json({ success: true, data: nuevoContacto });
  } catch (error) {
    console.error('Error creating contacto:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

export const deleteContacto = async (req: AuthRequest, res: Response) => {
  try {
    const perfilId = req.user?.id;
    const { id } = req.params;

    if (!perfilId) return res.status(401).json({ success: false, message: 'No autorizado' });

    // Logical delete
    await prisma.contactos_emergencia.update({
      where: { id },
      data: { activo: false, deleted_at: new Date() }
    });

    res.json({ success: true, message: 'Contacto eliminado' });
  } catch (error) {
    console.error('Error deleting contacto:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

export const setPrincipal = async (req: AuthRequest, res: Response) => {
  try {
    const perfilId = req.user?.id;
    const { id } = req.params;

    if (!perfilId) return res.status(401).json({ success: false, message: 'No autorizado' });

    const gestante = await prisma.gestantes.findUnique({
      where: { perfil_id: perfilId }
    });

    if (!gestante) return res.status(404).json({ success: false, message: 'Gestante no encontrada' });

    // Quitar principal a todos
    await prisma.contactos_emergencia.updateMany({
      where: { gestante_id: gestante.id },
      data: { es_contacto_principal: false }
    });

    // Poner principal al seleccionado
    await prisma.contactos_emergencia.update({
      where: { id },
      data: { es_contacto_principal: true }
    });

    res.json({ success: true, message: 'Contacto principal actualizado' });
  } catch (error) {
    console.error('Error setting principal contacto:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};
