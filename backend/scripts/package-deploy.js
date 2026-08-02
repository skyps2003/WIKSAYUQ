/**
 * package-deploy.js
 * Crea un ZIP listo para subir a Banahosting.
 *
 * En este monorepo, node_modules está en la raíz del workspace,
 * así que instalamos solo dependencias de producción en staging.
 *
 * Uso: node scripts/package-deploy.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'deploy');
const STAGING = path.join(OUT, 'staging');
const ZIP_NAME = `wiksayuq-backend-${new Date().toISOString().slice(0, 10)}.zip`;
const ZIP_PATH = path.join(OUT, ZIP_NAME);

// Verificar que dist/ existe
if (!fs.existsSync(path.join(ROOT, 'dist'))) {
  console.error('❌ La carpeta dist/ no existe. Ejecuta "npm run build" primero.');
  process.exit(1);
}

// Limpiar deploy anterior
if (fs.existsSync(OUT)) {
  fs.rmSync(OUT, { recursive: true });
}
fs.mkdirSync(STAGING, { recursive: true });

console.log('📦 Preparando paquete de deploy...\n');

// 1. Copiar dist/ (sin dist/src/ duplicado)
console.log('   → Copiando dist/...');
copyDirSync(path.join(ROOT, 'dist'), path.join(STAGING, 'dist'), ['src']);

// 2. Copiar prisma/schema.prisma
console.log('   → Copiando prisma/schema.prisma...');
fs.mkdirSync(path.join(STAGING, 'prisma'), { recursive: true });
fs.copyFileSync(
  path.join(ROOT, 'prisma', 'schema.prisma'),
  path.join(STAGING, 'prisma', 'schema.prisma'),
);

// 3. Copiar package.json y package-lock.json
console.log('   → Copiando package.json...');
fs.copyFileSync(path.join(ROOT, 'package.json'), path.join(STAGING, 'package.json'));
if (fs.existsSync(path.join(ROOT, 'package-lock.json'))) {
  fs.copyFileSync(path.join(ROOT, 'package-lock.json'), path.join(STAGING, 'package-lock.json'));
}

// 4. Instalar solo dependencias de producción
console.log('   → Instalando dependencias de producción (esto toma ~1 min)...');
execSync('npm install --omit=dev --ignore-scripts', {
  cwd: STAGING,
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production' },
});

// 5. Generar Prisma Client con binarios Linux
console.log('   → Generando Prisma Client (con binarios Linux)...');
execSync('npx prisma generate', {
  cwd: STAGING,
  stdio: 'inherit',
});

// 6. Crear ZIP usando System.IO.Compression (más rápido que Compress-Archive)
console.log('   → Comprimiendo con .NET ZipFile...');
if (fs.existsSync(ZIP_PATH)) fs.unlinkSync(ZIP_PATH);

const psScript = `
Add-Type -AssemblyName System.IO.Compression.FileSystem;
[System.IO.Compression.ZipFile]::CreateFromDirectory(
  '${STAGING.replace(/\\/g, '\\\\')}',
  '${ZIP_PATH.replace(/\\/g, '\\\\')}',
  [System.IO.Compression.CompressionLevel]::Fastest,
  $false
)
`;
execSync(`powershell -Command "${psScript.replace(/\n/g, ' ')}"`, { cwd: ROOT, stdio: 'inherit' });

// Limpiar staging
console.log('   → Limpiando staging...');
fs.rmSync(STAGING, { recursive: true });

const stats = fs.statSync(ZIP_PATH);
const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);

console.log(`\n✅ Paquete creado: ${ZIP_NAME} (${sizeMB} MB)`);
console.log(`   Ruta: ${ZIP_PATH}`);
console.log('\n📋 Pasos para desplegar en Banahosting:');
console.log('   1. Sube el ZIP al File Manager de Banahosting');
console.log('   2. Extrae el ZIP en la carpeta del backend');
console.log('   3. Verifica que el .env en el servidor tenga DATABASE_URL correcto');
console.log('   4. Reinicia Node.js desde el panel de Banahosting');
console.log('   5. Verifica: https://wiksayuq.rimaqmasi.com/api/health');

/**
 * Recursively copy a directory, optionally skipping subdirectory names.
 */
function copyDirSync(src, dest, skipDirs = []) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      if (skipDirs.includes(entry.name)) continue;
      copyDirSync(srcPath, destPath, skipDirs);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
