<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	const tabs = [
		{ href: '/' as const, label: 'Today', match: (p: string) => p === '/' },
		{ href: '/log' as const, label: 'Log', match: (p: string) => p.startsWith('/log') },
		{ href: '/pets' as const, label: 'Dogs', match: (p: string) => p.startsWith('/pets') },
		{
			href: '/household' as const,
			label: 'Household',
			match: (p: string) => p.startsWith('/household')
		}
	];

	let { late = 0 }: { late?: number } = $props();
	const active = $derived(tabs.findIndex((t) => t.match(page.url.pathname)));

	// The app-icon badge on the home screen (iOS 16.4+ when installed, Chrome desktop).
	$effect(() => {
		const nav = navigator as Navigator & {
			setAppBadge?: (n: number) => Promise<void>;
			clearAppBadge?: () => Promise<void>;
		};
		if (late > 0) nav.setAppBadge?.(late).catch(() => {});
		else nav.clearAppBadge?.().catch(() => {});
	});
</script>

<!-- The bar persists across pages (it lives in the layout), so the pill slides with a plain CSS transition. -->
<nav
	aria-label="Main"
	class="fixed bottom-[max(14px,env(safe-area-inset-bottom))] left-1/2 z-20 grid w-[min(408px,calc(100%-32px))] -translate-x-1/2 grid-cols-4 rounded-full bg-ink p-1.5 shadow-bar"
	style:view-transition-name="tabbar"
>
	{#if active >= 0}
		<span
			aria-hidden="true"
			class="pill absolute top-1.5 bottom-1.5 left-1.5 rounded-full bg-tennis"
			style:translate="{active * 100}% 0"
		></span>
	{/if}
	{#each tabs as tab, i (tab.href)}
		<a
			href={resolve(tab.href)}
			aria-current={i === active ? 'page' : undefined}
			class="label relative z-10 min-w-0 rounded-full py-3 text-center text-[clamp(0.75rem,3.4vw,0.875rem)] font-semibold {i ===
			active
				? 'text-ink'
				: 'text-paper/70 hover:bg-paper/10 hover:text-paper'}"
			>{tab.label}{#if i === 0 && late > 0}<span
					class="absolute top-1 right-[calc(50%-38px)] grid h-5 min-w-5 place-items-center rounded-full bg-late px-1 text-[0.6875rem] font-bold text-white"
					aria-label="{late} late">{late}</span
				>{/if}</a
		>
	{/each}
</nav>

<style>
	.pill {
		width: calc((100% - 12px) / 4);
		transition: translate 0.45s var(--ease-pen);
	}
	.label {
		transition:
			color 0.3s 0.08s,
			background-color 0.3s;
	}
</style>
