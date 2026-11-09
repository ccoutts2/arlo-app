<script lang="ts">
	import { resolve } from '$app/paths';
	import Tick from '$lib/components/Tick.svelte';
	import BellRing from '@lucide/svelte/icons/bell-ring';
	import Users from '@lucide/svelte/icons/users';
	import Timer from '@lucide/svelte/icons/timer';
	import NotebookPen from '@lucide/svelte/icons/notebook-pen';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Pill from '@lucide/svelte/icons/pill';
	import Share2 from '@lucide/svelte/icons/share-2';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import WifiOff from '@lucide/svelte/icons/wifi-off';
	import type { Attachment } from 'svelte/attachments';

	// Content fades up as it scrolls into view. Without JavaScript (or with reduced motion) it's
	// simply there: the hidden state is only applied once this runs.
	const reveal: Attachment<HTMLElement> = (el) => {
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		el.dataset.reveal = '';
		const io = new IntersectionObserver(
			(entries) => {
				for (const e of entries) {
					if (!e.isIntersecting) continue;
					(e.target as HTMLElement).dataset.shown = '';
					io.unobserve(e.target);
				}
			},
			{ rootMargin: '0px 0px -8% 0px' }
		);
		io.observe(el);
		return () => io.disconnect();
	};

	const sheet = [
		{ time: '7:30', what: 'Breakfast', who: 'S', done: true },
		{ time: '8:00', what: 'Apoquel, ½ tablet', who: 'C', done: true },
		{ time: '12:30', what: 'Walk, Bushy Park', who: 'S', done: true },
		{ time: '18:00', what: 'Dinner', who: '', done: false }
	];

	const features = [
		{
			icon: BellRing,
			title: 'Reminders that nudge everyone',
			body: 'Meds, flea drops, worming, jabs and vet visits. A push lands on every phone in the house, and a gentle follow-up if nobody ticks it.',
			why: 'One missed tablet is a bad night. Two doses is worse.',
			tint: 'bg-tennis',
			tilt: '-rotate-1'
		},
		{
			icon: Users,
			title: 'See who gave it',
			body: 'Every tick is initialled, like the sheet on the fridge. Invite your household with a link, no app store required.',
			why: 'No more “did you give her the tablet?” texts.',
			tint: 'bg-am',
			tilt: 'rotate-1'
		},
		{
			icon: Timer,
			title: 'Training, little and often',
			body: 'A five-minute session timer and a clicker in your pocket. Break skills into steps and watch them go from learning to reliable.',
			why: 'Short sessions stick. Seeing progress keeps you going.',
			tint: 'bg-pm',
			tilt: 'rotate-[0.6deg]'
		},
		{
			icon: NotebookPen,
			title: 'A diary for the odd stuff',
			body: 'Note the itching, the upset tummy, the day she finally ignored the squirrel. Add a photo if it helps.',
			why: 'When the vet asks “since when?”, you’ll know.',
			tint: 'bg-paper',
			tilt: '-rotate-[0.6deg]'
		},
		{
			icon: MapPin,
			title: 'Walks worth repeating',
			body: 'Rate each walk 👍 👌 👎, pin your favourite spots on a map and keep a wishlist of places to try. Directions open in Apple Maps, Google Maps or Waze.',
			why: 'Remember the field with the stream. Forget the one with the cows.',
			tint: 'bg-tennis',
			tilt: 'rotate-1'
		},
		{
			icon: Pill,
			title: 'Refills and weigh-ins',
			body: 'Lead counts down the tablets and tells you when to reorder. Log weight and see the trend at a glance.',
			why: 'Running out on a Sunday is nobody’s idea of fun.',
			tint: 'bg-am',
			tilt: '-rotate-1'
		}
	];

	const extras = [
		{ icon: Share2, text: 'A sitter link: they see the routine and tick doses, no account needed' },
		{
			icon: CalendarDays,
			text: 'Appointments in your own calendar, plus a vet summary to download'
		},
		{ icon: WifiOff, text: 'Log a walk with no signal. It syncs when you’re back' }
	];
</script>

<svelte:head>
	<title>Lead: the dog care sheet for your whole household</title>
	<meta
		name="description"
		content="Lead keeps your dog's meds, walks, training and vet notes in one shared sheet, with reminders that nudge everyone in the house."
	/>
</svelte:head>

<a
	href="#main"
	class="absolute -top-16 left-3 z-50 rounded-full bg-ink px-4 py-2.5 text-paper focus:top-3"
	>Skip to content</a
>

<header
	class="mx-auto flex max-w-[1040px] items-center justify-between px-4 pt-[max(16px,env(safe-area-inset-top))] sm:px-6"
>
	<p class="flex items-center gap-2.5 text-lg font-extrabold tracking-tight">
		<img src="/favicon.svg" alt="" width="32" height="32" class="rounded-lg" />Lead
	</p>
	<a
		class="rounded-full px-4 py-2.5 font-bold underline-offset-4 hover:underline"
		href={resolve('/auth/login')}>Log in</a
	>
</header>

<main id="main" class="mx-auto max-w-[1040px] px-4 pb-16 sm:px-6">
	<!-- Hero: the question every dog household asks, answered by the sheet. -->
	<section
		class="grid items-center gap-10 pt-8 pb-16 md:grid-cols-[1.1fr_1fr] md:gap-14 md:pt-16"
		aria-labelledby="hero-h"
	>
		<div class="grid gap-6">
			<h1
				id="hero-h"
				class="text-[3.1rem] leading-[0.88] font-extrabold tracking-[-0.055em] text-balance sm:text-[4.4rem] md:text-[5.2rem]"
			>
				Who fed the&nbsp;dog?
			</h1>
			<p class="max-w-[30ch] text-lg leading-snug text-muted sm:text-xl">
				Lead is the care sheet on your fridge, in everyone’s pocket. Meds, walks and training,
				ticked off and initialled by the whole household.
			</p>
			<div class="flex flex-wrap gap-3">
				<a class="btn" href={resolve('/auth/signup')}>Start your dog’s sheet</a>
				<a class="btn btn-ghost" href="#features">See what it does</a>
			</div>
		</div>

		<div class="relative mx-auto w-full max-w-[380px]">
			<div class="paper tape hero-card relative rotate-[1.5deg] p-5 sm:p-6">
				<div class="flex items-baseline justify-between gap-3">
					<p class="text-2xl font-extrabold tracking-tight">Juno · Today</p>
					<p class="text-sm font-semibold text-muted">Tue</p>
				</div>
				<ul class="mt-4 grid gap-1" aria-label="Example care sheet">
					{#each sheet as row, i (row.what)}
						<li
							class="grid grid-cols-[3.2rem_1fr_auto] items-center gap-2 border-t border-line py-2.5 first:border-t-0"
						>
							<span class="text-sm font-bold text-muted tabular-nums">{row.time}</span>
							<span class="min-w-0 truncate font-semibold">{row.what}</span>
							{#if row.done}
								<span class="done flex items-center gap-1 text-ink" style="--d: {0.5 + i * 0.35}s">
									<span class="sr-only">Done by {row.who === 'S' ? 'Sam' : 'Chris'}</span>
									<span class="hero-tick"><Tick seed={row.what} size={24} draw /></span>
									<span class="hand hero-initial text-2xl leading-none" aria-hidden="true"
										>{row.who}</span
									>
								</span>
							{:else}
								<span class="rounded-full bg-tennis px-2.5 py-1 text-xs font-bold whitespace-nowrap"
									>Next up</span
								>
							{/if}
						</li>
					{/each}
				</ul>
			</div>
			<p
				class="hand hero-note absolute -bottom-9 -left-1 -rotate-3 text-[1.7rem] leading-none sm:-left-6"
				aria-hidden="true"
			>
				Sam did. 7:32am!
			</p>
		</div>
	</section>

	<!-- The why, in the words every household already uses. -->
	<section class="py-12" aria-labelledby="why-h" {@attach reveal}>
		<h2 id="why-h" class="sr-only">Why Lead exists</h2>
		<div class="flex flex-wrap justify-center gap-3 sm:gap-4">
			{#each ['“Did anyone give her the tablet?”', '“When did the scratching start?”', '“Has he been out?”', '“Which walk was the good one?”'] as q, i (q)}
				<p
					class="paper hand px-4 py-2.5 text-[1.45rem] leading-tight sm:text-[1.7rem] {i % 2
						? 'rotate-1'
						: '-rotate-1'}"
				>
					{q}
				</p>
			{/each}
		</div>
		<p
			class="mx-auto mt-8 max-w-[34ch] text-center text-2xl leading-tight font-extrabold tracking-tight text-balance sm:text-3xl"
		>
			Caring for a dog is a team sport. Lead is the team sheet.
		</p>
	</section>

	<!-- Features, each with the reason it's there. -->
	<section id="features" class="scroll-mt-6 py-12" aria-labelledby="features-h">
		<h2
			id="features-h"
			class="text-[2.4rem] leading-[0.95] font-extrabold tracking-[-0.045em] sm:text-5xl"
			{@attach reveal}
		>
			Everything your dog needs,<br class="hidden sm:inline" /> nothing they don’t.
		</h2>
		<ul class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each features as f (f.title)}
				<li class="paper feature grid content-start gap-3 p-6 {f.tilt}" {@attach reveal}>
					<span
						class="grid size-12 place-items-center rounded-2xl {f.tint} shadow-[inset_0_0_0_2px_var(--color-ink)]"
					>
						<f.icon size={24} strokeWidth={2.2} aria-hidden="true" />
					</span>
					<h3 class="text-xl leading-tight font-extrabold tracking-tight">{f.title}</h3>
					<p class="text-muted">{f.body}</p>
					<p class="hand mt-1 text-[1.45rem] leading-tight">{f.why}</p>
				</li>
			{/each}
		</ul>
		<ul class="mt-8 grid gap-3 sm:grid-cols-3" {@attach reveal}>
			{#each extras as x (x.text)}
				<li
					class="flex items-start gap-3 rounded-2xl px-4 py-3 shadow-[inset_0_0_0_2px_var(--color-line)]"
				>
					<x.icon size={20} strokeWidth={2.2} class="mt-0.5 shrink-0" aria-hidden="true" />
					<span class="text-[0.9375rem] leading-snug font-semibold">{x.text}</span>
				</li>
			{/each}
		</ul>
	</section>

	<!-- How it works. -->
	<section class="py-12" aria-labelledby="how-h">
		<h2
			id="how-h"
			class="text-[2.4rem] leading-[0.95] font-extrabold tracking-[-0.045em] sm:text-5xl"
			{@attach reveal}
		>
			Up and running before the kettle boils.
		</h2>
		<ol class="mt-10 grid gap-5 sm:grid-cols-3">
			{#each [{ t: 'Add your dog', b: 'Name, birthday, vet, and the care they need. Presets cover the usual suspects.' }, { t: 'Invite the household', b: 'Send a link to whoever shares the walks. Partners, kids, the neighbour who pops in.' }, { t: 'Tick it off', b: 'Tap the reminder, tick it, done. Everyone sees it straight away.' }] as step, i (step.t)}
				<li class="grid content-start gap-2" {@attach reveal}>
					<span
						class="hand grid size-14 place-items-center rounded-full bg-ink text-[2rem] leading-none text-paper"
						aria-hidden="true">{i + 1}</span
					>
					<h3 class="mt-2 text-xl font-extrabold tracking-tight">{step.t}</h3>
					<p class="text-muted">{step.b}</p>
				</li>
			{/each}
		</ol>
	</section>

	<!-- Final call, with the iPhone install note. -->
	<section
		class="paper tape mt-10 grid justify-items-center gap-5 px-6 py-12 text-center sm:py-16"
		aria-labelledby="cta-h"
		{@attach reveal}
	>
		<h2
			id="cta-h"
			class="text-[2.4rem] leading-[0.95] font-extrabold tracking-[-0.045em] text-balance sm:text-5xl"
		>
			Give your dog a sheet of their own.
		</h2>
		<p class="max-w-[38ch] text-muted">
			Lead works in your browser. On iPhone, add it to your Home Screen and it behaves like an app,
			with notifications and a badge for anything late.
		</p>
		<div class="flex flex-wrap justify-center gap-3">
			<a class="btn" href={resolve('/auth/signup')}>Create an account</a>
			<a class="btn btn-ghost" href={resolve('/auth/login')}>I already have one</a>
		</div>
	</section>
</main>

<footer
	class="mx-auto max-w-[1040px] px-4 pb-[max(24px,env(safe-area-inset-bottom))] text-sm text-muted sm:px-6"
>
	<p>Made for dogs, and the people who share them.</p>
</footer>

<style>
	:global([data-reveal]) {
		transition:
			opacity 0.7s var(--ease-pen),
			translate 0.7s var(--ease-pen);
	}
	:global([data-reveal]:not([data-shown])) {
		opacity: 0;
		translate: 0 18px;
	}

	/* The hero card drops onto the fridge, then the household ticks it off one by one. */
	.hero-card {
		animation: drop 0.8s var(--ease-press) both;
	}
	@keyframes drop {
		from {
			opacity: 0;
			translate: 0 -24px;
			rotate: -4deg;
		}
	}
	.hero-tick :global(path) {
		animation-delay: var(--d);
	}
	.done .hero-initial {
		animation: stamp 0.3s var(--ease-press) both;
		animation-delay: calc(var(--d) + 0.3s);
	}
	@keyframes stamp {
		from {
			opacity: 0;
			scale: 1.6;
		}
	}
	.hero-note {
		animation: scrawl 0.6s var(--ease-pen) 1.9s both;
	}
	@keyframes scrawl {
		from {
			opacity: 0;
			clip-path: inset(0 100% 0 0);
		}
		to {
			clip-path: inset(0 -10% 0 0);
		}
	}

	.feature {
		transition:
			rotate 0.35s var(--ease-press),
			translate 0.35s var(--ease-press),
			opacity 0.7s var(--ease-pen);
	}
	@media (hover: hover) {
		.feature:hover {
			rotate: 0deg;
			translate: 0 -4px;
		}
	}
</style>
