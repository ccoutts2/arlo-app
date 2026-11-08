// Browser side of notifications: permission, subscribing this device, and install detection.
import { env } from '$env/dynamic/public';

export type DeviceState = 'unsupported' | 'needs-install' | 'blocked' | 'off' | 'on';

export const isIos = () => /iPhone|iPad|iPod/.test(navigator.userAgent);
export const isStandalone = () =>
	matchMedia('(display-mode: standalone)').matches ||
	(navigator as Navigator & { standalone?: boolean }).standalone === true;

function urlB64ToUint8Array(base64: string) {
	const padding = '='.repeat((4 - (base64.length % 4)) % 4);
	const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
	return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export async function deviceState(): Promise<DeviceState> {
	// iPhone only allows web push for apps added to the Home Screen (iOS 16.4+).
	if (isIos() && !isStandalone()) return 'needs-install';
	if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window))
		return 'unsupported';
	if (Notification.permission === 'denied') return 'blocked';
	const reg = await navigator.serviceWorker.ready;
	const sub = await reg.pushManager.getSubscription();
	return sub && Notification.permission === 'granted' ? 'on' : 'off';
}

/** Must run from a tap (iOS requires a user gesture for the permission prompt). */
export async function turnOn(): Promise<DeviceState> {
	const permission = await Notification.requestPermission();
	if (permission !== 'granted') return permission === 'denied' ? 'blocked' : 'off';
	const reg = await navigator.serviceWorker.ready;
	const sub =
		(await reg.pushManager.getSubscription()) ??
		(await reg.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlB64ToUint8Array(env.PUBLIC_VAPID_KEY ?? '')
		}));
	const res = await fetch('/api/push/subscribe', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(sub.toJSON())
	});
	return res.ok ? 'on' : 'off';
}

export async function turnOff(): Promise<DeviceState> {
	const reg = await navigator.serviceWorker.ready;
	const sub = await reg.pushManager.getSubscription();
	if (sub) {
		await fetch('/api/push/subscribe', {
			method: 'DELETE',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ endpoint: sub.endpoint })
		});
		await sub.unsubscribe();
	}
	return 'off';
}
