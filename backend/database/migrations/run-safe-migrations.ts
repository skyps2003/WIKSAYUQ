import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const runSafeMigrations = async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || connectionString.includes('CAMBIAR_PASSWORD')) {
    console.error('Error: Por favor configura una contraseña válida en DATABASE_URL dentro de .env');
    process.exit(1);
  }

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('Conectado a PostgreSQL para migraciones seguras...');

    const queries = [
      `ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS foto_base64 TEXT;`,
      `ALTER TABLE consejos ADD COLUMN IF NOT EXISTS imagen_base64 TEXT;`,
      `CREATE TABLE IF NOT EXISTS conversaciones (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        gestante_id UUID NOT NULL,
        personal_salud_id UUID NOT NULL,
        activa BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMP NULL,
        version INTEGER NOT NULL DEFAULT 1
      );`,
      `CREATE TABLE IF NOT EXISTS mensajes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversacion_id UUID NOT NULL REFERENCES conversaciones(id),
        remitente_perfil_id UUID NOT NULL,
        contenido TEXT NOT NULL,
        leido BOOLEAN NOT NULL DEFAULT FALSE,
        fecha_lectura TIMESTAMP NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMP NULL,
        version INTEGER NOT NULL DEFAULT 1
      );`,
      `CREATE INDEX IF NOT EXISTS idx_conversaciones_gestante ON conversaciones(gestante_id);`,
      `CREATE INDEX IF NOT EXISTS idx_mensajes_conversacion ON mensajes(conversacion_id);`
    ];

    for (const query of queries) {
      console.log(`Ejecutando: \n${query}`);
      await client.query(query);
    }

    console.log('Migraciones no destructivas ejecutadas con éxito.');
  } catch (error) {
    console.error('Error ejecutando migraciones:', error);
  } finally {
    await client.end();
  }
};

runSafeMigrations();
