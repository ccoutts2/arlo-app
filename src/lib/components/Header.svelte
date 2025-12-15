<script lang="ts">
	let { user, pets } = $props();
</script>

<header class="Header">
	<div class="Header__profile">
		<p>Hello, {user}</p>
		<div>
			<button>Open Menu</button>
		</div>
	</div>

	<ul class="Header__pets">
		{#each pets as { id, name }}
			<li class="Header__pet"><a href="/pet/{id}">{name}</a></li>
		{/each}
	</ul>
</header>

<style lang="scss">
	.Header {
		align-items: flex-start;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		position: relative;

		&__profile {
			display: flex;
			justify-content: space-between;
			align-items: center;
			width: 100%;
		}

		&__pets {
			display: flex;
			justify-content: flex-start;
			gap: 2rem;
			align-items: center;
			overflow-x: auto;
			white-space: nowrap;
			scroll-behavior: smooth;
			list-style: none;
			padding-top: 1rem;
			width: 100%;
		}

		&__pet {
			background-color: #353535;
			border-radius: 9999px;
			color: #ece4e1;
			flex: 0 0 auto;
			padding-block: 0.5rem;
			padding: 0.125rem 0.75rem;
		}
	}
</style>
