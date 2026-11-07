<script lang="ts">
	// A hand-drawn tick. `seed` picks one of a few strokes so a sheet doesn't look stamped.
	let {
		seed = '',
		size = 26,
		stroke = 2.6,
		draw = false,
		class: cls = ''
	}: { seed?: string; size?: number; stroke?: number; draw?: boolean; class?: string } = $props();

	const paths = [
		'M4 14c2.4 1.6 4.4 4 5.6 6.4C12.6 13 17 7 22.6 3.2',
		'M3.6 12.8c3 2 4.6 4.6 6.2 7.8 2.6-6.6 7-12.4 12.8-16.8',
		'M5 15.2c1.8 1 3.6 3.2 4.8 5.2 3.4-7.2 7.4-12 12.4-15.8'
	];
	const d = $derived(paths[[...seed].reduce((a, c) => a + c.charCodeAt(0), 0) % paths.length]);
</script>

<svg
	viewBox="0 0 26 26"
	width={size}
	height={size}
	class="overflow-visible {cls}"
	aria-hidden="true"
>
	<path
		{d}
		fill="none"
		stroke="currentColor"
		stroke-width={stroke}
		stroke-linecap="round"
		stroke-linejoin="round"
		pathLength="1"
		class={draw ? 'tick-draw' : ''}
	/>
</svg>

<style>
	.tick-draw {
		stroke-dasharray: 1;
		stroke-dashoffset: 1;
		animation: pen 0.42s var(--ease-pen) forwards;
	}
	@keyframes pen {
		to {
			stroke-dashoffset: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.tick-draw {
			animation: none;
			stroke-dashoffset: 0;
		}
	}
</style>
