<script lang="ts">
	import { enhance } from '$app/forms';
	import Field from './Field.svelte';
	import Choice from './Choice.svelte';
	import { shrinkPhoto } from '$lib/image';
	import type { PetFormErrors, PetFormValues } from '$lib/schemas/pet';

	let {
		values,
		errors = {},
		photoUrl = null,
		submitLabel,
		action
	}: {
		values: PetFormValues;
		errors?: PetFormErrors;
		photoUrl?: string | null;
		submitLabel: string;
		action?: string;
	} = $props();

	// Local editable copy of the values (re-filled from the server on a failed submit).
	// Deeply reactive copy, re-filled when the server sends values back (see CareForm).
	// eslint-disable-next-line svelte/prefer-writable-derived
	let v = $state({ ...values });
	$effect(() => {
		v = { ...values };
	});

	let preview = $state<string | null>(null);
	let busy = $state(false);
	let input: HTMLInputElement;

	async function pick() {
		const file = input.files?.[0];
		if (!file) return;
		busy = true;
		const small = await shrinkPhoto(file);
		const dt = new DataTransfer();
		dt.items.add(small);
		input.files = dt.files;
		if (preview) URL.revokeObjectURL(preview);
		preview = URL.createObjectURL(small);
		busy = false;
	}

	const shown = $derived(preview ?? photoUrl);
	let submitting = $state(false);
</script>

<form
	method="POST"
	{action}
	enctype="multipart/form-data"
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
	<div class="flex items-center gap-4">
		<label
			class="group relative grid size-[104px] shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full bg-paper shadow-paper has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-ink"
		>
			{#if shown}
				<img src={shown} alt="" class="size-full object-cover" />
			{:else}
				<svg viewBox="0 0 24 24" class="size-9 text-muted" aria-hidden="true"
					><path
						d="M4 8h3l2-2h6l2 2h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
						stroke-linejoin="round"
					/></svg
				>
			{/if}
			<span
				class="absolute inset-x-0 bottom-0 bg-ink/70 py-1 text-center text-xs font-semibold text-paper transition-transform duration-300 group-hover:translate-y-0 {shown
					? 'translate-y-full'
					: 'translate-y-0'}">{shown ? 'Change' : 'Add photo'}</span
			>
			<input
				bind:this={input}
				class="sr-only"
				type="file"
				name="photo"
				accept="image/*"
				onchange={pick}
				aria-label="Photo of your dog"
			/>
		</label>
		<p class="text-sm text-muted">
			{busy ? 'Getting the photo ready…' : 'A photo makes the sheet feel like theirs. Optional.'}
		</p>
	</div>
	{#if errors.photo}<p class="font-semibold text-late" role="alert">{errors.photo}</p>{/if}

	<Field
		label="Name"
		name="name"
		bind:value={v.name}
		errors={errors.name ? [errors.name] : []}
		autocomplete="off"
	/>
	<Field
		label="Breed"
		name="breed"
		bind:value={v.breed}
		errors={errors.breed ? [errors.breed] : []}
		placeholder="Labrador retriever"
	/>
	<Choice
		legend="Sex"
		name="sex"
		bind:value={v.sex}
		options={[
			{ value: 'FEMALE', label: 'Girl' },
			{ value: 'MALE', label: 'Boy' },
			{ value: 'UNKNOWN', label: 'Skip' }
		]}
	/>
	<div class="grid gap-5">
		<Field
			label="Birthday"
			name="birthday"
			type="date"
			bind:value={v.birthday}
			errors={errors.birthday ? [errors.birthday] : []}
		/>
		<Field
			label="Weight (kg)"
			name="weightKg"
			inputmode="decimal"
			bind:value={v.weightKg}
			errors={errors.weightKg ? [errors.weightKg] : []}
			placeholder="24.6"
		/>
	</div>
	<Choice
		legend="Neutered"
		name="neutered"
		bind:value={v.neutered}
		options={[
			{ value: 'yes', label: 'Yes' },
			{ value: 'no', label: 'No' },
			{ value: '', label: 'Not sure' }
		]}
	/>
	<Field
		label="Microchip number"
		name="microchip"
		inputmode="numeric"
		bind:value={v.microchip}
		errors={errors.microchip ? [errors.microchip] : []}
	/>
	<Field
		label="Allergies"
		name="allergies"
		bind:value={v.allergies}
		errors={errors.allergies ? [errors.allergies] : []}
		placeholder="Chicken, grass pollen"
	/>
	<Field
		label="A line about them"
		name="note"
		bind:value={v.note}
		errors={errors.note ? [errors.note] : []}
		hint="Written on their card, e.g. “hates the ear drops”."
	/>

	<fieldset class="paper grid gap-4 p-5">
		<legend class="sr-only">Vet</legend>
		<p class="text-lg font-extrabold tracking-tight" aria-hidden="true">Vet</p>
		<Field
			label="Practice"
			name="vetName"
			bind:value={v.vetName}
			errors={errors.vetName ? [errors.vetName] : []}
			placeholder="Riverside Vets"
		/>
		<Field
			label="Phone"
			name="vetPhone"
			type="tel"
			bind:value={v.vetPhone}
			errors={errors.vetPhone ? [errors.vetPhone] : []}
		/>
		<Field
			label="Address"
			name="vetAddress"
			bind:value={v.vetAddress}
			errors={errors.vetAddress ? [errors.vetAddress] : []}
		/>
	</fieldset>

	<button class="btn" disabled={submitting || busy}>{submitting ? 'Saving…' : submitLabel}</button>
</form>
