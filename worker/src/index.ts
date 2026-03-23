import { NameGenerator } from "../../src/generator.js";
import { NameSuggester } from "../../src/suggester.js";
import { predicates, objects } from "./data.js";
import { handlePreflight, withCors } from "./cors.js";

interface Env {
  ANTHROPIC_API_KEY: string;
  GENERATE_LIMITER: RateLimit;
  SUGGEST_LIMITER: RateLimit;
}

interface RateLimit {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

const generator = NameGenerator.fromParsedData(predicates, objects);
const suggester = new NameSuggester(generator);

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function handleGenerate(request: Request, env: Env): Promise<Response> {
  if (request.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  const { success } = await env.GENERATE_LIMITER.limit({ key: "global" });
  if (!success) {
    return json({ error: "Rate limit exceeded. Try again shortly." }, 429);
  }

  const url = new URL(request.url);
  const count = Math.min(Math.max(parseInt(url.searchParams.get("count") ?? "5", 10) || 5, 1), 50);

  const names = generator.generateBatch(count);
  return json({ names });
}

async function handleSuggest(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const { success } = await env.SUGGEST_LIMITER.limit({ key: "global" });
  if (!success) {
    return json({ error: "Rate limit exceeded. Try again shortly." }, 429);
  }

  let body: { purpose?: string; count?: number; topK?: number };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  try {
    const result = await suggester.suggest({
      purpose: body.purpose,
      count: body.count,
      topK: body.topK,
      apiKey: env.ANTHROPIC_API_KEY,
    });
    return json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return json({ error: message }, 500);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const preflight = handlePreflight(request);
    if (preflight) return preflight;

    const url = new URL(request.url);
    let response: Response;

    switch (url.pathname) {
      case "/generate":
        response = await handleGenerate(request, env);
        break;
      case "/suggest":
        response = await handleSuggest(request, env);
        break;
      default:
        response = json({ error: "Not found" }, 404);
    }

    return withCors(request, response);
  },
} satisfies ExportedHandler<Env>;
