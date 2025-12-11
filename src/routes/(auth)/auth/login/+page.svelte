<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const { form, enhance, message, errors } = superForm(data.form);
</script>

<main>
	<h1>Login</h1>

	<form method="POST" use:enhance>
		<div>
			<label for="email"> Email </label>
			<input type="email" id="email" name="email" bind:value={$form.email} />
		</div>
		<div>
			<label for="password"> Password </label>
			<input type="password" id="password" name="password" bind:value={$form.password} />
		</div>

		<button type="submit">Login</button>
	</form>

	<p>Don't have an account? <span><a href="/auth/signup">Register</a></span> now.</p>
</main>
