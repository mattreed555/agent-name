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
