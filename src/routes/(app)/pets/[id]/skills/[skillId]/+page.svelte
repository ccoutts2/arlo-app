<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Tick from '$lib/components/Tick.svelte';
	import { levelLabel, levels } from '$lib/log';

	let { data, form } = $props();
	let confirming = $state(false);
	const keep =
		() =>
		async ({ update }: { update: (o?: { reset?: boolean }) => Promise<void> }) =>
			update({ reset: true });
</script>

<svelte:head><title>{data.skill.name} · {data.pet.name} · Lead</title></svelte:head>

<a class="btn btn-ghost mb-6 min-h-11 px-4" href={resolve(`/pets/${data.pet.id}`)}
	>← {data.pet.name}</a
>
<h1 class="text-[2.6rem] leading-[0.9] font-extrabold tracking-[-0.05em]">{data.skill.name}</h1>
<p class="mt-2 text-muted">
	{data.sessions
		? `Practised in ${data.sessions} session${data.sessions === 1 ? '' : 's'}.`
		: 'Not practised yet.'}
	{#if data.sessions}<a
			class="font-bold text-ink underline underline-offset-4"
			href="{resolve('/log')}?skill={data.skill.id}">See sessions</a
		>{/if}
</p>

<form method="POST" action="?/level" use:enhance class="paper tape mt-6 grid gap-3 p-5">
	<p class="font-semibold">How’s it going?</p>
	<div class="grid grid-cols-3 gap-1.5">
		{#each levels as l (l)}
			<button
				name="level"
				value={l}
				aria-pressed={data.skill.level === l}
				class="rounded-xl border-2 px-1 py-3 text-sm font-semibold transition-colors {data.skill
					.level === l
					? 'border-ink bg-tennis'
					: 'border-line hover:border-ink/40'}">{levelLabel[l]}</button
			>
		{/each}
	</div>
</form>

<h2 class="mt-9 mb-1 text-[1.375rem] font-extrabold tracking-tight">Steps</h2>
<p class="mb-3 text-sm text-muted">
	Your own plan, one step at a time. For recall: in the house, then the garden, then the park on a
	long line.
</p>
{#if data.skill.steps.length}
	<ol class="grid gap-2">
		{#each data.skill.steps as step, i (step.id)}
			<li class="paper flex items-center gap-3 px-3 py-2.5">
				<form method="POST" action="?/toggleStep" use:enhance>
					<input type="hidden" name="id" value={step.id} />
					<button
						class="relative grid size-10 shrink-0 place-items-center rounded-lg border-2 border-ink"
						aria-label="{step.done ? 'Untick' : 'Tick'} step {i + 1}: {step.text}"
						aria-pressed={step.done}
					>
						{#if step.done}<Tick seed={step.id} size={24} draw />{/if}
					</button>
				</form>
				<span class="min-w-0 grow">
					<span
						class="block {step.done
							? 'text-muted line-through decoration-ink/40 decoration-2'
							: 'font-semibold'}">{step.text}</span
					>
					{#if step.done}<span class="hand text-lg text-muted">{step.by?.[0]} · {step.when}</span
						>{/if}
				</span>
				<form method="POST" action="?/removeStep" use:enhance>
					<input type="hidden" name="id" value={step.id} />
					<button
						class="grid size-9 place-items-center rounded-full text-lg hover:bg-biscuit"
						aria-label="Remove step {i + 1}">×</button
					>
				</form>
			</li>
		{/each}
	</ol>
{/if}
<form method="POST" action="?/addStep" use:enhance={keep} class="mt-3 flex gap-2">
	<label class="sr-only" for="step">New step</label>
	<input
		id="step"
		name="text"
		placeholder="Add a step"
		class="min-h-12 min-w-0 grow rounded-[14px] border-2 border-line bg-paper px-4 focus-visible:border-ink focus-visible:outline-none"
	/>
	<button class="btn min-h-12 px-5">Add</button>
</form>
{#if form && 'stepError' in form}<p class="mt-2 text-sm font-semibold text-late" role="alert">
		{form.stepError}
	</p>{/if}

{#if data.changes.length}
	<h2 class="mt-9 mb-3 text-[1.375rem] font-extrabold tracking-tight">Progress</h2>
	<ul class="grid gap-2">
		{#each data.changes as c (c.id)}
			<li
				class="flex items-center justify-between gap-3 rounded-[18px] px-4 py-2.5 shadow-[inset_0_0_0_1.5px_var(--color-line)]"
			>
				<span
					><span class="font-semibold">{levelLabel[c.from]} → {levelLabel[c.to]}</span><span
						class="block text-sm text-muted">by {c.by}</span
					></span
				>
				<span class="hand shrink-0 text-xl">{c.when}</span>
			</li>
		{/each}
	</ul>
{/if}

<section class="mt-12 rounded-[22px] p-5 shadow-[inset_0_0_0_1.5px_var(--color-line)]">
	<h2 class="text-lg font-extrabold">Remove {data.skill.name}</h2>
	<p class="mt-1 text-sm text-muted">
		Removes the skill, its steps and progress. Log entries stay.
	</p>
	{#if confirming}
		<form method="POST" action="?/delete" use:enhance class="mt-4 flex flex-wrap gap-2">
			<button class="btn bg-late">Yes, remove it</button>
			<button type="button" class="btn btn-ghost" onclick={() => (confirming = false)}>Keep</button>
		</form>
	{:else}
		<button class="btn btn-ghost mt-4" onclick={() => (confirming = true)}
			>Remove {data.skill.name}…</button
		>
	{/if}
</section>
