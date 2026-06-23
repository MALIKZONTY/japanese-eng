"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.autofill = void 0;
const grokService_1 = require("../services/grokService");
/**
 * POST /api/ai/autofill
 * Body: { query: string }
 * Implements Feature 4 AI auto fill logic.
 */
const autofill = async (req, res) => {
    try {
        const { query } = req.body;
        if (!query || typeof query !== 'string' || !query.trim()) {
            return res.status(400).json({ message: 'Autofill query is required.' });
        }
        const cleanQuery = query.trim();
        const result = await (0, grokService_1.queryGrokAI)(cleanQuery);
        res.json(result);
    }
    catch (error) {
        console.error('Autofill error:', error);
        res.status(500).json({
            message: 'Server error while running AI translation autofill.',
            error: error.message
        });
    }
};
exports.autofill = autofill;
