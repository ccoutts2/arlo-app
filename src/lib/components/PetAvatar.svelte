<script lang="ts">
	let {
		pet,
		size = 48,
		class: cls = ''
	}: { pet: { name: string; photoId: string | null }; size?: number; class?: string } = $props();
</script>

{#if pet.photoId}
	<img
		src="/files/{pet.photoId}"
		alt=""
		width={size}
		height={size}
		class="rounded-full object-cover {cls}"
		style:width="{size}px"
		style:height="{size}px"
	/>
{:else}
	<span
		aria-hidden="true"
		class="hand grid place-items-center rounded-full bg-ink text-paper {cls}"
		style:width="{size}px"
		style:height="{size}px"
		style:font-size="{size * 0.5}px">{pet.name[0]}</span
	>
{/if}
