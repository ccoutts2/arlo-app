<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import EntryCard from '$lib/components/EntryCard.svelte';
	import LogForm from '$lib/components/LogForm.svelte';

	let { data, form } = $props();
	let editing = $state(false);
	let confirming = $state(false);
	// After a save the entry reloads: show it, unless the save came back with errors to fix.
	$effect(() => {
		void data.entry;
		editing = Boolean(form?.errors);
	});
</script>

<svelte:head><title>Log entry · Lead</title></svelte:head>

<a class="btn btn-ghost mb-6 min-h-11 px-4" href={resolve('/log')}>← Log</a>
{#if editing}
	<h1 class="mb-6 text-[2.6rem] leading-[0.9] font-extrabold tracking-[-0.05em]">Edit entry</h1>
	<LogForm
		values={form?.values ?? data.values}
		errors={form?.errors}
		pets={data.pets}
		skillsByPet={data.skillsByPet}
		places={data.places}
		submitLabel="Save changes"
		action="?/save"
	/>
	<button class="btn btn-ghost mt-3 w-full" onclick={() => (editing = false)}>Cancel</button>
{:else}
	<h1 class="sr-only">Log entry for {data.entry.pet.name}</h1>
	<EntryCard entry={data.entry} full />
	<p class="mt-3 text-sm text-muted">
		{new Date(data.entry.date + 'T12:00:00Z').toLocaleDateString('en-GB', {
			weekday: 'long',
			day: 'numeric',
			month: 'long'
		})}
	</p>
	<div class="mt-6 grid grid-cols-2 gap-2.5">
		<button class="btn btn-ghost" onclick={() => (editing = true)}>Edit</button>
		{#if confirming}
			<form method="POST" action="?/delete" use:enhance>
				<button class="btn w-full bg-late">Yes, delete</button>
			</form>
		{:else}
			<button class="btn btn-ghost" onclick={() => (confirming = true)}>Delete…</button>
		{/if}
	</div>
{/if}
