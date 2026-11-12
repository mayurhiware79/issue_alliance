// Browser-side client for the /api/gemini Netlify Function.
// The Gemini API key lives only on the server.

/**
 * Generate text with Gemini via the server-side proxy.
 * @param {string|Array} input - A prompt string, or a Gemini `contents` array
 * @param {Object} [options]
 * @param {Object} [options.generationConfig]
 * @param {string} [options.model]
 * @returns {Promise<string>} - Generated text
 */
export async function generateGeminiText(input, { generationConfig, model } = {}) {
  const contents =
    typeof input === "string" ? [{ role: "user", parts: [{ text: input }] }] : input;

  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents, generationConfig, model }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Gemini request failed: ${response.status}`);
  }
  return data.text || "";
}
