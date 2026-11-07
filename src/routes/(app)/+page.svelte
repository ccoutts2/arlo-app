<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { flip } from 'svelte/animate';
	import { crossfade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import Initials from '$lib/components/Initials.svelte';
	import PetAvatar from '$lib/components/PetAvatar.svelte';
	import DoseRow from '$lib/components/DoseRow.svelte';
	import Sheet from '$lib/components/Sheet.svelte';

	let { data } = $props();

	const reduce =
		typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
	const dur = reduce ? 0 : 420;
	// Rows glide from "still to do" into "done" when ticked.
	const [send, receive] = crossfade({ duration: dur, easing: cubicOut });

	const now = new Date();
	const hour = now.getHours();
	const greeting = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';
	const date = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
	const firstPet = $derived(data.pets[0]);
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
<p class="mt-2 font-semibold">
	{date}
	{#if data.late.length}<em class="hand ml-1.5 text-2xl text-late not-italic"
			>{data.late.length} late</em
		>{/if}
</p>

{#if !data.pets.length}
	<section class="paper tape mt-8 grid gap-4 p-6" aria-labelledby="empty-h">
		<h2 id="empty-h" class="text-2xl leading-tight font-extrabold tracking-tight">
			Your sheet is empty
		</h2>
		<p class="text-muted">
			Add your dog to start. Then add their meds and treatments, and Lead will remind everyone in {data
				.household.name} when something’s due.
		</p>
		<a class="btn justify-self-start" href={resolve('/pets/new')}>Add your dog</a>
	</section>
{:else if !data.careCount}
	<section class="paper tape mt-8 grid gap-4 p-6" aria-labelledby="first-h">
		<h2 id="first-h" class="text-2xl leading-tight font-extrabold tracking-tight">
			Add {firstPet.name}’s first treatment
		</h2>
		<p class="text-muted">
			Daily meds, flea and worming treatments, boosters or a vet visit. Pick a preset and adjust it.
		</p>
		<a class="btn justify-self-start" href={resolve(`/pets/${firstPet.id}/care/new`)}
			>Add a treatment</a
		>
	</section>
{:else}
	{#each data.late as dose (dose.id)}
		<section
			class="paper tape mt-7 grid grid-cols-[64px_1fr] items-center gap-x-3.5 gap-y-3 p-4"
			aria-labelledby="late-{dose.id}"
			style:view-transition-name="dose-{dose.id}"
			out:send={{ key: dose.id }}
		>
			<PetAvatar pet={dose.pet} size={64} />
			<div class="min-w-0">
				<h2 id="late-{dose.id}" class="text-[1.375rem] leading-tight font-extrabold tracking-tight">
					{dose.title}{dose.dose ? '' : ''}
				</h2>
				<p class="mt-0.5 text-[0.9375rem] font-semibold text-late">
					{dose.pet.name} · was due {dose.time}{dose.date !== data.todayDate
						? ` on ${new Date(dose.dueAt).toLocaleDateString('en-GB', { weekday: 'short' })}`
						: ''}
				</p>
			</div>
			<div class="col-span-2 flex gap-2">
				<a class="btn grow" href={resolve(`/o/${dose.id}`)}>Mark given</a>
				<form method="POST" action="?/snooze" use:enhance>
					<input type="hidden" name="id" value={dose.id} />
					<button class="btn btn-ghost">Snooze</button>
				</form>
			</div>
		</section>
	{/each}

	{#each data.sheets as sheet (sheet.pet.id)}
		<h2
			class="mt-9 mb-3 flex items-baseline justify-between text-[1.375rem] font-extrabold tracking-tight"
		>
			This week’s sheet <small class="text-sm font-medium tracking-normal text-muted"
				>{sheet.pet.name}</small
			>
		</h2>
		<Sheet {sheet} />
	{/each}

	<h2
		class="mt-9 mb-3 flex items-baseline justify-between text-[1.375rem] font-extrabold tracking-tight"
	>
		Still to do <small class="text-sm font-medium tracking-normal text-muted"
			>{data.todo.length ? `${data.todo.length} left` : 'all done'}</small
		>
	</h2>
	{#if data.todo.length}
		<ul class="grid gap-2.5">
			{#each data.todo as dose (dose.id)}
				<li
					class="min-w-0"
					animate:flip={{ duration: dur }}
					in:receive={{ key: dose.id }}
					out:send={{ key: dose.id }}
				>
					<DoseRow {dose} />
				</li>
			{/each}
		</ul>
	{:else}
		<p class="hand text-2xl text-muted">Nothing else today.</p>
	{/if}

	{#if data.done.length}
		<h2 class="mt-9 mb-3 text-[1.375rem] font-extrabold tracking-tight">Done today</h2>
		<ul class="grid gap-2.5">
			{#each data.done as dose (dose.id)}
				<li
					class="min-w-0"
					animate:flip={{ duration: dur }}
					in:receive={{ key: dose.id }}
					out:send={{ key: dose.id }}
				>
					<DoseRow {dose} />
				</li>
			{/each}
		</ul>
	{/if}

	{#if data.upcoming.length}
		<h2 class="mt-9 mb-3 text-[1.375rem] font-extrabold tracking-tight">Coming up</h2>
		<ul class="grid gap-2.5">
			{#each data.upcoming as dose (dose.id)}
				<li class="min-w-0"><DoseRow {dose} showDay /></li>
			{/each}
		</ul>
	{/if}

	<ul class="mt-9 flex flex-wrap gap-2" aria-label="Your dogs">
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
{/if}
