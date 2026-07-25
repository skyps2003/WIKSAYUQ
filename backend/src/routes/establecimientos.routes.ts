import { Router } from 'express';
import { getEstablecimientos } from '../controllers/establecimientos.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

router.get('/', getEstablecimientos);

export default router;
