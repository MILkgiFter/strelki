// Service worker: игра работает без сети после первого открытия.
// Страница — сначала сеть (чтобы приходили обновления), без сети — из кэша.
// Остальные файлы своего сайта — из кэша, с тихим обновлением в фоне.
// Подключается только в сборке (main.js, import.meta.env.PROD). Новая версия кэша — поменять VERSION.
const VERSION = 'strelki-v1'; // ignoreVary: сервер может отдавать Vary: Origin, а запрос модуля идёт с Origin
const BASE = new URL('./', self.registration.scope).href;
const CORE = ['./', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon.svg'].map(
  (p) => new URL(p, BASE).href,
);

// файлы сборки (скрипт и стили с хэшем в имени) берём из ссылок в самой странице:
// при первом заходе страница загрузила их ещё до service worker'а, и в кэш они бы не попали
async function pageAssets() {
  try {
    const html = await (await fetch(BASE, { cache: 'no-cache' })).text();
    return [...html.matchAll(/(?:src|href)="([^"#?]+)"/g)]
      .map((m) => new URL(m[1], BASE).href)
      .filter((u) => u.startsWith(BASE));
  } catch {
    return [];
  }
}

self.addEventListener('install', (e) => {
  // по одному: отсутствие необязательного файла не должно ломать установку
  e.waitUntil(
    Promise.all([caches.open(VERSION), pageAssets()])
      .then(async ([c, assets]) => {
        const keep = new Set([...CORE, ...assets]);
        await Promise.all([...keep].map((u) => c.add(u).catch(() => {})));
        // файлы прошлых сборок (другой хэш в имени) больше не нужны — кэш не растёт от деплоя к деплою
        if (assets.length) for (const r of await c.keys()) if (!keep.has(r.url)) await c.delete(r);
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(BASE)) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          // в кэш как «страницу игры» — только саму игру (не privacy.html и другие страницы)
          const isGame = new URL(req.url).pathname === new URL(BASE).pathname;
          if (res.ok && isGame) {
            const copy = res.clone(); // копию снимаем сразу: тело ответа заберёт страница
            e.waitUntil(caches.open(VERSION).then((c) => c.put(BASE, copy)));
          }
          return res;
        })
        .catch(() => caches.match(BASE, { ignoreVary: true })),
    );
    return;
  }

  e.respondWith(
    caches.open(VERSION).then((c) =>
      c.match(req, { ignoreVary: true }).then((hit) => {
        const net = fetch(req)
          .then((res) => {
            // HTML на месте файла — это «заглушка» хостинга для отсутствующего файла, не кэшируем
            if (res.ok && !(res.headers.get('content-type') || '').includes('text/html')) e.waitUntil(c.put(req, res.clone()));
            return res;
          })
          .catch(() => hit || Response.error());
        if (hit) e.waitUntil(net.then(() => {}));
        return hit || net;
      }),
    ),
  );
});
