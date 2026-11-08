<script lang="ts">
	import { onMount } from 'svelte';
	import { outbox, sync } from '$lib/offline/outbox.svelte';

	let online = $state(true);
	onMount(() => {
		online = navigator.onLine;
		void sync();
		const up = () => ((online = true), void sync());
		const down = () => (online = false);
		const visible = () => document.visibilityState === 'visible' && void sync();
		addEventListener('online', up);
		addEventListener('offline', down);
		document.addEventListener('visibilitychange', visible);
		return () => {
			removeEventListener('online', up);
			removeEventListener('offline', down);
			document.removeEventListener('visibilitychange', visible);
		};
	});
</script>

{#if !online}
	<p
		role="status"
		class="sticky top-[env(safe-area-inset-top)] z-30 -mx-4 mb-3 bg-ink px-4 py-2 text-center text-sm font-semibold text-paper"
	>
		You’re offline. Log entries save on this phone and sync when you’re back.
	</p>
{/if}
{#if outbox.lastError}
	<p role="alert" class="mb-3 rounded-2xl bg-late/10 px-4 py-2 text-sm font-semibold text-late">
		{outbox.lastError}
	</p>
{/if}
