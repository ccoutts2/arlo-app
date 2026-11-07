<script lang="ts">
	let { title, body }: { title: string; body: string } = $props();
</script>

<h1
	class="-ml-[0.04em] text-[clamp(3rem,15vw,4rem)] leading-[0.86] font-extrabold tracking-[-0.055em]"
>
	{title}
</h1>
<section class="paper tape mt-8 grid gap-2 p-6">
	<p class="hand text-2xl text-muted">Next on the sheet</p>
	<p>{body}</p>
</section>
