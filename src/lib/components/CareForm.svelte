<script lang="ts">
	import { enhance } from '$app/forms';
	import Field from './Field.svelte';
	import Choice from './Choice.svelte';
	import { presets, careTypeLabel, type CareTypeKey } from '$lib/care';
	import { describe } from '$lib/schedule';
	import type { CareFormErrors, CareFormValues } from '$lib/schemas/care';

	let {
		values,
		errors = {},
		submitLabel,
		showPresets = false,
		action
	}: {
		values: CareFormValues;
		errors?: CareFormErrors;
		submitLabel: string;
		showPresets?: boolean;
		action?: string;
	} = $props();

	// Deeply reactive copy of the values, re-filled when the server sends new ones (a failed submit).
	// A writable $derived isn't deep, so editing v.times or v.repeat wouldn't update the form.
	const clone = (x: CareFormValues) => ({ ...x, times: [...x.times] });
	// eslint-disable-next-line svelte/prefer-writable-derived
	let v = $state(clone(values));
	$effect(() => {
		v = clone(values);
	});
	let picked = $state<string | null>(null);
	let submitting = $state(false);

	function usePreset(id: string) {
		const p = presets.find((x) => x.id === id)!;
		picked = id;
		v = {
			...v,
			type: p.type,
			title: p.title || v.title,
			repeat: p.repeat,
			interval: String(p.interval),
			times: [...p.times]
		};
	}

	const unit = $derived(
		{
			DAILY: ['day', 'days'],
			WEEKLY: ['week', 'weeks'],
			MONTHLY: ['month', 'months'],
			ONCE: ['', '']
		}[v.repeat as 'DAILY']
	);
	const summary = $derived(
		v.times.length && v.startDate
			? describe({
					repeat: v.repeat as 'DAILY',
					interval: Number(v.interval) || 1,
					times: [...v.times].sort(),
					startDate: v.startDate,
					endDate: null
				})
			: ''
	);
</script>

<form
	method="POST"
	{action}
	class="grid gap-5"
	novalidate
	use:enhance={() => {
		submitting = true;
		return async ({ update }) => {
			await update({ reset: false });
			submitting = false;
		};
	}}
>
	{#if showPresets}
		<fieldset>
			<legend class="mb-2 text-[0.9375rem] font-semibold">Start from</legend>
			<div class="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
				{#each presets as p (p.id)}
					<button
						type="button"
						onclick={() => usePreset(p.id)}
						aria-pressed={picked === p.id}
						class="shrink-0 snap-start rounded-2xl border-2 px-4 py-2.5 text-left transition-[background,border-color,scale] duration-200 active:scale-95 {picked ===
						p.id
							? 'border-ink bg-ink text-paper'
							: 'border-line bg-paper hover:border-ink/40'}"
					>
						<span class="block font-bold">{p.label}</span>
						<span class="block text-xs {picked === p.id ? 'text-paper/75' : 'text-muted'}"
							>{p.hint}</span
						>
					</button>
				{/each}
			</div>
		</fieldset>
	{/if}

	<div class="field">
		<label for="f-type">Type</label>
		<select
			id="f-type"
			name="type"
			bind:value={v.type}
			class="min-h-[52px] rounded-[14px] border-2 border-line bg-paper px-3.5 focus-visible:border-ink focus-visible:outline-none"
		>
			{#each Object.entries(careTypeLabel) as [key, label] (key)}
				<option value={key}>{label}</option>
			{/each}
		</select>
	</div>
	<Field
		label="Name"
		name="title"
		bind:value={v.title}
		errors={errors.title ? [errors.title] : []}
		placeholder={v.type === 'MEDICATION' ? 'Apoquel' : careTypeLabel[v.type as CareTypeKey]}
	/>
	<Field
		label="Dose"
		name="dose"
		bind:value={v.dose}
		errors={errors.dose ? [errors.dose] : []}
		placeholder="16 mg tablet, with food"
	/>

	<Choice
		legend="How often"
		name="repeat"
		bind:value={v.repeat}
		options={[
			{ value: 'ONCE', label: 'Once' },
			{ value: 'DAILY', label: 'Daily' },
			{ value: 'WEEKLY', label: 'Weekly' },
			{ value: 'MONTHLY', label: 'Monthly' }
		]}
	/>
	{#if v.repeat !== 'ONCE'}
		<div class="field">
			<label for="f-interval">Every</label>
			<div class="flex items-center gap-3">
				<input
					id="f-interval"
					name="interval"
					type="number"
					min="1"
					max="52"
					inputmode="numeric"
					bind:value={v.interval}
					class="w-24"
					aria-invalid={errors.interval ? 'true' : undefined}
				/>
				<span class="font-semibold">{Number(v.interval) === 1 ? unit[0] : unit[1]}</span>
			</div>
			{#if errors.interval}<p class="error">{errors.interval}</p>{/if}
		</div>
	{:else}
		<input type="hidden" name="interval" value="1" />
	{/if}

	<fieldset class="field">
		<legend class="mb-1.5 text-[0.9375rem] font-semibold"
			>{v.repeat === 'ONCE' ? 'Time' : 'At'}</legend
		>
		<div class="flex flex-wrap items-center gap-2">
			{#each v.times as time, i (i)}
				<span
					class="flex items-center gap-1 rounded-[14px] border-2 border-line bg-paper pr-1 focus-within:border-ink"
				>
					<input
						type="time"
						name="times"
						bind:value={v.times[i]}
						aria-label="Time {i + 1}"
						title={time}
						class="!min-h-11 !border-0 !bg-transparent !shadow-none"
					/>
					{#if v.times.length > 1}
						<button
							type="button"
							class="grid size-8 place-items-center rounded-full text-lg hover:bg-biscuit"
							aria-label="Remove time {v.times[i]}"
							onclick={() => (v.times = v.times.filter((_t, j) => j !== i))}>×</button
						>
					{/if}
				</span>
			{/each}
			{#if v.repeat !== 'ONCE' && v.times.length < 6}
				<button
					type="button"
					class="rounded-full px-3 py-2 text-sm font-bold hover:bg-paper"
					onclick={() => (v.times = [...v.times, '12:00'])}>+ Add a time</button
				>
			{/if}
		</div>
		{#if errors.times}<p class="error">{errors.times}</p>{/if}
	</fieldset>

	<div class="grid grid-cols-2 gap-3">
		<Field
			label={v.repeat === 'ONCE' ? 'Date' : 'Starting'}
			name="startDate"
			type="date"
			bind:value={v.startDate}
			errors={errors.startDate ? [errors.startDate] : []}
		/>
		{#if v.repeat !== 'ONCE'}
			<Field
				label="Until (optional)"
				name="endDate"
				type="date"
				bind:value={v.endDate}
				errors={errors.endDate ? [errors.endDate] : []}
			/>
		{/if}
	</div>
	{#if summary}<p class="hand -mt-1 text-2xl text-muted" aria-live="polite">{summary}</p>{/if}

	{#if v.type === 'MEDICATION' || v.type === 'FLEA_TICK' || v.type === 'WORMING'}
		<Field
			label="Doses left (optional)"
			name="stock"
			inputmode="numeric"
			bind:value={v.stock}
			errors={errors.stock ? [errors.stock] : []}
			hint="Counts down each time it’s given."
		/>
	{/if}
	<Field
		label="Notes"
		name="notes"
		bind:value={v.notes}
		errors={errors.notes ? [errors.notes] : []}
		placeholder="Hide it in cheese"
	/>

	<button class="btn" disabled={submitting}>{submitting ? 'Saving…' : submitLabel}</button>
</form>
