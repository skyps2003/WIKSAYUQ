import { Router } from 'express';
import { register, login, changePin } from '../controllers/auth.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/change-pin', protect, changePin);

export default router;
