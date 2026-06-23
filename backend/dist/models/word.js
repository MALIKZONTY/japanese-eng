"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Word = void 0;
const mongoose_1 = require("mongoose");
const WordSchema = new mongoose_1.Schema({
    english: { type: String, required: true, trim: true },
    telugu: { type: String, trim: true, default: '' },
    japanese: { type: String, required: true, trim: true },
    romaji: { type: String, required: true, trim: true },
    notes: { type: String, default: '' },
    isFavorite: { type: Boolean, default: false },
    groupIds: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Group', default: [] }],
    relatedWordIds: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Word', default: [] }]
}, {
    timestamps: true
});
// Indexes for quick lookup
WordSchema.index({ english: 1 });
WordSchema.index({ telugu: 1 });
WordSchema.index({ japanese: 1 });
WordSchema.index({ romaji: 1 });
exports.Word = (0, mongoose_1.model)('Word', WordSchema);
