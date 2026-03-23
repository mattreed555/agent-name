# Agent Name Generator

Generate creative names for AI agents using the pattern **Predicate-Predicate-Object** (e.g., "Productive-Sapphire-Breeze"), each with short nicknames suitable for everyday use (e.g., "Ducky", "Brie").

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
4. **Name suggestion** — requires Claude api key

## Attribution

The word lists are derived from [glitch/friendly-words](https://github.com/glitch/friendly-words), a curated collection of friendly word lists.

## License

MIT
