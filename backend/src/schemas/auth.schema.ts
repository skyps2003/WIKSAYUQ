import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    dni: z.string().min(8, 'DNI debe tener al menos 8 dígitos'),
    pin: z.string().min(4, 'El PIN debe tener al menos 4 dígitos'),
    nombres: z.string().min(2, 'Requerido'),
    edad: z.string().optional(),
    rol: z.enum(['GESTANTE', 'PERSONAL_SALUD']).default('GESTANTE'),
    comunidad_id: z.string().uuid().optional().nullable(),
    establecimiento_id: z.string().uuid().optional().nullable(),
    apellido_paterno: z.string().optional(),
    apellido_materno: z.string().optional().nullable(),
    sexo: z.enum(['MASCULINO', 'FEMENINO', 'NO_ESPECIFICA']).optional(),
    telefono: z.string().optional().nullable(),
    direccion: z.string().optional().nullable(),
    foto_base64: z.string().optional().nullable(),
    idioma_preferido: z.enum(['ESPANOL', 'QUECHUA']).default('ESPANOL'),
    acepta_terminos: z.boolean().refine(val => val === true, {
      message: 'Debe aceptar los términos',
    }),
    acepta_tratamiento_datos: z.boolean().refine(val => val === true, {
      message: 'Debe aceptar el tratamiento de datos',
    }),
    fum: z.string().optional().nullable(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    dni: z.string().min(8, 'DNI inválido'),
    pin: z.string().min(4, 'PIN requerido'),
  }),
});
