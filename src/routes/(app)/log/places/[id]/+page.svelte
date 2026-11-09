<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import EntryCard from '$lib/components/EntryCard.svelte';
	import PlaceForm from '$lib/components/PlaceForm.svelte';
	import MapView from '$lib/components/MapView.svelte';
	import { placeStatusLabel, walkRating } from '$lib/places';
	import Directions from '$lib/components/Directions.svelte';

	let { data, form } = $props();
	const p = $derived(data.place);
	let editing = $state(false);
	let confirming = $state(false);
	$effect(() => {
		void data.place;
		editing = Boolean(form?.errors);
	});
</script>

<svelte:head><title>{p.name} · Places · Lead</title></svelte:head>

<a class="btn btn-ghost mb-6 min-h-11 px-4" href={resolve('/log/places')}>← Places</a>

{#if editing}
	<h1 class="mb-6 text-[2.6rem] leading-[0.9] font-extrabold tracking-[-0.05em]">Edit place</h1>
	<PlaceForm
		values={form?.values ?? data.values}
		errors={form?.errors}
		submitLabel="Save changes"
		action="?/save"
	>
		{#snippet map(pick)}<MapView {pick} autoOpen={false} searchable />{/snippet}
	</PlaceForm>
	<button class="btn btn-ghost mt-3 w-full" onclick={() => (editing = false)}>Cancel</button>
{:else}
	<p class="text-sm font-bold {p.status === 'BEEN' ? '' : 'text-muted'}">
		{placeStatusLabel[p.status]}
	</p>
	<h1 class="text-[2.6rem] leading-[0.9] font-extrabold tracking-[-0.05em] break-words">
		{p.name}
	</h1>
	{#if p.recommendedBy}<p class="hand mt-1 text-2xl text-muted">
			Recommended by {p.recommendedBy}
		</p>{/if}

	{#if data.verdict.walks}
		<p class="mt-3 font-semibold">
			{data.verdict.walks} walk{data.verdict.walks === 1 ? '' : 's'} here
			{#if data.verdict.good + data.verdict.ok + data.verdict.bad}
				<span class="ml-1 text-muted">
					<span aria-label="{data.verdict.good} good">👍 {data.verdict.good}</span> ·
					<span aria-label="{data.verdict.ok} in between">👌 {data.verdict.ok}</span> ·
					<span aria-label="{data.verdict.bad} not great">👎 {data.verdict.bad}</span>
				</span>
			{/if}
		</p>
		{#if data.verdict.top}<p class="text-sm text-muted">
				Mostly {walkRating[data.verdict.top].label.toLowerCase()}
				{walkRating[data.verdict.top].emoji}
			</p>{/if}
	{/if}

	{#if p.tags.length}
		<ul class="mt-4 flex flex-wrap gap-1.5" aria-label="Good to know">
			{#each p.tags as t (t)}<li class="rounded-full bg-paper px-3 py-1 text-sm font-semibold">
					{t}
				</li>{/each}
		</ul>
	{/if}
	{#if p.notes}<p class="mt-4 whitespace-pre-line">{p.notes}</p>{/if}

	<div class="mt-6 grid grid-cols-2 items-start gap-2.5">
		<a class="btn" href="{resolve('/log/new')}?type=WALK&place={p.id}">Log a walk here</a>
		<Directions place={p} />
	</div>

	{#if data.walks.length}
		<h2 class="mt-9 mb-3 text-[1.375rem] font-extrabold tracking-tight">Walks here</h2>
		<ul class="grid gap-2.5">
			{#each data.walks as entry (entry.id)}<li class="min-w-0"><EntryCard {entry} /></li>{/each}
		</ul>
	{/if}

	<p class="mt-8 text-sm text-muted">
		Added{p.addedBy ? ` by ${p.addedBy}` : ''} on {new Date(p.createdAt).toLocaleDateString(
			'en-GB',
			{ day: 'numeric', month: 'long', year: 'numeric' }
		)}
	</p>
	<div class="mt-3 grid grid-cols-2 gap-2.5">
		<button class="btn btn-ghost" onclick={() => (editing = true)}>Edit</button>
		{#if confirming}
			<form method="POST" action="?/delete" use:enhance>
				<button class="btn w-full bg-late">Yes, remove</button>
			</form>
		{:else}
			<button class="btn btn-ghost" onclick={() => (confirming = true)}>Remove…</button>
		{/if}
	</div>
{/if}
