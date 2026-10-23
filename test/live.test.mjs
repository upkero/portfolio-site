import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createLiveHandler, createLimiter } from '../server/live.js';

const listen = (srv) => new Promise((r) => srv.listen(0, '127.0.0.1', () => r(srv.address().port)));
let upstream, bridge, base, upstreamMode = 'ok';
const seen = [];  // headers of every request the upstream received
const logs = [];  // log objects the bridge emitted

before(async () => {
  upstream = http.createServer((req, res) => {
    req.resume();
    seen.push(req.headers);
    if (upstreamMode === '429') res.writeHead(429, { 'Retry-After': '17', 'Content-Type': 'application/json' });
    else res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('{}');
  });
  const up = await listen(upstream);
  const live = createLiveHandler({ OPS_CORE_URL: `http://127.0.0.1:${up}`, MCP_AGENT_URL: `http://127.0.0.1:${up}`, SALES_AGENT_URL: `http://127.0.0.1:${up}`, VOICE_AGENT_URL: `http://127.0.0.1:${up}`, TRUST_PROXY: '1' }, (l) => logs.push(l));
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

const TRACEPARENT = /^00-([0-9a-f]{32})-([0-9a-f]{16})-01$/;
const waitLog = async (n) => { for (let i = 0; i < 200 && logs.length <= n; i++) await new Promise((r) => setTimeout(r, 5)); return logs.at(-1); };

test('X-Request-ID: a well-formed inbound id is kept, a malformed one is replaced; both reach the upstream and the response', async () => {
  const ip = { 'X-Forwarded-For': '203.0.113.30' };
  let r = await post('/sales/api/v1/turn', { ...ip, 'X-Request-ID': 'abc-123_DEF.456' });
  assert.equal(r.headers.get('x-request-id'), 'abc-123_DEF.456');
  assert.equal(seen.at(-1)['x-request-id'], 'abc-123_DEF.456');
  for (const bad of ['short', 'has space in it!', 'x'.repeat(65)]) {
    r = await post('/sales/api/v1/turn', { ...ip, 'X-Request-ID': bad });
    const id = r.headers.get('x-request-id');
    assert.notEqual(id, bad);
    assert.match(id, /^[0-9a-f-]{36}$/);
    assert.equal(seen.at(-1)['x-request-id'], id);
  }
});

test('traceparent: an inbound one is ignored, a fresh one is forwarded and matches the log line', async () => {
  const n = logs.length;
  const inbound = `00-${'a'.repeat(32)}-${'b'.repeat(16)}-01`;
  await (await post('/sales/api/v1/turn', { 'X-Forwarded-For': '203.0.113.31', traceparent: inbound })).text();
  const sent = seen.at(-1).traceparent;
  assert.notEqual(sent, inbound);
  const [, traceId, spanId] = sent.match(TRACEPARENT);
  const line = await waitLog(n);
  assert.equal(line.trace_id, traceId);
  assert.equal(line.span_id, spanId);
});

test('log line: route template, no body, query, IP or raw path', async () => {
  const n = logs.length;
  const uuid = '123e4567-e89b-12d3-a456-426614174000';
  await (await fetch(`${base}/core/api/v1/customers?name=Ivanova`, { headers: { 'X-Forwarded-For': '203.0.113.32' } })).text();
  let line = await waitLog(n);
  assert.deepEqual([line.service, line.route, line.method, line.status, line.status_class, line.outcome, line.bucket], ['core', 'core.customers.list', 'GET', 200, '2xx', 'ok', 'free']);
  assert.ok(Number.isInteger(line.duration_ms) && Number.isInteger(line.ttfb_ms));

  await (await fetch(`${base}/core/api/v1/bookings/${uuid}`, { method: 'DELETE', headers: { 'X-Forwarded-For': '203.0.113.32' } })).text();
  line = await waitLog(n + 1);
  assert.equal(line.route, 'core.bookings.delete');

  await post('/sales/api/v1/turn', { 'X-Forwarded-For': '203.0.113.32' }, JSON.stringify({ message: 'secret-guest-message' }));
  await waitLog(n + 2);
  const all = JSON.stringify(logs.slice(n));
  for (const leak of ['Ivanova', uuid, 'secret-guest-message', '203.0.113.32', 'api/v1']) assert.ok(!all.includes(leak), leak);
});

test('unmatched route: service and route are not taken from the URL', async () => {
  const n = logs.length;
  assert.equal((await fetch(`${base}/constructor/whatever/1234`)).status, 404);
  const line = await waitLog(n);
  assert.deepEqual([line.service, line.route, line.outcome, line.bucket], ['unknown', 'unmatched', 'not_found', null]);
});

test('OTLP: with an endpoint, each request is exported as a root span of service "site"', async () => {
  const got = [];
  const collector = http.createServer((req, res) => {
    const c = [];
    req.on('data', (d) => c.push(d)).on('end', () => { got.push({ url: req.url, body: JSON.parse(Buffer.concat(c)) }); res.end('{}'); });
  });
  const cp = await listen(collector);
  const up = upstream.address().port;
  const live = createLiveHandler({ SALES_AGENT_URL: `http://127.0.0.1:${up}`, OTEL_EXPORTER_OTLP_ENDPOINT: `http://127.0.0.1:${cp}/` }, () => {});
  const srv = http.createServer((req, res) => { req.url = req.url.replace(/^\/live/, ''); live(req, res); });
  const port = await listen(srv);
  await (await fetch(`http://127.0.0.1:${port}/live/sales/api/v1/turn`, { method: 'POST', body: '{}' })).text();
  for (let i = 0; i < 200 && !got.length; i++) { await new Promise((r) => setTimeout(r, 5)); await live.flush(); }
  srv.close(); srv.closeAllConnections(); collector.close(); collector.closeAllConnections();
  assert.equal(got[0].url, '/v1/traces');
  const { resource, scopeSpans } = got[0].body.resourceSpans[0];
  assert.deepEqual(resource.attributes, [{ key: 'service.name', value: { stringValue: 'site' } }]);
  const span = scopeSpans[0].spans[0];
  assert.equal(span.traceId, seen.at(-1).traceparent.split('-')[1]);
  assert.equal(span.spanId, seen.at(-1).traceparent.split('-')[2]);
  assert.equal(span.parentSpanId, undefined);
  assert.equal(span.name, 'POST sales.turn');
});
