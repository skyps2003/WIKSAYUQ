import { Router } from 'express';
import { getMe, getAsignadas, getById } from '../controllers/gestantes.controller';
import { authenticate, authorizeRoles } from '../middlewares/auth';

const router = Router();

router.get('/me', authenticate, authorizeRoles('GESTANTE'), getMe);
router.get('/asignadas', authenticate, authorizeRoles('PERSONAL_SALUD'), getAsignadas);
router.get('/:id', authenticate, authorizeRoles('PERSONAL_SALUD', 'ADMINISTRADOR'), getById);

export default router;
