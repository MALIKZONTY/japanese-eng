import { Request, Response } from 'express';
import { SearchHistory } from '../models/searchHistory';

/**
 * GET /api/history
 * Fetches the recent searches sorted by timestamp.
 */
export const getHistory = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Retrieve searches, excluding internal 'related:' queries if wanted
    // We can filter out related search entries or return them all
    const history = await SearchHistory.find({ query: { $not: /^related:/ } })
      .sort({ searchedAt: -1 })
      .limit(limit);
      
    res.json(history);
  } catch (error) {
    console.error('Error fetching search history:', error);
    res.status(500).json({ message: 'Server error while fetching search history.' });
  }
};
