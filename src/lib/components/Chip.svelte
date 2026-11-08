<script lang="ts">
	// A toggle chip backed by a real checkbox or radio, so it submits with the form.
	import type { Snippet } from 'svelte';
	let {
		name,
		value,
		type = 'checkbox',
		checked = false,
		onchange,
		children
	}: {
		name: string;
		value: string;
		type?: 'checkbox' | 'radio';
		checked?: boolean;
		onchange?: (checked: boolean) => void;
		children: Snippet;
	} = $props();
</script>

<label
	class="cursor-pointer rounded-full border-2 px-4 py-2.5 font-semibold transition-[background,border-color,scale,color] duration-200 select-none active:scale-95 has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink {checked
		? ''
		: 'border-line bg-paper hover:border-ink/40'}"
>
	<input
		class="sr-only"
		{type}
		{name}
		{value}
		{checked}
		onchange={(e) => onchange?.(e.currentTarget.checked)}
	/>
	{@render children()}
</label>
