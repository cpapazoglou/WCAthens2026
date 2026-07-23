// Static server for the bookmarklet workflow: serves ../CSS/styles.css at
// http://localhost:5757/styles.css (CORS + no-store, read fresh each request).
// Use this for LOGGED-IN / ?preview=true pages where the proxy can't carry the
// session cookie — click the bookmarklet (see README) to inject it.
//
//   cd dev && npm run css

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSS_FILE = path.resolve(__dirname, '../CSS/styles.css');
const PORT = 5757;

http
  .createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'text/css; charset=utf-8');
    try {
      res.end(fs.readFileSync(CSS_FILE, 'utf8'));
    } catch (e) {
      res.statusCode = 500;
      res.end('/* ' + String(e) + ' */');
    }
  })
  .listen(PORT, () => console.log(`CSS server → http://localhost:${PORT}/styles.css`));
