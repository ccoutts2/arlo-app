<script lang="ts">
	import { enhance } from '$app/forms';
	import Field from './Field.svelte';
	import Chip from './Chip.svelte';
	import PetAvatar from './PetAvatar.svelte';
	import { shrinkPhoto } from '$lib/image';
	import {
		healthTags,
		levelLabel,
		levels,
		logTypeLabel,
		ratingLabel,
		skillIdeas,
		type LogTypeKey,
		type SkillLevelKey
	} from '$lib/log';
	import type { LogFormErrors, LogFormValues } from '$lib/schemas/log';

	type PetOpt = { id: string; name: string; photoId: string | null };
	type SkillOpt = { id: string; name: string; level: SkillLevelKey };
	let {
		values,
		errors = {},
		pets,
		skillsByPet,
		submitLabel,
		action
	}: {
		values: LogFormValues;
		errors?: LogFormErrors;
		pets: PetOpt[];
		skillsByPet: Record<string, SkillOpt[]>;
		submitLabel: string;
		action?: string;
	} = $props();

	const clone = (x: LogFormValues) => ({
		...x,
		tags: [...x.tags],
		skillIds: [...x.skillIds],
		newSkills: [...x.newSkills],
		levels: { ...x.levels }
	});
	let v = $state(clone(values));
	// Build the starting values without reading `v` here, or the effect would re-trigger itself.
	$effect(() => {
		const next = clone(values);
		if (!next.petId && pets.length === 1) next.petId = pets[0].id;
		if (!next.clientId) next.clientId = crypto.randomUUID(); // lets an offline save be stored once
		v = next;
	});

	const skills = $derived(skillsByPet[v.petId] ?? []);
	let newSkill = $state('');
	let submitting = $state(false);
	let preview = $state<string | null>(null);
	let photoInput: HTMLInputElement;

	function toggle<T>(list: T[], item: T, on: boolean) {
		return on ? [...new Set([...list, item])] : list.filter((x) => x !== item);
	}
	function addSkill() {
		const name = newSkill.trim().replace(/\s+/g, ' ');
		if (!name) return;
		const existing = skills.find((s) => s.name.toLowerCase() === name.toLowerCase());
		if (existing) v.skillIds = toggle(v.skillIds, existing.id, true);
		else if (!v.newSkills.some((n) => n.toLowerCase() === name.toLowerCase()))
			v.newSkills = [...v.newSkills, name];
		newSkill = '';
	}
	async function pickPhoto() {
		const file = photoInput.files?.[0];
		if (!file) return;
		const small = await shrinkPhoto(file);
		const dt = new DataTransfer();
		dt.items.add(small);
		photoInput.files = dt.files;
		if (preview) URL.revokeObjectURL(preview);
		preview = URL.createObjectURL(small);
	}
	const t = $derived(v.type as LogTypeKey);
	const ideas = $derived(
		skillIdeas.filter((i) => !skills.some((s) => s.name === i) && !v.newSkills.includes(i))
	);
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
	<input type="hidden" name="clientId" value={v.clientId} />

	<fieldset>
		<legend class="mb-2 text-[0.9375rem] font-semibold">What happened</legend>
		<div
			class="grid grid-cols-4 gap-1 rounded-full bg-paper p-1 shadow-[inset_0_0_0_1.5px_var(--color-line)]"
		>
			{#each Object.entries(logTypeLabel) as [key, label] (key)}
				<label
					class="cursor-pointer rounded-full py-2.5 text-center text-sm font-semibold transition-colors has-[:checked]:bg-ink has-[:checked]:text-paper has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ink"
				>
					<input class="sr-only" type="radio" name="type" value={key} bind:group={v.type} />{label}
				</label>
			{/each}
		</div>
	</fieldset>

	{#if pets.length > 1}
		<fieldset>
			<legend class="mb-2 text-[0.9375rem] font-semibold">Dog</legend>
			<div class="flex flex-wrap gap-2">
				{#each pets as pet (pet.id)}
					<label
						class="flex cursor-pointer items-center gap-2 rounded-full border-2 py-1 pr-4 pl-1 font-semibold has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper {v.petId ===
						pet.id
							? ''
							: 'border-line bg-paper'}"
					>
						<input class="sr-only" type="radio" name="petId" value={pet.id} bind:group={v.petId} />
						<PetAvatar {pet} size={30} />{pet.name}
					</label>
				{/each}
			</div>
			{#if errors.petId}<p class="error mt-1 text-sm font-semibold text-late">
					{errors.petId}
				</p>{/if}
		</fieldset>
	{:else}
		<input type="hidden" name="petId" value={v.petId} />
	{/if}

	<div class="grid gap-5">
		<Field
			label="Date"
			name="date"
			type="date"
			bind:value={v.date}
			errors={errors.date ? [errors.date] : []}
		/>
		<Field
			label="Time"
			name="time"
			type="time"
			bind:value={v.time}
			errors={errors.time ? [errors.time] : []}
		/>
	</div>

	{#if t === 'TRAINING' || t === 'WALK'}
		<Field
			label="Minutes"
			name="durationMin"
			type="number"
			inputmode="numeric"
			min="1"
			max="600"
			bind:value={v.durationMin}
			errors={errors.durationMin ? [errors.durationMin] : []}
			placeholder={t === 'TRAINING' ? '5' : '40'}
		/>
	{/if}

	{#if t === 'TRAINING'}
		<fieldset class="grid gap-2">
			<legend class="mb-1 text-[0.9375rem] font-semibold">Skills practised</legend>
			{#if skills.length || v.newSkills.length}
				<div class="flex flex-wrap gap-2">
					{#each skills as s (s.id)}
						<Chip
							name="skillIds"
							value={s.id}
							checked={v.skillIds.includes(s.id)}
							onchange={(on) => (v.skillIds = toggle(v.skillIds, s.id, on))}>{s.name}</Chip
						>
					{/each}
					{#each v.newSkills as n (n)}
						<span
							class="flex items-center gap-1 rounded-full border-2 border-ink bg-ink py-2.5 pr-2 pl-4 font-semibold text-paper"
						>
							<input type="hidden" name="newSkills" value={n} />{n}
							<button
								type="button"
								class="grid size-6 place-items-center rounded-full hover:bg-paper/20"
								aria-label="Remove {n}"
								onclick={() => (v.newSkills = v.newSkills.filter((x) => x !== n))}>×</button
							>
						</span>
					{/each}
				</div>
			{/if}
			<div class="flex gap-2">
				<label class="sr-only" for="new-skill">Add a skill</label>
				<input
					id="new-skill"
					list="skill-ideas"
					bind:value={newSkill}
					placeholder={skills.length ? 'Add another skill' : 'e.g. Recall'}
					class="min-h-12 min-w-0 grow rounded-[14px] border-2 border-line bg-paper px-4 focus-visible:border-ink focus-visible:outline-none"
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							e.preventDefault();
							addSkill();
						}
					}}
				/>
				<datalist id="skill-ideas"
					>{#each ideas as i (i)}<option value={i}></option>{/each}</datalist
				>
				<button type="button" class="btn btn-ghost min-h-12 px-5" onclick={addSkill}>Add</button>
			</div>
		</fieldset>

		{#each skills.filter((s) => v.skillIds.includes(s.id)) as s (s.id)}
			<fieldset class="paper grid gap-2 p-4">
				<legend class="sr-only">How is {s.name} now?</legend>
				<p class="font-semibold" aria-hidden="true">How’s {s.name} now?</p>
				<div class="grid grid-cols-3 gap-1">
					{#each levels as level (level)}
						<label
							class="cursor-pointer rounded-xl border-2 px-1 py-2 text-center text-sm font-semibold has-[:checked]:border-ink has-[:checked]:bg-tennis has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ink {(v
								.levels[s.id] ?? s.level) === level
								? ''
								: 'border-line'}"
						>
							<input
								class="sr-only"
								type="radio"
								name="level_{s.id}"
								value={level}
								checked={(v.levels[s.id] ?? s.level) === level}
								onchange={() => (v.levels = { ...v.levels, [s.id]: level })}
							/>{levelLabel[level]}
						</label>
					{/each}
				</div>
			</fieldset>
		{/each}

		<fieldset>
			<legend class="mb-2 text-[0.9375rem] font-semibold">How did it go?</legend>
			<div class="flex flex-wrap gap-2">
				{#each [1, 2, 3] as r (r)}
					<Chip
						name="rating"
						type="radio"
						value={String(r)}
						checked={v.rating === String(r)}
						onchange={() => (v.rating = String(r))}>{ratingLabel[r]}</Chip
					>
				{/each}
			</div>
		</fieldset>
	{/if}

	{#if t === 'HEALTH'}
		<fieldset>
			<legend class="mb-2 text-[0.9375rem] font-semibold">What did you notice?</legend>
			<div class="flex flex-wrap gap-2">
				{#each healthTags as tag (tag)}
					<Chip
						name="tags"
						value={tag}
						checked={v.tags.includes(tag)}
						onchange={(on) => (v.tags = toggle(v.tags, tag, on))}>{tag}</Chip
					>
				{/each}
			</div>
			{#if errors.tags}<p class="mt-2 text-sm font-semibold text-late">{errors.tags}</p>{/if}
		</fieldset>
	{/if}

	<div class="field">
		<label for="f-body">{t === 'NOTE' ? 'Note' : 'Notes'}</label>
		<textarea
			id="f-body"
			name="body"
			bind:value={v.body}
			aria-invalid={errors.body ? 'true' : undefined}
			placeholder={t === 'TRAINING'
				? 'What worked, what didn’t, what to try next'
				: t === 'HEALTH'
					? 'When it started, how bad, anything that helped'
					: t === 'WALK'
						? 'Where you went, how they were'
						: 'Anything worth remembering'}
		></textarea>
		{#if errors.body}<p class="error">{errors.body}</p>{/if}
	</div>

	<div class="flex items-center gap-3">
		<label
			class="btn btn-ghost min-h-12 cursor-pointer px-5 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ink"
		>
			{preview ? 'Change photo' : 'Add a photo'}
			<input
				bind:this={photoInput}
				class="sr-only"
				type="file"
				name="photo"
				accept="image/*"
				onchange={pickPhoto}
			/>
		</label>
		{#if preview}<img src={preview} alt="" class="size-14 rounded-xl object-cover" />{/if}
	</div>
	{#if errors.photo}<p class="text-sm font-semibold text-late" role="alert">{errors.photo}</p>{/if}

	<button class="btn" disabled={submitting}>{submitting ? 'Saving…' : submitLabel}</button>
</form>
