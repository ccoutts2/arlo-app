<script lang="ts">
	import '../app.css';
	import { onNavigate } from '$app/navigation';

	let { children } = $props();

	// Animated page changes where the browser supports View Transitions (Safari 18+, Chrome).
	onNavigate((navigation) => {
		if (!document.startViewTransition) return;
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		return new Promise((resolve) => {
			const t = document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
			// A transition can be skipped (e.g. the viewport changes mid-way); that's not an error.
			t.ready.catch(() => {});
			t.finished.catch(() => {});
		});
	});
</script>

{@render children()}
