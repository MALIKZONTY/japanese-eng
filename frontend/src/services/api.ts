import axios from 'axios';
import { Word, Group, SearchHistory, AIResponse, SearchResponse } from '../types';

let base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
if (base && !base.endsWith('/api') && !base.endsWith('/api/')) {
  if (base.endsWith('/')) {
    base = base.slice(0, -1);
  }
  base = `${base}/api`;
}
const API_BASE_URL = base;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const wordService = {
  getWords: async (params?: { page?: number; limit?: number; search?: string; groupId?: string; isFavorite?: boolean; sortBy?: string; sortOrder?: string }) => {
    const response = await api.get<{
      words: Word[];
      page: number;
      limit: number;
      totalPages: number;
      totalWords: number;
    }>('/words', { params });
    return response.data;
  },

  getWordById: async (id: string) => {
    const response = await api.get<Word>(`/words/${id}`);
    return response.data;
  },

  createWord: async (data: Partial<Word>) => {
    const response = await api.post<Word>('/words', data);
    return response.data;
  },

  updateWord: async (id: string, data: Partial<Word>) => {
    const response = await api.put<Word>(`/words/${id}`, data);
    return response.data;
  },

  deleteWord: async (id: string) => {
    const response = await api.delete<{ message: string }>(`/words/${id}`);
    return response.data;
  },

  addFavorite: async (id: string) => {
    const response = await api.post<Word>(`/favorites/${id}`);
    return response.data;
  },

  removeFavorite: async (id: string) => {
    const response = await api.delete<Word>(`/favorites/${id}`);
    return response.data;
  },
};

export const groupService = {
  getGroups: async () => {
    const response = await api.get<Group[]>('/groups');
    return response.data;
  },

  getGroupById: async (id: string) => {
    const response = await api.get<Group>(`/groups/${id}`);
    return response.data;
  },

  createGroup: async (data: Partial<Group>) => {
    const response = await api.post<Group>('/groups', data);
    return response.data;
  },

  updateGroup: async (id: string, data: Partial<Group>) => {
    const response = await api.put<Group>(`/groups/${id}`, data);
    return response.data;
  },

  deleteGroup: async (id: string) => {
    const response = await api.delete<{ message: string }>(`/groups/${id}`);
    return response.data;
  },
};

export const searchService = {
  search: async (query: string) => {
    const response = await api.post<SearchResponse>('/search', { query });
    return response.data;
  },

  searchRelated: async (query: string) => {
    const response = await api.post<{ query: string; relatedWords: Array<{ english: string; japanese: string; romaji: string }> }>('/search/related', { query });
    return response.data;
  },
};

export const historyService = {
  getHistory: async (limit?: number) => {
    const response = await api.get<SearchHistory[]>('/history', { params: { limit } });
    return response.data;
  },
};

export const aiService = {
  autofill: async (query: string) => {
    const response = await api.post<AIResponse>('/ai/autofill', { query });
    return response.data;
  },
};
