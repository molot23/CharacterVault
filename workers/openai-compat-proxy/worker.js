/**
 * CORS proxy for OpenAI-compatible relay APIs used by CharacterVault on GitHub Pages.
 *
 * Browser apps on https://molot23.github.io cannot call relays that reject
 * cross-origin requests (403 / missing CORS). This worker forwards the request
 * server-side (no browser Origin) and returns CORS headers for the Pages origin.
 *
 * Security:
 * - Pins upstream host (env UPSTREAM_BASE, default https://api.kkaiapi.com)
 * - Does not log Authorization
 * - Pass-through only; does not store keys
 * - Optional Origin allowlist via ALLOWED_ORIGINS (comma-separated; default github pages)
 *
 * Deploy:
 *   cd workers/openai-compat-proxy
 *   npx wrangler deploy
 *
 * Then in CharacterVault Settings → AI Config, set API Base URL to:
 *   https://<this-worker>.workers.dev/v1
 */

const DEFAULT_UPSTREAM = 'https://api.kkaiapi.com';
const DEFAULT_ALLOWED_ORIGINS = [
  'https://molot23.github.io',
  'http://127.0.0.1:4173',
  'http://localhost:4173',
  'http://localhost:3000',
];

function parseAllowedOrigins(env) {
  const raw = (env && env.ALLOWED_ORIGINS) || '';
  if (!raw.trim()) return DEFAULT_ALLOWED_ORIGINS;
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = parseAllowedOrigins(env);
  const allowOrigin = allowed.includes('*')
    ? '*'
    : allowed.includes(origin)
      ? origin
      : allowed[0];

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':
      'Authorization, Content-Type, x-api-key, Accept, OpenAI-Organization, OpenAI-Project',
    'Access-Control-Expose-Headers': 'WWW-Authenticate, x-request-id, x-oneapi-request-id',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function withCors(request, env, body, init = {}) {
  const headers = new Headers(init.headers || {});
  for (const [k, v] of Object.entries(corsHeaders(request, env))) {
    headers.set(k, v);
  }
  return new Response(body, { ...init, headers });
}

function upstreamBase(env) {
  const base = ((env && env.UPSTREAM_BASE) || DEFAULT_UPSTREAM).replace(/\/$/, '');
  return base;
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return withCors(request, env, null, { status: 204 });
    }

    const url = new URL(request.url);
    // Preserve path+query; worker is the host, path should look like /v1/...
    const target = `${upstreamBase(env)}${url.pathname}${url.search}`;

    const upstreamHeaders = new Headers();
    const pass = [
      'authorization',
      'content-type',
      'accept',
      'x-api-key',
      'openai-organization',
      'openai-project',
    ];
    for (const name of pass) {
      const value = request.headers.get(name);
      if (value) upstreamHeaders.set(name, value);
    }

    let upstream;
    try {
      upstream = await fetch(target, {
        method: request.method,
        headers: upstreamHeaders,
        body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
        redirect: 'follow',
      });
    } catch {
      return withCors(
        request,
        env,
        JSON.stringify({ error: { message: 'Upstream unreachable' } }),
        { status: 502, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const outHeaders = new Headers();
    const contentType = upstream.headers.get('Content-Type');
    if (contentType) outHeaders.set('Content-Type', contentType);
    const requestId =
      upstream.headers.get('x-oneapi-request-id') || upstream.headers.get('x-request-id');
    if (requestId) outHeaders.set('x-request-id', requestId);

    // Stream body through (needed for chat completions SSE).
    return withCors(request, env, upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: outHeaders,
    });
  },
};
