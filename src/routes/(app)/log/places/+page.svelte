<script lang="ts">
	import { resolve } from '$app/paths';
	import LogTabs from '$lib/components/LogTabs.svelte';
	import MapView from '$lib/components/MapView.svelte';
	import { placeStatusLabel, walkRating } from '$lib/places';

	let { data } = $props();
	const filters = [
		['', 'All'],
		['WISHLIST', 'Wishlist'],
		['BEEN', 'Been']
	] as const;
</script>

<svelte:head>
	<title>Places · Lead</title>
	<meta name="description" content="Walks you love and places other dog owners recommend." />
</svelte:head>

<h1
	class="-ml-[0.04em] text-[clamp(3rem,15vw,4rem)] leading-[0.86] font-extrabold tracking-[-0.055em]"
>
	Log
</h1>
<LogTabs current="places" />

<div class="mt-5 flex flex-wrap items-center justify-between gap-3">
	<!-- Filters are query strings on this page. -->
	<!-- eslint-disable svelte/no-navigation-without-resolve -->
	<nav aria-label="Filter places" class="flex flex-wrap gap-2">
		{#each filters as [key, label] (key)}
			<a
				href={key ? `?status=${key}` : '?'}
				aria-current={(data.status ?? '') === key ? 'page' : undefined}
				class="rounded-full border-2 px-4 py-2 text-sm font-semibold {(data.status ?? '') === key
					? 'border-ink bg-ink text-paper'
					: 'border-line bg-paper hover:border-ink/40'}">{label}</a
			>
		{/each}
	</nav>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
	<a class="btn min-h-11 shrink-0 px-4" href={resolve('/log/places/new')}>Add</a>
</div>

{#if data.places.some((p) => p.lat !== null)}
	<div class="mt-5"><MapView places={data.places} /></div>
{/if}

{#if data.places.length}
	<ul class="mt-5 grid gap-2.5">
		{#each data.places as p (p.id)}
			<li class="min-w-0">
				<a
					href={resolve(`/log/places/${p.id}`)}
					class="paper group grid gap-1 px-4 py-3 transition-[translate] duration-300 ease-pen hover:translate-x-1"
				>
					<span class="flex items-center justify-between gap-3">
						<span class="flex min-w-0 items-center gap-2">
							<span
								aria-hidden="true"
								class="size-3 shrink-0 rounded-full border-2 border-ink {p.status === 'BEEN'
									? 'bg-ink'
									: ''}"
							></span>
							<span class="truncate font-bold">{p.name}</span>
						</span>
						<span
							class="shrink-0 text-xs font-bold {p.status === 'BEEN' ? 'text-ink' : 'text-muted'}"
							>{placeStatusLabel[p.status]}</span
						>
					</span>
					<span class="truncate text-sm text-muted">
						{#if p.verdict.walks}
							{#if p.verdict.top}<span aria-hidden="true">{walkRating[p.verdict.top].emoji}</span
								>{/if}
							{p.verdict.walks} walk{p.verdict.walks === 1 ? '' : 's'}{p.lastWalk
								? ` · last ${p.lastWalk}`
								: ''}
						{:else if p.recommendedBy}
							Recommended by {p.recommendedBy}
						{:else}
							{p.tags.slice(0, 3).join(' · ') || 'Not walked yet'}
						{/if}
					</span>
				</a>
			</li>
		{/each}
	</ul>
{:else}
	<section class="paper tape mt-6 grid gap-3 p-5">
		<h2 class="text-xl font-extrabold tracking-tight">
			{data.status === 'WISHLIST' ? 'Nothing on the wishlist yet' : 'No places yet'}
		</h2>
		<p class="text-muted">
			Save walks you love, and the places other dog owners recommend, so you remember them next
			time.
		</p>
		<a class="btn justify-self-start" href={resolve('/log/places/new')}>Add a place</a>
	</section>
{/if}
