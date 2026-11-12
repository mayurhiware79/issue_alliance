// Server-side proxy for Google Gemini text generation.
// Keeps the Gemini API key out of the browser bundle.

const ALLOWED_MODELS = new Set(["gemini-3.5-flash"]);
const DEFAULT_MODEL = "gemini-3.5-flash";

export default async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Gemini API key is not configured on the server." }, { status: 500 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { contents, generationConfig } = body || {};
  const model = ALLOWED_MODELS.has(body?.model) ? body.model : DEFAULT_MODEL;
  if (!Array.isArray(contents) || contents.length === 0) {
    return Response.json({ error: "`contents` must be a non-empty array" }, { status: 400 });
  }

  const upstream = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({ contents, ...(generationConfig && { generationConfig }) }),
    }
  );

  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return Response.json(
      { error: data?.error?.message || `Gemini API error: ${upstream.status}` },
      { status: upstream.status }
    );
  }

  const text = (data?.candidates?.[0]?.content?.parts || [])
    .map((part) => part.text || "")
    .join("");

  return Response.json({ text });
};

export const config = {
  path: "/api/gemini",
};
