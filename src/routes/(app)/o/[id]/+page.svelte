<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import PetAvatar from '$lib/components/PetAvatar.svelte';

	let { data } = $props();
	const d = $derived(data.dose);

	// Optimistic: the tick starts drawing the moment you tap, before the server answers.
	let pending = $state<null | 'give' | 'undo'>(null);
	let justGiven = $state(false);
	const given = $derived(pending === 'give' || (d.status === 'DONE' && pending !== 'undo'));
	const initial = $derived(pending === 'give' ? data.user.givenName[0] : (d.doneBy?.[0] ?? ''));

	const lateText = $derived(
		d.lateBy >= 60
			? `${Math.floor(d.lateBy / 60)} h ${d.lateBy % 60} m late`
			: d.lateBy > 0
				? `${d.lateBy} min late`
				: ''
	);
	const status = $derived(
		given
			? `Given by ${pending === 'give' || d.doneByMe ? 'you' : d.doneBy} at ${d.doneTime ?? 'just now'}.`
			: d.status === 'SKIPPED'
				? `Skipped by ${d.doneBy}.`
				: d.snoozedUntil
					? `Snoozed. We’ll remind everyone again at ${d.snoozedUntil}.`
					: 'Nobody has given this yet.'
	);
</script>

<svelte:head><title>{d.title} for {d.pet.name} · Lead</title></svelte:head>

<div class="mb-2 flex items-center justify-between">
	<a class="btn btn-ghost min-h-11 px-4" href={resolve('/')}>← Today</a>
	<PetAvatar pet={d.pet} size={40} />
</div>

<div class="grid min-h-[calc(100svh-230px)] content-center gap-5 py-4">
	<section class="paper tape p-6" aria-labelledby="dose-h">
		<p class="font-semibold text-muted">
			{d.pet.name} · {d.isToday ? 'due' : `due ${d.dueDay}`}
			{d.dueTime}
			{#if lateText && !given && d.status === 'PENDING'}<span class="text-late">
					· {lateText}</span
				>{/if}
		</p>
		<h1
			id="dose-h"
			class="mt-1.5 text-[clamp(2.8rem,13vw,3.6rem)] leading-[0.9] font-extrabold tracking-[-0.05em] break-words"
		>
			{d.title}
		</h1>
		{#if d.dose}<p class="mt-1 text-[1.0625rem]">{d.dose}</p>{/if}

		<div class="mt-5 flex items-end gap-4">
			<!-- The sheet cell: tick drawn with a pen, initial stamped beside it. -->
			<div
				class="relative grid size-[132px] shrink-0 place-items-center rounded-[18px] border-[3px] border-ink {given
					? 'press'
					: ''}"
			>
				{#if given}
					<svg viewBox="0 0 100 100" class="size-24 overflow-visible" aria-hidden="true">
						<path
							d="M18 54c8 5 15 13 20 22 10-24 26-44 46-58"
							fill="none"
							stroke="currentColor"
							stroke-width="7"
							stroke-linecap="round"
							stroke-linejoin="round"
							pathLength="1"
							class={justGiven ? 'pen' : ''}
						/>
					</svg>
					<span
						class="hand absolute -right-10 -bottom-1.5 -rotate-8 text-[2.75rem] {justGiven
							? 'stamp'
							: ''}"
						aria-hidden="true">{initial}</span
					>
				{:else if d.status === 'SKIPPED'}
					<span class="hand text-6xl text-muted" aria-hidden="true">–</span>
				{/if}
			</div>
			<div class="ml-12 grid gap-1 pb-1 text-sm text-muted">
				{#if d.stock !== null}<span><b class="text-ink tabular-nums">{d.stock}</b> left</span>{/if}
				{#if d.notes}<span>{d.notes}</span>{/if}
			</div>
		</div>
		<p class="mt-4 min-h-6 font-semibold" role="status" aria-live="polite">{status}</p>
	</section>

	<div class="grid gap-2.5">
		{#if given}
			<form
				method="POST"
				action="?/undo"
				use:enhance={() => {
					pending = 'undo';
					justGiven = false;
					return async ({ update }) => {
						await update();
						pending = null;
					};
				}}
			>
				<button class="btn btn-ghost w-full">Undo</button>
			</form>
			<a class="btn w-full" href={resolve('/')}>Back to today</a>
		{:else}
			<form
				method="POST"
				action="?/give"
				use:enhance={() => {
					pending = 'give';
					justGiven = true;
					return async ({ update }) => {
						await update();
						pending = null;
					};
				}}
			>
				<button class="btn w-full">Mark given</button>
			</form>
			{#if d.status === 'PENDING'}
				<div class="grid grid-cols-2 gap-2.5">
					<form method="POST" action="?/snooze" use:enhance>
						<button class="btn btn-ghost w-full">Snooze 30 min</button>
					</form>
					<form method="POST" action="?/skip" use:enhance>
						<button class="btn btn-ghost w-full">Skip</button>
					</form>
				</div>
			{/if}
			{#if data.household.members.length > 1}
				<p class="text-sm text-muted">
					Everyone in {data.household.name} sees your tick straight away.
				</p>
			{/if}
		{/if}
	</div>
</div>

<style>
	.pen {
		stroke-dasharray: 1;
		stroke-dashoffset: 1;
		animation: pen 0.42s var(--ease-pen) forwards;
	}
	@keyframes pen {
		to {
			stroke-dashoffset: 0;
		}
	}
	.stamp {
		opacity: 0;
		animation: stamp 0.3s 0.36s var(--ease-press) forwards;
	}
	@keyframes stamp {
		from {
			opacity: 0;
			scale: 1.6;
		}
		to {
			opacity: 1;
			scale: 1;
		}
	}
	.press {
		animation: press 0.3s 0.4s var(--ease-pen);
	}
	@keyframes press {
		40% {
			scale: 0.94;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.pen,
		.stamp,
		.press {
			animation: none;
			stroke-dashoffset: 0;
			opacity: 1;
		}
	}
</style>
