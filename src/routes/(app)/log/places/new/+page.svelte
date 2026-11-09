<script lang="ts">
	import { resolve } from '$app/paths';
	import PlaceForm from '$lib/components/PlaceForm.svelte';
	import MapView from '$lib/components/MapView.svelte';

	let { data, form } = $props();
</script>

<svelte:head><title>Add a place · Lead</title></svelte:head>

<a class="btn btn-ghost mb-6 min-h-11 px-4" href={resolve('/log/places')}>← Places</a>
<h1 class="mb-6 text-[2.6rem] leading-[0.9] font-extrabold tracking-[-0.05em]">Add a place</h1>
<PlaceForm values={form?.values ?? data.values} errors={form?.errors} submitLabel="Save place">
	{#snippet map(pick)}<MapView {pick} autoOpen={false} searchable />{/snippet}
</PlaceForm>
