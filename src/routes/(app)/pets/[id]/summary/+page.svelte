<script lang="ts">
	import { resolve } from '$app/paths';
	import { levelLabel } from '$lib/log';
	import { sexLabel } from '$lib/format';

	let { data } = $props();
	const p = $derived(data.pet);
</script>

<svelte:head><title>{p.name} · summary for the vet · Lead</title></svelte:head>

<div class="no-print mb-6 flex flex-wrap gap-2">
	<a class="btn btn-ghost min-h-11 px-4" href={resolve(`/pets/${p.id}`)}>← {p.name}</a>
	<button class="btn min-h-11 px-5" onclick={() => print()}>Print or save as PDF</button>
</div>

{#snippet table(title: string, head: string[], rows: (string | number)[][], empty: string)}
	<section>
		<h2 class="mb-2 text-lg font-extrabold">{title}</h2>
		{#if rows.length}
			<table class="w-full text-sm">
				<thead>
					<tr
						>{#each head as h (h)}<th scope="col" class="border-b-2 border-ink py-1 pr-2 text-left"
								>{h}</th
							>{/each}</tr
					>
				</thead>
				<tbody>
					{#each rows as r, i (i)}<tr class="border-b border-line"
							>{#each r as c, j (j)}<td class="py-1.5 pr-2 align-top">{c}</td>{/each}</tr
						>{/each}
				</tbody>
			</table>
		{:else}<p class="text-sm text-muted">{empty}</p>{/if}
	</section>
{/snippet}

<article class="summary grid gap-6">
	<header>
		<p class="text-sm text-muted">Summary from Lead · {data.generated}</p>
		<h1 class="text-[2.6rem] leading-[0.9] font-extrabold tracking-[-0.05em]">{p.name}</h1>
		<p class="mt-1">
			{[
				p.breed,
				p.sex !== 'UNKNOWN' ? sexLabel[p.sex] : null,
				p.birthday ? `born ${p.birthday}` : null,
				p.weightKg ? `${p.weightKg} kg` : null
			]
				.filter(Boolean)
				.join(' · ')}
		</p>
		{#if p.microchip}<p class="text-sm">Microchip {p.microchip}</p>{/if}
		{#if p.neutered !== null}<p class="text-sm">{p.neutered ? 'Neutered' : 'Not neutered'}</p>{/if}
		{#if p.allergies}<p class="mt-2 font-semibold text-late">Allergies: {p.allergies}</p>{/if}
	</header>

	{@render table(
		'Current treatments',
		['Treatment', 'Dose', 'Schedule'],
		data.care.map((c) => [c.title, c.dose ?? '', c.schedule]),
		'None recorded.'
	)}
	{@render table(
		'Given in the last 30 days',
		['Treatment', 'Due', 'By'],
		data.given.map((g) => [g.title, g.due, g.status === 'DONE' ? g.by : 'Skipped']),
		'Nothing recorded.'
	)}
	{@render table(
		'Vaccinations',
		['Vaccine', 'Given'],
		data.vaccines.map((v) => [v.title, v.on]),
		'None recorded in Lead.'
	)}
	{@render table(
		'Weight',
		['Date', 'kg'],
		data.weights.map((w) => [w.on, w.kg]),
		'No weights recorded.'
	)}
	{@render table(
		'Health notes, last 90 days',
		['Date', 'Noticed', 'Notes'],
		data.health.map((h) => [h.on, h.tags.join(', '), h.body ?? '']),
		'Nothing noted.'
	)}
	{#if data.skills.length}
		{@render table(
			'Training',
			['Skill', 'Level'],
			data.skills.map((s) => [s.name, levelLabel[s.level]]),
			''
		)}
	{/if}
	{#if p.vetName}<p class="text-sm text-muted">
			Usual vet: {p.vetName}{p.vetPhone ? `, ${p.vetPhone}` : ''}
		</p>{/if}
</article>

<style>
	@media print {
		:global(html),
		:global(body) {
			background: white !important;
		}
		:global(nav),
		:global(.no-print),
		:global([role='status']) {
			display: none !important;
		}
		.summary {
			font-size: 11pt;
		}
	}
</style>
