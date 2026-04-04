<template>
	<IntegrationTemplate
		app-name="Slack"
		:steps="SLACK_SETUP_STEPS"
	>
		<template #actions>
			<a class="flex items-stretch rounded-md transition-opacity hover:opacity-70" href="https://bots.globalping.io/slack/install" target="_blank" rel="noreferrer" aria-label="Add to slack">
				<img class="h-10" src="~/assets/images/slack/slack-button.svg" alt="Slack">
			</a>
		</template>

		<template #bottom-cta>
			<a class="flex items-stretch rounded-md transition-opacity hover:opacity-70" href="https://bots.globalping.io/slack/install" target="_blank" rel="noreferrer" aria-label="Add to slack">
				<img class="h-12" src="~/assets/images/slack/slack-button.svg" alt="Slack">
			</a>
		</template>
	</IntegrationTemplate>
</template>

<script setup lang="ts">
	const SLACK_SETUP_STEPS = [
		{
			title: 'Install the app in your Slack organization',
			description: 'Click to install below and select your Slack organization. After installation it will be available to all of your members.',
			image: 'slack/slack-screen-1.svg',
		},
		{
			title: 'Trigger it by calling "/globalping"',
			description: 'Any user can trigger a test by running the /globalping command. For example "/globalping ping jsdelivr.com from Germany".',
			image: 'slack/slack-screen-2.svg',
		},
		{
			title: 'Use it to run commands and get results in any channel',
			description: 'The results of the requested test will appear in the same channel or private message where it was triggered.',
			image: 'slack/slack-screen-3.svg',
		},
	];
</script>
