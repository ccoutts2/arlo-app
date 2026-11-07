<script lang="ts">
	import { resolve } from '$app/paths';
	import CareForm from '$lib/components/CareForm.svelte';

	let { data, form } = $props();
</script>

<svelte:head><title>Add to {data.pet.name}’s sheet · Lead</title></svelte:head>

<a class="btn btn-ghost mb-6 min-h-11 px-4" href={resolve(`/pets/${data.pet.id}`)}
	>← {data.pet.name}</a
>
<h1 class="mb-6 text-[2.4rem] leading-[0.92] font-extrabold tracking-[-0.05em]">
	Add to {data.pet.name}’s sheet
</h1>
<CareForm
	values={form?.values ?? data.values}
	errors={form?.errors}
	submitLabel="Add to the sheet"
	showPresets
/>
