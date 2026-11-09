<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { directionsLinks, mapsAppLabel, type MapsApp } from '$lib/places';

	let { place }: { place: { name: string; lat: number | null; lng: number | null } } = $props();

	// The maps app is remembered per phone (people in one household may use different apps).
	const KEY = 'lead.mapsApp';
	let preferred = $state<MapsApp | null>(null);
	let choosing = $state(false);
	let remember = $state(true);
	const links = $derived(directionsLinks(place));
	const apps: MapsApp[] = ['apple', 'google', 'waze'];

	onMount(() => {
		try {
			const v = localStorage.getItem(KEY);
			if (v === 'apple' || v === 'google' || v === 'waze') preferred = v;
		} catch {
			/* private mode: ask each time */
		}
	});
	function choose(app: MapsApp) {
		if (remember) {
			try {
				localStorage.setItem(KEY, app);
			} catch {
				/* ignore */
			}
			preferred = app;
		}
		choosing = false;
	}
	function change() {
		try {
			localStorage.removeItem(KEY);
		} catch {
			/* ignore */
		}
		preferred = null;
		choosing = true;
	}
</script>

<div class="grid gap-1">
	{#if preferred}
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
		<a class="btn btn-ghost w-full" href={links[preferred]} target="_blank" rel="noopener"
			>Directions</a
		>
		<button
			type="button"
			class="text-xs font-semibold text-muted underline underline-offset-2"
			onclick={change}
		>
			Opens {mapsAppLabel[preferred]} · change
		</button>
	{:else}
		<button
			type="button"
			class="btn btn-ghost w-full"
			aria-haspopup="dialog"
			onclick={() => (choosing = true)}>Directions</button
		>
	{/if}
</div>

{#if choosing}
	<div
		class="fixed inset-0 z-40 bg-ink/30"
		aria-hidden="true"
		onclick={() => (choosing = false)}
	></div>
	<div
		role="dialog"
		aria-modal="true"
		aria-labelledby="dir-h"
		tabindex="-1"
		class="paper fixed inset-x-3 bottom-[max(16px,env(safe-area-inset-bottom))] z-50 mx-auto grid max-w-[416px] gap-3 p-5 shadow-bar"
		transition:fly={{ y: 24, duration: 300, easing: cubicOut }}
		onkeydown={(e) => e.key === 'Escape' && (choosing = false)}
	>
		<h2 id="dir-h" class="text-xl font-extrabold tracking-tight">Directions to {place.name}</h2>
		<div class="grid gap-2">
			{#each apps as app (app)}
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a class="btn" href={links[app]} target="_blank" rel="noopener" onclick={() => choose(app)}
					>Open in {mapsAppLabel[app]}</a
				>
			{/each}
		</div>
		<label class="flex items-center gap-2 text-sm font-semibold">
			<input
				type="checkbox"
				bind:checked={remember}
				class="size-5 accent-[var(--color-ink)]"
			/>Remember my choice on this phone
		</label>
		<button type="button" class="btn btn-ghost" onclick={() => (choosing = false)}>Cancel</button>
	</div>
{/if}
