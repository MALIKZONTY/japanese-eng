import { Request, Response } from 'express';
import { Word } from '../models/word';
import { SearchHistory } from '../models/searchHistory';
import { queryGrokAI } from '../services/grokService';

/**
 * POST /api/search
 * Body: { query: string }
 * Implements Feature 5 search pipeline.
 */
export const search = async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ message: 'Search query is required.' });
    }

    const cleanQuery = query.trim();

    // Feature 11: Store search history
    await SearchHistory.create({
      query: cleanQuery,
      searchType: 'general',
      searchedAt: new Date()
    });

    // Step 1: Search local MongoDB for any partial/substring matches
    const partialRegex = new RegExp(cleanQuery, 'i');
    const localMatches = await Word.find({
      $or: [
        { english: partialRegex },
        { telugu: partialRegex },
        { japanese: partialRegex },
        { romaji: partialRegex }
      ]
    }).populate('groupIds', 'name');

    // Step 2 & 3: If local results exist, sort exact matches to the top and return them
    if (localMatches.length > 0) {
      const queryLower = cleanQuery.toLowerCase();
      localMatches.sort((a, b) => {
        // Check exact match for english
        const aEngExact = a.english.toLowerCase() === queryLower;
        const bEngExact = b.english.toLowerCase() === queryLower;
        if (aEngExact && !bEngExact) return -1;
        if (!aEngExact && bEngExact) return 1;

        // Check exact match for japanese
        const aJapExact = a.japanese.toLowerCase() === queryLower;
        const bJapExact = b.japanese.toLowerCase() === queryLower;
        if (aJapExact && !bJapExact) return -1;
        if (!aJapExact && bJapExact) return 1;

        // Check exact match for romaji
        const aRomExact = a.romaji.toLowerCase() === queryLower;
        const bRomExact = b.romaji.toLowerCase() === queryLower;
        if (aRomExact && !bRomExact) return -1;
        if (!aRomExact && bRomExact) return 1;

        return 0;
      });

      return res.json({
        source: 'local',
        results: localMatches
      });
    }

    // Step 4 & 5: If result does not exist locally, query Grok API
    try {
      const aiResponse = await queryGrokAI(cleanQuery);
      return res.json({
        source: 'ai',
        results: [aiResponse] // Return as array for compatibility
      });
    } catch (aiError) {
      console.error('Grok translation failed:', aiError);
      return res.status(502).json({ 
        message: 'No local match found, and AI translation failed.',
        error: (aiError as Error).message
      });
    }
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error during search.' });
  }
};

/**
 * POST /api/search/related
 * Body: { query: string }
 * Fetches related expressions for a specific word query from AI Cache or Grok.
 */
export const searchRelated = async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ message: 'Query is required to find related expressions.' });
    }

    const cleanQuery = query.trim();

    // Log history for related expression search
    await SearchHistory.create({
      query: `related:${cleanQuery}`,
      searchType: 'related',
      searchedAt: new Date()
    });

    // Use our queryGrokAI service which handles caching automatically
    const aiResponse = await queryGrokAI(cleanQuery);

    res.json({
      query: cleanQuery,
      relatedWords: aiResponse.relatedWords
    });
  } catch (error) {
    console.error('Error fetching related expressions:', error);
    res.status(500).json({ 
      message: 'Server error while fetching related expressions.',
      error: (error as Error).message
    });
  }
};
