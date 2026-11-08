<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import Tick from '$lib/components/Tick.svelte';

	const sitterToken = () => page.params.token;

	let { data, form } = $props();
</script>

<svelte:head>
	<title
		>{data.link ? `Looking after ${data.pets?.map((p) => p.name).join(' and ')}` : 'Link expired'} · Lead</title
	>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="mx-auto grid max-w-[440px] gap-6 px-4 pt-[max(24px,env(safe-area-inset-top))] pb-12">
	<p class="flex items-center gap-2.5 text-lg font-extrabold tracking-tight">
		<img src="/favicon.svg" alt="" width="32" height="32" class="rounded-lg" />Lead
	</p>
	{#if !data.link}
		<section class="paper tape grid gap-3 p-6">
			<h1 class="text-[2.4rem] leading-[0.92] font-extrabold tracking-[-0.05em]">
				This link has expired
			</h1>
			<p class="text-muted">
				Sitter links last a set number of days and can be cancelled. Ask the owner for a new one.
			</p>
		</section>
	{:else}
		<div>
			<p class="hand text-2xl text-muted">Hi {data.link.sitterName}</p>
			<h1 class="text-[2.6rem] leading-[0.9] font-extrabold tracking-[-0.05em]">
				Looking after {data.pets?.map((p) => p.name).join(' and ')}
			</h1>
			<p class="mt-2 text-sm text-muted">
				From {data.link.household}. This page works until {data.link.until}.
			</p>
		</div>
		{#if form?.error}<p class="font-semibold text-late" role="alert">{form.error}</p>{/if}

		{#each data.pets ?? [] as pet (pet.id)}
			<section class="paper tape grid gap-4 p-5" aria-labelledby="pet-{pet.id}">
				<div class="flex items-center gap-4">
					{#if pet.photoId}
						<img
							src="/sitter/{sitterToken()}/photo/{pet.photoId}"
							alt={pet.name}
							class="size-20 rounded-full object-cover"
						/>
					{:else}
						<span
							class="hand grid size-20 place-items-center rounded-full bg-ink text-4xl text-paper"
							aria-hidden="true">{pet.name[0]}</span
						>
					{/if}
					<div>
						<h2 id="pet-{pet.id}" class="text-3xl leading-none font-extrabold tracking-tight">
							{pet.name}
						</h2>
						{#if pet.breed}<p class="text-sm text-muted">{pet.breed}</p>{/if}
					</div>
				</div>
				{#if pet.allergies}<p class="rounded-xl bg-late/10 px-3 py-2 font-semibold text-late">
						Allergies: {pet.allergies}
					</p>{/if}
				{#if pet.sitterNotes}<p class="whitespace-pre-line">{pet.sitterNotes}</p>{/if}

				<div>
					<h3 class="mb-2 font-extrabold">Doses in the next day</h3>
					{#if pet.doses.length}
						<ul class="grid gap-2">
							{#each pet.doses as d (d.id)}
								<li
									class="flex items-center gap-3 rounded-2xl px-3 py-2.5 {d.status === 'PENDING'
										? 'bg-biscuit/40'
										: 'shadow-[inset_0_0_0_1.5px_var(--color-line)]'}"
								>
									<span class="min-w-0 grow">
										<span
											class="block font-bold {d.status !== 'PENDING'
												? 'text-muted line-through decoration-ink/40'
												: ''}">{d.title}{d.dose ? ` · ${d.dose}` : ''}</span
										>
										<span class="text-sm {d.late ? 'font-semibold text-late' : 'text-muted'}"
											>{d.status === 'DONE'
												? `Given by ${d.by}`
												: d.status === 'SKIPPED'
													? 'Skipped'
													: `${d.late ? 'Late, was due' : 'Due'} ${d.when}`}{d.notes &&
											d.status === 'PENDING'
												? ` · ${d.notes}`
												: ''}</span
										>
									</span>
									{#if d.status === 'DONE'}
										<Tick seed={d.id} size={24} />
									{:else if d.status === 'PENDING'}
										<form method="POST" action="?/give" use:enhance>
											<input type="hidden" name="id" value={d.id} />
											<button class="btn min-h-11 px-4 text-sm">Given</button>
										</form>
									{/if}
								</li>
							{/each}
						</ul>
					{:else}
						<p class="text-muted">Nothing due in the next 24 hours.</p>
					{/if}
				</div>

				{#if pet.vet}
					<div class="flex items-center justify-between gap-3 border-t border-line pt-3">
						<span
							><span class="block text-sm text-muted">Vet</span><b>{pet.vet.name ?? 'Vet'}</b
							>{#if pet.vet.address}<span class="block text-sm text-muted">{pet.vet.address}</span
								>{/if}</span
						>
						{#if pet.vet.phone}<a
								class="btn btn-ghost min-h-11 shrink-0 px-5"
								href="tel:{pet.vet.phone.replace(/\s/g, '')}">Call {pet.vet.phone}</a
							>{/if}
					</div>
				{/if}
			</section>
		{/each}
	{/if}
</main>
