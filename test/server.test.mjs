import { test, after, before } from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { server } from '../server.mjs';

let port;
before(() => new Promise((r) => server.listen(0, () => { port = server.address().port; r(); })));
after(() => server.close());

// fetch() would normalise the URL, so send the request line as-is
const raw = (path) => new Promise((resolve, reject) => {
  const s = net.connect(port, '127.0.0.1', () => s.write(`GET ${path} HTTP/1.1\r\nHost: x\r\nConnection: close\r\n\r\n`));
  let buf = '';
  s.on('data', (d) => (buf += d)).on('end', () => resolve(Number(buf.split(' ')[1]))).on('error', reject);
});

test('malformed URI → 400, server keeps answering', async () => {
  assert.equal(await raw('/%E0%A4%A'), 400);
  assert.equal(await raw('/'), 200);
});

test('bridge path that fails URL parsing does not crash the process', async () => {
  assert.ok([400, 404, 500].includes(await raw('/live///')));
  assert.equal(await raw('/'), 200);
});

test('traversal → 403 or served index, never a crash', async () => {
  assert.ok([200, 403].includes(await raw('/..%2f..%2fpackage.json')));
});
