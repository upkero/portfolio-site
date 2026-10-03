// Server-side bridge between the site and the five services: /live/<service>/<path> → service.
//
// Why a bridge instead of calling the services from the browser:
//  - API keys stay on the server (an X-API-Key shipped in a JS bundle is not a key);
//  - the services keep CORS closed, which is their secure default;
//  - mcp-ops-agent listens on loopback only, so only a same-host server can reach it.
// Only the routes the demos need are allowed; everything else is a 404.

import { Readable } from 'node:stream';

const SERVICES = {
  core: { url: 'OPS_CORE_URL', fallback: 'http://127.0.0.1:8000', key: 'OPS_CORE_API_KEY' },
  rag: { url: 'RAG_CHAT_URL', fallback: 'http://127.0.0.1:8001', key: 'OPS_CORE_API_KEY' },
  sales: { url: 'SALES_AGENT_URL', fallback: 'http://127.0.0.1:8002', key: 'SALES_AGENT_API_KEY' },
  mcp: { url: 'MCP_AGENT_URL', fallback: 'http://127.0.0.1:8003', key: 'MCP_AGENT_API_KEY' },
  voice: { url: 'VOICE_AGENT_URL', fallback: 'http://127.0.0.1:8080' },
};

// [service, method, path, timeout ms]
const ROUTES = [
  ['*', 'GET', /^\/health\/(live|ready)$/, 10_000],
  ['core', 'GET', /^\/api\/v1\/booking-slots$/, 15_000],
  ['core', 'GET', /^\/api\/v1\/customers$/, 15_000],
  ['core', 'GET', /^\/api\/v1\/pricing(\/services)?$/, 15_000],
  ['core', 'POST', /^\/api\/v1\/documents\/search$/, 30_000],
  ['core', 'POST', /^\/api\/v1\/bookings$/, 15_000],
  ['core', 'DELETE', /^\/api\/v1\/bookings\/[0-9a-f-]{36}$/, 15_000],
  ['rag', 'POST', /^\/api\/v1\/ask$/, 90_000],
  ['sales', 'POST', /^\/api\/v1\/turn$/, 90_000],
  ['mcp', 'POST', /^\/api\/v1\/invoke$/, 300_000],
  ['voice', 'POST', /^\/api\/v1\/token$/, 15_000],
];

const MAX_BODY = 16 * 1024;

const send = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new Error('too_large'));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/** Returns a connect-style handler; `env` holds the service URLs and keys (server-side only). */
export function createLiveHandler(env) {
  return async function live(req, res) {
    // req.url arrives without the /live mount prefix: "/<service>/<path>?query"
    const url = new URL(req.url, 'http://bridge');
    const [, service, ...rest] = url.pathname.split('/');
    const path = `/${rest.join('/')}`;
    const spec = SERVICES[service];
    const route = spec && ROUTES.find(([s, m, p]) => (s === '*' || s === service) && m === req.method && p.test(path));
    if (!route) return send(res, 404, { error: 'not_found', bridge: true });

    let body;
    if (req.method === 'POST') {
      try {
        body = await readBody(req);
      } catch {
        return send(res, 413, { error: 'too_large', bridge: true });
      }
    }

    const base = (env[spec.url] || spec.fallback).replace(/\/+$/, '');
    const headers = { Accept: req.headers.accept || 'application/json' };
    if (body) headers['Content-Type'] = 'application/json';
    const key = spec.key && env[spec.key]?.trim();
    if (key) headers['X-API-Key'] = key;

    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(new Error('timeout')), route[3]);
    // res, not req: req emits 'close' as soon as a POST body is read
    res.on('close', () => { if (!res.writableEnded) ac.abort(new Error('client_gone')); });

    let upstream;
    try {
      upstream = await fetch(`${base}${path}${url.search}`, { method: req.method, headers, body, signal: ac.signal });
    } catch (e) {
      clearTimeout(timer);
      const timedOut = ac.signal.reason?.message === 'timeout';
      return send(res, 503, { error: timedOut ? 'timeout' : 'unreachable', service, bridge: true });
    }

    res.statusCode = upstream.status;
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('X-Accel-Buffering', 'no'); // keep SSE unbuffered behind nginx
    if (!upstream.body) {
      clearTimeout(timer);
      return res.end();
    }
    // Streamed byte for byte, so SSE events reach the browser as they happen.
    Readable.fromWeb(upstream.body)
      .on('error', () => res.destroy())
      .on('end', () => clearTimeout(timer))
      .pipe(res);
  };
}
