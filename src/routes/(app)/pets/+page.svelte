<script lang="ts">
	import { resolve } from '$app/paths';
	import { age } from '$lib/format';
	import PetAvatar from '$lib/components/PetAvatar.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Dogs · Lead</title>
	<meta name="description" content="The dogs on your household's sheet." />
</svelte:head>

<div class="flex items-end justify-between gap-4">
	<h1
		class="-ml-[0.04em] text-[clamp(3rem,15vw,4rem)] leading-[0.86] font-extrabold tracking-[-0.055em]"
	>
		Dogs
	</h1>
	{#if data.pets.length}
		<a class="btn btn-ghost min-h-11 px-4" href={resolve('/pets/new')}>Add a dog</a>
	{/if}
</div>

{#if data.pets.length}
	<ul class="mt-8 grid gap-3">
		{#each data.pets as pet (pet.id)}
			<li>
				<a
					href={resolve(`/pets/${pet.id}`)}
					class="paper group flex items-center gap-4 p-3 pr-5 transition-[translate] duration-300 ease-pen hover:translate-x-1"
				>
					<span class="shrink-0">
						<PetAvatar {pet} size={72} />
					</span>
					<span class="grow">
						<span class="block text-xl font-extrabold tracking-tight">{pet.name}</span>
						<span class="text-sm text-muted"
							>{[pet.breed, age(pet.birthday)].filter(Boolean).join(' · ') ||
								'Add their details'}</span
						>
					</span>
					<span
						aria-hidden="true"
						class="text-xl transition-transform duration-300 group-hover:translate-x-1">→</span
					>
				</a>
			</li>
		{/each}
	</ul>
{:else}
	<section class="paper tape mt-8 grid gap-4 p-6" aria-labelledby="none-h">
		<h2 id="none-h" class="text-2xl font-extrabold tracking-tight">No dogs yet</h2>
		<p class="text-muted">
			Add your dog with a photo and their details. Everyone in your household will see them.
		</p>
		<a class="btn justify-self-start" href={resolve('/pets/new')}>Add your dog</a>
	</section>
{/if}
