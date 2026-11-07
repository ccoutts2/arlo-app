<script lang="ts">
	let { people }: { people: { id: string; givenName: string }[] } = $props();
	const label = $derived(`Household: ${people.map((p) => p.givenName).join(', ')}`);
</script>

<div class="flex" role="img" aria-label={label}>
	{#each people as person, i (person.id)}
		<span
			aria-hidden="true"
			class="hand -ml-2 grid size-[34px] place-items-center rounded-full border-2 border-biscuit text-xl first:ml-0 {i ===
			people.length - 1
				? 'bg-ink text-paper'
				: 'bg-paper'}">{person.givenName[0]}</span
		>
	{/each}
</div>
