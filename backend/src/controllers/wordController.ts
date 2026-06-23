import { Request, Response } from 'express';
import { Word } from '../models/word';
import { Group } from '../models/group';
import { Types } from 'mongoose';

/**
 * GET /api/words
 * Returns a list of words with pagination, filtering, and search.
 */
export const getWords = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    // Parse limit, default to 12 if not specified. If explicitly set to 0 or negative, fetch all.
    const limitQuery = req.query.limit !== undefined ? parseInt(req.query.limit as string) : 12;
    const limit = isNaN(limitQuery) ? 12 : limitQuery;
    const skip = (page - 1) * limit;

    const search = req.query.search as string;
    const groupId = req.query.groupId as string;
    const isFavorite = req.query.isFavorite as string;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = req.query.sortOrder as string === 'asc' ? 1 : -1;

    const filter: any = {};

    // Apply search filter if present across english, telugu, japanese, and romaji
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { english: searchRegex },
        { telugu: searchRegex },
        { japanese: searchRegex },
        { romaji: searchRegex }
      ];
    }

    // Apply Group filter
    if (groupId) {
      filter.groupIds = new Types.ObjectId(groupId);
    }

    // Apply Favorite filter
    if (isFavorite === 'true') {
      filter.isFavorite = true;
    }

    const total = await Word.countDocuments(filter);

    const sortObj: any = {};
    sortObj[sortBy] = sortOrder;

    let query = Word.find(filter)
      .populate('groupIds', 'name')
      .sort(sortObj);

    // Apply case-insensitive collation if sorting by text fields
    if (['romaji', 'english', 'japanese', 'telugu'].includes(sortBy)) {
      query = query.collation({ locale: 'en', strength: 2 });
    }

    if (limit > 0) {
      query = query.skip(skip).limit(limit);
    }

    const words = await query;

    res.json({
      words,
      page,
      limit,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 1,
      totalWords: total
    });
  } catch (error) {
    console.error('Error fetching words:', error);
    res.status(500).json({ message: 'Server error while fetching words.' });
  }
};

/**
 * GET /api/words/:id
 * Fetches a single word by its ID, populating details.
 */
export const getWordById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid word ID format.' });
    }

    const word = await Word.findById(id)
      .populate('groupIds', 'name description')
      .populate('relatedWordIds', 'english japanese romaji isFavorite');

    if (!word) {
      return res.status(404).json({ message: 'Word not found.' });
    }

    res.json(word);
  } catch (error) {
    console.error('Error fetching word details:', error);
    res.status(500).json({ message: 'Server error while fetching word details.' });
  }
};

/**
 * POST /api/words
 * Creates a new word. Reconciles group and related word references.
 */
export const createWord = async (req: Request, res: Response) => {
  try {
    const { english, telugu, japanese, romaji, notes, isFavorite, groupIds, relatedWordIds } = req.body;

    if (!english || !japanese || !romaji) {
      return res.status(400).json({ message: 'English, Japanese, and Romaji are required fields.' });
    }

    // Check for duplicate word in local DB (to prevent redundant saves)
    const existing = await Word.findOne({ english: english.trim(), japanese: japanese.trim() });
    if (existing) {
      return res.status(409).json({ message: 'Word already exists in local dictionary.', wordId: existing._id });
    }

    const word = new Word({
      english: english.trim(),
      telugu: telugu ? telugu.trim() : '',
      japanese: japanese.trim(),
      romaji: romaji.trim(),
      notes: notes || '',
      isFavorite: !!isFavorite,
      groupIds: Array.isArray(groupIds) ? groupIds.map(id => new Types.ObjectId(id)) : [],
      relatedWordIds: Array.isArray(relatedWordIds) ? relatedWordIds.map(id => new Types.ObjectId(id)) : []
    });

    await word.save();

    // Reconcile: update referenced Groups
    if (word.groupIds.length > 0) {
      await Group.updateMany(
        { _id: { $in: word.groupIds } },
        { $addToSet: { wordIds: word._id } }
      );
    }

    // Reconcile: update referenced Words to establish bidirectional relationship
    if (word.relatedWordIds.length > 0) {
      await Word.updateMany(
        { _id: { $in: word.relatedWordIds } },
        { $addToSet: { relatedWordIds: word._id } }
      );
    }

    res.status(201).json(word);
  } catch (error) {
    console.error('Error creating word:', error);
    res.status(500).json({ message: 'Server error while creating word.' });
  }
};

/**
 * PUT /api/words/:id
 * Updates an existing word. Reconciles group and related word additions and removals.
 */
export const updateWord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { english, telugu, japanese, romaji, notes, isFavorite, groupIds, relatedWordIds } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid word ID format.' });
    }

    const word = await Word.findById(id);
    if (!word) {
      return res.status(404).json({ message: 'Word not found.' });
    }

    const oldGroups = word.groupIds.map(g => g.toString());
    const oldRelated = word.relatedWordIds.map(w => w.toString());

    // Update field values
    if (english !== undefined) word.english = english.trim();
    if (telugu !== undefined) word.telugu = telugu.trim();
    if (japanese !== undefined) word.japanese = japanese.trim();
    if (romaji !== undefined) word.romaji = romaji.trim();
    if (notes !== undefined) word.notes = notes;
    if (isFavorite !== undefined) word.isFavorite = !!isFavorite;
    
    if (groupIds !== undefined && Array.isArray(groupIds)) {
      word.groupIds = groupIds.map(gid => new Types.ObjectId(gid));
    }
    if (relatedWordIds !== undefined && Array.isArray(relatedWordIds)) {
      word.relatedWordIds = relatedWordIds.map(rwid => new Types.ObjectId(rwid));
    }

    await word.save();

    const newGroups = word.groupIds.map(g => g.toString());
    const newRelated = word.relatedWordIds.map(w => w.toString());

    // Group reconciliation: remove word ID from old groups, add to new groups
    const groupsToRemove = oldGroups.filter(g => !newGroups.includes(g));
    const groupsToAdd = newGroups.filter(g => !oldGroups.includes(g));

    if (groupsToRemove.length > 0) {
      await Group.updateMany(
        { _id: { $in: groupsToRemove } },
        { $pull: { wordIds: word._id } }
      );
    }
    if (groupsToAdd.length > 0) {
      await Group.updateMany(
        { _id: { $in: groupsToAdd } },
        { $addToSet: { wordIds: word._id } }
      );
    }

    // Related Words reconciliation (bidirectional): remove from old related, add to new related
    const relatedToRemove = oldRelated.filter(w => !newRelated.includes(w));
    const relatedToAdd = newRelated.filter(w => !oldRelated.includes(w));

    if (relatedToRemove.length > 0) {
      await Word.updateMany(
        { _id: { $in: relatedToRemove } },
        { $pull: { relatedWordIds: word._id } }
      );
    }
    if (relatedToAdd.length > 0) {
      await Word.updateMany(
        { _id: { $in: relatedToAdd } },
        { $addToSet: { relatedWordIds: word._id } }
      );
    }

    res.json(word);
  } catch (error) {
    console.error('Error updating word:', error);
    res.status(500).json({ message: 'Server error while updating word.' });
  }
};

/**
 * DELETE /api/words/:id
 * Deletes a word. Removes references from groups and related words.
 */
export const deleteWord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid word ID format.' });
    }

    const word = await Word.findById(id);
    if (!word) {
      return res.status(404).json({ message: 'Word not found.' });
    }

    // Remove word ID from all groups referencing it
    await Group.updateMany(
      { wordIds: word._id },
      { $pull: { wordIds: word._id } }
    );

    // Remove word ID from all other words' relatedWordIds
    await Word.updateMany(
      { relatedWordIds: word._id },
      { $pull: { relatedWordIds: word._id } }
    );

    // Delete word
    await Word.deleteOne({ _id: word._id });

    res.json({ message: 'Word deleted successfully.' });
  } catch (error) {
    console.error('Error deleting word:', error);
    res.status(500).json({ message: 'Server error while deleting word.' });
  }
};

/**
 * POST /api/favorites/:id
 * Sets a word as favorite.
 */
export const addFavorite = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid word ID format.' });
    }

    const word = await Word.findByIdAndUpdate(id, { isFavorite: true }, { new: true });
    if (!word) {
      return res.status(404).json({ message: 'Word not found.' });
    }

    res.json(word);
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ message: 'Server error while updating favorite status.' });
  }
};

/**
 * DELETE /api/favorites/:id
 * Removes a word from favorites.
 */
export const removeFavorite = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid word ID format.' });
    }

    const word = await Word.findByIdAndUpdate(id, { isFavorite: false }, { new: true });
    if (!word) {
      return res.status(404).json({ message: 'Word not found.' });
    }

    res.json(word);
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ message: 'Server error while updating favorite status.' });
  }
};
