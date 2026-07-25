# WIKSAYUQ
> Tu embarazo, nuestro acompañamiento.

Proyecto de aplicación móvil para el seguimiento prenatal de gestantes en zonas altoandinas del Perú.

## Estructura del Proyecto

El proyecto está dividido en dos partes principales y funciona como un monorepo (npm workspaces):
- `backend/`: API RESTful construida con Node.js, Express, TypeScript y Prisma (PostgreSQL).
- `frontend/`: Aplicación móvil construida con React Native y Expo, soportando funcionalidad offline-first mediante SQLite.

## Requisitos Previos
- Node.js v18+
- Base de datos PostgreSQL local corriendo en el puerto 5432 con la base `wiksayuq_db`.

## Instrucciones de Ejecución

### 1. Configuración de Base de Datos y Backend

```bash
cd backend
npm install
```
Luego, copia el archivo de entorno de ejemplo:
```bash
cp .env.example .env
```
Abre `.env` y completa `DATABASE_URL` con la contraseña de tu usuario `postgres`.
Ejecuta Prisma para conectar a la base de datos existente y generar el cliente:
```bash
npx prisma db pull
npx prisma generate
```
Inicia el servidor en modo desarrollo:
```bash
npm run dev
```

### 2. Configuración del Frontend

Abre otra terminal:
```bash
cd frontend
npm install
```
Copia el archivo de entorno:
```bash
cp .env.example .env
```
Asegúrate de que `EXPO_PUBLIC_API_URL` apunte a la IP o dominio correcto donde corre el backend.
- Para Android Emulator usa: `http://10.0.2.2:3000/api`
- Para iOS Simulator usa: `http://localhost:3000/api`
- Para un dispositivo físico en tu red WiFi usa: `http://<TU_IP_LOCAL>:3000/api`

Inicia la aplicación en Expo:
```bash
npx expo start
```

## Solución de Problemas

- **Contraseña incorrecta de PostgreSQL**: Asegúrate de actualizar el archivo `.env` en `backend/` y reiniciar el servidor.
- **Puerto 5432 ocupado**: Verifica si hay otra instancia de Postgres corriendo o cambia el puerto en `.env`.
- **Backend no accesible desde emulador o celular físico**: Revisa las IPs en `frontend/.env` y asegúrate de que el firewall de Windows permita conexiones entrantes al puerto 3000.
- **Prisma no conecta**: Revisa que la base de datos `wiksayuq_db` exista.
- **Imagen Base64 demasiado grande**: Hay un límite en `MAX_BASE64_IMAGE_MB=2` en el backend. Imágenes más pesadas serán rechazadas.
# WIKSAYUQ
