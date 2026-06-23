export interface RelatedWord {
  english: string;
  japanese: string;
  romaji: string;
}

export interface Word {
  _id: string;
  english: string;
  telugu: string;
  japanese: string;
  romaji: string;
  notes: string;
  isFavorite: boolean;
  groupIds: Array<string | { _id: string; name: string }>;
  relatedWordIds: Array<string | Word>;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  _id: string;
  name: string;
  description: string;
  wordIds: string[] | Word[];
  wordCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SearchHistory {
  _id: string;
  query: string;
  searchType: string;
  searchedAt: string;
}

export interface AIResponse {
  english: string;
  telugu: string;
  japanese: string;
  romaji: string;
  notes: string;
  relatedWords: RelatedWord[];
}

export interface SearchResponse {
  source: 'local' | 'ai';
  results: Array<Word | AIResponse>;
}
