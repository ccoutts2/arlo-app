<script lang="ts">
	import { page } from '$app/state';
	import TabBar from '$lib/components/TabBar.svelte';
	import InstallHint from '$lib/components/InstallHint.svelte';
	import OfflineBar from '$lib/components/OfflineBar.svelte';

	let { children, data } = $props();

	// Full-screen tasks (adding, editing, marking a dose) hide the tab bar, like pushed screens in
	// iOS apps. It also keeps the bar from covering the form's submit button.
	const focused = $derived(/\/(new|edit)$|\/care\/|^\/o\//.test(page.url.pathname));
</script>

<a
	href="#main"
	class="absolute -top-16 left-3 z-50 rounded-full bg-ink px-4 py-2.5 text-paper focus:top-3"
	>Skip to content</a
>
<main
	id="main"
	class="mx-auto max-w-[440px] px-4 pt-[max(18px,env(safe-area-inset-top))] {focused
		? 'pb-[max(96px,calc(env(safe-area-inset-bottom)+64px))]'
		: 'pb-[136px]'}"
>
	<OfflineBar />
	{@render children()}
</main>
{#if !focused}<TabBar late={data.lateCount} /><InstallHint />{/if}
