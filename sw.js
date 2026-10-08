/* Offline support (service worker).
   The first visit caches the page shell below plus every file the page loaded: index.html posts that list once it
   has loaded (fonts, three.js, sound clips). After that everything is served from the cache, so the game starts
   without internet, and each file is refreshed in the background when online, so a change shows up on the launch
   after next. All tb-x games share one cache storage, so each game's caches carry its own prefix.
   Bump CACHE only when this file's logic changes; activate deletes this game's older caches. */
const PREFIX = 'sparkle-smile-';
const CACHE = PREFIX + 'v1';
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

const keep = (res) => (res.ok && !res.redirected) || res.type === 'opaque';

async function store(cache, url) {
  if (await cache.match(url, { ignoreVary: true })) return;
  try {
    const res = await fetch(url, { mode: 'cors' }).catch(() => fetch(url, { mode: 'no-cors' }));
    if (keep(res)) await cache.put(url, res);
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
    const net = fetch(req).then((res) => { if (keep(res)) cache.put(req, res.clone()); return res; });
    if (hit) { e.waitUntil(net.catch(() => {})); return hit; }   // cached: answer now, refresh in the background
    return net.catch(async () => (nav && await cache.match('./')) || Response.error());
  }));
});
