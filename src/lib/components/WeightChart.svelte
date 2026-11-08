<script lang="ts">
	// Weight over time: one series, so no legend (the heading names it). 2px ink line, the latest
	// point emphasised and labelled, recessive min/max guides, a tooltip on every point.
	let { points }: { points: { at: string; kg: number; label: string }[] } = $props();

	const W = 320,
		H = 120,
		PAD = { l: 8, r: 44, t: 16, b: 20 };
	const xs = $derived(points.map((p) => new Date(p.at).getTime()));
	const ys = $derived(points.map((p) => p.kg));
	const x0 = $derived(Math.min(...xs)),
		x1 = $derived(Math.max(...xs));
	const lo = $derived(Math.min(...ys)),
		hi = $derived(Math.max(...ys));
	const pad = $derived(Math.max((hi - lo) * 0.15, 0.2));
	const sx = (t: number) =>
		PAD.l + (x1 === x0 ? (W - PAD.l - PAD.r) / 2 : ((t - x0) / (x1 - x0)) * (W - PAD.l - PAD.r));
	const sy = (kg: number) =>
		PAD.t + (1 - (kg - (lo - pad)) / (hi + pad - (lo - pad))) * (H - PAD.t - PAD.b);
	const path = $derived(
		points.map((p, i) => `${i ? 'L' : 'M'}${sx(xs[i]).toFixed(1)},${sy(p.kg).toFixed(1)}`).join(' ')
	);
	let hover = $state<number | null>(null);
	const last = $derived(points.length - 1);
	const shown = $derived(hover ?? last);
</script>

<figure class="relative m-0">
	<svg
		viewBox="0 0 {W} {H}"
		class="block h-auto w-full overflow-visible"
		role="img"
		aria-label="Weight over time, from {points[0].kg} kg to {points[last].kg} kg"
	>
		<!-- Recessive guides at the lowest and highest weights -->
		{#each [lo, hi] as g (g)}
			<line
				x1={PAD.l}
				x2={W - PAD.r}
				y1={sy(g)}
				y2={sy(g)}
				stroke="var(--color-line)"
				stroke-width="1"
			/>
			<text x={W - PAD.r + 6} y={sy(g) + 4} class="fill-muted text-[10px] tabular-nums"
				>{g.toFixed(1)}</text
			>
		{/each}
		<path
			d={path}
			fill="none"
			stroke="var(--color-ink)"
			stroke-width="2"
			stroke-linejoin="round"
			stroke-linecap="round"
		/>
		{#each points as p, i (p.at + i)}
			<!-- Large invisible hit target, small visible mark -->
			<circle
				cx={sx(xs[i])}
				cy={sy(p.kg)}
				r="14"
				fill="transparent"
				role="button"
				tabindex="0"
				aria-label="{p.label}: {p.kg} kg"
				onpointerenter={() => (hover = i)}
				onpointerleave={() => (hover = null)}
				onfocus={() => (hover = i)}
				onblur={() => (hover = null)}
			/>
			<circle
				cx={sx(xs[i])}
				cy={sy(p.kg)}
				r={i === shown ? 5 : 3}
				fill={i === shown ? 'var(--color-ink)' : 'var(--color-paper)'}
				stroke="var(--color-paper)"
				stroke-width="2"
				pointer-events="none"
			/>
			{#if i !== shown}<circle
					cx={sx(xs[i])}
					cy={sy(p.kg)}
					r="3"
					fill="var(--color-ink)"
					pointer-events="none"
				/>{/if}
		{/each}
	</svg>
	<figcaption class="mt-1 flex items-baseline justify-between text-sm">
		<span class="text-muted">{points[shown].label}</span>
		<span class="font-bold tabular-nums">{points[shown].kg} kg</span>
	</figcaption>
</figure>
