const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Borrando TODOS los datos de usuarios de la base de datos...');
  
  try {
    // Al hacer TRUNCATE CASCADE a auth_users, PostgreSQL borra automáticamente
    // todos los registros que dependan de los usuarios (perfiles, gestantes, citas, controles, etc.)
    await prisma.$executeRawUnsafe('TRUNCATE TABLE auth_users CASCADE;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE sync_queue CASCADE;');
    
    console.log('¡Base de datos limpia! Todos los usuarios y sus registros han sido eliminados.');
    console.log('\n=========================================');
    console.log('⚠️ IMPORTANTE: TU CELULAR AÚN TIENE DATOS');
    console.log('Para empezar de cero, debes borrar el almacenamiento/caché de la app');
    console.log('en tu celular o desinstalarla y volverla a instalar.');
    console.log('De lo contrario, la app intentará sincronizar la data vieja.');
    console.log('=========================================');
  } catch (error) {
    console.error('Hubo un error borrando la base de datos:', error);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
