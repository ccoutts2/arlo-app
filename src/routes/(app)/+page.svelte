<script lang="ts">
	import { resolve } from '$app/paths';
	import Initials from '$lib/components/Initials.svelte';
	import PetAvatar from '$lib/components/PetAvatar.svelte';

	let { data } = $props();

	const now = new Date();
	const hour = now.getHours();
	const greeting = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';
	const date = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
</script>

<svelte:head>
	<title>Today · Lead</title>
	<meta name="description" content="What your dog needs today, and who has already done it." />
</svelte:head>

<div class="mb-4 flex items-center justify-between">
	<p class="text-sm font-medium text-muted">{greeting}, {data.user.givenName}</p>
	<Initials people={data.household.members} />
</div>
<h1
	class="-ml-[0.04em] text-[clamp(3.4rem,17vw,4.6rem)] leading-[0.86] font-extrabold tracking-[-0.055em]"
>
	Today
</h1>
<p class="mt-2 font-semibold">{date}</p>

{#if data.pets.length}
	<ul class="mt-6 flex flex-wrap gap-2" aria-label="Your dogs">
		{#each data.pets as pet (pet.id)}
			<li>
				<a
					href={resolve(`/pets/${pet.id}`)}
					class="flex items-center gap-2 rounded-full bg-paper py-1 pr-4 pl-1 font-semibold shadow-paper transition-[translate] duration-300 ease-press hover:-translate-y-0.5"
				>
					<PetAvatar {pet} size={34} />{pet.name}
				</a>
			</li>
		{/each}
	</ul>
	<section class="paper tape mt-8 grid gap-3 p-6" aria-labelledby="ready-h">
		<h2 id="ready-h" class="text-2xl leading-tight font-extrabold tracking-tight">
			Nothing due today
		</h2>
		<p class="text-muted">
			Meds, flea and worming treatments and vet visits will appear here when they’re due, ticked off
			with whoever gave them. Adding them arrives in the next update.
		</p>
	</section>
{:else}
	<section class="paper tape mt-8 grid gap-4 p-6" aria-labelledby="empty-h">
		<div
			class="grid size-[88px] place-items-center rounded-[18px] border-[3px] border-dashed border-ink/40"
		>
			<svg viewBox="0 0 100 100" class="size-16 opacity-25" aria-hidden="true">
				<path
					d="M18 54c8 5 15 13 20 22 10-24 26-44 46-58"
					fill="none"
					stroke="currentColor"
					stroke-width="8"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</div>
		<h2 id="empty-h" class="text-2xl leading-tight font-extrabold tracking-tight">
			Your sheet is empty
		</h2>
		<p class="text-muted">
			Add your dog to start. Then add their meds and treatments, and Lead will remind everyone in
			{data.household.name} when something’s due.
		</p>
		<a class="btn justify-self-start" href={resolve('/pets/new')}>Add your dog</a>
	</section>
{/if}
