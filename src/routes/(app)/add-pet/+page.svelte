<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import type { PageProps } from './$types';
	import RadioGroup from '$lib/components/form/RadioGroup/RadioGroup.svelte';
	import RadioGroupOption from '$lib/components/form/RadioGroup/RadioGroupOption.svelte';

	let { data }: PageProps = $props();

	const { form, enhance, message, errors } = superForm(data.form);
</script>

<main>
	<h1>Add Pet</h1>

	<form method="POST" use:enhance enctype="multipart/form-data">
		<div>
			<label for="name">Name</label>
			<input type="text" id="name" name="name" required bind:value={$form.name} />
		</div>
		<div>
			<label for="breed">Breed</label>
			<input type="text" id="breed" name="breed" required bind:value={$form.breed} />
		</div>
		<div>
			<label for="weight">Weight</label>
			<input type="number" id="weight" name="weight" bind:value={$form.weight} />
		</div>
		<div>
			<label for="birthday">Birthday</label>
			<input type="date" id="birthday" name="birthday" bind:value={$form.birthday} />
		</div>
		<div>
			<label for="sex">Sex</label>
			<input type="text" id="sex" name="sex" bind:value={$form.sex} />
		</div>
		<RadioGroup name="neutured" legend="Neutered">
			<RadioGroupOption
				label="Yes"
				id="neutered-yes"
				name="neutered"
				bind:group={$form.neutered}
				value="Yes"
			/>
			<RadioGroupOption
				label="No"
				id="neutered-no"
				name="neutered"
				bind:group={$form.neutered}
				value="No"
			/>
		</RadioGroup>
		<div>
			<label for="allergies">Allergies</label>
			<textarea id="allergies" name="allergies" bind:value={$form.allergies}></textarea>
		</div>
		<div>
			<label for="image">Image</label>
			<input type="file" id="image" name="image" accept="image/*" bind:value={$form.image} />
		</div>

		<button type="submit">Add</button>
		{#if $message}
			<p>{$message.message}</p>
		{/if}
	</form>
</main>

<style lang="scss">
	input,
	textarea {
		background-color: white;
	}
</style>
