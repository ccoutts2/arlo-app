<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import type { PageProps } from './$types';
	import { ReminderFrequency } from '$lib/enums';

	let { data }: PageProps = $props();

	const { form, enhance, message, errors } = superForm(data.form);
	const frequencies = Object.values(ReminderFrequency);
</script>

<main>
	<h1>Add reminder</h1>

	<form method="POST" use:enhance>
		<div>
			<label for="title">Title</label>
			<input type="text" id="title" name="title" required bind:value={$form.title} />
		</div>

		<div>
			<label for="description">Description</label>
			<input type="text" id="description" name="description" bind:value={$form.description} />
		</div>

		<div>
			<label for="reminderDate">Reminder Date</label>
			<input type="date" id="reminderDate" name="reminderDate" bind:value={$form.reminderDate} />
		</div>

		<div>
			<select name="frequency" id="frequency-select" bind:value={$form.frequency} required>
				<option value="">--Please choose an option--</option>
				{#each frequencies as frequency}
					<option value={frequency}>{frequency}</option>
				{/each}
			</select>
		</div>

		<div>
			<input type="checkbox" id="createMultiple" name="createMultiple" />
			<label for="createMultiple">Create multiple</label>
		</div>

		<button type="submit">Submit</button>
	</form>
</main>

<style lang="scss">
	input,
	select {
		background-color: white;
	}
</style>
