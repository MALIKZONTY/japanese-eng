import { Router } from 'express';
import { getGroups, getGroupById, createGroup, updateGroup, deleteGroup } from '../controllers/groupController';

const router = Router();

router.get('/', getGroups);
router.get('/:id', getGroupById);
router.post('/', createGroup);
router.put('/:id', updateGroup);
router.delete('/:id', deleteGroup);

export default router;
