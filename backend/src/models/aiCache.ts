import { Schema, model, Document } from 'mongoose';

export interface IAICache extends Document {
  query: string;
  response: any;
  createdAt: Date;
}

const AICacheSchema = new Schema<IAICache>({
  query: { type: String, required: true, unique: true, trim: true, index: true },
  response: { type: Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const AICache = model<IAICache>('AICache', AICacheSchema);
