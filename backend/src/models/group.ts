import { Schema, model, Document, Types } from 'mongoose';

export interface IGroup extends Document {
  name: string;
  description: string;
  wordIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new Schema<IGroup>({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  wordIds: [{ type: Schema.Types.ObjectId, ref: 'Word', default: [] }]
}, {
  timestamps: true
});

export const Group = model<IGroup>('Group', GroupSchema);
