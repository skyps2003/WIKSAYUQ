import { Router } from 'express';
import { getDepartamentos, getProvincias, getDistritos, getComunidades, getCentrosSalud } from '../controllers/ubigeo.controller';

const router = Router();

router.get('/departamentos', getDepartamentos);
router.get('/provincias/:departamento_id', getProvincias);
router.get('/distritos/:provincia_id', getDistritos);
router.get('/comunidades/:distrito_id', getComunidades);
router.get('/centros-salud/:distrito_id', getCentrosSalud);

export default router;
