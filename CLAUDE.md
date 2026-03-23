# Agent Name Generator

This project generates creative names for AI agents using combinatorial word lists.

## How It Works

Names follow the pattern: **Predicate-Predicate-Object** (e.g., "Dedicated-Tasteful-Constellation"). Each name gets several short nicknames suitable for everyday use (e.g., "Stella", "Connie").

## Files

- `predicates.txt` — ~1,450 adjectives/descriptors
- `objects.txt` — ~3,062 nouns
- `candidate-names.txt` — Generated names with nicknames (currently ~300 entries)
- `predicate-nicknames.jsonl` — Pre-computed nicknames for each predicate (generated)
- `object-nicknames.jsonl` — Pre-computed nicknames for each object (generated)
- `scripts/generate-nicknames.py` — Python script to regenerate the JSONL nickname files
- `src/` — TypeScript module for programmatic name generation

## Common Tasks

### Suggest names for a specific role

This is the most common use case. The user will describe a role (e.g., "personal executive assistant", "code reviewer", "data pipeline monitor") and wants recommendations from the existing `candidate-names.txt` list. Review the list, pick 3-5 names whose full meaning and nicknames fit the role's personality, and explain the reasoning. This is how "Stella" (from Dedicated-Tasteful-Constellation) was chosen for a personal/executive assistant.

### Generate more candidate names

To add more entries to `candidate-names.txt`:
1. Use a Python script to randomly select 2 predicates + 1 object from the word lists, capitalized and hyphen-joined
2. Come up with 3-4 short nicknames for each (abbreviations, playful suffixes, mashups, personality-driven riffs)
3. Append to the file, continuing the existing numbering

### Remove a chosen name

When the user picks a name, remove its entry from `candidate-names.txt` so it isn't suggested again.

### Regenerate nickname data

If `predicates.txt` or `objects.txt` change, regenerate the JSONL files:

```bash
python3 scripts/generate-nicknames.py
```

This produces `predicate-nicknames.jsonl` and `object-nicknames.jsonl` — one JSON object per line with `{"word": "...", "nicknames": [...]}`.

### Use the TypeScript generator

No LLM needed at runtime. Build and run:

```bash
npm install && npx tsc
node dist/index.js
```

Or use programmatically:

```typescript
import { NameGenerator } from "./dist/index.js";
const gen = await NameGenerator.create();
const name = gen.generate();       // single name
const batch = gen.generateBatch(10); // bulk
```

Each `GeneratedName` has `fullName` (e.g. "Bold-Serene-Falcon"), word entries with their nicknames, and 4-6 combined nicknames.
