<script lang="ts">
	import { resolve } from '$app/paths';
	import Tick from './Tick.svelte';
	import type { Sheet } from '$lib/server/today';

	let { sheet }: { sheet: Sheet } = $props();
	const stateLabel = {
		done: 'given',
		skipped: 'skipped',
		late: 'late',
		due: 'due today',
		later: 'not yet due',
		none: 'not scheduled',
		before: 'not started'
	};
</script>

<div class="paper px-3.5 pt-4 pb-3">
	<table class="w-full table-fixed border-collapse">
		<caption class="px-0.5 pb-2.5 text-left text-[0.8125rem] font-semibold text-muted">
			Ticked and initialled by whoever gave it.
		</caption>
		<thead>
			<tr>
				<td class="w-[28%]"></td>
				{#each sheet.days as day (day.date)}
					<th
						scope="col"
						class="pb-2 text-xs font-semibold {day.today ? 'text-ink' : 'text-muted'}"
						aria-label={day.today ? `${day.label}, today` : undefined}
					>
						{day.label}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each sheet.rows as row (row.key)}
				<tr>
					<th
						scope="row"
						class="py-1 pr-1.5 pl-0.5 text-left text-[0.8125rem] leading-tight font-bold"
					>
						<span class="block truncate">{row.title}</span>
						<span class="block text-xs font-medium text-muted tabular-nums">{row.time}</span>
					</th>
					{#each row.cells as cell, i (cell.date)}
						<td
							class="relative h-10 overflow-hidden border-[1.5px] border-line text-center
							{sheet.days[i].today ? 'bg-tennis/30' : ''}
							{cell.state === 'none' ? 'hatch' : ''}"
							aria-label="{sheet.days[i].label}: {stateLabel[cell.state]}{cell.by
								? ` by ${cell.by}`
								: ''}"
						>
							{#if cell.state === 'done'}
								<Tick seed={cell.id} size={22} class="absolute top-[46%] left-1/2 -translate-1/2" />
								<i class="hand absolute right-0.5 -bottom-0.5 text-base not-italic text-muted"
									>{cell.by}</i
								>
							{:else if cell.state === 'skipped'}
								<span class="hand text-xl text-muted">–</span>
							{:else if cell.state === 'late'}
								<a
									href={resolve(`/o/${cell.id}`)}
									class="late-cell absolute inset-[3px] grid place-items-center rounded-sm"
									><span class="hand text-base text-late">late</span></a
								>
							{/if}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.hatch {
		background-image: repeating-linear-gradient(
			135deg,
			transparent 0 5px,
			var(--color-line) 5px 6px
		);
	}
	.late-cell {
		outline: 2px dashed var(--color-late);
		outline-offset: -2px;
		animation: march 1.6s steps(2) infinite;
	}
	@keyframes march {
		50% {
			outline-color: transparent;
		}
	}
</style>
