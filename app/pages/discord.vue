<template>
	<IntegrationTemplate
		app-name="Discord"
		:steps="DISCORD_SETUP_STEPS"
	>
		<template #actions>
			<a class="flex items-center rounded-md bg-[#5865F2] px-4 hover:bg-[#7289da]" href="https://bots.globalping.io/discord/install" target="_blank" rel="noreferrer" aria-label="Add to Discord">
				<img class="h-5" src="~/assets/images/discord/discord-logo.svg" alt="Discord">
			</a>
		</template>

		<template #bottom-cta>
			<a class="flex items-center rounded-lg bg-[#5865F2] px-4 py-3 hover:bg-[#7289da]" href="https://bots.globalping.io/discord/install" target="_blank" rel="noreferrer" aria-label="Add to Discord">
				<img class="h-7 max-md:h-5" src="~/assets/images/discord/discord-logo.svg" alt="Discord">
			</a>
		</template>
	</IntegrationTemplate>
</template>

<script setup lang="ts">
	const DISCORD_SETUP_STEPS = [
		{
			title: 'Install the app in your Discord server',
			description: 'Click to install below and select your Discord server. After installation it will be available to all of your members.',
			image: 'discord/discord-screen-1.svg',
		},
		{
			title: 'Trigger it by calling "/globalping"',
			description: 'Any user can trigger a test by running the /globalping command. For example "/globalping ping jsdelivr.com from Germany".',
			image: 'discord/discord-screen-2.svg',
			class: 'md:w-[46%]',
		},
		{
			title: 'Use it to run commands and get results in any channel',
			description: 'The results of the requested test will appear in the same channel or private message where it was triggered.',
			image: 'discord/discord-screen-3.svg',
		},
	];
</script>
