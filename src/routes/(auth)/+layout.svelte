<script lang="ts">
	let { children } = $props();
</script>

<a
	href="#main"
	class="absolute -top-16 left-3 z-50 rounded-full bg-ink px-4 py-2.5 text-paper focus:top-3"
	>Skip to form</a
>
<main
	id="main"
	class="mx-auto grid min-h-svh max-w-[440px] content-center gap-8 px-4 pt-[max(24px,env(safe-area-inset-top))] pb-10"
>
	<p class="flex items-center gap-2.5 text-lg font-extrabold tracking-tight">
		<img src="/favicon.svg" alt="" width="32" height="32" class="rounded-lg" />Lead
	</p>
	{@render children()}
</main>
