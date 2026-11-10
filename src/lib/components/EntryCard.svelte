<script lang="ts">
	import { resolve } from '$app/paths';
	import PetAvatar from './PetAvatar.svelte';
	import { walkRating } from '$lib/places';
	import {
		levelLabel,
		logTypeLabel,
		ratingLabel,
		type LogTypeKey,
		type SkillLevelKey
	} from '$lib/log';
	import type { EntryView } from '$lib/server/log';

	let { entry, full = false }: { entry: EntryView; full?: boolean } = $props();
	const stripe: Record<LogTypeKey, string> = {
		TRAINING: 'bg-tennis',
		NOTE: 'bg-paper shadow-[inset_0_0_0_1.5px_var(--color-line)]',
		HEALTH: 'bg-late/80',
		WALK: 'bg-pm'
	};
	const headline = $derived(
		[logTypeLabel[entry.type as LogTypeKey], entry.durationMin ? `${entry.durationMin} min` : null]
			.filter(Boolean)
			.join(' · ')
	);
</script>

<article
	class="paper grid grid-cols-[minmax(0,1fr)] gap-2.5 p-4"
	aria-label="{headline} for {entry.pet.name} by {entry.author}"
>
	<header class="flex items-center gap-3">
		<PetAvatar pet={entry.pet} size={40} class="shrink-0" />
		<div class="min-w-0 grow">
			<p class="flex items-center gap-2 font-bold">
				<span
					class="size-2.5 shrink-0 rounded-full {stripe[entry.type as LogTypeKey]}"
					aria-hidden="true"
				></span>{headline}
			</p>
			<p class="text-sm text-muted [overflow-wrap:anywhere]">
				{entry.pet.name}{entry.place ? ` · ${entry.place.name}` : ''} · {entry.time} · by {entry.author}
			</p>
		</div>
		{#if entry.rating && entry.type === 'WALK'}
			<span class="shrink-0 text-sm font-semibold"
				><span class="text-xl" aria-hidden="true">{walkRating[entry.rating].emoji}</span>
				{walkRating[entry.rating].label}</span
			>
		{:else if entry.rating}
			<span class="hand shrink-0 text-2xl">{ratingLabel[entry.rating].toLowerCase()}</span>
		{/if}
	</header>

	{#if entry.skills.length || entry.tags.length}
		<ul class="flex flex-wrap gap-1.5" aria-label={entry.skills.length ? 'Skills' : 'Noticed'}>
			{#each entry.skills as s (s.id)}<li
					class="rounded-full bg-biscuit/60 px-3 py-1 text-sm font-semibold"
				>
					{s.name}
				</li>{/each}
			{#each entry.tags as tag (tag)}<li
					class="rounded-full bg-late/10 px-3 py-1 text-sm font-semibold text-late"
				>
					{tag}
				</li>{/each}
		</ul>
	{/if}
	{#if entry.body}
		<p class="whitespace-pre-line {full ? '' : 'line-clamp-4'}">{entry.body}</p>
	{/if}
	{#each entry.levelUps as l (l.skill)}
		<p class="hand text-xl text-muted">
			{l.skill} → {levelLabel[l.to as SkillLevelKey].toLowerCase()}
		</p>
	{/each}
	{#if entry.photos.length}
		<div class="flex gap-2">
			{#each entry.photos as id (id)}
				<img
					src="/files/{id}"
					alt="{entry.pet.name}, {logTypeLabel[entry.type as LogTypeKey].toLowerCase()}"
					class="{full ? 'w-full' : 'size-24'} rounded-xl object-cover"
					loading="lazy"
				/>
			{/each}
		</div>
	{/if}
	{#if !full}
		<a
			href={resolve(`/log/${entry.id}`)}
			class="-m-1 justify-self-end rounded-full px-3 py-1.5 text-sm font-bold hover:bg-biscuit/50"
			>Open</a
		>
	{/if}
</article>
