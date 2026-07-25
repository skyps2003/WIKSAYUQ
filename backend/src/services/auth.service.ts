import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || '';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET or JWT_ACCESS_SECRET must be configured');
}

export class AuthService {
  async register(data: any) {
    const existingUser = await prisma.perfiles.findUnique({
      where: { numero_documento: data.dni }
    });

    if (existingUser) {
      throw new Error('El DNI ya está registrado.');
    }

    const hashedPassword = await bcrypt.hash(data.pin, 10);

    const birthYear = new Date().getFullYear() - (parseInt(data.edad) || 25);
    const fecha_nacimiento = new Date(birthYear, 0, 1);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.auth_users.create({
        data: {
          encrypted_password: hashedPassword,
          created_at: new Date(),
          updated_at: new Date(),
        }
      });

      const perfil = await tx.perfiles.create({
        data: {
          id: user.id,
          numero_documento: data.dni,
          nombres: data.nombres,
          apellido_paterno: data.apellido_paterno || '',
          apellido_materno: data.apellido_materno || null,
          tipo_documento: 'DNI',
          fecha_nacimiento: fecha_nacimiento,
          sexo: data.sexo || 'NO_ESPECIFICA',
          telefono: data.telefono || null,
          direccion: data.direccion || null,
          idioma_preferido: data.idioma_preferido || 'ESPANOL',
          rol: data.rol || 'GESTANTE',
          acepta_terminos: data.acepta_terminos === true,
          acepta_tratamiento_datos: data.acepta_tratamiento_datos === true,
          fecha_aceptacion_datos: (data.acepta_terminos && data.acepta_tratamiento_datos) ? new Date() : null,
          foto_base64: data.foto_base64 || null,
        }
      });

      if (perfil.rol === 'GESTANTE') {
        await tx.gestantes.create({
          data: {
            perfil_id: perfil.id,
            comunidad_id: data.comunidad_id || null,
            establecimiento_id: data.establecimiento_id || null,
          }
        });
      } else if (perfil.rol === 'PERSONAL_SALUD') {
        if (data.establecimiento_id) {
          await tx.personal_salud.create({
            data: {
              perfil_id: perfil.id,
              establecimiento_id: data.establecimiento_id,
              tipo_personal: 'MEDICO',
            }
          });
        }
      }

      return perfil;
    });

    return this.generateToken(result);
  }

  async login(data: any) {
    const perfil = await prisma.perfiles.findUnique({
      where: { numero_documento: data.dni },
      include: { auth_users: true, gestantes: true }
    });

    if (!perfil || !perfil.auth_users?.encrypted_password) {
      throw new Error('Credenciales inválidas');
    }

    const isMatch = await bcrypt.compare(data.pin, perfil.auth_users.encrypted_password);
    if (!isMatch) {
      throw new Error('Credenciales inválidas');
    }

    await prisma.auth_users.update({
      where: { id: perfil.id },
      data: { last_sign_in_at: new Date() }
    });

    return this.generateToken(perfil);
  }

  private generateToken(perfil: any) {
    const payload = {
      id: perfil.id,
      rol: perfil.rol,
      nombres: perfil.nombres,
    };

    const token = jwt.sign(
      payload, 
      JWT_SECRET, 
      { expiresIn: '30d' }
    );

    return {
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
      }
    };
  }
}
