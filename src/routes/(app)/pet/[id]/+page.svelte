<script lang="ts">
	import { enhance } from '$app/forms';
	let { data } = $props();
	import { format } from 'date-fns';

	const petDetails = $derived(data.petDetails);

	const formattedDate = (date: Date) => {
		if (!date) {
			return null;
		}
		const dateObj = typeof date === 'string' ? new Date(date) : date;

		return format(dateObj, 'do MMMM yyyy');
	};
</script>

{#if petDetails && petDetails !== null}
	<main class="Pet">
		<header class="Pet__header">
			<h1>{petDetails.name}</h1>
			<figure class="Pet__image">
				<img src={petDetails.image} alt="Profile avatar" />
			</figure>
		</header>
		<dl class="Pet__detailsList">
			<div>
				<dt class="Pet__detailsTerm">Breed:</dt>
				<dd class="Pet__detailsDescription">{petDetails.breed}</dd>
			</div>
			<div>
				<dt class="Pet__detailsTerm">Weight:</dt>
				<dd class="Pet__detailsDescription">{petDetails.weight ?? null} kg</dd>
			</div>
			<div>
				<dt class="Pet__detailsTerm">Birthday:</dt>
				<dd class="Pet__detailsDescription">
					{formattedDate(petDetails.birthday as Date) ?? null}
				</dd>
			</div>
			<div>
				<dt class="Pet__detailsTerm">Sex:</dt>
				<dd class="Pet__detailsDescription">{petDetails.sex ?? null}</dd>
			</div>
			<div>
				<dt class="Pet__detailsTerm">Neutered:</dt>
				<dd class="Pet__detailsDescription">{petDetails.neutered ? 'Yes' : 'No'}</dd>
			</div>
			<div>
				<dt class="Pet__detailsTerm">Allergies:</dt>
				<dd class="Pet__detailsDescription">{petDetails.allergies}</dd>
			</div>
		</dl>
		<section class="Pet__reminders">
			<h2>Reminders</h2>
			<ul class="Reminders">
				{#each petDetails.reminders as reminder}
					<li class="Reminders__item">
						<article class="Reminders__card">
							<header>
								<h3>{reminder.title}</h3>
								<form method="POST" use:enhance>
									<input type="hidden" name="reminderId" value={reminder.id} />
									<button
										name="delete"
										type="submit"
										onclick={(e) =>
											!confirm('This will remove this from the reminders?') && e.preventDefault()}
									>
										Check off reminder!
									</button>
								</form>
							</header>

							<p>{reminder.description}</p>
							<footer>
								<span>{reminder.frequency}</span>
								<span>{reminder.reminderDate}</span>
							</footer>
						</article>
					</li>
				{/each}
			</ul>
		</section>
	</main>
{/if}

<style lang="scss">
	.Pet {
		&__header {
			display: flex;
			flex-direction: column-reverse;
			align-items: center;
			justify-content: center;
			padding-block: 1rem;
			gap: 0.5rem;
		}
		&__image {
			width: 12rem;
			height: 12rem;
			border-radius: 100%;
			overflow: hidden;

			img {
				height: 100%;
				object-fit: cover;
				width: 100%;
			}
		}

		&__detailsList {
			div {
				display: flex;
				gap: 0.5rem;
				padding: 0.25rem 0.5rem;
				border-top: 1px solid;

				&:last-child {
					border-bottom: 1px solid;
				}
			}
		}

		&__reminders {
			padding: 2rem 1rem;
		}
	}
</style>
