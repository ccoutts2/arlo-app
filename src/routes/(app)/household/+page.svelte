<script lang="ts">
	import { enhance } from '$app/forms';

	let { data } = $props();
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
<p class="mt-2 font-semibold">{data.household.name}</p>

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
		</li>
	{/each}
</ul>
<p class="mt-3 text-sm text-muted">Inviting your partner or a sitter comes in the next update.</p>

<form method="POST" action="/auth/logout" use:enhance class="mt-10">
	<button class="btn btn-ghost w-full">Log out</button>
</form>
