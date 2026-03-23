#!/usr/bin/env python3
"""Generate nickname JSONL files from predicates.txt and objects.txt.

For each word, produces 3 diverse nicknames using layered heuristics:
1. Suffix stripping
2. Syllable truncation
3. Diminutive suffixes
4. Tail extraction (compound words)
5. Short word handling
6. Hand-curated overrides
"""

import json
import re
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Hand-curated overrides (~50 words where algorithmic output is awkward)
# ---------------------------------------------------------------------------
OVERRIDES: dict[str, list[str]] = {
    # Objects
    "constellation": ["Stella", "Connie", "Constell"],
    "hurricane": ["Cane", "Hurri", "Storma"],
    "walker": ["Strider", "Wally", "Walkx"],
    "butterfly": ["Flutter", "Fly", "Butta"],
    "allosaurus": ["Allo", "Saura", "Rex"],
    "tyrannosaurus": ["Rex", "Tyra", "Rexie"],
    "triceratops": ["Trice", "Cera", "Topsy"],
    "stegosaurus": ["Stego", "Saura", "Stex"],
    "velociraptor": ["Velo", "Raptor", "Vex"],
    "brachiosaurus": ["Brachi", "Saura", "Brax"],
    "pterodactyl": ["Ptero", "Dactyl", "Terry"],
    "ankylosaurus": ["Anky", "Saura", "Ankix"],
    "diplodocus": ["Diplo", "Docus", "Dippy"],
    "octopus": ["Octo", "Opus", "Octi"],
    "hippopotamus": ["Hippo", "Potam", "Hippa"],
    "rhinoceros": ["Rhino", "Cera", "Rhinx"],
    "elephant": ["Ella", "Phant", "Ellix"],
    "crocodile": ["Croco", "Dile", "Crocx"],
    "chameleon": ["Cham", "Leon", "Chamix"],
    "telescope": ["Telly", "Scope", "Telex"],
    "microscope": ["Micro", "Scope", "Micra"],
    "kaleidoscope": ["Kali", "Scope", "Kalyx"],
    "skateboard": ["Skate", "Board", "Skaix"],
    "firewall": ["Fire", "Wall", "Firex"],
    "snowflake": ["Flake", "Snowy", "Flaix"],
    "earthquake": ["Quake", "Terra", "Eartha"],
    "moonstone": ["Luna", "Stone", "Mooni"],
    "sunflower": ["Sunny", "Flora", "Sunna"],
    "stargazer": ["Gaze", "Stari", "Gazer"],
    "thunderbird": ["Thunder", "Birdi", "Thundex"],
    "lighthouse": ["Light", "House", "Lumo"],
    "dragonfly": ["Dragon", "Fly", "Drix"],
    "waterfall": ["Falls", "Aqua", "Falla"],
    "nightingale": ["Gale", "Nighty", "Nighta"],
    "porcupine": ["Porky", "Pine", "Quilla"],
    "caterpillar": ["Cater", "Pilli", "Cattix"],
    "grasshopper": ["Hopper", "Grassy", "Hopix"],
    "hummingbird": ["Hummer", "Birdi", "Humix"],
    # Predicates
    "everlasting": ["Ever", "Lasti", "Evra"],
    "adventurous": ["Venture", "Advent", "Addie"],
    "magnificent": ["Magni", "Magna", "Magnix"],
    "extraordinary": ["Extra", "Xtra", "Exo"],
    "quintessential": ["Quinn", "Quint", "Essa"],
    "incandescent": ["Candi", "Incan", "Glow"],
    "effervescent": ["Effer", "Fizzi", "Vesca"],
    "sophisticated": ["Sophi", "Sopha", "Sophix"],
    "enthusiastic": ["Thusi", "Enzo", "Enthix"],
    "melancholy": ["Melan", "Coly", "Mellix"],
    "whimsical": ["Whimsy", "Whim", "Calyx"],
    "mysterious": ["Mysti", "Myra", "Mystix"],
    "beautiful": ["Beau", "Bella", "Beauti"],
    "wonderful": ["Wonda", "Wondi", "Deri"],
    "delightful": ["Deli", "Lighta", "Delix"],
    "courageous": ["Couri", "Coura", "Ragex"],
}

# ---------------------------------------------------------------------------
# Vowel / consonant helpers
# ---------------------------------------------------------------------------
VOWELS = set("aeiou")


def _is_vowel(ch: str) -> bool:
    return ch.lower() in VOWELS


def _capitalize(s: str) -> str:
    return s[0].upper() + s[1:] if s else s


# ---------------------------------------------------------------------------
# Strategy 1: Suffix stripping
# ---------------------------------------------------------------------------
SUFFIX_PATTERNS = [
    (r"saurus$", ""),
    (r"raptor$", ""),
    (r"ceratops$", ""),
    (r"tion$", ""),
    (r"sion$", ""),
    (r"ment$", ""),
    (r"ness$", ""),
    (r"ious$", ""),
    (r"eous$", ""),
    (r"ous$", ""),
    (r"ful$", ""),
    (r"ing$", ""),
    (r"ive$", ""),
    (r"ible$", ""),
    (r"able$", ""),
    (r"ical$", ""),
    (r"ated$", ""),
    (r"ized$", ""),
    (r"escent$", ""),
    (r"istic$", ""),
    (r"berry$", ""),
    (r"flower$", ""),
    (r"fish$", ""),
    (r"bird$", ""),
    (r"worm$", ""),
    (r"boat$", ""),
    (r"board$", ""),
    (r"ed$", ""),
    (r"ly$", ""),
    (r"er$", ""),
    (r"al$", ""),
]


def suffix_strip(word: str) -> list[str]:
    results = []
    for pattern, replacement in SUFFIX_PATTERNS:
        match = re.search(pattern, word)
        if match:
            stem = word[: match.start()] + replacement
            if len(stem) >= 2:
                results.append(_capitalize(stem))
    return results


# ---------------------------------------------------------------------------
# Strategy 2: Syllable truncation (first 1-2 syllables)
# ---------------------------------------------------------------------------
def _find_syllable_breaks(word: str) -> list[int]:
    """Find positions where syllable breaks likely occur."""
    breaks = []
    for i in range(1, len(word) - 1):
        if not _is_vowel(word[i]) and _is_vowel(word[i - 1]) and i >= 2:
            breaks.append(i)
        elif (
            not _is_vowel(word[i])
            and not _is_vowel(word[i + 1])
            and _is_vowel(word[i - 1])
            and i >= 2
        ):
            breaks.append(i + 1)
    # Deduplicate and sort
    return sorted(set(breaks))


def syllable_truncate(word: str) -> list[str]:
    results = []
    if len(word) <= 4:
        return results
    breaks = _find_syllable_breaks(word)
    for brk in breaks:
        if 2 <= brk <= len(word) - 2:
            truncated = word[:brk]
            if len(truncated) >= 2:
                results.append(_capitalize(truncated))
    # Also try first 3-5 chars as a simple truncation
    for length in [3, 4, 5]:
        if length < len(word):
            candidate = word[:length]
            cap = _capitalize(candidate)
            if cap not in results:
                results.append(cap)
    return results


# ---------------------------------------------------------------------------
# Strategy 3: Diminutive suffixes
# ---------------------------------------------------------------------------
DIMINUTIVE_SUFFIXES = ["-ie", "-o", "-a", "-y", "-ex", "-ix", "-ette", "-i"]


def diminutive(word: str) -> list[str]:
    results = []
    # Get a base: first 3-5 chars of the word
    bases = []
    if len(word) <= 4:
        bases.append(word)
    else:
        for length in [3, 4, 5]:
            if length <= len(word):
                bases.append(word[:length])

    for base in bases:
        # Remove trailing vowel before adding suffix
        stem = base.rstrip("aeiouy") if len(base) > 2 else base
        if len(stem) < 2:
            stem = base[:2]

        for suffix in DIMINUTIVE_SUFFIXES:
            sfx = suffix.lstrip("-")
            # Skip if the stem already ends with a similar sound
            if stem.endswith(sfx[0]):
                continue
            candidate = _capitalize(stem + sfx)
            if candidate not in results and len(candidate) <= 10:
                results.append(candidate)
    return results


# ---------------------------------------------------------------------------
# Strategy 4: Tail extraction (last morpheme of compound-ish words)
# ---------------------------------------------------------------------------
COMPOUND_TAILS = [
    "berry", "flower", "fish", "bird", "worm", "boat", "board",
    "stone", "light", "fire", "star", "moon", "sun", "snow",
    "storm", "wind", "rain", "drop", "fall", "horn", "tail",
    "shell", "wood", "leaf", "seed", "corn", "nut", "fruit",
    "cake", "cup", "top", "fly", "bee", "cat", "dog", "fox",
    "bug", "ant", "man", "ship", "ring", "bell", "drum",
    "pipe", "mint", "weed", "rose", "lily", "fern", "vine",
    "moss", "palm", "pine", "sage", "dew", "ice", "ash",
]


def tail_extract(word: str) -> list[str]:
    results = []
    for tail in COMPOUND_TAILS:
        if word.endswith(tail) and len(word) > len(tail) + 1:
            results.append(_capitalize(tail))
            head = word[: -len(tail)]
            if len(head) >= 2:
                results.append(_capitalize(head))
    return results


# ---------------------------------------------------------------------------
# Strategy 5: Short word handling (≤4 chars)
# ---------------------------------------------------------------------------
def short_word_variants(word: str) -> list[str]:
    if len(word) > 4:
        return []
    results = []
    # Add suffix variants
    for sfx in ["y", "io", "kit", "o", "a", "ix", "ex", "i"]:
        # Skip if the word already ends with the first char of suffix
        if word.endswith(sfx[0]):
            continue
        candidate = _capitalize(word + sfx)
        if candidate not in results and len(candidate) <= 8:
            results.append(candidate)
    return results


# ---------------------------------------------------------------------------
# Main nickname generator
# ---------------------------------------------------------------------------
def generate_nicknames(word: str) -> list[str]:
    """Generate 3 diverse nicknames for a word."""
    w = word.lower().strip()

    # Check overrides first
    if w in OVERRIDES:
        return OVERRIDES[w]

    # Collect candidates from all strategies, tagged by strategy
    candidates: list[tuple[str, int]] = []  # (nickname, strategy_id)

    for nick in suffix_strip(w):
        candidates.append((nick, 1))
    for nick in syllable_truncate(w):
        candidates.append((nick, 2))
    for nick in diminutive(w):
        candidates.append((nick, 3))
    for nick in tail_extract(w):
        candidates.append((nick, 4))
    for nick in short_word_variants(w):
        candidates.append((nick, 5))

    # Deduplicate while preserving order
    seen: set[str] = set()
    unique: list[tuple[str, int]] = []
    for nick, strat in candidates:
        # Filter out nicknames that are too similar to the word itself
        if nick.lower() == w:
            continue
        if nick not in seen and len(nick) >= 2:
            seen.add(nick)
            unique.append((nick, strat))

    if not unique:
        # Fallback: capitalize the word itself and add simple suffixes
        cap = _capitalize(w)
        return [cap, _capitalize(w[:3] + "o"), _capitalize(w[:3] + "ix")]

    # Pick 3 diverse results: try one from each strategy
    result: list[str] = []
    used_strategies: set[int] = set()

    # First pass: one per strategy
    for nick, strat in unique:
        if strat not in used_strategies and len(result) < 3:
            result.append(nick)
            used_strategies.add(strat)

    # Fill remaining from unused candidates
    for nick, strat in unique:
        if nick not in result and len(result) < 3:
            result.append(nick)

    # Last resort padding
    while len(result) < 3:
        fallback = _capitalize(w[:3] + ["o", "ix", "a"][len(result)])
        if fallback not in result:
            result.append(fallback)
        else:
            result.append(_capitalize(w[:4] + "i"))
            break

    return result[:3]


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def process_file(input_path: Path, output_path: Path) -> int:
    words = [
        line.strip()
        for line in input_path.read_text().splitlines()
        if line.strip()
    ]
    with output_path.open("w") as f:
        for word in words:
            nicknames = generate_nicknames(word)
            entry = {"word": word, "nicknames": nicknames}
            f.write(json.dumps(entry) + "\n")
    return len(words)


def main() -> None:
    project_dir = Path(__file__).resolve().parent.parent

    predicates_in = project_dir / "predicates.txt"
    objects_in = project_dir / "objects.txt"
    predicates_out = project_dir / "predicate-nicknames.jsonl"
    objects_out = project_dir / "object-nicknames.jsonl"

    for path in [predicates_in, objects_in]:
        if not path.exists():
            print(f"Error: {path} not found", file=sys.stderr)
            sys.exit(1)

    pred_count = process_file(predicates_in, predicates_out)
    print(f"Generated nicknames for {pred_count} predicates -> {predicates_out.name}")

    obj_count = process_file(objects_in, objects_out)
    print(f"Generated nicknames for {obj_count} objects -> {objects_out.name}")


if __name__ == "__main__":
    main()
