<script>
	import { House, List, Settings } from '@lucide/svelte';
</script>

<footer class="Footer">
	<nav class="Footer__nav">
		<ul class="Footer__navList">
			<li><a href="/"><House /></a></li>
			<li><a href="/up-next"><List /></a></li>
			<li><a href="/settings"><Settings /></a></li>
		</ul>
	</nav>
</footer>

<style lang="scss">
	.Footer {
		position: fixed;
		bottom: 0;
		left: 0;
		width: 100%;
		padding: 0.25rem;

		&__nav {
			background-color: powderblue;
			border-radius: 1rem;
			padding: 0.5rem 1rem;
		}

		&__navList {
			display: flex;
			justify-content: space-between;
			align-items: center;
		}
	}
</style>
