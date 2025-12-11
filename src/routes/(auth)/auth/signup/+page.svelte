<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const { form, enhance, message, errors } = superForm(data.form);
</script>

<main>
	<h1>Signup</h1>

	<form method="POST" use:enhance>
		<fieldset>
			<legend>What is your name</legend>

			<div>
				<label for="givenName"></label>
				<input type="text" id="givenName" name="givenName" bind:value={$form.givenName} />
			</div>
			<div>
				<label for="familyName"></label>
				<input type="text" id="familyName" name="familyName" bind:value={$form.familyName} />
			</div>
		</fieldset>

		<div>
			<label for="email"></label>
			<input type="email" id="email" name="email" bind:value={$form.email} />
		</div>

		<div>
			<label for="password"></label>
			<input type="password" id="password" name="password" bind:value={$form.password} />
		</div>

		<button type="submit">Create Account</button>
	</form>

	<p>Already have an account? <span><a href="/auth/login">Login</a></span> now.</p>
</main>
