import { Router } from 'express';
import { getWords, getWordById, createWord, updateWord, deleteWord } from '../controllers/wordController';

const router = Router();

router.get('/', getWords);
router.get('/:id', getWordById);
router.post('/', createWord);
router.put('/:id', updateWord);
router.delete('/:id', deleteWord);

export default router;
