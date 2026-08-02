import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma, isDatabaseConnectionError } from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || '';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET or JWT_ACCESS_SECRET must be configured');
}

export const register = async (req: Request, res: Response) => {
  try {
    const {
      dni, pin, nombres, edad, rol, comunidad_id, establecimiento_id,
      apellido_paterno, apellido_materno, sexo, telefono, direccion,
      foto_base64, idioma_preferido, acepta_terminos, acepta_tratamiento_datos,
      fum
    } = req.body;

    if (!dni || !pin || !nombres) {
      return res.status(400).json({ success: false, message: 'DNI, PIN y Nombres son requeridos' });
    }

    // Check if user already exists
    const existingPerfil = await prisma.perfiles.findUnique({
      where: { numero_documento: dni },
      include: { auth_users: true },
    });

    if (existingPerfil) {
      const sameCredentials = existingPerfil.auth_users?.encrypted_password
        ? await bcrypt.compare(pin, existingPerfil.auth_users.encrypted_password)
        : false;

      if (!sameCredentials) {
        return res.status(409).json({
          success: false,
          code: 'USER_EXISTS',
          message: 'Este DNI ya tiene una cuenta. Inicia sesión con tu PIN.',
        });
      }

      const token = jwt.sign({ id: existingPerfil.id, rol: existingPerfil.rol }, JWT_SECRET, { expiresIn: '30d' });
      return res.status(200).json({
        success: true,
        data: {
          token,
          user: {
            id: existingPerfil.id,
            dni: existingPerfil.numero_documento,
            nombres: existingPerfil.nombres,
            apellido_paterno: existingPerfil.apellido_paterno,
            apellido_materno: existingPerfil.apellido_materno,
            sexo: existingPerfil.sexo,
            telefono: existingPerfil.telefono,
            direccion: existingPerfil.direccion,
            idioma_preferido: existingPerfil.idioma_preferido,
            rol: existingPerfil.rol,
            foto_url: existingPerfil.foto_url,
            foto_base64: existingPerfil.foto_base64,
            acepta_terminos: existingPerfil.acepta_terminos,
            acepta_tratamiento_datos: existingPerfil.acepta_tratamiento_datos,
            fecha_nacimiento: existingPerfil.fecha_nacimiento,
          },
        },
      });
    }

    // Hash the PIN/Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(pin, salt);

    // Default dates
    const birthYear = new Date().getFullYear() - (parseInt(edad) || 25);
    const fecha_nacimiento = new Date(birthYear, 0, 1);

    // Create auth_users, perfiles and gestante/personal_salud in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create auth_user
      const authUser = await tx.auth_users.create({
        data: {
          encrypted_password: hashedPassword,
        }
      });

      // Create perfil linked to auth_user with ALL fields
      const perfil = await tx.perfiles.create({
        data: {
          id: authUser.id,
          numero_documento: dni,
          nombres: nombres,
          apellido_paterno: apellido_paterno || '',
          apellido_materno: apellido_materno || null,
          tipo_documento: 'DNI',
          fecha_nacimiento: fecha_nacimiento,
          sexo: sexo || 'NO_ESPECIFICA',
          telefono: telefono || null,
          direccion: direccion || null,
          idioma_preferido: idioma_preferido || 'ESPANOL',
          rol: rol || 'GESTANTE',
          acepta_terminos: acepta_terminos === true,
          acepta_tratamiento_datos: acepta_tratamiento_datos === true,
          fecha_aceptacion_datos: (acepta_terminos && acepta_tratamiento_datos) ? new Date() : null,
          foto_base64: foto_base64 || null,
        }
      });

      if (perfil.rol === 'GESTANTE') {
        const gestante = await tx.gestantes.create({
          data: {
            perfil_id: perfil.id,
            comunidad_id: comunidad_id || null,
            establecimiento_id: establecimiento_id && establecimiento_id !== 'custom' ? establecimiento_id : null,
          }
        });

        if (fum) {
          const fechaUltimaMenstruacion = new Date(fum);
          if (!Number.isNaN(fechaUltimaMenstruacion.getTime())) {
            const fechaProbableParto = new Date(fechaUltimaMenstruacion);
            fechaProbableParto.setDate(fechaProbableParto.getDate() + 280);

            await tx.embarazos.create({
              data: {
                gestante_id: gestante.id,
                establecimiento_id: establecimiento_id && establecimiento_id !== 'custom' ? establecimiento_id : null,
                fecha_ultima_menstruacion: fechaUltimaMenstruacion,
                fecha_probable_parto: fechaProbableParto,
                fecha_inicio_seguimiento: new Date(),
                estado: 'ACTIVO'
              }
            });
          }
        }
      } else if (perfil.rol === 'PERSONAL_SALUD') {
        if (establecimiento_id && establecimiento_id !== 'custom') {
          await tx.personal_salud.create({
            data: {
              perfil_id: perfil.id,
              establecimiento_id: establecimiento_id,
              tipo_personal: 'MEDICO',
            }
          });
        }
      }

      return perfil;
    });

    // Generate JWT
    const token = jwt.sign({ id: result.id, rol: result.rol }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: result.id,
          dni: result.numero_documento,
          nombres: result.nombres,
          apellido_paterno: result.apellido_paterno,
          apellido_materno: result.apellido_materno,
          sexo: result.sexo,
          telefono: result.telefono,
          direccion: result.direccion,
          idioma_preferido: result.idioma_preferido,
          rol: result.rol,
          foto_url: result.foto_url,
          foto_base64: result.foto_base64,
          acepta_terminos: result.acepta_terminos,
          acepta_tratamiento_datos: result.acepta_tratamiento_datos,
          fecha_nacimiento: result.fecha_nacimiento,
        }
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    if (isDatabaseConnectionError(error)) {
      return res.status(503).json({
        success: false,
        code: 'DB_UNAVAILABLE',
        message: 'La base de datos no está disponible. Intenta de nuevo en unos minutos.',
      });
    }
    res.status(500).json({ success: false, message: 'Error en el registro del usuario' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { dni, pin } = req.body;

    if (!dni || !pin) {
      return res.status(400).json({ success: false, message: 'DNI y PIN son requeridos' });
    }

    const perfil = await prisma.perfiles.findUnique({
      where: { numero_documento: dni },
      include: {
        auth_users: true,
        gestantes: {
          include: {
            establecimientos_salud: true,
            embarazos: {
              where: { estado: 'ACTIVO' },
              orderBy: { created_at: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    if (!perfil || !perfil.auth_users?.encrypted_password) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    const isMatch = await bcrypt.compare(pin, perfil.auth_users.encrypted_password);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    // Update last sign in
    await prisma.auth_users.update({
      where: { id: perfil.id },
      data: { last_sign_in_at: new Date() }
    });

    const token = jwt.sign({ id: perfil.id, rol: perfil.rol }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: perfil.id,
          dni: perfil.numero_documento,
          nombres: perfil.nombres,
          apellido_paterno: perfil.apellido_paterno,
          apellido_materno: perfil.apellido_materno,
          sexo: perfil.sexo,
          telefono: perfil.telefono,
          direccion: perfil.direccion,
          idioma_preferido: perfil.idioma_preferido,
          rol: perfil.rol,
          foto_url: perfil.foto_url,
          foto_base64: perfil.foto_base64,
          fecha_nacimiento: perfil.fecha_nacimiento,
          comunidad_id: perfil.gestantes?.comunidad_id || null,
          establecimiento_id: perfil.gestantes?.establecimiento_id || null,
          centro_salud: perfil.gestantes?.establecimientos_salud?.nombre || null,
          fum: perfil.gestantes?.embarazos?.[0]?.fecha_ultima_menstruacion || null,
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    if (isDatabaseConnectionError(error)) {
      return res.status(503).json({
        success: false,
        code: 'DB_UNAVAILABLE',
        message: 'La base de datos no está disponible. Intenta de nuevo en unos minutos.',
      });
    }
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

export const changePin = async (req: AuthRequest, res: Response) => {
  try {
    const { newPin } = req.body;
    const userId = req.user?.id;

    if (!newPin || newPin.length !== 4) {
      return res.status(400).json({ success: false, message: 'El PIN debe ser de 4 dígitos' });
    }

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPin, salt);

    await prisma.auth_users.update({
      where: { id: userId },
      data: { encrypted_password: hashedPassword }
    });

    res.json({ success: true, message: 'PIN actualizado correctamente' });

  } catch (error) {
    console.error('Change PIN error:', error);
    if (isDatabaseConnectionError(error)) {
      return res.status(503).json({
        success: false,
        code: 'DB_UNAVAILABLE',
        message: 'La base de datos no está disponible. Intenta de nuevo en unos minutos.',
      });
    }
    res.status(500).json({ success: false, message: 'Error al cambiar el PIN' });
  }
};
