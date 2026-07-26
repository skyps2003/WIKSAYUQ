# WIKSAYUQ
> Tu embarazo, nuestro acompañamiento.

Proyecto de aplicación móvil para el seguimiento prenatal de gestantes en zonas altoandinas del Perú.

## Arquitectura del Proyecto

El proyecto está dividido en dos partes principales:
- **Backend y Base de Datos:** Alojados en la nube. La API RESTful (Node.js, Express, TypeScript, Prisma) y la base de datos PostgreSQL ya están desplegados y funcionando remotamente.
- **Frontend (Mobile App):** Aplicación móvil construida con React Native y Expo, que se conecta a la API en la nube y soporta funcionalidad offline-first mediante SQLite.

## Requisitos Previos
- Node.js v18+
- Aplicación [Expo Go](https://expo.dev/client) instalada en tu dispositivo físico (Android/iOS) o un emulador correctamente configurado.

## Instrucciones de Instalación y Ejecución

Dado que el **backend y la base de datos se encuentran en la nube**, solo necesitas instalar y ejecutar el entorno frontend para probar la aplicación.

### 1. Configuración del Frontend

Abre una terminal y navega a la carpeta del frontend:
```bash
cd frontend
```

Instala las dependencias del proyecto:
```bash
npm install
```

Crea tu archivo de variables de entorno:
```bash
cp .env.example .env
```
*(Nota: Si usas Windows, puedes simplemente copiar y pegar el archivo `.env.example` y renombrarlo a `.env`)*

Abre el archivo `.env` recién creado y asegúrate de que la variable `EXPO_PUBLIC_API_URL` esté apuntando a la URL del backend en la nube.
Ejemplo:
```env
EXPO_PUBLIC_API_URL=https://api.tu-dominio-en-la-nube.com/api
```

### 2. Ejecutar la Aplicación

Inicia el servidor de desarrollo de Expo:
```bash
npx expo start
```

Una vez que se inicie el servidor, verás un código QR en tu terminal:
- **Dispositivo físico:** Escanea el código QR usando la app Expo Go (en Android) o la aplicación de Cámara (en iOS).
- **Emuladores:** Presiona `a` en la terminal para abrir el Android Emulator o `i` para abrir el iOS Simulator.

## Solución de Problemas

- **La app no conecta al backend o no carga datos:** Verifica que tu dispositivo móvil tenga conexión a internet y que la URL definida en `EXPO_PUBLIC_API_URL` sea correcta.
- **Problemas al instalar dependencias:** Asegúrate de estar usando una versión reciente de Node.js (v18 o superior). Puedes borrar la carpeta `node_modules` y ejecutar `npm install` nuevamente.
- **Los cambios en el `.env` no se reflejan:** Si cambiaste la URL del backend, reinicia el servidor de Expo limpiando la caché ejecutando: `npx expo start -c`.
