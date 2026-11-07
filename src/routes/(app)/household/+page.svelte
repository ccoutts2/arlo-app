<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let copied = $state(false);
	const inviteUrl = $derived(form && 'inviteUrl' in form ? form.inviteUrl : null);
	const isOwner = $derived(data.household.role === 'OWNER');
	const days = (d: Date) => Math.max(1, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000));

	async function share(url: string) {
		const text = `Join ${data.household.name} on Lead to share our dog’s reminders and log.`;
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

<div class="mt-10 grid gap-3">
	{#if data.household.members.length > 1}
		<form method="POST" action="?/leave" use:enhance>
			<button class="btn btn-ghost w-full">Leave household</button>
		</form>
		{#if form && 'leaveError' in form}<p class="text-sm font-semibold text-late" role="alert">
				{form.leaveError}
			</p>{/if}
	{/if}
	<form method="POST" action="/auth/logout" use:enhance>
		<button class="btn btn-ghost w-full">Log out</button>
	</form>
</div>
