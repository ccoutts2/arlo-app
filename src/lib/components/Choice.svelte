<script lang="ts">
	let {
		legend,
		name,
		options,
		value = $bindable('')
	}: {
		legend: string;
		name: string;
		options: { value: string; label: string }[];
		value?: string;
	} = $props();
</script>

<fieldset class="grid gap-1.5">
	<legend class="mb-1.5 text-[0.9375rem] font-semibold">{legend}</legend>
	<div class="flex flex-wrap gap-2">
		{#each options as option (option.value)}
			<label
				class="cursor-pointer rounded-full border-2 px-4 py-2.5 font-semibold transition-[background,border-color,scale] duration-200 active:scale-95 has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink {value ===
				option.value
					? ''
					: 'border-line bg-paper hover:border-ink/40'}"
			>
				<input class="sr-only" type="radio" {name} value={option.value} bind:group={value} />
				{option.label}
			</label>
		{/each}
	</div>
</fieldset>
