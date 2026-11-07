<script lang="ts">
	import { resolve } from '$app/paths';
	import { superForm } from 'sveltekit-superforms';
	import { page } from '$app/state';
	import Field from '$lib/components/Field.svelte';

	let { data } = $props();
	const { form, errors, message, enhance, submitting } = superForm(data.form);
</script>

<svelte:head>
	<title>Create your account · Lead</title>
	<meta
		name="description"
		content="Start a shared log of your dog's care, training and reminders."
	/>
</svelte:head>

<section class="paper tape grid gap-6 p-6" aria-labelledby="h">
	<div>
		<h1 id="h" class="text-[2.6rem] leading-[0.9] font-extrabold tracking-[-0.05em]">
			Start your sheet
		</h1>
		{#if data.joining}
			<p class="hand mt-2 text-2xl text-muted">Joining {data.joining}</p>
		{:else}
			<p class="mt-2 text-muted">
				One place for your dog’s doses, training and notes. Invite your household after.
			</p>
		{/if}
	</div>

	<form method="POST" use:enhance class="grid gap-4" novalidate>
		<Field
			label="First name"
			name="givenName"
			autocomplete="given-name"
			bind:value={$form.givenName}
			errors={$errors.givenName}
			hint="Shown as your initial when you tick a dose."
		/>
		<Field
			label="Email"
			name="email"
			type="email"
			autocomplete="email"
			inputmode="email"
			bind:value={$form.email}
			errors={$errors.email}
		/>
		<Field
			label="Password"
			name="password"
			type="password"
			autocomplete="new-password"
			bind:value={$form.password}
			errors={$errors.password}
			hint="At least 8 characters."
		/>
		{#if $message}<p class="font-semibold text-late" role="alert">{$message}</p>{/if}
		<button class="btn mt-2" disabled={$submitting}>
			{$submitting ? 'Creating…' : 'Create account'}
		</button>
	</form>
</section>
<p class="text-center">
	Already have an account?
	<!-- Keeps ?invite=… when switching between sign-up and log-in. -->
	<!-- eslint-disable svelte/no-navigation-without-resolve -->
	<a class="font-bold underline underline-offset-4" href={resolve('/auth/login') + page.url.search}
		>Log in</a
	>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
</p>
