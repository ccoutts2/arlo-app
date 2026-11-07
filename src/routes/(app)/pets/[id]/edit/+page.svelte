<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import PetForm from '$lib/components/PetForm.svelte';

	let { data, form } = $props();
	let confirming = $state(false);
</script>

<svelte:head><title>Edit {data.pet.name} · Lead</title></svelte:head>

<a class="btn btn-ghost mb-6 min-h-11 px-4" href={resolve(`/pets/${data.pet.id}`)}
	>← {data.pet.name}</a
>
<h1 class="mb-6 text-[2.6rem] leading-[0.9] font-extrabold tracking-[-0.05em]">
	Edit {data.pet.name}
</h1>
<PetForm
	values={form?.values ?? data.values}
	errors={form?.errors}
	photoUrl={data.pet.photoId ? `/files/${data.pet.photoId}` : null}
	submitLabel="Save changes"
	action="?/save"
/>

<section
	class="mt-12 rounded-[22px] p-5 shadow-[inset_0_0_0_1.5px_var(--color-line)]"
	aria-labelledby="del-h"
>
	<h2 id="del-h" class="text-lg font-extrabold">Remove {data.pet.name}</h2>
	<p class="mt-1 text-sm text-muted">
		This deletes their details and photos for everyone in your household.
	</p>
	{#if confirming}
		<form method="POST" action="?/delete" use:enhance class="mt-4 flex flex-wrap gap-2">
			<button class="btn bg-late">Yes, remove {data.pet.name}</button>
			<button type="button" class="btn btn-ghost" onclick={() => (confirming = false)}>Keep</button>
		</form>
	{:else}
		<button class="btn btn-ghost mt-4" onclick={() => (confirming = true)}
			>Remove {data.pet.name}…</button
		>
	{/if}
</section>
