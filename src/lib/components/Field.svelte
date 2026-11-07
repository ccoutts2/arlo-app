<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	let {
		label,
		name,
		value = $bindable(),
		errors,
		hint,
		...rest
	}: HTMLInputAttributes & {
		label: string;
		name: string;
		errors?: string[];
		hint?: string;
	} = $props();

	const id = `f-${name}`;
</script>

<div class="field">
	<label for={id}>{label}</label>
	<input
		{id}
		{name}
		bind:value
		aria-invalid={errors?.length ? 'true' : undefined}
		aria-describedby={errors?.length ? `${id}-err` : hint ? `${id}-hint` : undefined}
		{...rest}
	/>
	{#if errors?.length}
		<p class="error" id="{id}-err">{errors[0]}</p>
	{:else if hint}
		<p class="text-sm text-muted" id="{id}-hint">{hint}</p>
	{/if}
</div>
