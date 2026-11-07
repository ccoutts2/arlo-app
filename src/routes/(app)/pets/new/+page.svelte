<script lang="ts">
	import { resolve } from '$app/paths';
	import PetForm from '$lib/components/PetForm.svelte';

	let { data, form } = $props();
</script>

<svelte:head><title>Add a dog · Lead</title></svelte:head>

<a class="btn btn-ghost mb-6 min-h-11 px-4" href={resolve('/pets')}>← Dogs</a>
<h1 class="mb-6 text-[2.6rem] leading-[0.9] font-extrabold tracking-[-0.05em]">Add a dog</h1>
<PetForm
	values={form?.values ?? data.values}
	errors={form?.errors}
	submitLabel="Add to the sheet"
/>
