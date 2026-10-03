// Production server: serves dist/ and the /live bridge. No dependencies.
// Run: npm run build && node --env-file=.env.local server.mjs
import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { createLiveHandler } from './server/live.js';

const ROOT = join(import.meta.dirname, 'dist');
const PORT = Number(process.env.PORT) || 4173;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json',
};
const live = createLiveHandler(process.env);

http.createServer(async (req, res) => {
  if (req.url.startsWith('/live/')) {
    req.url = req.url.slice(5);
    return live(req, res);
  }
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
  let file = join(ROOT, path);
  if (!file.startsWith(ROOT)) { res.statusCode = 403; return res.end(); }
  const info = await stat(file).catch(() => null);
  if (!info || info.isDirectory()) file = join(ROOT, 'index.html');
  res.setHeader('Content-Type', TYPES[extname(file)] || 'application/octet-stream');
  if (path.startsWith('assets')) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`upkero-site on http://localhost:${PORT}`));
