/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `lead-${version}`;
// The app shell: built JS/CSS plus everything in /static.
const ASSETS = [...build, ...files];

sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(ASSETS))
			.then(() => sw.skipWaiting())
	);
});

// A new version clears old assets and saved screens (they point at the old build's files);
// screens are saved again as they're used online.
sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
			.then(() => sw.clients.claim())
	);
});

sw.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;
	const url = new URL(request.url);
	if (url.origin !== sw.location.origin) return;

	// Static assets: cache first (they are versioned).
	if (ASSETS.includes(url.pathname)) {
		event.respondWith(caches.match(request).then((hit) => hit ?? fetch(request)));
		return;
	}
	// Pages and their data: network first, so doses are never stale; if there's no signal, the
	// last copy of that screen is used (query strings ignored, the page fills those in itself).
	if (isAppPage(url)) {
		event.respondWith(networkFirst(request));
	}
});

const PAGES = 'lead-pages';
const NO_CACHE = ['/api/', '/auth/', '/files/', '/join/'];

function isAppPage(url: URL) {
	if (NO_CACHE.some((p) => url.pathname.startsWith(p))) return false;
	return true;
}

async function networkFirst(request: Request) {
	const cache = await caches.open(PAGES);
	try {
		const res = await fetch(request);
		// Only keep good, signed-in pages (a redirect to log in shouldn't be replayed offline).
		if (res.ok && !res.redirected) await cache.put(request, res.clone());
		return res;
	} catch {
		const hit =
			(await cache.match(request)) ?? (await cache.match(request, { ignoreSearch: true }));
		if (hit) return hit;
		return new Response(
			'<!doctype html><meta name="viewport" content="width=device-width"><body style="font-family:system-ui;padding:24px;background:#ebc995;color:#2a1a10"><h1>You’re offline</h1><p>Open this screen once with a signal and Lead will keep it for next time.</p><p><a href="/">Back to Today</a></p>',
			{ status: 503, headers: { 'content-type': 'text/html; charset=utf-8' } }
		);
	}
}

// Logging out wipes saved screens so the next person on this phone can't see them.
sw.addEventListener('message', (event) => {
	if (event.data === 'clear-pages') event.waitUntil(caches.delete(PAGES));
});

// ---- Push notifications ----
type Payload = { title: string; body: string; url: string; tag?: string; badge?: number };
type BadgeNav = { setAppBadge?: (n: number) => Promise<void>; clearAppBadge?: () => Promise<void> };

sw.addEventListener('push', (event) => {
	const data: Payload = event.data?.json() ?? {
		title: 'Lead',
		body: 'Something is due.',
		url: '/'
	};
	const nav = sw.navigator as unknown as BadgeNav;
	event.waitUntil(
		Promise.all([
			sw.registration.showNotification(data.title, {
				body: data.body,
				tag: data.tag, // a later push for the same dose replaces the earlier one
				icon: '/icons/icon-192.png',
				badge: '/icons/icon-192.png',
				data: { url: data.url }
			}),
			typeof data.badge === 'number'
				? data.badge > 0
					? nav.setAppBadge?.(data.badge)
					: nav.clearAppBadge?.()
				: undefined
		])
	);
});

// Tapping a notification opens that dose's Mark given screen (iOS web push has no action buttons).
sw.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const url = new URL((event.notification.data?.url as string) ?? '/', sw.location.origin).href;
	event.waitUntil(
		sw.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (windows) => {
			const open = windows.find((w) => new URL(w.url).origin === sw.location.origin) as
				| WindowClient
				| undefined;
			if (open) {
				await open.focus();
				return open.navigate(url);
			}
			return sw.clients.openWindow(url);
		})
	);
});
