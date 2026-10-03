import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createLiveHandler, createLimiter } from '../server/live.js';

const listen = (srv) => new Promise((r) => srv.listen(0, '127.0.0.1', () => r(srv.address().port)));
let upstream, bridge, base, upstreamMode = 'ok';

before(async () => {
  upstream = http.createServer((req, res) => {
    req.resume();
    if (upstreamMode === '429') res.writeHead(429, { 'Retry-After': '17', 'Content-Type': 'application/json' });
    else res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('{}');
  });
  const up = await listen(upstream);
  const live = createLiveHandler({ MCP_AGENT_URL: `http://127.0.0.1:${up}`, SALES_AGENT_URL: `http://127.0.0.1:${up}`, VOICE_AGENT_URL: `http://127.0.0.1:${up}`, TRUST_PROXY: '1' });
  bridge = http.createServer((req, res) => { req.url = req.url.replace(/^\/live/, ''); live(req, res); });
  base = `http://127.0.0.1:${await listen(bridge)}/live`;
});
after(() => { upstream.close(); bridge.close(); bridge.closeAllConnections(); });

const post = (path, headers = {}, body = '{}') => fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body });

test('limiter: sliding window frees slots as old hits expire', () => {
  let t = 0;
  const l = createLimiter({ x: [2, 1000] }, () => t);
  assert.equal(l.hit('x', 'a'), 0);
  t = 400; assert.equal(l.hit('x', 'a'), 0);
  t = 500; assert.equal(l.hit('x', 'a'), 1); // oldest hit leaves at t=1000 → 0.5s, rounded up
  assert.equal(l.hit('x', 'b'), 0);           // other IP has its own budget
  t = 1001; assert.equal(l.hit('x', 'a'), 0);
  l.stop();
});

test('costly route: 429 + Retry-After once the per-IP budget is spent, other routes unaffected', async () => {
  const ip = { 'X-Forwarded-For': '203.0.113.1' };
  for (let i = 0; i < 6; i++) assert.equal((await post('/mcp/api/v1/invoke', ip)).status, 200);
  const r = await post('/mcp/api/v1/invoke', ip);
  assert.equal(r.status, 429);
  assert.ok(Number(r.headers.get('retry-after')) >= 1);
  assert.deepEqual(await r.json(), { error: 'rate_limited', bridge: true });
  assert.equal((await post('/sales/api/v1/turn', ip)).status, 200);
  assert.equal((await post('/mcp/api/v1/invoke', { 'X-Forwarded-For': '203.0.113.2' })).status, 200);
});

test('X-Forwarded-For: the proxy-appended (last) entry counts, a spoofed first entry does not', async () => {
  for (let i = 0; i < 6; i++) await post('/voice/api/v1/token', { 'X-Forwarded-For': `spoof${i}, 198.51.100.7` });
  assert.equal((await post('/voice/api/v1/token', { 'X-Forwarded-For': 'another, 198.51.100.7' })).status, 429);
});

test('upstream 429 passes Retry-After through', async () => {
  upstreamMode = '429';
  const r = await post('/sales/api/v1/turn', { 'X-Forwarded-For': '203.0.113.9' });
  upstreamMode = 'ok';
  assert.equal(r.status, 429);
  assert.equal(r.headers.get('retry-after'), '17');
});

test('body over 16 KB → 413 (declared and streamed), not a dropped connection', async () => {
  const big = JSON.stringify({ message: 'x'.repeat(20_000) });
  assert.equal((await post('/sales/api/v1/turn', { 'X-Forwarded-For': '203.0.113.20' }, big)).status, 413);
  // chunked, no Content-Length
  const chunked = new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode(big)); c.close(); } });
  const r = await fetch(`${base}/sales/api/v1/turn`, { method: 'POST', headers: { 'X-Forwarded-For': '203.0.113.21' }, body: chunked, duplex: 'half' });
  assert.equal(r.status, 413);
});
