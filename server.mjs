// Production server: serves dist/ and the /live bridge. No dependencies.
// Run: npm run build && node --env-file=.env.local server.mjs
import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLiveHandler } from './server/live.js';

const ROOT = join(import.meta.dirname, 'dist');
const PORT = Number(process.env.PORT) || 4173;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json',
};
const live = createLiveHandler(process.env);

const fail = (res, status) => {
  if (res.headersSent) return res.destroy();
  res.statusCode = status;
  res.removeHeader('Cache-Control');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end();
};

export const server = http.createServer(async (req, res) => {
  try {
    if (req.url.startsWith('/live/')) {
      req.url = req.url.slice(5);
      return await live(req, res);
    }
    let path;
    try {
      path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
    } catch {
      return fail(res, 400); // malformed %-escape or unparsable URL
    }
    let file = join(ROOT, path);
    if (!file.startsWith(ROOT)) return fail(res, 403);
    const info = await stat(file).catch(() => null);
    if (!info || info.isDirectory()) file = join(ROOT, 'index.html');
    res.setHeader('Content-Type', TYPES[extname(file)] || 'application/octet-stream');
    if (path.startsWith('assets')) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    createReadStream(file).on('error', (e) => fail(res, e.code === 'ENOENT' ? 404 : 500)).pipe(res);
  } catch {
    fail(res, 500);
  }
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  server.listen(PORT, () => console.log(`upkero-site on http://localhost:${PORT}`));
}
