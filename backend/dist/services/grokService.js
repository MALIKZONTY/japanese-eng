"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryGrokAI = void 0;
const aiCache_1 = require("../models/aiCache");
/**
 * Normalizes query string for caching
 */
const normalizeQuery = (query) => {
    return query.trim().toLowerCase();
};
const detectProvider = (apiKey) => {
    if (apiKey.startsWith('gsk_')) {
        // Groq Cloud API — https://console.groq.com
        console.log('[AI] Using Groq Cloud API (llama-3.3-70b-versatile)');
        return {
            baseUrl: 'https://api.groq.com/openai/v1',
            model: 'llama-3.3-70b-versatile',
            fallbackModel: 'llama3-70b-8192',
            supportsJsonMode: true
        };
    }
    else if (apiKey.startsWith('xai-')) {
        // xAI / Grok API — https://console.x.ai
        console.log('[AI] Using xAI Grok API (grok-2)');
        return {
            baseUrl: 'https://api.x.ai/v1',
            model: 'grok-2',
            fallbackModel: 'grok-beta',
            supportsJsonMode: true
        };
    }
    else if (apiKey.startsWith('sk-')) {
        // OpenAI API
        console.log('[AI] Using OpenAI API (gpt-4o-mini)');
        return {
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-4o-mini',
            fallbackModel: 'gpt-3.5-turbo',
            supportsJsonMode: true
        };
    }
    else {
        // Unknown key format — default to Groq as most common free option
        console.warn('[AI] Unknown API key format. Attempting Groq endpoint as default.');
        return {
            baseUrl: 'https://api.groq.com/openai/v1',
            model: 'llama-3.3-70b-versatile',
            fallbackModel: 'llama3-70b-8192',
            supportsJsonMode: true
        };
    }
};
const buildRequestBody = (model, prompt, supportsJsonMode) => {
    const body = {
        model,
        messages: [
            {
                role: 'system',
                content: 'You are a precise Japanese-English-Telugu translation assistant. You ONLY output valid JSON matching the exact schema the user provides, with no additional text, markdown, or explanation.'
            },
            { role: 'user', content: prompt }
        ],
        temperature: 0.2
    };
    // Add json_object mode only if provider supports it
    if (supportsJsonMode) {
        body.response_format = { type: 'json_object' };
    }
    return body;
};
/**
 * Calls AI API to translate / fetch expressions.
 * Supports Groq (gsk_), xAI/Grok (xai-), and OpenAI (sk-) keys automatically.
 */
const queryGrokAI = async (query) => {
    const normalized = normalizeQuery(query);
    // Feature 12: Check AI Cache first
    const cached = await aiCache_1.AICache.findOne({ query: normalized });
    if (cached) {
        console.log(`[AI] Cache hit for query: "${normalized}"`);
        return cached.response;
    }
    console.log(`[AI] Cache miss. Calling AI API for query: "${normalized}"`);
    const apiKey = process.env.GROK_API_KEY;
    if (!apiKey || !apiKey.trim()) {
        throw new Error('GROK_API_KEY environment variable is not defined in backend/.env');
    }
    const provider = detectProvider(apiKey.trim());
    const prompt = `You are a professional Japanese-English-Telugu language learning assistant.
Translate the search query '${query}' (which could be in English, Japanese, Telugu, or Romaji) into Japanese vocabulary.
Provide:
- English: the standard English word/phrase
- Telugu: the Telugu translation (in Telugu script)
- Japanese: the Japanese writing (Kanji/Kana/Hiragana/Katakana as most appropriate). It must NEVER be an empty string. Even for simple words like "hi", output the correct Japanese characters (e.g., "こんにちは").
- Romaji: the standard romanized pronunciation
- Notes: short usage context, politeness level, or example sentence
- RelatedWords: 2 to 4 related Japanese expressions (each with English, Japanese, Romaji). Make sure the "japanese" field for each related word is also filled with actual Japanese writing.

Return ONLY a valid JSON object with this exact structure, no markdown, no explanation, no extra fields:
{
  "english": "...",
  "telugu": "...",
  "japanese": "...",
  "romaji": "...",
  "notes": "...",
  "relatedWords": [
    { "english": "...", "japanese": "...", "romaji": "..." }
  ]
}`;
    const makeRequest = async (model) => {
        const url = `${provider.baseUrl}/chat/completions`;
        console.log(`[AI] POST ${url} model=${model}`);
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey.trim()}`
            },
            body: JSON.stringify(buildRequestBody(model, prompt, provider.supportsJsonMode))
        });
        return response;
    };
    try {
        let response = await makeRequest(provider.model);
        // If primary model fails, try the fallback
        if (!response.ok && provider.fallbackModel) {
            const errorText = await response.text();
            console.warn(`[AI] Primary model "${provider.model}" failed (${response.status}): ${errorText}`);
            console.log(`[AI] Retrying with fallback model: ${provider.fallbackModel}`);
            response = await makeRequest(provider.fallbackModel);
        }
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`[AI] All models failed. Status: ${response.status}`, errorBody);
            throw new Error(`AI API returned status ${response.status}: ${errorBody}`);
        }
        return await handleAIResponse(normalized, response);
    }
    catch (error) {
        console.error('[AI] Request failed:', error);
        throw error;
    }
};
exports.queryGrokAI = queryGrokAI;
/**
 * Parses, validates, and caches the AI JSON response.
 */
async function handleAIResponse(normalizedQuery, response) {
    const data = (await response.json());
    const rawText = data.choices?.[0]?.message?.content || '';
    if (!rawText) {
        throw new Error('Received empty message content from AI API');
    }
    // Parse JSON — strip markdown code fences if the model ignores instructions
    let parsed;
    try {
        let cleanedText = rawText.trim();
        if (cleanedText.startsWith('```')) {
            cleanedText = cleanedText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/m, '').trim();
        }
        parsed = JSON.parse(cleanedText);
    }
    catch (e) {
        console.error('[AI] Failed to parse JSON response:', rawText);
        throw new Error(`AI returned invalid JSON. Raw response: ${rawText.substring(0, 200)}`);
    }
    // Build validated result
    const result = {
        english: String(parsed.english || '').trim(),
        telugu: String(parsed.telugu || '').trim(),
        japanese: String(parsed.japanese || '').trim(),
        romaji: String(parsed.romaji || '').trim(),
        notes: String(parsed.notes || '').trim(),
        relatedWords: Array.isArray(parsed.relatedWords)
            ? parsed.relatedWords.map((rw) => ({
                english: String(rw.english || '').trim(),
                japanese: String(rw.japanese || '').trim(),
                romaji: String(rw.romaji || '').trim()
            })).filter((rw) => rw.english || rw.japanese)
            : []
    };
    if (!result.english || !result.japanese) {
        throw new Error(`AI response missing required fields. Got: english="${result.english}", japanese="${result.japanese}"`);
    }
    // Cache the result
    try {
        await aiCache_1.AICache.create({ query: normalizedQuery, response: result });
        console.log(`[AI] Cached response for: "${normalizedQuery}"`);
    }
    catch (err) {
        // Ignore duplicate key errors (race condition — cache entry created between check and write)
        if (err.code !== 11000) {
            console.error('[AI] Failed to write to AI Cache:', err);
        }
    }
    return result;
}
