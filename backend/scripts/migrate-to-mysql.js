const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
const backupPath = path.join(__dirname, '../prisma/schema.postgresql.bak');

// 1. Backup
let schema = fs.readFileSync(schemaPath, 'utf8');
fs.writeFileSync(backupPath, schema);
console.log('✅ Backup creado en prisma/schema.postgresql.bak');

// 2. Reemplazos
schema = schema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "mysql"');
schema = schema.replace(/@default\(dbgenerated\("gen_random_uuid\(\)"\)\)\s*@db\.Uuid/g, '@default(uuid()) @db.Char(36)');
schema = schema.replace(/@db\.Uuid/g, '@db.Char(36)');
schema = schema.replace(/@db\.Timestamp\(6\)/g, '@db.DateTime(6)');
schema = schema.replace(/directUrl\s*=\s*env\("DIRECT_URL"\)/g, ''); // Remove directUrl

// 3. Guardar
fs.writeFileSync(schemaPath, schema);
console.log('✅ Esquema actualizado a MySQL');
