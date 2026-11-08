<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import ShareIcon from '$lib/components/ShareIcon.svelte';
	import { isIos, isStandalone } from '$lib/push-client';

	type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
	let platform = $state<'ios' | 'android' | 'other'>('ios');
	let installed = $state(false);
	let deferred = $state<BIP | null>(null);

	onMount(() => {
		platform = isIos() ? 'ios' : /Android/.test(navigator.userAgent) ? 'android' : 'other';
		installed = isStandalone();
		const onPrompt = (e: Event) => {
			e.preventDefault();
			deferred = e as BIP;
		};
		addEventListener('beforeinstallprompt', onPrompt);
		return () => removeEventListener('beforeinstallprompt', onPrompt);
	});

	async function install() {
		if (!deferred) return;
		await deferred.prompt();
		deferred = null;
	}
</script>

<svelte:head>
	<title>Add Lead to your Home Screen</title>
	<meta name="description" content="Install Lead on your phone so reminders can reach you." />
</svelte:head>

<main
	class="mx-auto grid min-h-svh max-w-[440px] content-start gap-6 px-4 pt-[max(24px,env(safe-area-inset-top))] pb-12"
>
	<a class="btn btn-ghost min-h-11 justify-self-start px-4" href={resolve('/')}>← Lead</a>
	<h1 class="text-[2.6rem] leading-[0.9] font-extrabold tracking-[-0.05em]">
		Add Lead to your Home Screen
	</h1>
	<p class="text-muted">
		Lead works like an app once it’s on your Home Screen. On iPhone, that’s also the only way
		reminders can reach you.
	</p>

	{#if installed}
		<section class="paper tape grid gap-3 p-5">
			<h2 class="text-xl font-extrabold">You’re all set</h2>
			<p>Lead is installed. Turn on reminders so you hear when something’s due.</p>
			<a class="btn" href={resolve('/household/notifications')}>Turn on reminders</a>
		</section>
	{:else}
		<div class="flex gap-2" role="tablist" aria-label="Phone">
			{#each [['ios', 'iPhone'], ['android', 'Android']] as [key, label] (key)}
				<button
					role="tab"
					aria-selected={platform === key}
					class="rounded-full border-2 px-4 py-2 font-semibold {platform === key
						? 'border-ink bg-ink text-paper'
						: 'border-line bg-paper'}"
					onclick={() => (platform = key as 'ios')}>{label}</button
				>
			{/each}
		</div>

		{#if platform === 'android'}
			<ol class="paper tape grid gap-4 p-5">
				{#if deferred}
					<li><button class="btn w-full" onclick={install}>Install Lead</button></li>
				{/if}
				<li class="flex gap-3">
					<span class="hand text-3xl leading-none">1</span><span
						>In Chrome, tap the <b>⋮</b> menu at the top right.</span
					>
				</li>
				<li class="flex gap-3">
					<span class="hand text-3xl leading-none">2</span><span
						>Tap <b>Install app</b> (or <b>Add to Home screen</b>).</span
					>
				</li>
				<li class="flex gap-3">
					<span class="hand text-3xl leading-none">3</span><span
						>Open Lead from your Home Screen and turn on reminders.</span
					>
				</li>
			</ol>
		{:else}
			<ol class="paper tape grid gap-4 p-5">
				<li class="flex gap-3">
					<span class="hand text-3xl leading-none">1</span><span
						>In <b>Safari</b>, tap the Share button <ShareIcon /> in the bar at the bottom of the screen.</span
					>
				</li>
				<li class="flex gap-3">
					<span class="hand text-3xl leading-none">2</span><span
						>Scroll down and tap <b>Add to Home Screen</b>.</span
					>
				</li>
				<li class="flex gap-3">
					<span class="hand text-3xl leading-none">3</span><span
						>Tap <b>Add</b>. Lead appears on your Home Screen with a tick icon.</span
					>
				</li>
				<li class="flex gap-3">
					<span class="hand text-3xl leading-none">4</span><span
						>Open Lead from there and tap <b>Turn on reminders</b> in Household › Notifications.</span
					>
				</li>
			</ol>
			<p class="text-sm text-muted">
				Needs iOS 16.4 or later. Using Chrome on iPhone? The same steps work from its Share menu.
			</p>
		{/if}
	{/if}
</main>
