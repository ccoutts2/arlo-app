<script lang="ts">
	import { resolve } from '$app/paths';
	let { current }: { current: 'diary' | 'places' } = $props();
</script>

<!-- Diary and Places share the Log tab (a fifth tab wouldn't fit a 320 px screen). -->
<nav
	aria-label="Log sections"
	class="mt-5 grid grid-cols-2 gap-1 rounded-full bg-paper p-1 shadow-[inset_0_0_0_1.5px_var(--color-line)]"
>
	{#each [['diary', 'Diary', '/log'], ['places', 'Places', '/log/places']] as const as [key, label, href] (key)}
		<a
			href={resolve(href)}
			aria-current={current === key ? 'page' : undefined}
			class="rounded-full py-2.5 text-center text-sm font-semibold transition-colors {current ===
			key
				? 'bg-ink text-paper'
				: 'hover:bg-biscuit/50'}">{label}</a
		>
	{/each}
</nav>
