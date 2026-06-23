import { Router } from 'express';
import { addFavorite, removeFavorite } from '../controllers/wordController';

const router = Router();

router.post('/:id', addFavorite);
router.delete('/:id', removeFavorite);

export default router;
