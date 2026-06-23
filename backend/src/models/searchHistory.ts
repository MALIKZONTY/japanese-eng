import { Schema, model, Document } from 'mongoose';

export interface ISearchHistory extends Document {
  query: string;
  searchType: string;
  searchedAt: Date;
}

const SearchHistorySchema = new Schema<ISearchHistory>({
  query: { type: String, required: true, trim: true },
  searchType: { type: String, required: true },
  searchedAt: { type: Date, default: Date.now }
});

export const SearchHistory = model<ISearchHistory>('SearchHistory', SearchHistorySchema);
