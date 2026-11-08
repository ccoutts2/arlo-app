<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onDestroy } from 'svelte';
	import PetAvatar from '$lib/components/PetAvatar.svelte';
	import { click } from '$lib/clicker';

	let { data } = $props();

	let petId = $state(data.petId ?? data.pets[0]?.id ?? '');
	let chosen = $state<string[]>([]);
	const skills = $derived(data.skillsByPet[petId] ?? []);

	// Timer: counts down from the target, then keeps counting so you see how far over you went.
	let target = $state(5 * 60);
	let elapsed = $state(0); // seconds
	let running = $state(false);
	let startedAt = 0;
	let base = 0;
	let tick: ReturnType<typeof setInterval> | undefined;
	let wake: { release: () => Promise<void> } | null = null;

	async function start() {
		running = true;
		startedAt = Date.now();
		base = elapsed;
		tick = setInterval(() => (elapsed = base + Math.floor((Date.now() - startedAt) / 1000)), 250);
		// Keep the screen on during a session (supported on iOS 16.4+).
		wake =
			(await (
				navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<typeof wake> } }
			).wakeLock
				?.request('screen')
				.catch(() => null)) ?? null;
	}
	function pause() {
		running = false;
		clearInterval(tick);
		void wake?.release().catch(() => {});
		wake = null;
	}
	onDestroy(pause);

	let clicks = $state(0);
	let pulse = $state(0);
	function doClick() {
		click();
		clicks++;
		pulse++;
		if (!running && elapsed === 0) start();
	}

	const remaining = $derived(target - elapsed);
	const over = $derived(remaining < 0);
	const fmt = (s: number) =>
		`${Math.floor(Math.abs(s) / 60)}:${String(Math.abs(s) % 60).padStart(2, '0')}`;

	function finish() {
		pause();
		const q = [
			'type=TRAINING',
			`pet=${encodeURIComponent(petId)}`,
			`duration=${Math.max(1, Math.round(elapsed / 60))}`,
			chosen.length ? `skills=${chosen.join(',')}` : '',
			clicks ? `clicks=${clicks}` : ''
		]
			.filter(Boolean)
			.join('&');
		// Resolved path plus a query string.
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(`${resolve('/log/new')}?${q}`);
	}
</script>

<svelte:head><title>Training session · Lead</title></svelte:head>

<a class="btn btn-ghost mb-4 min-h-11 px-4" href={resolve('/log')}>← Log</a>
<h1 class="text-[2.6rem] leading-[0.9] font-extrabold tracking-[-0.05em]">Training</h1>

{#if !data.pets.length}
	<p class="mt-4 text-muted">
		Add your dog first. <a
			class="font-bold underline underline-offset-4"
			href={resolve('/pets/new')}>Add a dog</a
		>
	</p>
{:else}
	{#if data.pets.length > 1}
		<div class="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Dog">
			{#each data.pets as pet (pet.id)}
				<button
					role="radio"
					aria-checked={petId === pet.id}
					onclick={() => ((petId = pet.id), (chosen = []))}
					class="flex items-center gap-2 rounded-full border-2 py-1 pr-4 pl-1 font-semibold {petId ===
					pet.id
						? 'border-ink bg-ink text-paper'
						: 'border-line bg-paper'}"
				>
					<PetAvatar {pet} size={30} />{pet.name}
				</button>
			{/each}
		</div>
	{/if}

	<section class="paper tape mt-6 grid justify-items-center gap-3 p-6" aria-label="Timer">
		<p class="text-sm font-semibold text-muted">
			{over ? 'Over by' : running ? 'Time left' : elapsed ? 'Paused' : 'Session length'}
		</p>
		<p
			class="text-[4.5rem] leading-none font-extrabold tracking-tight tabular-nums {over
				? 'text-late'
				: ''}"
			role="timer"
			aria-live="off"
		>
			{over ? '+' : ''}{fmt(remaining)}
		</p>
		{#if !running && elapsed === 0}
			<div class="flex gap-2" role="group" aria-label="Session length">
				{#each [3, 5, 10] as m (m)}
					<button
						onclick={() => (target = m * 60)}
						aria-pressed={target === m * 60}
						class="rounded-full border-2 px-4 py-2 font-semibold {target === m * 60
							? 'border-ink bg-ink text-paper'
							: 'border-line'}">{m} min</button
					>
				{/each}
			</div>
		{/if}
		<div class="grid w-full grid-cols-2 gap-2.5">
			{#if running}
				<button class="btn btn-ghost" onclick={pause}>Pause</button>
			{:else}
				<button class="btn btn-ghost" onclick={start}>{elapsed ? 'Resume' : 'Start'}</button>
			{/if}
			<button class="btn" onclick={finish} disabled={elapsed === 0 && clicks === 0}>Finish</button>
		</div>
	</section>

	<!-- The clicker: tap to mark the moment your dog gets it right. -->
	<div class="mt-6 grid justify-items-center gap-2">
		{#key pulse}
			<button
				onclick={doClick}
				class="clicker grid size-44 place-items-center rounded-full bg-ink text-2xl font-extrabold text-tennis shadow-bar active:scale-95"
				aria-label="Click"
			>
				Click
			</button>
		{/key}
		<p class="text-sm text-muted" aria-live="polite">
			{clicks ? `${clicks} click${clicks === 1 ? '' : 's'}` : 'Tap when they get it right'}
		</p>
	</div>

	{#if skills.length}
		<fieldset class="mt-6">
			<legend class="mb-2 font-semibold">Working on</legend>
			<div class="flex flex-wrap gap-2">
				{#each skills as s (s.id)}
					<button
						aria-pressed={chosen.includes(s.id)}
						onclick={() =>
							(chosen = chosen.includes(s.id)
								? chosen.filter((x) => x !== s.id)
								: [...chosen, s.id])}
						class="rounded-full border-2 px-4 py-2.5 font-semibold {chosen.includes(s.id)
							? 'border-ink bg-ink text-paper'
							: 'border-line bg-paper'}">{s.name}</button
					>
				{/each}
			</div>
		</fieldset>
	{:else}
		<p class="mt-6 text-sm text-muted">You can add the skills you worked on when you finish.</p>
	{/if}
{/if}

<style>
	.clicker {
		animation: pop 0.18s var(--ease-press);
		transition: scale 0.1s;
	}
	@keyframes pop {
		40% {
			scale: 0.92;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.clicker {
			animation: none;
		}
	}
</style>
