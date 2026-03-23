# Agent Name Generator

Generate creative names for AI agents using the pattern **Predicate-Predicate-Object** (e.g., "Dedicated-Tasteful-Constellation"), each with short nicknames suitable for everyday use (e.g., "Stella", "Connie").

## Quick Start

```bash
npm install
npx tsc
node dist/index.js
```

Output:

```
Bold-Serene-Falcon  →  Boldo, Sera, Falc, Fali
```

## How It Works

1. **Word lists** — ~1,450 adjectives and ~3,062 nouns, each pre-mapped to 3 creative nicknames in JSONL files
2. **Name generation** — Randomly combines 2 predicates + 1 object, capitalizes and hyphen-joins them, then draws 4-6 nicknames from the component words' pools
3. **No LLM needed** — Nicknames are pre-computed via heuristics (suffix stripping, syllable truncation, diminutives, compound splitting, and hand-curated overrides)

## Programmatic Usage

```typescript
import { NameGenerator } from "./dist/index.js";

const gen = await NameGenerator.create();
const name = gen.generate();        // single name
const batch = gen.generateBatch(10); // bulk

console.log(name.fullName);    // "Calm-Vivid-Stargazer"
console.log(name.nicknames);   // ["Calmo", "Vivi", "Gaze", "Stari"]
```

## Regenerating Nicknames

If you modify the word lists in the JSONL files or want to regenerate from source text files:

```bash
python3 scripts/generate-nicknames.py
```

## Attribution

The word lists are derived from [glitch/friendly-words](https://github.com/glitch/friendly-words), a curated collection of friendly word lists.

## License

MIT
