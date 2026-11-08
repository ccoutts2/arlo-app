<script lang="ts">
	import { resolve } from '$app/paths';
	import { age, sexLabel } from '$lib/format';
	import { levelLabel } from '$lib/log';
	import EntryCard from '$lib/components/EntryCard.svelte';
	import WeightChart from '$lib/components/WeightChart.svelte';
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	const pet = $derived(data.pet);

	const facts = $derived(
		[
			['Breed', pet.breed],
			['Age', age(pet.birthday)],
			['Sex', pet.sex === 'UNKNOWN' ? null : sexLabel[pet.sex]],
			['Weight', pet.weightKg ? `${pet.weightKg} kg` : null],
			['Neutered', pet.neutered === null ? null : pet.neutered ? 'Yes' : 'No'],
			['Microchip', pet.microchip],
			['Allergies', pet.allergies]
		].filter((f): f is [string, string] => Boolean(f[1]))
	);
</script>

<svelte:head>
	<title>{pet.name} · Lead</title>
	<meta name="description" content="{pet.name}'s details, vet and treatments." />
</svelte:head>

<div class="relative -mx-4 -mt-[max(18px,env(safe-area-inset-top))]">
	{#if pet.photoId}
		<img
			src="/files/{pet.photoId}"
			alt={pet.name}
			class="aspect-[4/4.2] w-full rounded-b-none object-cover"
		/>
	{:else}
		<div
			class="hand grid aspect-[4/3] w-full place-items-center rounded-b-none bg-ink text-[9rem] text-paper/90"
			aria-hidden="true"
		>
			{pet.name[0]}
		</div>
	{/if}
	<a
		href={resolve('/pets')}
		class="absolute top-[max(12px,env(safe-area-inset-top))] left-4 rounded-full bg-paper px-4 py-2.5 text-sm font-bold transition-colors hover:bg-tennis"
		>← Dogs</a
	>
	<a
		href={resolve(`/pets/${pet.id}/edit`)}
		class="absolute top-[max(12px,env(safe-area-inset-top))] right-4 rounded-full bg-paper px-4 py-2.5 text-sm font-bold transition-colors hover:bg-tennis"
		>Edit</a
	>
</div>

<section class="paper tape relative -mt-16 p-5">
	<h1 class="text-[4.25rem] leading-[0.82] font-extrabold tracking-[-0.06em]">{pet.name}</h1>
	{#if pet.note}<p class="hand mt-1.5 inline-block -rotate-2 text-[1.625rem] text-muted">
			{pet.note}
		</p>{/if}
	{#if facts.length}
		<dl class="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
			{#each facts as [label, value] (label)}
				<div class="min-w-0">
					<dt class="text-xs font-semibold text-muted">{label}</dt>
					<dd class="font-bold break-words">{value}</dd>
				</div>
			{/each}
		</dl>
	{:else}
		<p class="mt-3 text-muted">
			No details yet. <a
				class="font-bold underline underline-offset-4"
				href={resolve(`/pets/${pet.id}/edit`)}>Add some</a
			>
		</p>
	{/if}
</section>

<h2
	class="mt-9 mb-3 flex items-baseline justify-between text-[1.375rem] font-extrabold tracking-tight"
>
	On the sheet
	<a
		class="rounded-full px-3 py-1.5 text-sm font-bold tracking-normal hover:bg-paper"
		href={resolve(`/pets/${pet.id}/care/new`)}>+ Add</a
	>
</h2>
{#if data.care.length}
	<ul class="grid gap-2.5">
		{#each data.care as c (c.id)}
			<li>
				<a
					href={resolve(`/pets/${pet.id}/care/${c.id}`)}
					class="paper group flex items-center gap-3 px-4 py-3 transition-[translate] duration-300 ease-pen hover:translate-x-1"
				>
					<span class="min-w-0 grow">
						<span class="block truncate font-bold">{c.title}</span>
						<span class="block text-sm text-muted"
							>{c.schedule}{c.stock !== null ? ` · ${c.stock} left` : ''}</span
						>
					</span>
					{#if c.next}
						<span
							class="hand shrink-0 text-right text-xl leading-tight {c.next.late
								? 'text-late'
								: ''}">{c.next.late ? 'late' : c.next.label}</span
						>
					{/if}
				</a>
			</li>
		{/each}
	</ul>
{:else}
	<div class="grid gap-3 rounded-[22px] p-5 shadow-[inset_0_0_0_1.5px_var(--color-line)]">
		<p class="text-muted">
			Nothing on {pet.name}’s sheet yet. Add their meds, flea and worming treatments or a vet visit.
		</p>
		<a class="btn justify-self-start" href={resolve(`/pets/${pet.id}/care/new`)}>Add a treatment</a>
	</div>
{/if}

<h2 class="mt-9 mb-3 text-[1.375rem] font-extrabold tracking-tight">Weight</h2>
<section class="paper grid gap-3 p-4" aria-label="Weight">
	{#if data.weights.length > 1}
		{@const change = data.weights.at(-1)!.kg - data.weights.at(-2)!.kg}
		<WeightChart points={data.weights} />
		<p class="text-sm text-muted">
			{change === 0
				? 'Same as last time'
				: `${change > 0 ? 'Up' : 'Down'} ${Math.abs(change).toFixed(1)} kg since ${data.weights.at(-2)!.label}`}
		</p>
	{:else if data.weights.length === 1}
		<p>
			<span class="text-2xl font-extrabold tabular-nums">{data.weights[0].kg} kg</span>
			<span class="text-sm text-muted"
				>on {data.weights[0].label}. Add another to see the trend.</span
			>
		</p>
	{:else}
		<p class="text-muted">
			Weigh {pet.name} now and then to spot changes early. Handy for dosing by weight, too.
		</p>
	{/if}
	<form
		method="POST"
		action="?/weight"
		use:enhance={() =>
			async ({ update }) =>
				update({ reset: true })}
		class="flex items-end gap-2"
	>
		<label class="field grow"
			><span class="text-sm font-semibold">Weight today (kg)</span><input
				name="kg"
				inputmode="decimal"
				placeholder="24.6"
				required
			/></label
		>
		<button class="btn min-h-[52px] px-5">Add</button>
	</form>
	{#if form && 'weightError' in form}<p class="text-sm font-semibold text-late" role="alert">
			{form.weightError}
		</p>{/if}
	{#if data.weights.length > 1}
		<details>
			<summary class="cursor-pointer text-sm font-semibold">All weights</summary>
			<table class="mt-2 w-full text-sm">
				<thead
					><tr
						><th scope="col" class="text-left font-semibold text-muted">Date</th><th
							scope="col"
							class="text-right font-semibold text-muted">kg</th
						></tr
					></thead
				>
				<tbody>
					{#each [...data.weights].reverse() as w (w.id)}<tr class="border-t border-line"
							><td class="py-1.5">{w.label}</td><td class="text-right tabular-nums">{w.kg}</td></tr
						>{/each}
				</tbody>
			</table>
		</details>
	{/if}
</section>

<h2
	class="mt-9 mb-3 flex items-baseline justify-between text-[1.375rem] font-extrabold tracking-tight"
>
	Skills
	<a
		class="rounded-full px-3 py-1.5 text-sm font-bold tracking-normal hover:bg-paper"
		href="{resolve('/log/session')}?pet={pet.id}">Train now</a
	>
</h2>
{#if data.skills.length}
	<ul class="grid gap-2.5">
		{#each data.skills as s (s.id)}
			<li>
				<a
					href={resolve(`/pets/${pet.id}/skills/${s.id}`)}
					class="paper group grid gap-2 px-4 py-3 transition-[translate] duration-300 ease-pen hover:translate-x-1"
				>
					<span class="flex items-center justify-between gap-3">
						<span class="font-bold">{s.name}</span>
						<span
							class="rounded-full px-2.5 py-1 text-xs font-bold {s.level === 'RELIABLE'
								? 'bg-ink text-tennis'
								: s.level === 'GETTING_THERE'
									? 'bg-tennis'
									: 'bg-biscuit/70'}">{levelLabel[s.level]}</span
						>
					</span>
					<!-- Three-step level track -->
					<span class="grid grid-cols-3 gap-1" aria-hidden="true">
						{#each ['LEARNING', 'GETTING_THERE', 'RELIABLE'] as l, i (l)}
							<span
								class="h-1.5 rounded-full {i <=
								['LEARNING', 'GETTING_THERE', 'RELIABLE'].indexOf(s.level)
									? 'bg-ink'
									: 'bg-line'}"
							></span>
						{/each}
					</span>
					<span class="text-sm text-muted">
						{s.sessions
							? `${s.sessions} session${s.sessions === 1 ? '' : 's'} · last ${s.lastPractised}`
							: 'Not practised yet'}{s.steps ? ` · ${s.stepsDone}/${s.steps} steps` : ''}
					</span>
				</a>
			</li>
		{/each}
	</ul>
{:else}
	<div class="grid gap-3 rounded-[22px] p-5 shadow-[inset_0_0_0_1.5px_var(--color-line)]">
		<p class="text-muted">
			Skills appear here when you log a training session, like recall or loose lead walking.
		</p>
		<a class="btn justify-self-start" href="{resolve('/log/session')}?pet={pet.id}"
			>Start a session</a
		>
	</div>
{/if}

{#if data.recentLog.length}
	<h2
		class="mt-9 mb-3 flex items-baseline justify-between text-[1.375rem] font-extrabold tracking-tight"
	>
		Latest in the log
		<a
			class="rounded-full px-3 py-1.5 text-sm font-bold tracking-normal hover:bg-paper"
			href="{resolve('/log')}?pet={pet.id}">All</a
		>
	</h2>
	<ul class="grid gap-2.5">
		{#each data.recentLog as entry (entry.id)}<li class="min-w-0"><EntryCard {entry} /></li>{/each}
	</ul>
{/if}

{#if data.history.length}
	<h2 class="mt-9 mb-3 text-[1.375rem] font-extrabold tracking-tight">Recently given</h2>
	<ul class="grid gap-2">
		{#each data.history as h (h.id)}
			<li
				class="flex items-center gap-3 rounded-[18px] px-4 py-2.5 shadow-[inset_0_0_0_1.5px_var(--color-line)]"
			>
				<span
					class="hand grid size-9 shrink-0 place-items-center rounded-full bg-ink text-xl text-paper"
					aria-hidden="true">{h.by[0]}</span
				>
				<span class="min-w-0 grow">
					<span class="block truncate font-semibold">{h.title}</span>
					<span class="text-sm text-muted"
						>{h.status === 'DONE' ? 'Given' : 'Skipped'} by {h.by} · {h.when}</span
					>
				</span>
			</li>
		{/each}
	</ul>
{/if}

<a
	href={resolve(`/pets/${pet.id}/summary`)}
	class="paper group mt-9 flex items-center justify-between gap-3 px-5 py-4 transition-[translate] duration-300 ease-pen hover:translate-x-1"
>
	<span
		><span class="block font-extrabold">Summary for the vet</span><span class="text-sm text-muted"
			>Treatments, what was given, weight and health notes. Print or save as PDF.</span
		></span
	>
	<span aria-hidden="true" class="text-xl">→</span>
</a>

<h2 class="mt-9 mb-3 text-[1.375rem] font-extrabold tracking-tight">Vet</h2>
{#if pet.vetName || pet.vetPhone}
	<div class="paper flex items-center justify-between gap-3 p-5">
		<div class="min-w-0">
			<strong class="block">{pet.vetName ?? 'Vet'}</strong>
			{#if pet.vetAddress}<span class="text-sm text-muted">{pet.vetAddress}</span>{/if}
		</div>
		{#if pet.vetPhone}
			<a class="btn btn-ghost min-h-11 shrink-0 px-5" href="tel:{pet.vetPhone.replace(/\s/g, '')}"
				>Call</a
			>
		{/if}
	</div>
{:else}
	<p class="text-muted">
		No vet saved. <a
			class="font-bold underline underline-offset-4"
			href={resolve(`/pets/${pet.id}/edit`)}>Add their vet</a
		>
	</p>
{/if}
