import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const port = Number(process.env.PORT || 4173);
const prefix = process.env.BASE_PATH || '/';
if (!prefix.startsWith('/') || !prefix.endsWith('/')) throw new Error('BASE_PATH must start and end with /');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.mjs': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };
http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);
    if (!pathname.startsWith(prefix)) throw new Error('Not found');
    const relative = pathname.slice(prefix.length) || 'index.html';
    const filename = path.resolve(root, relative);
    if (!filename.startsWith(root)) throw new Error('Not found');
    const body = await readFile(filename);
    res.writeHead(200, { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Sidan hittades inte.');
  }
}).listen(port, '0.0.0.0', () => console.log(`Preview: http://localhost:${port}${prefix}`));
