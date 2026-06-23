"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHistory = void 0;
const searchHistory_1 = require("../models/searchHistory");
/**
 * GET /api/history
 * Fetches the recent searches sorted by timestamp.
 */
const getHistory = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        // Retrieve searches, excluding internal 'related:' queries if wanted
        // We can filter out related search entries or return them all
        const history = await searchHistory_1.SearchHistory.find({ query: { $not: /^related:/ } })
            .sort({ searchedAt: -1 })
            .limit(limit);
        res.json(history);
    }
    catch (error) {
        console.error('Error fetching search history:', error);
        res.status(500).json({ message: 'Server error while fetching search history.' });
    }
};
exports.getHistory = getHistory;
