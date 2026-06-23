import { Router } from 'express';
import { search, searchRelated } from '../controllers/searchController';

const router = Router();

router.post('/', search);
router.post('/related', searchRelated);

export default router;
