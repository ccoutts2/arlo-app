<script lang="ts">
	import RadioGroup from '$lib/components/form/RadioGroup/RadioGroup.svelte';
	import RadioGroupOption from '$lib/components/form/RadioGroup/RadioGroupOption.svelte';
	import { Plus } from '@lucide/svelte';
	import { Minus } from '@lucide/svelte';
	import { superForm } from 'sveltekit-superforms';
	import type { PageProps } from './$types';
	import { ReminderFrequency } from '$lib/enums';

	let { data }: PageProps = $props();

	const { form, enhance, message, errors } = superForm(data.form);
</script>

<main class="Home">
	<section class="Home__actions">
		<h2>Actions</h2>
		<nav>
			<!-- <form method="POST" use:enhance class="Form">
				<div class="Form__wrapper">
					<label class="Form__label" for="pet-select">Choose a pet:</label>

					<select class="Form__input" name="pets" id="pet-select">
						<option value="">--Please choose an option--</option>
						<option value="dog">Arlo</option>
						<option value="cat">Indie</option>
						<option value="hamster">Millie</option>
					</select>
				</div>

				<div class="Form__wrapper">
					<label class="Form__label" for="title">Reminder</label>
					<input type="text" class="Form__input" name="title" id="title" />
				</div>

				<div class="Form__wrapper">
					<label class="Form__label" for="description">Description</label>
					<textarea class="Form__input" name="description" id="description"></textarea>
				</div>

				<div class="Form__wrapper">
					<label class="Form__label" for="start">Start date:</label>
					<input type="date" class="Form__input" id="start" name="reminder-start" />
				</div>
				<RadioGroup name="type" legend="Frequency">
					<RadioGroupOption
						label="Once"
						id="frequency-once"
						name="frequency"
						bind:group={$form.frequency}
						value={ReminderFrequency.ONCE}
					/>
					<RadioGroupOption
						label="Daily"
						id="frequency-daily"
						name="frequency"
						bind:group={$form.frequency}
						value={ReminderFrequency.DAILY}
					/>
					<RadioGroupOption
						label="Weekly"
						id="frequency-weekly"
						name="frequency"
						bind:group={$form.frequency}
						value={ReminderFrequency.WEEKLY}
					/>
					<RadioGroupOption
						label="Monthly"
						id="frequency-monthly"
						name="frequency"
						bind:group={$form.frequency}
						value={ReminderFrequency.MONTHLY}
					/>
					<RadioGroupOption
						label="Quarterly"
						id="frequency-quarterly"
						name="frequency"
						bind:group={$form.frequency}
						value={ReminderFrequency.QUARTERLY}
					/>
					<RadioGroupOption
						label="Yearly"
						id="frequency-yearly"
						name="frequency"
						bind:group={$form.frequency}
						value={ReminderFrequency.YEARLY}
					/>
				</RadioGroup>
				<button type="submit">Submit</button>
			</form> -->
			<div>
				<a href="/add-pet">Add pet</a>
			</div>
		</nav>
	</section>

	<section class="Home__upcomingReminders">
		<h2>Upcoming reminders</h2>
		<dl class="Reminders">
			<div class="Reminders__item">
				<dt>Worming treatment</dt>
				<dd><time datetime="2018-07-07">2 days time</time></dd>
			</div>

			<div class="Reminders__item">
				<dt>Flea treatment</dt>
				<dd><time datetime="2018-07-07">23 days time</time></dd>
			</div>

			<div class="Reminders__item">
				<dt>Vet appointment</dt>
				<dd><time datetime="2018-07-07">2 months time</time></dd>
			</div>
		</dl>
	</section>
</main>

<style lang="scss">
	.Home {
		&__actions {
			padding: 1rem;
		}

		&__upcomingReminders {
			padding: 1rem;
		}
	}

	// .Form {
	// 	display: flex;
	// 	flex-direction: column;

	// 	&__wrapper {
	// 		display: flex;
	// 		flex-direction: column;
	// 	}

	// 	&__label {
	// 		padding-bottom: 0.5rem;
	// 	}

	// 	&__input {
	// 		background-color: #ece4e1;
	// 		border: 1px solid;
	// 		border-radius: 0.5rem;
	// 		padding: 0.25rem;
	// 	}
	// }

	.Reminders {
		display: flex;
		flex-direction: column;

		&__item {
			padding: 0.5rem 0.25rem;
			border-top: 1px solid;
			display: flex;
			justify-content: space-between;
			font-size: 0.875rem;
			align-items: center;

			&:last-of-type {
				border-bottom: 1px solid;
			}
		}
	}
</style>
