<script lang="ts">
	import '../app.css';
	import { beforeNavigate, onNavigate } from '$app/navigation';

	let { children } = $props();

	// Offline, move between screens with full page loads: the service worker serves the saved copy
	// of each screen, whereas an in-app navigation would need fresh data from the server.
	beforeNavigate((navigation) => {
		if (navigator.onLine || !navigation.to || navigation.willUnload) return;
		if (navigation.type === 'popstate' || navigation.to.url.origin !== location.origin) return;
		navigation.cancel();
		location.href = navigation.to.url.href;
	});

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
