const CACHE_NAME = "keiko-note-v9";
const APP_SHELL = [
  "/manifest.webmanifest",
  "/assets/app-icon-192.png",
  "/assets/app-icon-512.png",
  "/assets/favicon.png",
  "/assets/pomegranate-clean.png",
  "/assets/sword-cropped.png",
  "/assets/title-line-v2-cropped.png",
  "/assets/attendance-people.png",
  "/assets/attendance-rate-icon.png",
  "/assets/calendar-cute-icon.png",
  "/assets/current-rehearsal-calendar.png",
  "/assets/no-reply-icon.png",
  "/assets/notice-megaphone.png",
  "/assets/scene-checklist.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.hostname.includes("supabase.co")) return;

  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => caches.match("/")));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request)),
  );
});

self.addEventListener("push", (event) => {
  const fallback = {
    title: "ザクロ稽古ノート",
    body: "今日はザクロの稽古日だよ！がんばろうね！",
  };
  let data = fallback;
  try {
    data = event.data ? event.data.json() : fallback;
  } catch (error) {
    data = fallback;
  }
  event.waitUntil(
    self.registration.showNotification(data.title ?? fallback.title, {
      body: data.body ?? fallback.body,
      icon: "/assets/app-icon-192.png",
      badge: "/assets/favicon.png",
      data: {
        url: data.url ?? "/",
      },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => client.url.includes(self.location.origin));
      if (existing) return existing.focus();
      return self.clients.openWindow(targetUrl);
    }),
  );
});
