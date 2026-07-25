import { Router } from 'express';
import { getReniecData } from '../controllers/reniec.controller';

const router = Router();

router.get('/:dni', getReniecData);

export default router;
