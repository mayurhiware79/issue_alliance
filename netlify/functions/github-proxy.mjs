// Server-side proxy for the GitHub REST API.
// Keeps the GitHub token out of the browser bundle: the frontend calls
// /api/github/<path> and this function forwards the request to
// https://api.github.com/<path> with the server-side token attached.

const GITHUB_API_BASE_URL = "https://api.github.com";
const PASSTHROUGH_HEADERS = [
  "content-type",
  "x-ratelimit-limit",
  "x-ratelimit-remaining",
  "x-ratelimit-reset",
  "link",
];

export default async (req) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const githubPath = url.pathname.replace(/^\/api\/github/, "") || "/";
  const target = `${GITHUB_API_BASE_URL}${githubPath}${url.search}`;

  const token = process.env.GITHUB_API_TOKEN || process.env.VITE_GITHUB_API_TOKEN;
  const headers = { Accept: "application/vnd.github.v3+json", "User-Agent": "issue-alliance" };
  if (token) headers.Authorization = `token ${token}`;

  const upstream = await fetch(target, { headers });

  const responseHeaders = new Headers();
  for (const name of PASSTHROUGH_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  responseHeaders.set("Cache-Control", "public, max-age=60");

  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
};

export const config = {
  path: "/api/github/*",
};
