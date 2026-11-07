<script lang="ts">
	import { resolve } from '$app/paths';
	import { age, sexLabel } from '$lib/format';

	let { data } = $props();
	const pet = $derived(data.pet);

	const facts = $derived(
		[
			['Breed', pet.breed],
			['Age', age(pet.birthday)],
			['Sex', pet.sex === 'UNKNOWN' ? null : sexLabel[pet.sex]],
			['Weight', pet.weightKg ? `${pet.weightKg} kg` : null],
			['Neutered', pet.neutered === null ? null : pet.neutered ? 'Yes' : 'No'],
			['Microchip', pet.microchip],
			['Allergies', pet.allergies]
		].filter((f): f is [string, string] => Boolean(f[1]))
	);
</script>

<svelte:head>
	<title>{pet.name} · Lead</title>
	<meta name="description" content="{pet.name}'s details, vet and treatments." />
</svelte:head>

<div class="relative -mx-4 -mt-[max(18px,env(safe-area-inset-top))]">
	{#if pet.photoId}
		<img
			src="/files/{pet.photoId}"
			alt={pet.name}
			class="aspect-[4/4.2] w-full rounded-b-none object-cover"
			style:view-transition-name="pet-photo-{pet.id}"
		/>
	{:else}
		<div
			class="hand grid aspect-[4/3] w-full place-items-center rounded-b-none bg-ink text-[9rem] text-paper/90"
			style:view-transition-name="pet-photo-{pet.id}"
			aria-hidden="true"
		>
			{pet.name[0]}
		</div>
	{/if}
	<a
		href={resolve('/pets')}
		class="absolute top-[max(12px,env(safe-area-inset-top))] left-4 rounded-full bg-paper px-4 py-2.5 text-sm font-bold transition-colors hover:bg-tennis"
		>← Dogs</a
	>
	<a
		href={resolve(`/pets/${pet.id}/edit`)}
		class="absolute top-[max(12px,env(safe-area-inset-top))] right-4 rounded-full bg-paper px-4 py-2.5 text-sm font-bold transition-colors hover:bg-tennis"
		>Edit</a
	>
</div>

<section class="paper tape relative -mt-16 p-5">
	<h1 class="text-[4.25rem] leading-[0.82] font-extrabold tracking-[-0.06em]">{pet.name}</h1>
	{#if pet.note}<p class="hand mt-1.5 inline-block -rotate-2 text-[1.625rem] text-muted">
			{pet.note}
		</p>{/if}
	{#if facts.length}
		<dl class="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
			{#each facts as [label, value] (label)}
				<div class="min-w-0">
					<dt class="text-xs font-semibold text-muted">{label}</dt>
					<dd class="font-bold break-words">{value}</dd>
				</div>
			{/each}
		</dl>
	{:else}
		<p class="mt-3 text-muted">
			No details yet. <a
				class="font-bold underline underline-offset-4"
				href={resolve(`/pets/${pet.id}/edit`)}>Add some</a
			>
		</p>
	{/if}
</section>

<h2 class="mt-9 mb-3 text-[1.375rem] font-extrabold tracking-tight">On the sheet</h2>
<div class="rounded-[22px] p-5 shadow-[inset_0_0_0_1.5px_var(--color-line)]">
	<p class="text-muted">Treatments and reminders for {pet.name} arrive in the next update.</p>
</div>

<h2 class="mt-9 mb-3 text-[1.375rem] font-extrabold tracking-tight">Vet</h2>
{#if pet.vetName || pet.vetPhone}
	<div class="paper flex items-center justify-between gap-3 p-5">
		<div class="min-w-0">
			<strong class="block">{pet.vetName ?? 'Vet'}</strong>
			{#if pet.vetAddress}<span class="text-sm text-muted">{pet.vetAddress}</span>{/if}
		</div>
		{#if pet.vetPhone}
			<a class="btn btn-ghost min-h-11 shrink-0 px-5" href="tel:{pet.vetPhone.replace(/\s/g, '')}"
				>Call</a
			>
		{/if}
	</div>
{:else}
	<p class="text-muted">
		No vet saved. <a
			class="font-bold underline underline-offset-4"
			href={resolve(`/pets/${pet.id}/edit`)}>Add their vet</a
		>
	</p>
{/if}
