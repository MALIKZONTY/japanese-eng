import { Router } from 'express';
import { autofill } from '../controllers/aiController';

const router = Router();

router.post('/autofill', autofill);

export default router;
