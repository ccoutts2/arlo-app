<script lang="ts">
</script>

<main>
	<h1>Signup</h1>

	<form method="POST">
		<fieldset>
			<legend>What is your name</legend>

			<div>
				<label for="givenName"></label>
				<input type="text" id="givenName" name="givenName" />
			</div>
			<div>
				<label for="familyName"></label>
				<input type="text" id="familyName" name="familyName" />
			</div>
		</fieldset>

		<div>
			<label for="email"></label>
			<input type="email" id="email" name="email" />
		</div>

		<div>
			<label for="password"></label>
			<input type="password" id="password" name="password" />
		</div>
	</form>
</main>
