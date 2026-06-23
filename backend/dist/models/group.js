"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Group = void 0;
const mongoose_1 = require("mongoose");
const GroupSchema = new mongoose_1.Schema({
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    wordIds: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Word', default: [] }]
}, {
    timestamps: true
});
exports.Group = (0, mongoose_1.model)('Group', GroupSchema);
