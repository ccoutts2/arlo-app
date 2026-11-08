<script lang="ts">
	import { resolve } from '$app/paths';
	import EntryCard from '$lib/components/EntryCard.svelte';
	import type { EntryView } from '$lib/server/log';

	let { data } = $props();

	const groups = $derived.by(() => {
		const out: { date: string; entries: EntryView[] }[] = [];
		for (const e of data.entries) {
			const last = out.at(-1);
			if (last?.date === e.date) last.entries.push(e);
			else out.push({ date: e.date, entries: [e] });
		}
		return out;
	});
	const dayLabel = (d: string) =>
		d === data.today
			? 'Today'
			: d === data.yesterday
				? 'Yesterday'
				: new Date(d + 'T12:00:00Z').toLocaleDateString('en-GB', {
						weekday: 'long',
						day: 'numeric',
						month: 'short'
					});

	const types = [
		['', 'All'],
		['TRAINING', 'Training'],
		['NOTE', 'Notes'],
		['HEALTH', 'Health'],
		['WALK', 'Walks']
	] as const;
	const href = (o: { type?: string; pet?: string }) => {
		const type = o.type ?? data.filter.type ?? '';
		const pet = o.pet ?? data.filter.petId ?? '';
		const q = [type && `type=${type}`, pet && `pet=${encodeURIComponent(pet)}`]
			.filter(Boolean)
			.join('&');
		return q ? `?${q}` : '?';
	};
</script>

<svelte:head>
	<title>Log · Lead</title>
	<meta
		name="description"
		content="Training sessions, notes and health observations for your dogs."
	/>
</svelte:head>

<h1
	class="-ml-[0.04em] text-[clamp(3rem,15vw,4rem)] leading-[0.86] font-extrabold tracking-[-0.055em]"
>
	Log
</h1>

{#if !data.pets.length}
	<section class="paper tape mt-8 grid gap-4 p-6">
		<h2 class="text-2xl font-extrabold tracking-tight">Add your dog first</h2>
		<p class="text-muted">
			The log keeps training sessions, notes and health observations for each dog.
		</p>
		<a class="btn justify-self-start" href={resolve('/pets/new')}>Add your dog</a>
	</section>
{:else}
	<div class="mt-6 grid grid-cols-2 gap-2.5">
		<a class="btn" href={resolve('/log/session')}>Start training</a>
		<a class="btn btn-ghost" href={resolve('/log/new')}>Add to log</a>
	</div>

	<!-- Filter links are query strings on this page. -->
	<!-- eslint-disable svelte/no-navigation-without-resolve -->
	<nav
		aria-label="Filter the log"
		class="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]"
	>
		{#each types as [key, label] (key)}
			<a
				href={href({ type: key })}
				aria-current={(data.filter.type ?? '') === key ? 'page' : undefined}
				class="shrink-0 rounded-full border-2 px-4 py-2 text-sm font-semibold {(data.filter.type ??
					'') === key
					? 'border-ink bg-ink text-paper'
					: 'border-line bg-paper hover:border-ink/40'}">{label}</a
			>
		{/each}
		{#if data.pets.length > 1}
			<span class="mx-1 w-px shrink-0 bg-line" aria-hidden="true"></span>
			{#each [{ id: '', name: 'All dogs' }, ...data.pets] as pet (pet.id)}
				<a
					href={href({ pet: pet.id })}
					aria-current={(data.filter.petId ?? '') === pet.id ? 'page' : undefined}
					class="shrink-0 rounded-full border-2 px-4 py-2 text-sm font-semibold {(data.filter
						.petId ?? '') === pet.id
						? 'border-ink bg-ink text-paper'
						: 'border-line bg-paper hover:border-ink/40'}">{pet.name}</a
				>
			{/each}
		{/if}
	</nav>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
	{#if data.skill}<p class="mt-3 font-semibold">
			Showing sessions with <span class="hand text-2xl">{data.skill.name}</span> ·
			<a class="underline underline-offset-4" href={resolve('/log')}>show all</a>
		</p>{/if}

	{#if groups.length}
		{#each groups as g (g.date)}
			<h2 class="mt-8 mb-3 text-[1.375rem] font-extrabold tracking-tight">{dayLabel(g.date)}</h2>
			<ul class="grid gap-2.5">
				{#each g.entries as entry (entry.id)}<li class="min-w-0"><EntryCard {entry} /></li>{/each}
			</ul>
		{/each}
	{:else}
		<section
			class="mt-8 grid gap-2 rounded-[22px] p-5 shadow-[inset_0_0_0_1.5px_var(--color-line)]"
		>
			<p class="hand text-2xl text-muted">Nothing here yet</p>
			<p class="text-muted">
				Start a five-minute training session, or jot down a note. Everyone in your household sees
				the log.
			</p>
		</section>
	{/if}
{/if}
