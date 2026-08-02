import { PrismaClient, tipo_establecimiento, tipo_personal_salud, rol_usuario } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create a default Health Center (Posta)
  const posta = await prisma.establecimientos_salud.create({
    data: {
      nombre: 'Posta de Salud Abancay',
      tipo: tipo_establecimiento.PUESTO_SALUD,
      categoria: 'I-2',
      direccion: 'Av. Principal S/N, Abancay',
    },
  });
  console.log(`✅ Creada la Posta de Salud: ${posta.nombre} (ID: ${posta.id})`);

  // 2. Create a default Health Professional (Obstetra)
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('1234', salt); // PIN 1234 para login

  // Use transaction to ensure both auth user and profile are created together
  const obstetra = await prisma.$transaction(async (tx) => {
    const authUser = await tx.auth_users.create({
      data: {
        encrypted_password: hashedPassword,
      }
    });

    const perfil = await tx.perfiles.create({
      data: {
        id: authUser.id,
        numero_documento: '12345678', // DNI de prueba
        nombres: 'María',
        apellido_paterno: 'Obstetra',
        rol: rol_usuario.PERSONAL_SALUD,
        telefono: '999999999',
        acepta_terminos: true,
      }
    });

    await tx.personal_salud.create({
      data: {
        perfil_id: perfil.id,
        establecimiento_id: posta.id,
        tipo_personal: tipo_personal_salud.OBSTETRA,
      }
    });

    return perfil;
  });

  console.log(`✅ Creado usuario Personal de Salud de prueba:`);
  console.log(`   DNI: 12345678`);
  console.log(`   PIN/Contraseña: 1234`);
  console.log(`   Posta asignada: ${posta.nombre}`);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
