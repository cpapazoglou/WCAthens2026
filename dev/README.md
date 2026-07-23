# Local CSS preview (dev tools)

Preview `CSS/styles.css` against the **live** WordCamp Athens 2026 site before
committing — nothing here touches production. Two ways, pick per page:

| Tool | Port | Use for | How you see changes |
|------|------|---------|---------------------|
| **Proxy** (`npm start`) | 5858 | **Public pages** | Browse the whole site through localhost; CSS auto-injected. Just refresh. |
| **CSS server + bookmarklet** (`npm run css`) | 5757 | **Logged-in / `?preview=true` pages** | Open the real page (logged in), click the bookmarklet. |

Both read `CSS/styles.css` fresh on every request — edit the file, refresh the
browser, see the change. No build step.

## One-time setup

Requires Node 18+.

```bash
cd dev
npm install
```

`dev/` is not committed (it never ships to production — only `CSS/styles.css`
does, via Remote CSS). Leave it untracked.

## A) Proxy — public pages (recommended)

```bash
cd dev
npm start
```

Then open the live path through the proxy, e.g.:

- http://localhost:5858/2026/
- http://localhost:5858/2026/sponsors/

Your local `CSS/styles.css` is injected **last in `<head>`**, so it overrides
the live/synced remote CSS at equal specificity. Links stay inside the proxy so
you can click around. Edit the CSS → refresh → done.

**Limit:** public pages only. The browser won't send your `wordcamp.org` login
cookie to `localhost`, so logged-in and `?preview=true` pages won't load fully —
use method B for those.

## B) CSS server + bookmarklet — logged-in / preview pages

Serves just the stylesheet so you can inject it onto the real (logged-in) page.

```bash
cd dev
npm run css      # serves http://localhost:5757/styles.css
```

**Create the bookmarklet once** (Chrome → `Ctrl+Shift+B` → right-click the
bookmarks bar → *Add page…*). Name it `WCA CSS`, and paste this as the URL:

```
javascript:(()=>{let l=document.getElementById('wca-inject');if(l)l.remove();l=document.createElement('link');l.id='wca-inject';l.rel='stylesheet';l.href='http://localhost:5757/styles.css?'+Date.now();document.head.appendChild(l);})();
```

Usage: open any `athens.wordcamp.org` page (e.g. the ticket preview
`/2026/?page_id=1856&preview=true`), click **WCA CSS**. Re-click after editing to
reload the latest. A page refresh removes it (nothing persists on the live site).

If Chrome blocks it (https page loading `http://localhost`): the shield/lock icon
in the address bar → allow insecure content for the site. (`http://localhost` is
usually allowed by default.)

## Deploy (for reference — not part of preview)

Previewing changes nothing live. To ship: commit + push `CSS/styles.css` to
GitHub `main`, then fire the sync webhook (see the repo `CLAUDE.md`).

## Official full-site local (heavy, rarely needed)

For CSS work the tools above are enough. To run the *whole* WordCamp.org stack
locally (Docker, full codebase, sample content) see the handbook:

- Setting up a Local WordCamp.org Sandbox — https://make.wordpress.org/community/handbook/wordcamp-organizer/first-steps/web-presence/contributing-to-wordcamp-org/setting-up-a-local-wordcamp-org-sandbox/
- WordPress Meta Environment — https://make.wordpress.org/meta/2014/06/23/wordpress-meta-environment/
