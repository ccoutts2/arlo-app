<script lang="ts">
	import TabBar from '$lib/components/TabBar.svelte';

	let { children } = $props();
</script>

<a
	href="#main"
	class="absolute -top-16 left-3 z-50 rounded-full bg-ink px-4 py-2.5 text-paper focus:top-3"
	>Skip to content</a
>
<main
	id="main"
	class="mx-auto max-w-[440px] px-4 pt-[max(18px,env(safe-area-inset-top))] pb-[136px]"
>
	{@render children()}
</main>
<TabBar />
