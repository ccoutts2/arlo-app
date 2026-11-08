<script lang="ts">
	import { resolve } from '$app/paths';
	import LogForm from '$lib/components/LogForm.svelte';

	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { localParts } from '$lib/time';
	import type { LogFormValues } from '$lib/schemas/log';

	let { data, form } = $props();

	// Offline, this page can come from the phone's saved copy, so set the time and the
	// session details (?duration=…&skills=…) here as well as on the server.
	const values = $derived.by((): LogFormValues => {
		if (form?.values) return form.values;
		if (!browser) return data.values;
		const q = page.url.searchParams;
		const now = localParts(new Date(), data.tz);
		const clicks = Number(q.get('clicks'));
		return {
			...data.values,
			date: now.date,
			time: now.time,
			type: q.get('type') ?? data.values.type,
			petId: q.get('pet') ?? data.values.petId,
			durationMin: q.get('duration') ?? data.values.durationMin,
			skillIds: q.get('skills')?.split(',').filter(Boolean) ?? data.values.skillIds,
			body: clicks > 0 ? `${clicks} clicks.` : data.values.body
		};
	});
</script>

<svelte:head><title>Add to the log · Lead</title></svelte:head>

<a class="btn btn-ghost mb-6 min-h-11 px-4" href={resolve('/log')}>← Log</a>
<h1 class="mb-6 text-[2.6rem] leading-[0.9] font-extrabold tracking-[-0.05em]">Add to the log</h1>
{#if data.pets.length}
	<LogForm
		{values}
		errors={form?.errors}
		pets={data.pets}
		skillsByPet={data.skillsByPet}
		submitLabel="Save to the log"
	/>
{:else}
	<p class="text-muted">
		Add your dog first. <a
			class="font-bold underline underline-offset-4"
			href={resolve('/pets/new')}>Add a dog</a
		>
	</p>
{/if}
