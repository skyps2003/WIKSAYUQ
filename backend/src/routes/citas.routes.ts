import { Router } from 'express';
import { getCitas, getProximaCita, createCita } from '../controllers/citas.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

router.get('/', getCitas);
router.get('/proximas', getProximaCita);
router.post('/', createCita);

export default router;
