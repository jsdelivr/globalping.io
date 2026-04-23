<template>
	<main class="flex flex-col items-center gap-12 py-10 max-md:gap-8 max-md:py-7">
		<section class="max-w-section flex w-full flex-col gap-2 max-md:gap-3">
			<h3>
				Globalping Integrations
			</h3>
			<p class="mb-6 text-sm max-md:mb-4">
				A fully-featured REST API for your own app, easy-to-use CLI for scripting, or a no-code chatbot – we have it all. Integrate Globalping into anything!
			</p>
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				<IntegrationsTile
					v-for="tile in mainTiles"
					:key="tile.header"
					:tile="tile"
				/>
			</div>
		</section>

		<section class="max-w-section flex w-full flex-col gap-2">
			<h3>
				Globalping as a Feature
			</h3>
			<p class="mb-6 text-sm max-md:mb-4">
				Many applications and services already integrate Globalping to enhance their functionality. Just bring your Globalping token.
			</p>
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				<IntegrationsTile
					v-for="tile in featureTiles"
					:key="tile.header"
					:tile="tile"
				/>
			</div>
		</section>

		<section class="max-w-section flex w-full flex-col gap-2">
			<h3>
				Community Integrations
			</h3>
			<p class="mb-6 text-sm max-md:mb-4">
				Unofficial integrations built and supported by the amazing Globalping community!
			</p>
			<div data-testid="community-tiles" class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				<IntegrationsCommunityTile
					v-for="tile in communityTiles"
					:key="tile.header"
					:tile="tile"
				/>
			</div>
		</section>
	</main>
</template>
<script setup>
	usePageHead({
		title: 'Globalping Integrations - Power up your tools and apps by giving them access to Globalping',
		description: 'Learn how to interact with our global network of probes and add network testing functionality to your tools and apps.',
	});

	const mainTiles = [
		{
			header: 'REST API',
			description: 'Build your own free or commercial tools and services using our flexible and powerful API.',
			href: '/docs/api.globalping.io',
			img: 'rest.svg',
		},
		{
			header: 'CLI/Scripting',
			description: 'Script and automate all kinds of actions and tests from your terminal using our CLI.',
			href: '/cli',
			img: 'bash.svg',
		},
		{
			header: 'Slack',
			description: 'Collaborate with your team and run network tests in any Slack channel or thread.',
			href: '/slack',
			img: 'slack.svg',
			imgClass: 'p-1.25',
		},
		{
			header: 'Discord',
			description: 'Collaborate with your server and run network tests in any Discord channel or thread.',
			href: '/discord',
			img: 'discord.svg',
		},
		{
			header: 'Zapier',
			description: 'Build advanced automations without writing any code using Zapier.',
			href: 'https://zapier.com/apps/globalping/integrations',
			img: 'zapier.svg',
		},
		{
			header: 'n8n node',
			description: 'Add Globalping to your n8n workflows and get access to thousands of probes.',
			href: 'https://www.npmjs.com/package/@globalping/n8n-nodes-globalping',
			img: 'n8n.svg',
			imgClass: 'p-1',
		},
		{
			header: 'MCP Server',
			description: 'Give LLMs network access via our remote MCP server.',
			href: 'https://github.com/jsdelivr/globalping-mcp-server',
			img: 'mcp-server.svg',
			imgClass: 'p-1.75',
		},
		{
			header: 'Globalping TS',
			description: 'Integrate Globalping into your Node.js and TypeScript apps.',
			href: 'https://github.com/jsdelivr/globalping-typescript',
			img: 'typescript.svg',
		},
		{
			header: 'Globalping Go',
			description: 'Integrate Globalping into your Go applications and tools.',
			href: 'https://github.com/jsdelivr/globalping-go',
			img: 'go.svg',
		},
		{
			header: 'Helm',
			description: 'Deploy Globalping probes to your Kubernetes cluster using Helm.',
			href: 'https://artifacthub.io/packages/helm/globalping/globalping',
			img: 'helm.svg',
		},
		{
			header: 'Visual Studio Code',
			description: 'Run network diagnostics from thousands of global locations directly in VS Code.',
			href: 'https://marketplace.visualstudio.com/items?itemName=Globalping.globalping',
			img: 'vscode.svg',
		},
		{
			header: 'GitHub Bot',
			description: 'Interact with the Globalping network in GitHub comments for quick and simple tests.',
			href: 'https://github.com/globalping',
			img: 'gh-bot.svg',
		},
		{
			header: 'ChatGPT',
			description: 'Let ChatGPT do the testing for you.',
			img: 'chatgpt.svg',
			disabled: true,
		},
		{
			header: 'IFTTT',
			description: 'Make Globalping part of your flow with our IFTTT integration.',
			img: 'ifttt.svg',
			disabled: true,
			imgClass: 'scale-135',
		},
		{
			header: 'GitHub Action',
			description: 'Automate tests and make Globalping part of your CI to ensure your network is available and fast.',
			img: 'gh-action.svg',
			disabled: true,
			imgClass: 'p-2',
		},
		{
			header: 'NetBox',
			description: 'Interact with Globalping without ever leaving NetBox.',
			img: 'netbox.svg',
			disabled: true,
			imgClass: 'p-2.5',
		},
	];

	const featureTiles = [
		{
			header: 'Uptime Kuma',
			description: 'Self-hosted uptime monitoring with native Globalping integration.',
			href: 'https://blog.globalping.io/global-monitoring-uptime-kuma-and-globalping/',
			docsLink: 'https://github.com/louislam/uptime-kuma',
			img: 'feature/uptime-kuma.svg',
			imgClass: 'p-1',
		},
		{
			header: 'Upptime',
			description: 'GitHub Actions based uptime monitoring with Globalping.',
			href: 'https://blog.globalping.io/global-uptime-monitoring-upptime-globalping/',
			docsLink: 'https://upptime.js.org/docs/configuration/#globalping',
			img: 'feature/upptime.svg',
			imgClass: 'p-2',
		},
		{
			header: 'UptimeFlare',
			description: 'Uptime monitoring using Cloudflare and Globalping networks.',
			href: 'https://blog.globalping.io/uptime-monitoring-with-uptimeflare-and-globalping/',
			docsLink: 'https://github.com/lyc8503/UptimeFlare',
		},
		{
			header: 'Doggo DNS',
			description: 'Run DNS queries locally or via Globalping.',
			href: 'https://github.com/mr-karan/doggo',
			docsLink: 'https://doggo.mrkaran.dev/docs/guide/reference/#globalping-api-options',
		},
		{
			header: 'CraftCMS Cache Igniter',
			description: 'Warm CDN cache globally using Globalping.',
			href: 'https://github.com/putyourlightson/craft-cache-igniter',
			docsLink: 'https://putyourlightson.com/plugins/cache-igniter#globalping-warmer',
			img: 'feature/craftcms-cache-igniter.svg',
			imgClass: 'p-2',
		},
		{
			header: 'Checkmate',
			description: 'Open-source infrastructure monitoring for uptime and servers with Globalping.',
			href: 'https://blog.globalping.io/global-uptime-monitoring-with-checkmate-and-globalping/',
			docsLink: 'https://checkmate.so/',
		},
	];

	const communityTiles = [
		{
			header: 'Home Assistant Addon',
			description: 'Run a Globalping probe with Home Assistant',
			author: 'Erwin Willems',
			href: 'https://github.com/erwin-willems/hassio-addons',
			img: 'community/home-assistant.jpeg',
		},
		{
			header: 'Globalping Java Client Library',
			description: 'Java library with Maven and Gradle',
			author: 'nick9822',
			href: 'https://github.com/nick9822/globalping-java',
			img: 'community/gp-java-cli-lib.jpeg',
		},
		{
			header: 'Globalping Python Library',
			description: 'Python library for easy scripting',
			author: 'HackedServer',
			href: 'https://github.com/HackedServer/libglobalping-unofficial',
			img: 'community/unofficial-gp-python-lib.png',
		},
		{
			header: 'Globalping .Net Library',
			description: '.NET client library and PowerShell module',
			author: 'EvotecIT',
			href: 'https://github.com/EvotecIT/Globalping',
			img: 'community/globalping-dotnet.jpg',
		},
	];
</script>

<style scoped>
	.max-w-section {
		max-width: min(90vw, 1064px);
	}
</style>

