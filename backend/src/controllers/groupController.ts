import { Request, Response } from 'express';
import { Group } from '../models/group';
import { Word } from '../models/word';
import { Types } from 'mongoose';

/**
 * GET /api/groups
 * Retrieves all groups with basic summary info.
 */
export const getGroups = async (req: Request, res: Response) => {
  try {
    // Return groups sorted alphabetically, including count of words
    const groups = await Group.find().sort({ name: 1 });
    
    // Format list to include count of words in each group
    const formatted = groups.map(g => ({
      _id: g._id,
      name: g.name,
      description: g.description,
      wordCount: g.wordIds.length,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ message: 'Server error while fetching groups.' });
  }
};

/**
 * GET /api/groups/:id
 * Fetches details of a single group, including populated words.
 */
export const getGroupById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid group ID format.' });
    }

    const group = await Group.findById(id).populate({
      path: 'wordIds',
      select: 'english telugu japanese romaji isFavorite notes'
    });

    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    res.json(group);
  } catch (error) {
    console.error('Error fetching group details:', error);
    res.status(500).json({ message: 'Server error while fetching group details.' });
  }
};

/**
 * POST /api/groups
 * Creates a new group. Synchronizes the wordIds references.
 */
export const createGroup = async (req: Request, res: Response) => {
  try {
    const { name, description, wordIds } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Group name is required.' });
    }

    // Check duplicate group name
    const existing = await Group.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({ message: 'Group with this name already exists.' });
    }

    const group = new Group({
      name: name.trim(),
      description: description || '',
      wordIds: Array.isArray(wordIds) ? wordIds.map(id => new Types.ObjectId(id)) : []
    });

    await group.save();

    // Synchronize Group ID into referenced Words' groupIds
    if (group.wordIds.length > 0) {
      await Word.updateMany(
        { _id: { $in: group.wordIds } },
        { $addToSet: { groupIds: group._id } }
      );
    }

    res.status(201).json(group);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ message: 'Server error while creating group.' });
  }
};

/**
 * PUT /api/groups/:id
 * Updates group properties and synchronizes membership changes.
 */
export const updateGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, wordIds } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid group ID format.' });
    }

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    // Check duplicate name on rename
    if (name && name.trim() !== group.name) {
      const existing = await Group.findOne({ name: name.trim() });
      if (existing) {
        return res.status(409).json({ message: 'Group with this name already exists.' });
      }
      group.name = name.trim();
    }

    if (description !== undefined) {
      group.description = description;
    }

    const oldWords = group.wordIds.map(w => w.toString());

    if (wordIds !== undefined && Array.isArray(wordIds)) {
      group.wordIds = wordIds.map(wid => new Types.ObjectId(wid));
    }

    await group.save();

    const newWords = group.wordIds.map(w => w.toString());

    // Reconcile Word references
    const wordsToRemove = oldWords.filter(w => !newWords.includes(w));
    const wordsToAdd = newWords.filter(w => !oldWords.includes(w));

    if (wordsToRemove.length > 0) {
      await Word.updateMany(
        { _id: { $in: wordsToRemove } },
        { $pull: { groupIds: group._id } }
      );
    }

    if (wordsToAdd.length > 0) {
      await Word.updateMany(
        { _id: { $in: wordsToAdd } },
        { $addToSet: { groupIds: group._id } }
      );
    }

    res.json(group);
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ message: 'Server error while updating group.' });
  }
};

/**
 * DELETE /api/groups/:id
 * Deletes a group. Removes group references from words first.
 */
export const deleteGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid group ID format.' });
    }

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    // Remove group reference from all words
    await Word.updateMany(
      { groupIds: group._id },
      { $pull: { groupIds: group._id } }
    );

    // Delete group
    await Group.deleteOne({ _id: group._id });

    res.json({ message: 'Group deleted successfully.' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ message: 'Server error while deleting group.' });
  }
};
