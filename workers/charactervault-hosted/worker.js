const DEFAULT_UPSTREAM = 'https://api.kkaiapi.com';

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      if (url.pathname === '/v1' || url.pathname.startsWith('/v1/')) {
        return await proxyV1(request, env, url);
      }
      return env.ASSETS.fetch(request);
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err && err.message || err) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};

async function proxyV1(request, env, url) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors(request) });
  }
  const upstreamBase = (env.UPSTREAM_BASE || DEFAULT_UPSTREAM).replace(/\/$/, '');
  const target = `${upstreamBase}${url.pathname}${url.search}`;
  const upstreamHeaders = new Headers();
  for (const name of ['authorization', 'content-type', 'accept', 'x-api-key']) {
    const value = request.headers.get(name);
    if (value) upstreamHeaders.set(name, value);
  }
  const upstream = await fetch(target, {
    method: request.method,
    headers: upstreamHeaders,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
  });
  const headers = new Headers(cors(request));
  const ct = upstream.headers.get('Content-Type');
  if (ct) headers.set('Content-Type', ct);
  return new Response(upstream.body, { status: upstream.status, headers });
}

function cors(request) {
  const origin = request.headers.get('Origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin === 'null' ? '*' : origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, x-api-key, Accept',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}
