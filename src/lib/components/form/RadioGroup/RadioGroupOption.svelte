<script lang="ts">
	let {
		group = $bindable(),
		id,
		label,
		name,
		value,
		checked
	}: {
		group: string | undefined;
		id: string;
		name: string;
		label: string;
		value: string;
		checked?: boolean;
	} = $props();
</script>

<label for={id}>
	<input type="radio" {name} {id} bind:group {value} {checked} />
	<span>{label}</span>
</label>

<style lang="scss">
	label {
		cursor: pointer;
		align-items: center;
		border-radius: 4px;
		display: flex;
		font-size: 0.825rem;
		justify-content: center;
		min-height: 2rem;
		min-width: 5rem;
		overflow: hidden;
		position: relative;
		text-transform: capitalize;

		span {
			text-align: center;
			transition: color 0.3s cubic-bezier(0.22, 0.31, 0, 1);
			width: 100%;
		}
	}

	input[type='radio'] {
		display: none;
	}

	label:has(input[type='radio']:checked) {
		background-color: #101214;
		&::after {
			transform: translateY(0%);
		}

		span {
			color: #a399a8;
			z-index: 2;
		}
	}
</style>
