"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AICache = void 0;
const mongoose_1 = require("mongoose");
const AICacheSchema = new mongoose_1.Schema({
    query: { type: String, required: true, unique: true, trim: true, index: true },
    response: { type: mongoose_1.Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: Date.now }
});
exports.AICache = (0, mongoose_1.model)('AICache', AICacheSchema);
