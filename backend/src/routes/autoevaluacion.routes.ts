import { Router } from 'express';
import { createAutoevaluacion } from '../controllers/autoevaluacion.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.post('/', createAutoevaluacion);

export default router;
