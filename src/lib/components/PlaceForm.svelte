<script lang="ts">
	import { enhance } from '$app/forms';
	import Field from './Field.svelte';
	import Chip from './Chip.svelte';
	import { placeTags } from '$lib/places';
	import type { PlaceFormErrors, PlaceFormValues } from '$lib/schemas/place';
	import type { Snippet } from 'svelte';

	let {
		values,
		errors = {},
		submitLabel,
		action,
		map
	}: {
		values: PlaceFormValues;
		errors?: PlaceFormErrors;
		submitLabel: string;
		action?: string;
		/** Optional map pin picker (Mapbox), given the current lat/lng setters. */
		map?: Snippet<[{ lat: string; lng: string; set: (lat: string, lng: string) => void }]>;
	} = $props();

	const clone = (x: PlaceFormValues) => ({ ...x, tags: [...x.tags] });
	// Deeply reactive copy (a writable $derived isn't deep, so editing v.tags wouldn't update).
	// eslint-disable-next-line svelte/prefer-writable-derived
	let v = $state(clone(values));
	$effect(() => {
		v = clone(values);
	});
	let submitting = $state(false);
	let locating = $state(false);
	let locateError = $state('');

	function useLocation() {
		locateError = '';
		if (!('geolocation' in navigator))
			return (locateError = 'This phone can’t share its location.');
		locating = true;
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				v.lat = pos.coords.latitude.toFixed(6);
				v.lng = pos.coords.longitude.toFixed(6);
				locating = false;
			},
			() => {
				locating = false;
				locateError = 'Couldn’t get your location. Check Lead is allowed to use it in Settings.';
			},
			{ enableHighAccuracy: true, timeout: 10000 }
		);
	}
	const toggle = (list: string[], item: string, on: boolean) =>
		on ? [...new Set([...list, item])] : list.filter((x) => x !== item);
</script>

<form
	method="POST"
	{action}
	class="grid gap-5"
	novalidate
	use:enhance={() => {
		submitting = true;
		return async ({ update }) => {
			await update({ reset: false });
			submitting = false;
		};
	}}
>
	<fieldset>
		<legend class="mb-2 text-[0.9375rem] font-semibold">This place is</legend>
		<div
			class="grid grid-cols-2 gap-1 rounded-full bg-paper p-1 shadow-[inset_0_0_0_1.5px_var(--color-line)]"
		>
			{#each [['WISHLIST', 'On our wishlist'], ['BEEN', 'Somewhere we’ve been']] as [key, label] (key)}
				<label
					class="cursor-pointer rounded-full px-2 py-2.5 text-center text-sm font-semibold has-[:checked]:bg-ink has-[:checked]:text-paper has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ink"
				>
					<input
						class="sr-only"
						type="radio"
						name="status"
						value={key}
						bind:group={v.status}
					/>{label}
				</label>
			{/each}
		</div>
	</fieldset>

	<Field
		label="Name"
		name="name"
		bind:value={v.name}
		errors={errors.name ? [errors.name] : []}
		placeholder="Bushy Park"
	/>

	<fieldset class="grid gap-2">
		<legend class="mb-1 text-[0.9375rem] font-semibold">Where is it?</legend>
		<input type="hidden" name="lat" value={v.lat} />
		<input type="hidden" name="lng" value={v.lng} />
		{#if map}
			{@render map({ lat: v.lat, lng: v.lng, set: (lat, lng) => ((v.lat = lat), (v.lng = lng)) })}
		{/if}
		{#if v.lat && v.lng}
			<p class="text-sm font-semibold">
				Pin saved <button
					type="button"
					class="ml-1 underline underline-offset-4"
					onclick={() => ((v.lat = ''), (v.lng = ''))}>Remove pin</button
				>
			</p>
		{:else}
			<button type="button" class="btn btn-ghost min-h-12" onclick={useLocation} disabled={locating}
				>{locating ? 'Finding you…' : 'I’m here now: use my location'}</button
			>
			<p class="text-sm text-muted">
				Optional. Without a pin, directions search Apple Maps for the name.
			</p>
		{/if}
		{#if locateError || errors.lat}<p class="text-sm font-semibold text-late" role="alert">
				{locateError || errors.lat}
			</p>{/if}
	</fieldset>

	<Field
		label="Recommended by"
		name="recommendedBy"
		bind:value={v.recommendedBy}
		errors={errors.recommendedBy ? [errors.recommendedBy] : []}
		placeholder="Sarah, at the park"
	/>

	<fieldset>
		<legend class="mb-2 text-[0.9375rem] font-semibold">Good to know</legend>
		<div class="flex flex-wrap gap-2">
			{#each placeTags as tag (tag)}
				<Chip
					name="tags"
					value={tag}
					checked={v.tags.includes(tag)}
					onchange={(on) => (v.tags = toggle(v.tags, tag, on))}>{tag}</Chip
				>
			{/each}
		</div>
	</fieldset>

	<div class="field">
		<label for="f-notes">Notes</label>
		<textarea
			id="f-notes"
			name="notes"
			bind:value={v.notes}
			placeholder="Best route, where to park, busy times"
		></textarea>
		{#if errors.notes}<p class="error">{errors.notes}</p>{/if}
	</div>

	<button class="btn" disabled={submitting}>{submitting ? 'Saving…' : submitLabel}</button>
</form>
