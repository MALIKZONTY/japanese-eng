import { Request, Response } from 'express';
import { queryGrokAI } from '../services/grokService';

/**
 * POST /api/ai/autofill
 * Body: { query: string }
 * Implements Feature 4 AI auto fill logic.
 */
export const autofill = async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ message: 'Autofill query is required.' });
    }

    const cleanQuery = query.trim();
    const result = await queryGrokAI(cleanQuery);

    res.json(result);
  } catch (error) {
    console.error('Autofill error:', error);
    res.status(500).json({ 
      message: 'Server error while running AI translation autofill.',
      error: (error as Error).message
    });
  }
};
