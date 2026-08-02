import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';

dotenv.config();

const app: Application = express();
const corsOrigins = process.env.CORS_ORIGINS
  ?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean) ?? [];

// Render terminates TLS at its proxy and forwards the original client address.
app.set('trust proxy', 1);

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    // Browsers require one Access-Control-Allow-Origin value, never a CSV list.
    if (!origin || corsOrigins.length === 0 || corsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
}));
app.use(express.json({ limit: '8mb' })); // Para aceptar Base64 grandes según MAX_BASE64_IMAGE_MB
app.use(express.urlencoded({ extended: true, limit: '8mb' }));
app.use(morgan('dev'));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'RATE_LIMITED',
    message: 'Demasiadas solicitudes. Espera unos minutos e intenta nuevamente.',
  },
  skip: (req) => req.path === '/health',
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => typeof req.body?.dni === 'string' ? req.body.dni : 'missing-dni',
  message: {
    success: false,
    code: 'AUTH_RATE_LIMITED',
    message: 'Demasiados intentos para este DNI. Espera 15 minutos e intenta nuevamente.',
  },
});

import { isDatabaseHealthy } from './config/database';

// Health Endpoint — verifica la conexión real a la base de datos
app.get('/api/health', async (req: Request, res: Response) => {
  const dbOk = await isDatabaseHealthy();
  const status = dbOk ? 200 : 503;
  res.status(status).json({
    success: dbOk,
    message: dbOk ? 'WIKSAYUQ API funcionando' : 'Base de datos no disponible',
    database: dbOk ? 'connected' : 'disconnected',
    version: 'v2-db-check',
    provider: process.env.DATABASE_PROVIDER || 'local',
    timestamp: new Date().toISOString()
  });
});

import authRoutes from './routes/auth.routes';
import gestantesRoutes from './routes/gestantes.routes';
import conversacionesRoutes from './routes/conversaciones.routes';
import citasRoutes from './routes/citas.routes';
import autoevaluacionRoutes from './routes/autoevaluacion.routes';
import sosRoutes from './routes/sos.routes';
import ubigeoRoutes from './routes/ubigeo.routes';
import reniecRoutes from './routes/reniec.routes';
import contactoRoutes from './routes/contacto.routes';
import vacunasRoutes from './routes/vacunas.routes';
import establecimientosRoutes from './routes/establecimientos.routes';
import controlesRoutes from './routes/controles.routes';
import nearbyHealthCentersRoutes from './routes/nearby-health-centers.routes';

// Rutas base
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/gestantes', gestantesRoutes);
app.use('/api/conversaciones', conversacionesRoutes);
app.use('/api/reniec', reniecRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/contactos', contactoRoutes);
app.use('/api/vacunas', vacunasRoutes);
app.use('/api/establecimientos', establecimientosRoutes);
app.use('/api/controles', controlesRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/nearby-health-centers', nearbyHealthCentersRoutes);
app.use('/api/autoevaluacion', autoevaluacionRoutes);
app.use('/api/ubigeo', ubigeoRoutes);

// ...

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada', errors: [] });
});

// Error Handler Global — intercepta errores de conexión a DB para todos los controllers
import { isDatabaseConnectionError } from './config/database';

app.use((err: any, req: Request, res: Response, next: any) => {
  console.error(err.stack);

  // Database unreachable / bad credentials / pool exhausted → 503
  if (isDatabaseConnectionError(err)) {
    return res.status(503).json({
      success: false,
      code: 'DB_UNAVAILABLE',
      message: 'La base de datos no está disponible. Intenta de nuevo en unos minutos.',
    });
  }

  const status = Number(err.status || err.statusCode) || 500;
  const message = status === 413
    ? 'La imagen seleccionada es demasiado grande. Intenta con otra imagen.'
    : 'Error interno del servidor';
  res.status(status).json({ success: false, message, errors: [err.message] });
});

export default app;
