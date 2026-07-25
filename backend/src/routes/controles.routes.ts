import { Router } from 'express';
import { getControles, createControl } from '../controllers/controles.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);
router.get('/', getControles);
router.post('/', createControl);

export default router;
