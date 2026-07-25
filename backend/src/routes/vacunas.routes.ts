import { Router } from 'express';
import { getVacunasList, getMisVacunas, addMisVacunas } from '../controllers/vacunas.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

router.get('/', getVacunasList);
router.get('/list', getVacunasList);
router.get('/mis-vacunas', getMisVacunas);
router.post('/mis-vacunas', addMisVacunas);

export default router;
