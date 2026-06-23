"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchHistory = void 0;
const mongoose_1 = require("mongoose");
const SearchHistorySchema = new mongoose_1.Schema({
    query: { type: String, required: true, trim: true },
    searchType: { type: String, required: true },
    searchedAt: { type: Date, default: Date.now }
});
exports.SearchHistory = (0, mongoose_1.model)('SearchHistory', SearchHistorySchema);
