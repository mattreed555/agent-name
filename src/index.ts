export type { WordEntry, GeneratedName } from "./types.js";
export { NameGenerator } from "./generator.js";

// CLI demo when run directly
const isMain = import.meta.filename === process.argv[1];
if (isMain) {
  const { NameGenerator } = await import("./generator.js");
  const gen = await NameGenerator.create();
  const names = gen.generateBatch(5);
  for (const name of names) {
    console.log(`${name.fullName}  →  ${name.nicknames.join(", ")}`);
  }
}
