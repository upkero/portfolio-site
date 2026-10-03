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

// [service, method, path, timeout ms, rate-limit bucket]. Buckets marked "costly" spend LLM money per call.
const ROUTES = [
  ['*', 'GET', /^\/health\/(live|ready)$/, 10_000, 'free'],
  ['core', 'GET', /^\/api\/v1\/booking-slots$/, 15_000, 'free'],
  ['core', 'GET', /^\/api\/v1\/customers$/, 15_000, 'free'],
  ['core', 'GET', /^\/api\/v1\/pricing(\/services)?$/, 15_000, 'free'],
  ['core', 'POST', /^\/api\/v1\/documents\/search$/, 30_000, 'search'],
  ['core', 'POST', /^\/api\/v1\/bookings$/, 15_000, 'book'],
  ['core', 'DELETE', /^\/api\/v1\/bookings\/[0-9a-f-]{36}$/, 15_000, 'book'],
  ['rag', 'POST', /^\/api\/v1\/ask$/, 90_000, 'rag'],
  ['sales', 'POST', /^\/api\/v1\/turn$/, 90_000, 'sales'],
  ['mcp', 'POST', /^\/api\/v1\/invoke$/, 300_000, 'mcp'],
  ['voice', 'POST', /^\/api\/v1\/token$/, 15_000, 'voice'],
];

// Per-IP budgets: [max requests, window ms]. The services see only the bridge's address, so their own
// per-IP limit is shared by every visitor; this is where one visitor gets cut off.
const WINDOW = 60_000;
const LIMITS = {
  free: [300, WINDOW], search: [30, WINDOW], book: [30, WINDOW],
  rag: [10, WINDOW], sales: [30, WINDOW], mcp: [6, WINDOW], voice: [6, WINDOW],
};

/** In-memory sliding window. `hit` returns 0 when allowed, else the seconds until a slot frees up. */
export function createLimiter(limits = LIMITS, now = Date.now) {
  const hits = new Map(); // "bucket|ip" → timestamps inside the window
  const sweep = setInterval(() => {
    const t = now();
    for (const [k, ts] of hits) if (t - ts.at(-1) >= limits[k.split('|', 1)[0]][1]) hits.delete(k);
  }, WINDOW);
  sweep.unref();
  return {
    hit(bucket, ip) {
      const [max, win] = limits[bucket];
      const t = now();
      const key = `${bucket}|${ip}`;
      const ts = (hits.get(key) || []).filter((x) => t - x < win);
      if (ts.length >= max) return Math.ceil((ts[0] + win - t) / 1000);
      ts.push(t);
      hits.set(key, ts);
      return 0;
    },
    stop: () => clearInterval(sweep),
  };
}

const MAX_BODY = 16 * 1024;

const send = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    if (Number(req.headers['content-length']) > MAX_BODY) return reject(new Error('too_large'));
    const chunks = [];
    let size = 0;
    let over = false;
    req.on('data', (c) => {
      if (over) return; // keep draining so the 413 can be delivered, but keep nothing
      size += c.length;
      if (size > MAX_BODY) {
        over = true;
        chunks.length = 0;
        reject(new Error('too_large'));
      } else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// Behind a reverse proxy the socket address is the proxy's: the client is the last X-Forwarded-For entry,
// the one the proxy itself appended. Only trusted when TRUST_PROXY is set, otherwise the header is spoofable.
const clientIp = (req, trustProxy) => {
  const fwd = trustProxy && req.headers['x-forwarded-for'];
  return (fwd && String(fwd).split(',').at(-1).trim()) || req.socket.remoteAddress || 'unknown';
};

/** Returns a connect-style handler; `env` holds the service URLs and keys (server-side only). */
export function createLiveHandler(env) {
  const limiter = createLimiter();
  const trustProxy = /^(1|true|yes)$/i.test(env.TRUST_PROXY || '');
  return async function live(req, res) {
    // req.url arrives without the /live mount prefix: "/<service>/<path>?query"
    const url = new URL(req.url, 'http://bridge');
    const [, service, ...rest] = url.pathname.split('/');
    const path = `/${rest.join('/')}`;
    const spec = SERVICES[service];
    const route = spec && ROUTES.find(([s, m, p]) => (s === '*' || s === service) && m === req.method && p.test(path));
    if (!route) return send(res, 404, { error: 'not_found', bridge: true });

    const wait = limiter.hit(route[4], clientIp(req, trustProxy));
    if (wait) {
      res.setHeader('Retry-After', wait);
      return send(res, 429, { error: 'rate_limited', bridge: true });
    }

    let body;
    if (req.method === 'POST') {
      try {
        body = await readBody(req);
      } catch {
        res.setHeader('Connection', 'close'); // the rest of the oversized upload is not worth reading
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
    const retry = upstream.status === 429 && upstream.headers.get('retry-after');
    if (retry) res.setHeader('Retry-After', retry);
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
