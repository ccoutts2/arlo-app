<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onDestroy, onMount } from 'svelte';
	import type { Map as MapboxMap, Marker } from 'mapbox-gl';

	type PlacePin = {
		id: string;
		name: string;
		status: 'WISHLIST' | 'BEEN';
		lat: number | null;
		lng: number | null;
	};
	let {
		places = [],
		pick,
		autoOpen = true,
		searchable = false,
		height = 'h-72'
	}: {
		places?: PlacePin[];
		/** Pin mode: tapping the map (or dragging the pin) sets these coordinates. */
		pick?: { lat: string; lng: string; set: (lat: string, lng: string) => void };
		/** Opening counts as a Mapbox map load, so forms open the map only when asked. */
		autoOpen?: boolean;
		searchable?: boolean;
		height?: string;
	} = $props();

	let mapState = $state<'idle' | 'loading' | 'ready' | 'paused'>('idle');
	let message = $state('');
	let container: HTMLDivElement;
	let map: MapboxMap | null = null;
	let pin: Marker | null = null;
	let mapbox: typeof import('mapbox-gl').default;
	const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
	const LONDON: [number, number] = [-0.1276, 51.5072];

	async function open() {
		if (mapState === 'loading' || mapState === 'ready') return;
		mapState = 'loading';
		const res = await fetch('/api/maps/ticket', { method: 'POST' }).catch(() => null);
		const ticket = (await res?.json().catch(() => null)) as {
			ok: boolean;
			token?: string;
			message?: string;
		} | null;
		if (!ticket?.ok || !ticket.token) {
			mapState = 'paused';
			message = ticket?.message ?? 'The map needs a connection.';
			return;
		}
		mapbox = (await import('mapbox-gl')).default;
		await import('mapbox-gl/dist/mapbox-gl.css');
		mapbox.accessToken = ticket.token;
		const located = places.filter((p) => p.lat !== null && p.lng !== null);
		const start: [number, number] =
			pick?.lat && pick.lng
				? [Number(pick.lng), Number(pick.lat)]
				: located[0]
					? [located[0].lng!, located[0].lat!]
					: LONDON;
		map = new mapbox.Map({
			container,
			style: 'mapbox://styles/mapbox/outdoors-v12',
			center: start,
			zoom: pick?.lat ? 15 : located.length ? 12 : 10
		});
		map.addControl(new mapbox.NavigationControl({ showCompass: false }), 'top-right');
		if (located.length > 1 && !pick?.lat) {
			const b = new mapbox.LngLatBounds();
			located.forEach((p) => b.extend([p.lng!, p.lat!]));
			map.fitBounds(b, { padding: 48, maxZoom: 14, animate: false });
		}
		for (const p of located) {
			const el = document.createElement('button');
			el.type = 'button';
			el.className = `lead-marker ${p.status === 'BEEN' ? 'been' : 'wish'}`;
			el.setAttribute(
				'aria-label',
				`${p.name}, ${p.status === 'BEEN' ? 'been' : 'on the wishlist'}`
			);
			el.innerHTML = `<span class="dot"></span><span class="name"></span>`;
			el.querySelector('.name')!.textContent = p.name;
			el.addEventListener('click', (e) => {
				e.stopPropagation();
				if (!pick) goto(resolve(`/log/places/${p.id}`));
			});
			new mapbox.Marker({ element: el, anchor: 'left' }).setLngLat([p.lng!, p.lat!]).addTo(map);
			// Mapbox relabels markers as a generic image; restore a useful name and the button role.
			el.setAttribute(
				'aria-label',
				`${p.name}, ${p.status === 'BEEN' ? 'been' : 'on the wishlist'}`
			);
			el.removeAttribute('role');
		}
		if (pick) {
			if (pick.lat && pick.lng) placePin(Number(pick.lng), Number(pick.lat));
			map.on('click', (e) => {
				placePin(e.lngLat.lng, e.lngLat.lat);
				pick!.set(e.lngLat.lat.toFixed(6), e.lngLat.lng.toFixed(6));
			});
		}
		mapState = 'ready';
	}

	function placePin(lng: number, lat: number) {
		if (!map) return;
		if (!pin) {
			pin = new mapbox.Marker({ color: '#2a1a10', draggable: true })
				.setLngLat([lng, lat])
				.addTo(map);
			pin.on('dragend', () => {
				const p = pin!.getLngLat();
				pick?.set(p.lat.toFixed(6), p.lng.toFixed(6));
			});
		} else pin.setLngLat([lng, lat]);
	}

	// Search moves the map; the person then taps to drop the pin (search results are never saved).
	let query = $state('');
	let results = $state<{ name: string; detail: string; lat: number; lng: number }[]>([]);
	let searchNote = $state('');
	let timer: ReturnType<typeof setTimeout>;
	function onSearch() {
		clearTimeout(timer);
		searchNote = '';
		if (query.trim().length < 3) return (results = []);
		timer = setTimeout(async () => {
			const c = map?.getCenter();
			const near = c ? `&near=${c.lng.toFixed(4)},${c.lat.toFixed(4)}` : '';
			const res = await fetch(
				`/api/maps/search?q=${encodeURIComponent(query.trim())}${near}`
			).catch(() => null);
			const body = (await res?.json().catch(() => null)) as {
				results: typeof results;
				message?: string;
			} | null;
			results = body?.results ?? [];
			searchNote =
				body?.message ?? (results.length ? '' : 'No matches. Try a nearby town or postcode.');
		}, 450);
	}
	function goTo(r: (typeof results)[number]) {
		results = [];
		query = r.name;
		if (!map) return;
		const opts = { center: [r.lng, r.lat] as [number, number], zoom: 15 };
		if (reduce()) map.jumpTo(opts);
		else map.flyTo({ ...opts, speed: 1.6 });
		searchNote = pick ? 'Now tap the map to drop the pin exactly where you mean.' : '';
	}

	onMount(() => {
		if (autoOpen) void open();
	});
	onDestroy(() => map?.remove());
</script>

<div class="grid gap-2">
	{#if searchable && mapState === 'ready'}
		<div class="relative">
			<label class="sr-only" for="map-search">Search for a place</label>
			<input
				id="map-search"
				bind:value={query}
				oninput={onSearch}
				placeholder="Search for a park or town"
				autocomplete="off"
				class="min-h-12 w-full rounded-[14px] border-2 border-line bg-paper px-4 focus-visible:border-ink focus-visible:outline-none"
			/>
			{#if results.length}
				<ul
					class="paper absolute inset-x-0 top-[calc(100%+4px)] z-10 grid overflow-hidden p-1"
					role="listbox"
					aria-label="Search results"
				>
					{#each results as r, i (i)}
						<li role="option" aria-selected="false">
							<button
								type="button"
								class="w-full rounded-xl px-3 py-2.5 text-left hover:bg-biscuit/50"
								onclick={() => goTo(r)}
							>
								<span class="block font-semibold">{r.name}</span><span
									class="block truncate text-sm text-muted">{r.detail}</span
								>
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
		{#if searchNote}<p class="text-sm text-muted" role="status">{searchNote}</p>{/if}
	{/if}

	<div
		class="relative overflow-hidden rounded-[18px] {mapState === 'idle' || mapState === 'paused'
			? ''
			: height} {mapState === 'ready' || mapState === 'loading'
			? 'shadow-[inset_0_0_0_1.5px_var(--color-line)]'
			: ''}"
	>
		<!-- Mapbox makes the container position:relative, so it needs its own size (not inset-0). Mapbox labels its canvas as the "Map" region. -->
		<div bind:this={container} class="size-full"></div>
		{#if mapState === 'loading'}<p
				class="absolute inset-0 grid place-items-center bg-paper/70 text-sm font-semibold"
			>
				Loading map…
			</p>{/if}
	</div>
	{#if mapState === 'idle'}
		<button type="button" class="btn btn-ghost min-h-12" onclick={open}
			>{pick ? 'Pick on map' : 'Show map'}</button
		>
	{:else if mapState === 'paused'}
		<p
			class="rounded-2xl bg-paper px-4 py-3 text-sm font-semibold shadow-[inset_0_0_0_1.5px_var(--color-line)]"
			role="status"
		>
			{message}
		</p>
	{:else if pick && mapState === 'ready' && !pick.lat}
		<p class="text-sm text-muted">Tap the map to drop a pin. You can drag it to adjust.</p>
	{/if}
</div>

<style>
	:global(.lead-marker) {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 0;
		background: none;
		border: 0;
		cursor: pointer;
	}
	:global(.lead-marker .dot) {
		width: 16px;
		height: 16px;
		border-radius: 999px;
		border: 3px solid var(--color-ink);
		background: var(--color-paper);
		box-shadow: 0 0 0 2px var(--color-paper);
		translate: -8px 0;
	}
	:global(.lead-marker.been .dot) {
		background: var(--color-ink);
	}
	:global(.lead-marker .name) {
		translate: -8px 0;
		max-width: 140px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font: 700 12px/1 var(--font-display);
		color: var(--color-ink);
		background: var(--color-paper);
		padding: 4px 7px;
		border-radius: 999px;
		box-shadow: 0 1px 4px rgb(42 26 16 / 0.25);
	}
	:global(.lead-marker:focus-visible) {
		outline: 3px solid var(--color-ink);
		outline-offset: 2px;
		border-radius: 999px;
	}
</style>
