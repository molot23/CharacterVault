const DEFAULT_UPSTREAM = 'https://api.kkaiapi.com';

function cors(origin) {
  const allowed = [
    'https://molot23.github.io',
    'http://127.0.0.1:4173',
    'http://localhost:4173',
    'http://localhost:3000',
  ];
  const allow = allowed.includes(origin) ? origin : allowed[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':
      'Authorization, Content-Type, x-api-key, Accept, OpenAI-Organization, OpenAI-Project',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export async function onRequest(context) {
  const { request, params, env } = context;
  const origin = request.headers.get('Origin') || '';

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors(origin) });
  }

  const rest = Array.isArray(params.path) ? params.path.join('/') : String(params.path || '');
  const path = `/${rest.replace(/^\/+/, '')}`;
  const upstreamBase = (env.UPSTREAM_BASE || DEFAULT_UPSTREAM).replace(/\/$/, '');
  const url = new URL(request.url);
  const target = `${upstreamBase}${path}${url.search}`;

  const upstreamHeaders = {};
  for (const name of ['authorization', 'content-type', 'accept', 'x-api-key']) {
    const value = request.headers.get(name);
    if (value) upstreamHeaders[name] = value;
  }

  let upstream;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers: upstreamHeaders,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    });
  } catch {
    return new Response(JSON.stringify({ error: { message: 'Upstream unreachable' } }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...cors(origin) },
    });
  }

  const headers = new Headers(cors(origin));
  const contentType = upstream.headers.get('Content-Type');
  if (contentType) headers.set('Content-Type', contentType);

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}
