import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';

dotenv.config();

const app: Application = express();

// Security Middlewares
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGINS || '*' }));
app.use(express.json({ limit: '8mb' })); // Para aceptar Base64 grandes según MAX_BASE64_IMAGE_MB
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Límite de 100 peticiones por IP por ventana
  message: 'Demasiadas peticiones desde esta IP, por favor intenta de nuevo más tarde.',
});
app.use('/api/', limiter);

// Basic Health Endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'WIKSAYUQ API funcionando',
    database: 'connected', // Mapear más adelante a una verificación real de DB
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
app.use('/api/auth', authRoutes);
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

// Error Handler Global (por implementar detalle)
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Error interno del servidor', errors: [err.message] });
});

export default app;
