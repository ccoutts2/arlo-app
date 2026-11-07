<script lang="ts">
	import { resolve } from '$app/paths';
	import { superForm } from 'sveltekit-superforms';
	import Field from '$lib/components/Field.svelte';

	let { data } = $props();
	const { form, errors, message, enhance, submitting } = superForm(data.form);
</script>

<svelte:head>
	<title>Log in · Lead</title>
	<meta name="description" content="Log in to your household's dog care sheet." />
</svelte:head>

<section class="paper tape grid gap-6 p-6" aria-labelledby="h">
	<h1 id="h" class="text-[2.6rem] leading-[0.9] font-extrabold tracking-[-0.05em]">Welcome back</h1>
	<form method="POST" use:enhance class="grid gap-4" novalidate>
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
			autocomplete="current-password"
			bind:value={$form.password}
			errors={$errors.password}
		/>
		{#if $message}<p class="font-semibold text-late" role="alert">{$message}</p>{/if}
		<button class="btn mt-2" disabled={$submitting}>{$submitting ? 'Logging in…' : 'Log in'}</button
		>
	</form>
</section>
<p class="text-center">
	New here? <a class="font-bold underline underline-offset-4" href={resolve('/auth/signup')}
		>Create an account</a
	>
</p>
