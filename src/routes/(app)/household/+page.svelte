<script lang="ts">
	import { enhance } from '$app/forms';
	import { clearOutbox, outbox, sync } from '$lib/offline/outbox.svelte';
	import { resolve } from '$app/paths';

	let { data, form } = $props();

	let copied = $state(false);
	const inviteUrl = $derived(form && 'inviteUrl' in form ? form.inviteUrl : null);
	const isOwner = $derived(data.household.role === 'OWNER');
	const days = (d: Date) => Math.max(1, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000));

	async function share(url: string, message?: string) {
		const text =
			message ?? `Join ${data.household.name} on Lead to share our dog’s reminders and log.`;
		if (navigator.share) {
			try {
				await navigator.share({ title: 'Join our household on Lead', text, url });
				return;
			} catch {
				/* cancelled: fall back to copy */
			}
		}
		try {
			await navigator.clipboard.writeText(url);
			copied = true;
			setTimeout(() => (copied = false), 2500);
		} catch {
			/* the link stays visible to copy by hand */
		}
	}
</script>

<svelte:head>
	<title>Household · Lead</title>
	<meta name="description" content="The people who share your dog's sheet." />
</svelte:head>

<h1
	class="-ml-[0.04em] text-[clamp(3rem,15vw,4rem)] leading-[0.86] font-extrabold tracking-[-0.055em]"
>
	Household
</h1>
<form
	method="POST"
	action="?/rename"
	use:enhance={() =>
		async ({ update }) =>
			update({ reset: false })}
	class="mt-2 flex items-center gap-2"
>
	<label for="hh-name" class="sr-only">Household name</label>
	<input
		id="hh-name"
		name="name"
		value={data.household.name}
		class="min-w-0 grow rounded-xl border-2 border-transparent bg-transparent px-2 py-1 -ml-2 font-semibold hover:border-line focus-visible:border-ink focus-visible:bg-paper focus-visible:outline-none"
	/>
	<button class="rounded-full px-3 py-1.5 text-sm font-bold hover:bg-paper">Rename</button>
</form>
<p class="min-h-5 text-sm font-semibold" role="status">
	{#if form && 'renameError' in form}
		<span class="text-late">{form.renameError}</span>
	{:else if form && 'renamed' in form}
		Saved
	{/if}
</p>

<h2 class="mt-9 mb-3 text-[1.375rem] font-extrabold tracking-tight">People</h2>
<ul class="grid gap-2.5">
	{#each data.household.members as member (member.id)}
		<li class="paper flex items-center gap-3.5 px-4 py-3">
			<span
				class="hand grid size-11 place-items-center rounded-full bg-ink text-2xl text-paper"
				aria-hidden="true">{member.givenName[0]}</span
			>
			<span class="grow">
				<span class="block font-bold"
					>{member.givenName}{member.id === data.user.id ? ' (you)' : ''}</span
				>
				<span class="text-sm text-muted">{member.role === 'OWNER' ? 'Owner' : 'Member'}</span>
			</span>
			{#if isOwner && member.id !== data.user.id}
				<form method="POST" action="?/remove" use:enhance>
					<input type="hidden" name="userId" value={member.id} />
					<button class="rounded-full px-3 py-2 text-sm font-bold text-late hover:bg-late/10"
						>Remove</button
					>
				</form>
			{/if}
		</li>
	{/each}
</ul>

<a
	href={resolve('/household/notifications')}
	class="paper group mt-8 flex items-center justify-between gap-3 px-5 py-4 transition-[translate] duration-300 ease-pen hover:translate-x-1"
>
	<span
		><span class="block font-extrabold">Notifications</span><span class="text-sm text-muted"
			>Reminders on this phone, quiet hours, follow-ups</span
		></span
	>
	<span aria-hidden="true" class="text-xl">→</span>
</a>

<section class="paper tape mt-8 grid gap-3 p-5" aria-labelledby="inv-h">
	<h2 id="inv-h" class="text-xl font-extrabold tracking-tight">Invite someone</h2>
	<p class="text-muted">
		Send a link to your partner, family or sitter. They’ll see the same dogs and reminders, and
		their initial goes on the sheet when they tick something.
	</p>
	{#if inviteUrl}
		<div class="grid gap-2">
			<label for="inv-url" class="text-sm font-semibold">Invite link, valid for 7 days</label>
			<input
				id="inv-url"
				readonly
				value={inviteUrl}
				class="min-h-12 rounded-xl border-2 border-line bg-paper px-3 text-sm"
				onfocus={(e) => e.currentTarget.select()}
			/>
			<button class="btn" type="button" onclick={() => share(inviteUrl)}
				>{copied ? 'Link copied' : 'Share link'}</button
			>
		</div>
	{:else}
		<form method="POST" action="?/invite" use:enhance>
			<button class="btn w-full">Create invite link</button>
		</form>
	{/if}
	{#if data.invites.length}
		<ul class="mt-2 grid gap-2 text-sm">
			{#each data.invites as invite (invite.id)}
				<li class="flex items-center justify-between gap-3 border-t border-line pt-2">
					<span
						>Link from {invite.createdBy?.givenName ?? 'someone'} · {days(invite.expiresAt)} days left
						· {invite.uses === 0
							? 'not used yet'
							: invite.uses === 1
								? 'used once'
								: `used ${invite.uses} times`}</span
					>
					<form method="POST" action="?/revoke" use:enhance>
						<input type="hidden" name="id" value={invite.id} />
						<button class="rounded-full px-3 py-1.5 font-bold hover:bg-biscuit">Cancel</button>
					</form>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<section class="paper mt-8 grid gap-3 p-5" aria-labelledby="cal-h">
	<h2 id="cal-h" class="text-xl font-extrabold tracking-tight">Calendar</h2>
	<p class="text-muted">
		See vet visits, boosters, wormers and other less frequent treatments in Apple Calendar. Daily
		meds stay in Lead.
	</p>
	{#if form && 'webcalUrl' in form}
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
		<a class="btn" href={form.webcalUrl}>Add to Apple Calendar</a>
		<label class="field"
			><span class="text-sm font-semibold">Or paste this into another calendar app</span><input
				readonly
				value={form.calendarUrl}
				onfocus={(e) => e.currentTarget.select()}
			/></label
		>
		<form method="POST" action="?/calendarOff" use:enhance>
			<button class="btn btn-ghost w-full">Turn off</button>
		</form>
	{:else if data.calendarOn}
		<p class="text-sm font-semibold">Your calendar link is on.</p>
		<div class="grid grid-cols-2 gap-2.5">
			<form method="POST" action="?/calendar" use:enhance>
				<button class="btn btn-ghost w-full">New link</button>
			</form>
			<form method="POST" action="?/calendarOff" use:enhance>
				<button class="btn btn-ghost w-full">Turn off</button>
			</form>
		</div>
	{:else}
		<form method="POST" action="?/calendar" use:enhance>
			<button class="btn w-full">Create calendar link</button>
		</form>
	{/if}
</section>

<section class="paper mt-8 grid gap-3 p-5" aria-labelledby="exp-h">
	<h2 id="exp-h" class="text-xl font-extrabold tracking-tight">Your data</h2>
	<p class="text-muted">
		Everything you put in Lead is yours. Download it any time. For a vet-ready summary, open a dog
		and tap “Summary for the vet”.
	</p>
	<div class="grid grid-cols-2 gap-2.5">
		<a class="btn btn-ghost" href={resolve('/api/export/doses.csv')} download data-sveltekit-reload
			>Doses (CSV)</a
		>
		<a class="btn btn-ghost" href={resolve('/api/export/log.csv')} download data-sveltekit-reload
			>Log (CSV)</a
		>
		<a
			class="btn btn-ghost col-span-2"
			href={resolve('/api/export/places.csv')}
			download
			data-sveltekit-reload>Places (CSV)</a
		>
	</div>
	<p class="text-sm text-muted">
		Map use this month: {data.mapUsage.maps.used.toLocaleString('en-GB')} of {data.mapUsage.maps.cap.toLocaleString(
			'en-GB'
		)} map opens,
		{data.mapUsage.searches.used.toLocaleString('en-GB')} of {data.mapUsage.searches.cap.toLocaleString(
			'en-GB'
		)} searches. Lead pauses the map before it could cost anything.
	</p>
</section>

<section class="paper mt-8 grid gap-3 p-5" aria-labelledby="sit-h">
	<h2 id="sit-h" class="text-xl font-extrabold tracking-tight">Sitter link</h2>
	<p class="text-muted">
		A private page for a sitter or walker: your dogs, allergies, vet and the next day’s doses, which
		they can mark given. No account needed.
	</p>
	{#if form && 'sitterUrl' in form}
		<div class="grid gap-2">
			<label for="sit-url" class="text-sm font-semibold">Link for {form.sitterName}</label>
			<input
				id="sit-url"
				readonly
				value={form.sitterUrl}
				class="min-h-12 rounded-xl border-2 border-line bg-paper px-3 text-sm"
				onfocus={(e) => e.currentTarget.select()}
			/>
			<button
				class="btn"
				type="button"
				onclick={() =>
					form?.sitterUrl &&
					share(form.sitterUrl, `Here’s how to look after our dogs while we’re away.`)}
				>{copied ? 'Link copied' : 'Share link'}</button
			>
		</div>
	{:else}
		<form method="POST" action="?/sitter" use:enhance class="grid gap-3">
			<label class="field"
				><span class="text-sm font-semibold">Sitter’s name</span><input
					name="sitterName"
					required
					maxlength="40"
					placeholder="Emma"
				/></label
			>
			<label class="field"
				><span class="text-sm font-semibold">Link works for</span>
				<select
					name="days"
					class="min-h-[52px] rounded-[14px] border-2 border-line bg-paper px-3.5"
				>
					{#each [[1, '1 day'], [2, '2 days'], [3, '3 days'], [7, 'A week'], [14, 'Two weeks']] as [d, l] (d)}<option
							value={d}
							selected={d === 3}>{l}</option
						>{/each}
				</select>
			</label>
			<button class="btn">Create sitter link</button>
		</form>
	{/if}
	{#if form && 'sitterError' in form}<p class="text-sm font-semibold text-late" role="alert">
			{form.sitterError}
		</p>{/if}
	{#if data.sitterLinks.length}
		<ul class="mt-1 grid gap-2 text-sm">
			{#each data.sitterLinks as l (l.id)}
				<li class="flex items-center justify-between gap-3 border-t border-line pt-2">
					<span
						>{l.sitterName} · until {new Date(l.expiresAt).toLocaleDateString('en-GB', {
							weekday: 'short',
							day: 'numeric',
							month: 'short'
						})}</span
					>
					<form method="POST" action="?/revokeSitter" use:enhance>
						<input type="hidden" name="id" value={l.id} />
						<button class="rounded-full px-3 py-1.5 font-bold hover:bg-biscuit">Cancel</button>
					</form>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<div class="mt-10 grid gap-3">
	{#if data.household.members.length > 1}
		<form method="POST" action="?/leave" use:enhance>
			<button class="btn btn-ghost w-full">Leave household</button>
		</form>
		{#if form && 'leaveError' in form}<p class="text-sm font-semibold text-late" role="alert">
				{form.leaveError}
			</p>{/if}
	{/if}
	{#if outbox.pending}
		<p class="text-sm font-semibold text-late">
			{outbox.pending} log {outbox.pending === 1 ? 'entry hasn’t' : 'entries haven’t'} synced yet. Logging
			out now discards {outbox.pending === 1 ? 'it' : 'them'}.
		</p>
	{/if}
	<!-- Logging out clears screens and unsent entries kept on this phone. -->
	<form
		method="POST"
		action="/auth/logout"
		use:enhance={async () => {
			await sync();
			await clearOutbox();
			navigator.serviceWorker?.controller?.postMessage('clear-pages');
		}}
	>
		<button class="btn btn-ghost w-full">Log out</button>
	</form>
</div>
