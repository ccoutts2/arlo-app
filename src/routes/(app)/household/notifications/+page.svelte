<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { deviceState, turnOff, turnOn, type DeviceState } from '$lib/push-client';

	let { data, form } = $props();
	let device = $state<DeviceState | 'loading'>('loading');
	let busy = $state(false);
	let testResult = $state('');

	onMount(async () => {
		device = await deviceState().catch(() => 'unsupported' as const);
	});

	async function enable() {
		busy = true;
		device = await turnOn().catch(() => 'off' as const);
		busy = false;
	}
	async function disable() {
		busy = true;
		device = await turnOff();
		busy = false;
	}
	async function test() {
		testResult = 'Sending…';
		const r = await fetch('/api/push/test', { method: 'POST' })
			.then((x) => x.json())
			.catch(() => null);
		testResult = !r
			? 'Couldn’t reach Lead. Check your connection.'
			: r.sent
				? `Sent to ${r.sent} device${r.sent === 1 ? '' : 's'}. It should arrive in a few seconds.`
				: 'No device received it. Turn notifications on above, then try again.';
	}

	const ago = (d: Date | string | null) =>
		d
			? new Date(d).toLocaleString('en-GB', {
					day: 'numeric',
					month: 'short',
					hour: '2-digit',
					minute: '2-digit'
				})
			: 'never';
	const copy: Record<string, { title: string; body: string }> = {
		loading: { title: 'Checking this device…', body: '' },
		'needs-install': {
			title: 'Add Lead to your Home Screen first',
			body: 'iPhones only allow reminders from apps on the Home Screen.'
		},
		unsupported: {
			title: 'This browser can’t receive reminders',
			body: 'Use Safari on iPhone (with Lead on your Home Screen), or Chrome.'
		},
		blocked: {
			title: 'Notifications are blocked',
			body: 'Turn them on in Settings › Notifications › Lead, then come back.'
		},
		off: {
			title: 'Reminders are off on this device',
			body: 'Turn them on to get a push when a dose is due.'
		},
		on: { title: 'Reminders are on', body: 'This device gets a push when something is due.' }
	};
</script>

<svelte:head><title>Notifications · Lead</title></svelte:head>

<a class="btn btn-ghost mb-6 min-h-11 px-4" href={resolve('/household')}>← Household</a>
<h1 class="mb-6 text-[2.6rem] leading-[0.9] font-extrabold tracking-[-0.05em]">Notifications</h1>

<section class="paper tape grid gap-3 p-5" aria-labelledby="dev-h" aria-live="polite">
	<h2 id="dev-h" class="text-xl font-extrabold tracking-tight">{copy[device].title}</h2>
	{#if copy[device].body}<p class="text-muted">{copy[device].body}</p>{/if}
	{#if device === 'needs-install'}
		<a class="btn" href={resolve('/install')}>Show me how</a>
	{:else if device === 'off'}
		<button class="btn" onclick={enable} disabled={busy}
			>{busy ? 'Asking…' : 'Turn on reminders'}</button
		>
	{:else if device === 'on'}
		<div class="grid grid-cols-2 gap-2.5">
			<button class="btn" onclick={test}>Send a test</button>
			<button class="btn btn-ghost" onclick={disable} disabled={busy}>Turn off</button>
		</div>
		{#if testResult}<p class="text-sm font-semibold" role="status">{testResult}</p>{/if}
	{/if}
</section>

{#if data.devices.length}
	<h2 class="mt-9 mb-3 text-[1.375rem] font-extrabold tracking-tight">Your devices</h2>
	<ul class="grid gap-2">
		{#each data.devices as d (d.id)}
			<li
				class="flex items-center justify-between gap-3 rounded-[18px] px-4 py-3 shadow-[inset_0_0_0_1.5px_var(--color-line)]"
			>
				<span>
					<span class="block font-bold">{d.label ?? 'Device'}</span>
					<span class="text-sm text-muted">Last reminder delivered: {ago(d.lastSuccessAt)}</span>
				</span>
				<span
					class="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold {d.failures > 2
						? 'bg-late text-white'
						: 'bg-tennis text-ink'}"
				>
					{d.failures > 2 ? 'Failing' : 'Working'}
				</span>
			</li>
		{/each}
	</ul>
{/if}

<h2 class="mt-9 mb-3 text-[1.375rem] font-extrabold tracking-tight">For the whole household</h2>
<form
	method="POST"
	action="?/settings"
	use:enhance={() =>
		async ({ update }) =>
			update({ reset: false })}
	class="paper grid gap-4 p-5"
>
	<fieldset class="grid gap-2">
		<legend class="mb-1 font-semibold">Quiet hours</legend>
		<p class="text-sm text-muted">
			Follow-ups and snoozes wait until morning. A dose you’ve set for this time still reminds you.
		</p>
		<div class="grid gap-3">
			<label class="field"
				><span class="text-sm font-semibold">From</span><input
					type="time"
					name="quietStart"
					value={data.settings.quietStart}
				/></label
			>
			<label class="field"
				><span class="text-sm font-semibold">Until</span><input
					type="time"
					name="quietEnd"
					value={data.settings.quietEnd}
				/></label
			>
		</div>
	</fieldset>
	<div class="field">
		<label for="fu">If a dose still isn’t given, remind everyone again after</label>
		<select
			id="fu"
			name="followUpMinutes"
			class="min-h-[52px] rounded-[14px] border-2 border-line bg-paper px-3.5"
		>
			{#each [[30, '30 minutes'], [60, '1 hour'], [120, '2 hours'], [240, '4 hours'], [0, 'Don’t remind again']] as [v, l] (v)}
				<option value={v} selected={data.settings.followUpMinutes === v}>{l}</option>
			{/each}
		</select>
	</div>
	<button class="btn">Save</button>
	<p class="min-h-5 text-sm font-semibold" role="status">
		{form?.saved ? 'Saved' : (form?.error ?? '')}
	</p>
</form>
