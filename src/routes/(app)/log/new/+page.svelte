<script lang="ts">
	import { resolve } from '$app/paths';
	import LogForm from '$lib/components/LogForm.svelte';

	let { data, form } = $props();
</script>

<svelte:head><title>Add to the log · Lead</title></svelte:head>

<a class="btn btn-ghost mb-6 min-h-11 px-4" href={resolve('/log')}>← Log</a>
<h1 class="mb-6 text-[2.6rem] leading-[0.9] font-extrabold tracking-[-0.05em]">Add to the log</h1>
{#if data.pets.length}
	<LogForm
		values={form?.values ?? data.values}
		errors={form?.errors}
		pets={data.pets}
		skillsByPet={data.skillsByPet}
		submitLabel="Save to the log"
	/>
{:else}
	<p class="text-muted">
		Add your dog first. <a
			class="font-bold underline underline-offset-4"
			href={resolve('/pets/new')}>Add a dog</a
		>
	</p>
{/if}
