<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		errors,
		children,
		name,
		legend
	}: { errors?: string[]; children: Snippet; name: string; legend: string } = $props();
</script>

<fieldset
	class="Fieldset"
	role="radiogroup"
	aria-required="true"
	data-has-error={errors ? 'true' : undefined}
	aria-invalid={errors ? 'true' : undefined}
	aria-describedby="{name}-error-message"
>
	<legend> {legend} </legend>

	{#if errors}
		<div class="Error" id="{name}-error-message">
			{errors}
		</div>
	{/if}

	{@render children?.()}
</fieldset>

<style lang="scss">
	.Error {
		color: #dc2626;
		display: flex;
		gap: 0.2rem;
		margin-bottom: 0.25rem;
	}

	.Fieldset {
		color: grey;
		display: flex;
		font-size: 0.825rem;
		flex-wrap: wrap;
		gap: 1rem;
		margin-block: 0.5rem;
		width: 100%;

		legend {
			padding-bottom: 0.5rem;
		}
	}
</style>
