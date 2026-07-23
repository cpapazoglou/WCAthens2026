// Local dev proxy for WordCamp Athens 2026.
// Browses the LIVE site through http://localhost:5858 and injects your local
// CSS/styles.css into every HTML page. Includes LIVE RELOAD: when you save
// CSS/styles.css the page hot-swaps the styles instantly — no manual refresh,
// no full reload (scroll position kept).
//
//   cd dev && npm install && npm start
//
// Notes / limits:
// - Public pages only. Logged-in / ?preview=true pages need the wordcamp.org
//   session cookie, which the browser won't send to localhost — use the
//   bookmarklet (localhost:5757, `npm run css`) for those.
// - Our <style> is injected LAST in <head>, so it overrides the live/synced
//   remote CSS at equal specificity (what we want while iterating).
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

const readCss = () => {
  try { return fs.readFileSync(CSS_FILE, 'utf8'); } catch (e) { return '/* ' + String(e) + ' */'; }
};
// cheap change token: file mtime (+ size). Changes on every save.
const cssVersion = () => {
  try { const s = fs.statSync(CSS_FILE); return s.mtimeMs + '-' + s.size; } catch { return '0'; }
};

// Injected once per page: our styles + a poller that hot-swaps them on change.
const liveReloadScript = `<script>(function(){var v=null;setInterval(function(){fetch('/__wca/version',{cache:'no-store'}).then(function(r){return r.text();}).then(function(t){if(v===null){v=t;return;}if(t!==v){v=t;fetch('/__wca/css',{cache:'no-store'}).then(function(r){return r.text();}).then(function(css){var el=document.getElementById('wca-local');if(el)el.textContent=css;});}}).catch(function(){});},1000);})();</script>`;

const proxy = createProxyMiddleware({
  target: TARGET,
  changeOrigin: true,
  selfHandleResponse: true,
  on: {
    proxyReq: (proxyReq) => {
      proxyReq.setHeader('accept-encoding', 'identity'); // decompress so we can edit the body
    },
    proxyRes: responseInterceptor(async (buf, proxyRes) => {
      const type = String(proxyRes.headers['content-type'] || '');
      if (!type.includes('text/html')) return buf;
      let html = buf.toString('utf8');
      html = html.split(TARGET).join(`http://localhost:${PORT}`);
      const inject = `<style id="wca-local">\n${readCss()}\n</style>${liveReloadScript}`;
      return html.includes('</head>') ? html.replace('</head>', inject + '</head>') : inject + html;
    }),
  },
});

http
  .createServer((req, res) => {
    // live-reload endpoints (same-origin → no CORS / mixed-content issues)
    if (req.url.startsWith('/__wca/version')) {
      res.setHeader('cache-control', 'no-store');
      res.setHeader('content-type', 'text/plain');
      return res.end(cssVersion());
    }
    if (req.url.startsWith('/__wca/css')) {
      res.setHeader('cache-control', 'no-store');
      res.setHeader('content-type', 'text/css; charset=utf-8');
      return res.end(readCss());
    }
    proxy(req, res, (err) => {
      res.statusCode = 502;
      res.end('proxy error: ' + String(err));
    });
  })
  .listen(PORT, () => {
    console.log(`WCA proxy → http://localhost:${PORT}  (local CSS injected + live reload on save)`);
  });
