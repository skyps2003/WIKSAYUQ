import { Router } from 'express';
import { createSOS } from '../controllers/sos.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.post('/', createSOS);

export default router;
