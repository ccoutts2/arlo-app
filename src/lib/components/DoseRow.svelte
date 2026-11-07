<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import PetAvatar from './PetAvatar.svelte';
	import type { DoseView } from '$lib/server/today';

	let { dose, showDay = false }: { dose: DoseView; showDay?: boolean } = $props();
	const day = $derived(
		new Date(dose.dueAt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })
	);
	let busy = $state(false);
</script>

<div
	class="flex min-w-0 items-center gap-2.5 rounded-[22px] px-3 py-3 min-[360px]:gap-3 min-[360px]:px-3.5 {dose.status ===
	'PENDING'
		? 'paper'
		: 'shadow-[inset_0_0_0_1.5px_var(--color-line)]'}"
	style:view-transition-name="dose-{dose.id}"
>
	<a href={resolve(`/o/${dose.id}`)} class="group flex min-w-0 grow items-center gap-3">
		<PetAvatar pet={dose.pet} size={40} class="shrink-0" />
		<span class="min-w-0">
			<span
				class="block truncate font-bold {dose.status !== 'PENDING'
					? 'text-muted line-through decoration-ink/40 decoration-2'
					: ''}">{dose.title}</span
			>
			<span class="block truncate text-sm text-muted">
				{dose.pet.name}
				{#if dose.status === 'DONE'}· given by {dose.doneBy}
				{:else if dose.status === 'SKIPPED'}· skipped by {dose.doneBy}
				{:else if dose.snoozedUntil}· snoozed till {dose.snoozedUntil}
				{:else if dose.dose}· {dose.dose}{/if}
			</span>
		</span>
	</a>
	{#if dose.status === 'PENDING' && !showDay}
		<form
			method="POST"
			action="?/give"
			use:enhance={() => {
				busy = true;
				return async ({ update }) => {
					await update();
					busy = false;
				};
			}}
		>
			<input type="hidden" name="id" value={dose.id} />
			<button
				class="grid size-11 place-items-center rounded-full border-2 border-ink transition-[background,scale] duration-200 hover:bg-tennis active:scale-90"
				aria-label="Mark {dose.title} given"
				disabled={busy}
			>
				<svg viewBox="0 0 26 26" class="size-5" aria-hidden="true"
					><path
						d="M5 14c2.2 1.4 4 3.6 5 5.8 2.8-6.4 6.6-11 11.4-14.6"
						fill="none"
						stroke="currentColor"
						stroke-width="3"
						stroke-linecap="round"
						stroke-linejoin="round"
					/></svg
				>
			</button>
		</form>
	{/if}
	<span class="hand shrink-0 text-2xl tabular-nums {dose.late ? 'text-late' : ''}">
		{#if dose.status === 'DONE'}{dose.doneBy?.[0]}
			{dose.doneTime}{:else if showDay}{day}{:else}{dose.time}{/if}
	</span>
</div>
