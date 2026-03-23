const ALLOWED_ORIGINS = [
  "https://mattreed555.github.io",
  "http://localhost:3000",
  "http://localhost:5173",
];

function getAllowedOrigin(request: Request): string | null {
  const origin = request.headers.get("Origin");
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
  return null;
}

export function handlePreflight(request: Request): Response | null {
  if (request.method !== "OPTIONS") return null;

  const origin = getAllowedOrigin(request);
  if (!origin) return new Response(null, { status: 403 });

  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export function withCors(request: Request, response: Response): Response {
  const origin = getAllowedOrigin(request);
  if (!origin) return response;

  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", origin);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
