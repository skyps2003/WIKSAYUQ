# WIKSAYUQ
> Tu embarazo, nuestro acompañamiento.

Aplicación móvil para el seguimiento prenatal de gestantes en zonas altoandinas del Perú.

## Arquitectura

```
┌─────────────────────┐       ┌──────────────────────┐       ┌──────────────┐
│  App Móvil (Expo)   │ ──►   │  Backend Express     │ ──►   │  Supabase    │
│  (tu celular /      │ HTTP  │  (tu PC local)       │ SQL   │  (cloud DB)  │
│   emulador)         │       │  localhost:3000       │       │  PostgreSQL  │
└─────────────────────┘       └──────────────────────┘       └──────────────┘
```

- **Backend** → se ejecuta **localmente** en tu PC con Node.js
- **Base de datos** → **Supabase cloud** (PostgreSQL remoto)
- **App** → Expo (React Native), se conecta al backend de tu PC vía WiFi

## Requisitos Previos

- Node.js v20.x
- Expo Go en tu celular, o un emulador Android/iOS
- Tu PC y tu celular conectados a la **misma red WiFi**

## Instalación y Ejecución

### 1. Backend (en tu PC)

```bash
cd backend
npm install
cp .env.example .env
```

Edita `backend/.env` y completa los datos reales de tu base de datos Supabase (o usa los que ya tienes).

Luego inicia el servidor:

```bash
npm run dev
```

Deberías ver: `[server]: Server is running at http://0.0.0.0:3000`

### 2. Frontend (en tu PC)

```bash
cd frontend
npm install
cp .env.example .env
```

### 3. Dónde cambiar la IP del Backend

Abre `frontend/.env` y edita `EXPO_PUBLIC_API_URL` con la IP **local de tu PC**:

```env
EXPO_PUBLIC_API_URL=http://192.168.18.50:3000/api
```

**¿Cómo saber tu IP local?**
- **Windows:** Abre PowerShell y ejecuta `ipconfig`. Busca la dirección IPv4 (ej: `192.168.x.x`).
- **macOS/Linux:** Ejecuta `ifconfig` o `ip a`.

Reemplaza `192.168.18.50` por la IP que obtuviste.

> **Importante:** Si usas un emulador Android, puedes usar `http://10.0.2.2:3000/api` (el emulador mapea `10.0.2.2` a tu `localhost`).  
> Para iOS simulator, usa `http://localhost:3000/api`.

### 4. Ejecutar la App

```bash
npx expo start
```

Escanea el QR con Expo Go (Android) o la cámara (iOS).

## Build APK (EAS)

```bash
cd frontend
npx eas build --profile preview --platform android
```

El APK generado apuntará a la IP configurada en `frontend/eas.json`.  
**Importante:** Para que funcione en otro dispositivo, ambos deben estar en la misma red WiFi y el backend debe estar corriendo.

## Archivos Clave

| Archivo | Qué hace |
|---|---|
| `frontend/.env` | IP del backend para desarrollo local |
| `frontend/eas.json` | IP del backend para builds EAS (APK) |
| `frontend/src/config/api.ts` | Lógica de selección de URL |
| `backend/.env` | Conexión a Supabase y JWT secrets |
| `backend/.env.example` | Template para configurar el backend |

## Documentación Académica

- Informe técnico: `docs/informe/INFORME_TECNICO_WIKSAYUQ.pdf`
- Artículo científico: `docs/articulo/ARTICULO_CIENTIFICO_WIKSAYUQ_IEEE.pdf`
- Matriz de entrega: `docs/entrega/MATRIZ_CUMPLIMIENTO_ENTREGA.md`
- Declaración de uso académico: `ACADEMIC_USE.md`

> **Advertencia de salud:** Este sistema es un prototipo académico y no reemplaza la evaluación, diagnóstico o recomendación de un profesional de la salud. Para demostraciones deben utilizarse únicamente datos ficticios o anonimizados.

## Solución de Problemas

- **"Network request failed":** Verifica que el backend esté corriendo (`npm run dev` en `backend/`) y que la IP en `frontend/.env` sea correcta.
- **El celular no encuentra el servidor:** Asegúrate de estar en la misma red WiFi. Prueba hacer ping a la IP de tu PC desde el celular.
- **CORS error:** Revisa que `CORS_ORIGINS` en `backend/.env` incluya la IP de tu celular.
- **Puerto bloqueado:** Asegúrate de que el puerto 3000 no esté siendo usado por otro programa.
