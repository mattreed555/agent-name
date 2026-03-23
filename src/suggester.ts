import type { NameGenerator } from "./generator.js";
import type {
  GeneratedName,
  SuggesterOptions,
  SuggesterResult,
} from "./types.js";

export class NameSuggester {
  constructor(private generator: NameGenerator) {}

  async suggest(options: SuggesterOptions = {}): Promise<SuggesterResult> {
    const {
      count = 30,
      topK = 10,
      purpose,
      apiKey = process.env.ANTHROPIC_API_KEY,
      model = "claude-haiku-4-5-20251001",
    } = options;

    if (!apiKey) {
      throw new Error(
        "Anthropic API key required: pass apiKey option or set ANTHROPIC_API_KEY env var",
      );
    }

    const candidates = this.generator.generateBatch(count);

    const candidateList = candidates
      .map(
        (c, i) =>
          `${i + 1}. ${c.fullName} — nicknames: ${c.nicknames.join(", ")}`,
      )
      .join("\n");

    const systemPrompt = `You rank AI agent names by how well they fit a described purpose. Return ONLY valid JSON matching this schema:
{
  "suggestions": [{ "fullName": string, "nickname": string, "reasoning": string }],
  "recommendation": { "fullName": string, "nickname": string, "reasoning": string }
}
suggestions must contain exactly ${topK} items ranked best-first. recommendation is your #1 pick (same as suggestions[0]). Keep each reasoning to ONE short sentence — no more than 15 words. Use only names and nicknames from the provided list.`;

    const userPrompt = `${purpose ? `Purpose: ${purpose}\n\n` : ""}Pick the ${topK} best agent names from this list:\n\n${candidateList}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${body}`);
    }

    const data = (await response.json()) as {
      content: { type: string; text: string }[];
    };

    const text = data.content.find((b) => b.type === "text")?.text;
    if (!text) {
      throw new Error("No text content in API response");
    }

    // Extract JSON from response (may be wrapped in markdown fences)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from API response");
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      suggestions: { fullName: string; nickname: string; reasoning: string }[];
      recommendation: { fullName: string; nickname: string; reasoning: string };
    };

    const nameMap = new Map<string, GeneratedName>();
    for (const c of candidates) {
      nameMap.set(c.fullName, c);
    }

    const suggestions = parsed.suggestions
      .map((s) => {
        const name = nameMap.get(s.fullName);
        return name ? { name, reasoning: s.reasoning } : null;
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);

    const recName = nameMap.get(parsed.recommendation.fullName);
    if (!recName) {
      throw new Error(
        `Recommendation "${parsed.recommendation.fullName}" not found in candidates`,
      );
    }

    return {
      suggestions,
      recommendation: {
        name: recName,
        nickname: parsed.recommendation.nickname,
        reasoning: parsed.recommendation.reasoning,
      },
    };
  }
}
