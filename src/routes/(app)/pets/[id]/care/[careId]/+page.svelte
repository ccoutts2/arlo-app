<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import CareForm from '$lib/components/CareForm.svelte';

	let { data, form } = $props();
	let confirming = $state(false);
</script>

<svelte:head><title>Edit {data.item.title} · Lead</title></svelte:head>

<a class="btn btn-ghost mb-6 min-h-11 px-4" href={resolve(`/pets/${data.pet.id}`)}
	>← {data.pet.name}</a
>
<h1 class="mb-6 text-[2.4rem] leading-[0.92] font-extrabold tracking-[-0.05em]">
	Edit {data.item.title}
</h1>
<CareForm
	values={form?.values ?? data.values}
	errors={form?.errors}
	submitLabel="Save changes"
	action="?/save"
/>
<p class="mt-3 text-sm text-muted">
	Changing the schedule updates upcoming doses. Ones already given stay on the sheet.
</p>

<section
	class="mt-12 rounded-[22px] p-5 shadow-[inset_0_0_0_1.5px_var(--color-line)]"
	aria-labelledby="del-h"
>
	<h2 id="del-h" class="text-lg font-extrabold">Take {data.item.title} off the sheet</h2>
	<p class="mt-1 text-sm text-muted">Removes it and its history for everyone in your household.</p>
	{#if confirming}
		<form method="POST" action="?/delete" use:enhance class="mt-4 flex flex-wrap gap-2">
			<button class="btn bg-late">Yes, remove it</button>
			<button type="button" class="btn btn-ghost" onclick={() => (confirming = false)}>Keep</button>
		</form>
	{:else}
		<button class="btn btn-ghost mt-4" onclick={() => (confirming = true)}
			>Remove {data.item.title}…</button
		>
	{/if}
</section>
