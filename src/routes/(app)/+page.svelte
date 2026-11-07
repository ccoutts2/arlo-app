<script lang="ts">
	import { resolve } from '$app/paths';
	import Initials from '$lib/components/Initials.svelte';

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
	<a class="btn justify-self-start" href={resolve('/pets')}>Add your dog</a>
</section>
