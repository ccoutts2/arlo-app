<script lang="ts">
	import '$lib/styles/globals.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/Header.svelte';
	import type { Snippet } from 'svelte';
	import Footer from '$lib/components/Footer.svelte';

	let { children, data }: { children: Snippet; data: any } = $props();

	const pets = data.pets;
	const user = data.user;
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Header {pets} {user} />
{@render children?.()}

<Footer />
