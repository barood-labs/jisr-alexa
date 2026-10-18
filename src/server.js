// HTTP server: MCP endpoint at /mcp (Streamable HTTP) + the Alexa+ simulator web app at /.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize as np } from 'node:path';
import { fileURLToPath } from 'node:url';
import { httpHandler, PROTOCOL } from './mcp.js';

const PUB = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'public');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };
const hits = new Map();

export function createServer() {
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://x');
      if (url.pathname === '/health') return json(res, 200, { ok: true, mcp: '/mcp', protocol: PROTOCOL });
      if (url.pathname === '/mcp') {
        const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress; const now = Date.now();
        const h = (hits.get(ip) || []).filter((t) => now - t < 60000); if (h.length >= 60) return json(res, 429, { error: 'rate limited' }); hits.set(ip, [...h, now]);
        return httpHandler(req, res, await readBody(req));
      }
      const p = np(url.pathname === '/' ? '/index.html' : url.pathname).replace(/^(\.\.[/\\])+/, '');
      const file = join(PUB, p);
      if (!file.startsWith(PUB)) return json(res, 403, { error: 'forbidden' });
      const data = await readFile(file).catch(() => null);
      if (!data) return json(res, 404, { error: 'not found' });
      res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' }); res.end(data);
    } catch (e) { json(res, 500, { error: e.message }); }
  });
}
function json(res, code, o) { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(o)); }
function readBody(req) { return new Promise((ok, bad) => { let b = ''; req.on('data', (c) => { b += c; if (b.length > 50000) { bad(new Error('body too large')); req.destroy(); } }); req.on('end', () => ok(b)); req.on('error', bad); }); }

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 8787;
  createServer().listen(port, () => console.log(`Jisr MCP on http://localhost:${port}/mcp · simulator on http://localhost:${port}/`));
}
