<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';

	let { data, form } = $props();
</script>

<svelte:head>
	<title>Join a household · Lead</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="mx-auto grid min-h-svh max-w-[440px] content-center gap-8 px-4 py-10">
	<p class="flex items-center gap-2.5 text-lg font-extrabold tracking-tight">
		<img src="/favicon.svg" alt="" width="32" height="32" class="rounded-lg" />Lead
	</p>
	<section class="paper tape grid gap-4 p-6">
		{#if data.invite}
			<p class="hand text-2xl text-muted">
				{data.invite.from ? `${data.invite.from} invited you` : 'You’re invited'}
			</p>
			<h1 class="text-[2.4rem] leading-[0.92] font-extrabold tracking-[-0.05em]">
				Join {data.invite.householdName}
			</h1>
			<p class="text-muted">
				Share the same dogs, reminders and log. Your initial goes on the sheet when you tick
				something.
			</p>
			{#if data.signedIn}
				<form method="POST" use:enhance><button class="btn w-full">Join household</button></form>
			{:else}
				<a class="btn" href="{resolve('/auth/signup')}?invite={data.token}"
					>Create an account to join</a
				>
				<a class="btn btn-ghost" href="{resolve('/auth/login')}?invite={data.token}"
					>I already have an account</a
				>
			{/if}
			{#if form?.error}<p class="font-semibold text-late" role="alert">{form.error}</p>{/if}
		{:else}
			<h1 class="text-[2.4rem] leading-[0.92] font-extrabold tracking-[-0.05em]">
				This link has expired
			</h1>
			<p class="text-muted">
				Invite links last 7 days and can be cancelled. Ask for a new one from the Household tab.
			</p>
			<a class="btn" href={resolve('/')}>Go to Lead</a>
		{/if}
	</section>
</main>
