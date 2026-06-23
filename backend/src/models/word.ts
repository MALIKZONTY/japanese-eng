import { Schema, model, Document, Types } from 'mongoose';

export interface IWord extends Document {
  english: string;
  telugu: string;
  japanese: string;
  romaji: string;
  notes: string;
  isFavorite: boolean;
  groupIds: Types.ObjectId[];
  relatedWordIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const WordSchema = new Schema<IWord>({
  english: { type: String, required: true, trim: true },
  telugu: { type: String, trim: true, default: '' },
  japanese: { type: String, required: true, trim: true },
  romaji: { type: String, required: true, trim: true },
  notes: { type: String, default: '' },
  isFavorite: { type: Boolean, default: false },
  groupIds: [{ type: Schema.Types.ObjectId, ref: 'Group', default: [] }],
  relatedWordIds: [{ type: Schema.Types.ObjectId, ref: 'Word', default: [] }]
}, {
  timestamps: true
});

// Indexes for quick lookup
WordSchema.index({ english: 1 });
WordSchema.index({ telugu: 1 });
WordSchema.index({ japanese: 1 });
WordSchema.index({ romaji: 1 });

export const Word = model<IWord>('Word', WordSchema);
