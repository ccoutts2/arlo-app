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
	// Pages and data: always the network, so doses are never stale. Offline logging comes in phase 6.
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
