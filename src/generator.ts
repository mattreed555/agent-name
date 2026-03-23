import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { randomInt } from "node:crypto";
import type { WordEntry, GeneratedName } from "./types.js";

function loadJsonl(text: string): WordEntry[] {
  return text
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line) as WordEntry);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[randomInt(arr.length)];
}

function pickRandomSubset<T>(arr: readonly T[], count: number): T[] {
  if (arr.length <= count) return [...arr];
  const indices = new Set<number>();
  while (indices.size < count) {
    indices.add(randomInt(arr.length));
  }
  return [...indices].map((i) => arr[i]);
}

export class NameGenerator {
  private predicates: WordEntry[];
  private objects: WordEntry[];

  private constructor(predicates: WordEntry[], objects: WordEntry[]) {
    this.predicates = predicates;
    this.objects = objects;
  }

  static fromParsedData(predicates: WordEntry[], objects: WordEntry[]): NameGenerator {
    return new NameGenerator(predicates, objects);
  }

  static async create(dataDir?: string): Promise<NameGenerator> {
    const dir = dataDir ?? join(import.meta.dirname, "..");
    const [predText, objText] = await Promise.all([
      readFile(join(dir, "predicate-nicknames.jsonl"), "utf-8"),
      readFile(join(dir, "object-nicknames.jsonl"), "utf-8"),
    ]);
    return new NameGenerator(loadJsonl(predText), loadJsonl(objText));
  }

  generate(): GeneratedName {
    const pred1 = pickRandom(this.predicates);
    let pred2 = pickRandom(this.predicates);
    while (pred2.word === pred1.word) {
      pred2 = pickRandom(this.predicates);
    }
    const obj = pickRandom(this.objects);

    const fullName = [pred1.word, pred2.word, obj.word]
      .map(capitalize)
      .join("-");

    const allNicknames = [...pred1.nicknames, ...pred2.nicknames, ...obj.nicknames];
    const nicknames = pickRandomSubset(allNicknames, Math.min(allNicknames.length, 4 + randomInt(3)));

    return { fullName, predicate1: pred1, predicate2: pred2, object: obj, nicknames };
  }

  generateBatch(count: number): GeneratedName[] {
    return Array.from({ length: count }, () => this.generate());
  }
}
