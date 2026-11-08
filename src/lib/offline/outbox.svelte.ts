// The outbox: log entries saved on this phone while offline, sent when there's a signal.
// Stored in IndexedDB (photos included). Each entry has a clientId, so sending twice saves once.

type Field = [string, string | File];
export type OutboxItem = {
	id: string;
	url: string;
	fields: Field[];
	label: string;
	createdAt: number;
};

const DB = 'lead';
const STORE = 'outbox';

function open(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB, 1);
		req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}
async function tx<T>(
	mode: IDBTransactionMode,
	fn: (s: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
	const db = await open();
	return new Promise((resolve, reject) => {
		const req = fn(db.transaction(STORE, mode).objectStore(STORE));
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

export const outbox = $state({ pending: 0, syncing: false, lastError: '' });

async function refresh() {
	outbox.pending = ((await tx('readonly', (s) => s.getAll())) as OutboxItem[]).length;
}

export async function queue(url: string, form: FormData, label: string) {
	const fields = [...form.entries()].filter(
		([, v]) => typeof v === 'string' || v.size > 0
	) as Field[];
	const id = String(form.get('clientId') || crypto.randomUUID());
	const item: OutboxItem = { id, url, fields, label, createdAt: Date.now() };
	await tx('readwrite', (s) => s.put(item));
	await refresh();
}

/** Sends everything waiting. Stops at the first network failure (still offline). */
export async function sync() {
	if (outbox.syncing || !navigator.onLine) return refresh();
	outbox.syncing = true;
	outbox.lastError = '';
	try {
		const items = (await tx('readonly', (s) => s.getAll())) as OutboxItem[];
		for (const item of items.sort((a, b) => a.createdAt - b.createdAt)) {
			const body = new FormData();
			for (const [k, v] of item.fields) body.append(k, v);
			let res: Response;
			try {
				res = await fetch(item.url, {
					method: 'POST',
					body,
					headers: { 'x-sveltekit-action': 'true' }
				});
			} catch {
				break; // no signal after all
			}
			const result = (await res.json().catch(() => ({ type: 'error' }))) as { type: string };
			if (result.type === 'redirect' || result.type === 'success') {
				await tx('readwrite', (s) => s.delete(item.id));
			} else if (result.type === 'failure') {
				// Refused by the server (e.g. the dog was removed meanwhile): drop it and say so.
				await tx('readwrite', (s) => s.delete(item.id));
				outbox.lastError = `“${item.label}” couldn’t be saved because it no longer matches a dog in Lead.`;
			} else {
				break;
			}
		}
	} finally {
		outbox.syncing = false;
		await refresh();
	}
}

export async function clearOutbox() {
	await tx('readwrite', (s) => s.clear());
	await refresh();
}
