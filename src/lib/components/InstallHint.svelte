<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import ShareIcon from './ShareIcon.svelte';
	import { isIos, isStandalone } from '$lib/push-client';

	// Shown once, on a phone, when Lead isn't installed yet. The guide stays available at /install.
	const KEY = 'lead.installHint.v1';
	let show = $state(false);

	onMount(() => {
		const phone = isIos() || /Android/.test(navigator.userAgent);
		let seen = true;
		try {
			seen = localStorage.getItem(KEY) !== null;
			if (phone && !isStandalone() && !seen) localStorage.setItem(KEY, new Date().toISOString());
		} catch {
			/* private mode: just don't show it */
		}
		show = phone && !isStandalone() && !seen;
	});
</script>

{#if show}
	<div
		role="dialog"
		aria-labelledby="ih-h"
		class="paper fixed inset-x-3 bottom-[max(96px,calc(env(safe-area-inset-bottom)+84px))] z-30 mx-auto grid max-w-[416px] gap-3 p-5 shadow-bar"
		transition:fly={{ y: 24, duration: 360, easing: cubicOut }}
	>
		<h2 id="ih-h" class="text-xl leading-tight font-extrabold tracking-tight">
			Get reminders on your phone
		</h2>
		<p class="text-muted">
			{#if isIos()}Tap <ShareIcon /> then <b class="text-ink">Add to Home Screen</b>. iPhones only
				send reminders from apps on the Home Screen.{:else}Install Lead from your browser menu so
				reminders reach you like an app.{/if}
		</p>
		<div class="grid grid-cols-2 gap-2.5">
			<a class="btn" href={resolve('/install')} onclick={() => (show = false)}>Show me how</a>
			<button class="btn btn-ghost" onclick={() => (show = false)}>Not now</button>
		</div>
	</div>
{/if}
