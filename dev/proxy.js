// Local dev proxy for WordCamp Athens 2026.
// Browses the LIVE site through http://localhost:5858 and auto-injects your
// local CSS/styles.css into every HTML page (read fresh on each request) — so
// you edit the file, refresh the browser, and see changes. No bookmarklet.
//
//   cd dev && npm install && npm start
//
// Notes / limits:
// - Public pages only. Logged-in / ?preview=true pages need the wordcamp.org
//   session cookie, which the browser won't send to localhost — use the
//   bookmarklet (localhost:5757) for those, or preview a published page.
// - Our <style> is injected LAST in <head>, so it overrides the live/synced
//   remote CSS at equal specificity (exactly what we want while iterating).
// - athens.wordcamp.org links are rewritten to localhost so navigation stays
//   inside the proxy; assets proxy through too.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createProxyMiddleware, responseInterceptor } from 'http-proxy-middleware';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSS_FILE = path.resolve(__dirname, '../CSS/styles.css');
const TARGET = 'https://athens.wordcamp.org';
const PORT = 5858;

const proxy = createProxyMiddleware({
  target: TARGET,
  changeOrigin: true,
  selfHandleResponse: true,
  on: {
    proxyReq: (proxyReq) => {
      // decompress so we can edit the HTML body
      proxyReq.setHeader('accept-encoding', 'identity');
    },
    proxyRes: responseInterceptor(async (buf, proxyRes) => {
      const type = String(proxyRes.headers['content-type'] || '');
      if (!type.includes('text/html')) return buf;
      let html = buf.toString('utf8');
      html = html.split(TARGET).join(`http://localhost:${PORT}`);
      const css = fs.readFileSync(CSS_FILE, 'utf8');
      const tag = `<style id="wca-local">\n${css}\n</style>`;
      return html.includes('</head>') ? html.replace('</head>', tag + '</head>') : tag + html;
    }),
  },
});

http
  .createServer((req, res) => proxy(req, res, (err) => {
    res.statusCode = 502;
    res.end('proxy error: ' + String(err));
  }))
  .listen(PORT, () => {
    console.log(`WCA proxy → http://localhost:${PORT}  (local CSS auto-injected from CSS/styles.css)`);
  });
