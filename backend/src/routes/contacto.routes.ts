import { Router } from 'express';
import { getContactos, createContacto, deleteContacto, setPrincipal } from '../controllers/contacto.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

router.get('/', getContactos);
router.post('/', createContacto);
router.delete('/:id', deleteContacto);
router.put('/:id/principal', setPrincipal);

export default router;
