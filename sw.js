/* Offline support (service worker).
   The first visit caches the page shell below plus every file the page loaded: index.html posts that list once it
   has loaded (fonts, three.js, sound clips). After that everything is served from the cache, so the game starts
   without internet. Pages and unversioned files are refreshed in the background when online, so a change shows up
   on the launch after next; files that never change at their URL (?v=N, pinned CDN files) are fetched once, and the
   ?v= files a refreshed page links are fetched with it, so the launch that first shows it works offline too. All
   tb-x games share one cache storage, so each game's caches carry its own prefix.
   Bump CACHE only when this file's logic changes; activate deletes this game's older caches. */
const PREFIX = 'sparkle-smile-';
const CACHE = PREFIX + 'v4';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon.svg', 'icon-180.png', 'icon-512.png'];
const mine = (url) => url.startsWith('http');   // this game's pages only ever load their own files and CDN files

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// files whose content never changes at the same URL: ?v=N is bumped whenever the file changes, CDN files are pinned
// to a version in their path, and Google's font files are named by their content
const fixed = (url) => {
  const u = new URL(url);
  return u.searchParams.has('v') || u.hostname === 'fonts.gstatic.com' || u.hostname === 'cdnjs.cloudflare.com'
    || (u.hostname === 'cdn.jsdelivr.net' && /@\d/.test(u.pathname));
};

// an unreadable (opaque) copy counts as several MB against the shared storage quota, so keep one only from a host
// that can't answer a CORS request; this site and these CDNs can, and store() asks them that way
const CORS = new Set(['fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com']);
const keep = (res, url) => {
  if (res.ok && !res.redirected) return true;
  const u = new URL(url);
  return res.type === 'opaque' && u.origin !== self.location.origin && !CORS.has(u.hostname);
};

// drop the older copies of a file (each ?v= bump is a new cache key, and a game's sound clips can be tens of MB).
// Only lower ?v= numbers go: a page still running the old version may fetch its files again, and that mustn't
// delete the new ones fetched ahead for the next launch. Other queries replace each other. Pages are left alone,
// so the shell's './' stays as the offline fallback.
const ver = (u) => (u.searchParams.has('v') ? Number(u.searchParams.get('v')) : NaN);
async function prune(cache, url) {
  const u = new URL(url);
  if (/(\/|\.html)$/.test(u.pathname)) return;
  for (const req of await cache.keys(url, { ignoreSearch: true, ignoreVary: true })) {
    const r = new URL(req.url);
    if (r.origin !== u.origin || r.pathname !== u.pathname || r.search === u.search) continue;
    if (isNaN(ver(r)) || isNaN(ver(u)) || ver(r) < ver(u)) await cache.delete(req, { ignoreVary: true });
  }
}

async function save(cache, req, res) {
  await cache.put(req, res);
  await prune(cache, typeof req === 'string' ? req : req.url);
}

async function store(cache, url) {
  if (await cache.match(url, { ignoreVary: true })) return prune(cache, url);   // (clears copies an old page put back)
  try {
    const res = await fetch(url, { mode: 'cors', cache: 'no-cache' }).catch(() => fetch(url, { mode: 'no-cors', cache: 'no-cache' }));
    if (keep(res, url)) await save(cache, url, res);
  } catch { /* offline or blocked: try again on a later visit */ }
}

// the font files named in a cached Google Fonts stylesheet (the page's list can miss them when the browser
// already had them in memory)
async function storeFonts(cache) {
  for (const req of await cache.keys()) {
    if (!req.url.includes('fonts.googleapis.com/css')) continue;
    const css = await (await cache.match(req)).text().catch(() => '');
    for (const m of css.matchAll(/url\((https:[^)]+)\)/g)) await store(cache, m[1]);
  }
}

// the ?v= files a freshly downloaded page links (its styles, scripts and import map), so the launch that first shows
// it doesn't need the network; files named in script (assets/…?v=${ASSET_V}) aren't seen and come when first used
async function storeLinked(cache, page) {
  const html = await page.text();
  const urls = [...html.matchAll(/["'(]([^"'()\s<>`]+\?v=\d+)["')]/g)].map((m) => new URL(m[1], page.url).href);
  await Promise.all(urls.filter((u) => u.startsWith(self.location.origin + '/')).map((u) => store(cache, u)));
}

self.addEventListener('message', (e) => {   // { cache: [urls] } from the page: everything it loaded
  const urls = e.data && Array.isArray(e.data.cache) ? e.data.cache.filter(mine) : [];
  if (urls.length) e.waitUntil(caches.open(CACHE).then((c) => Promise.all(urls.map((u) => store(c, u))).then(() => storeFonts(c))));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || !mine(req.url)) return;
  e.respondWith(caches.open(CACHE).then(async (cache) => {
    const nav = req.mode === 'navigate';
    const hit = await cache.match(req, { ignoreSearch: nav, ignoreVary: true });
    if (hit && !nav && fixed(req.url)) return hit;   // can't have changed: no need to ask the server
    // (the refresh always asks the server, so the browser's own cache can't hand back a stale copy: a local server
    // sends no caching rules, and a page would otherwise stay old for days)
    const net = fetch(nav ? req.url : req, { cache: 'no-cache' }).then((res) => {
      if (keep(res, req.url)) {
        const copy = res.clone(), page = nav && res.clone();
        e.waitUntil(save(cache, req, copy).then(() => page && storeLinked(cache, page)).catch(() => {}));
      }
      return res;
    });
    if (hit) { e.waitUntil(net.catch(() => {})); return hit; }   // cached: answer now, refresh in the background
    return net.catch(async () => (nav && await cache.match('./')) || Response.error());
  }));
});
