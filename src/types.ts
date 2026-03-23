export interface WordEntry {
  word: string;
  nicknames: string[];
}

export interface GeneratedName {
  fullName: string;
  predicate1: WordEntry;
  predicate2: WordEntry;
  object: WordEntry;
  nicknames: string[];
}

export interface SuggesterOptions {
  count?: number;
  topK?: number;
  purpose?: string;
  apiKey?: string;
  model?: string;
}

export interface Suggestion {
  name: GeneratedName;
  reasoning: string;
}

export interface SuggesterResult {
  suggestions: Suggestion[];
  recommendation: { name: GeneratedName; nickname: string; reasoning: string };
}
