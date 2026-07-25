import { Router } from 'express';
import { getConversaciones, getMensajes, createMensaje } from '../controllers/conversaciones.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', getConversaciones);
router.get('/:id/mensajes', getMensajes);
router.post('/:id/mensajes', createMensaje);

export default router;
