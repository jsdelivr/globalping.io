<template>
	<main class="relative mb-16 flex w-full flex-col items-center justify-center gap-20 duration-200 ease-in-out max-md:mb-8 max-md:gap-12">
		<section class="from-bluegray-50 to-bluegray-0 relative flex w-full flex-col items-center overflow-hidden bg-linear-to-tr from-50% px-8 max-md:px-6">
			<div class="z-10 flex max-w-[784px] flex-col gap-7 pt-[100px] pb-32 max-md:py-9">
				<h1>
					Run network commands on a <span class="text-primary-500">global network of
						<span class="inline-block min-w-[5ch] text-end"><AnimatedNumber :number="roundedProbeCount"/>+</span> probes</span>
					to test, debug and benchmark your infrastructure, routing and web services.
				</h1>
				<p class="text-xl leading-8 font-semibold max-md:text-lg">
					All in your command line, simple to use and fully scriptable.
				</p>
				<a class="btn-secondary gap-2 px-4" href="https://github.com/jsdelivr/globalping-cli" target="_blank" rel="noreferrer">
					<img class="size-5" src="~/assets/images/icons/github.small.svg" alt="GitHub"> GitHub
				</a>
			</div>
			<img class="pointer-events-none absolute inset-0 z-0 mx-auto h-full object-cover" src="~/assets/images/grid-2.svg" alt="">
			<div class="absolute inset-x-0 bottom-0 h-[100px] w-full opacity-80 max-md:opacity-35">
				<span class="absolute inset-x-0 bottom-0 mx-auto h-[120px] w-[600px] max-w-1/3 translate-x-1/2 translate-y-3/5 rounded-full bg-blue-500 blur-3xl max-md:translate-x-full"/>
				<span class="bg-primary absolute inset-x-0 bottom-0 mx-auto h-[120px] w-[600px] max-w-1/3 translate-y-3/5 rounded-full blur-3xl"/>
				<span class="absolute inset-x-0 bottom-0 mx-auto h-[120px] w-[600px] max-w-1/3 -translate-x-1/2 translate-y-3/5 rounded-full bg-blue-500 blur-3xl max-md:-translate-x-full"/>
				<span class="bg-primary absolute inset-x-0 bottom-0 h-4 w-full translate-y-1/2 rounded-full blur-2xl"/>
			</div>
		</section>
		<section class="max-w-section flex w-full flex-col items-center max-md:px-2">
			<div class="flex flex-col gap-4 md:-mb-36 md:-translate-y-36 md:rounded-xl md:border md:bg-white md:p-12 md:shadow-xl">
				<h2 class="md:px-14">
					How to install
				</h2>
				<p class="mb-6 text-xl leading-8 font-semibold max-md:text-lg md:px-14">
					Install the correct repo for your OS to make sure you get the latest updates we release.
				</p>
				<CliInstallCommands/>
			</div>
		</section>
		<section class="max-w-section flex flex-col gap-6 max-md:px-2 max-md:text-center">
			<h2 class="lg:px-20">
				Globalping CLI is a must-have all-in-one tool for network optimization
			</h2>
			<p class="text-xl leading-8 font-semibold max-md:text-lg lg:px-20">
				Run network commands, write scripts, automate uptime monitoring, do latency checks and make sure your anycast network continues to perform up to your standards, globally!
				<a class="inline-link" href="https://github.com/jsdelivr/globalping#best-practices-and-tips" target="_blank" rel="noreferrer">Learn more about the best practices.</a>
			</p>
			<CliCommandExamples/>
		</section>
		<section class="max-w-section relative flex flex-col items-center gap-6 max-md:px-2 max-md:text-center">
			<h2 class="w-full lg:px-20">
				Globalping CLI - Quick Start
			</h2>
			<p class="text-xl leading-8 font-semibold max-md:text-lg lg:px-20">
				The Globalping command line tool provides a simple and familiar interface that works on Linux, Mac, and Windows
			</p>
			<div class="relative mb-4 max-w-full rounded-xl border bg-white p-6 text-start shadow-xl max-md:p-0 max-md:shadow-md">
				<pre class="bg-surface-50 max-h-96 max-w-full overflow-auto rounded-xl p-6 max-md:p-3">
~$ globalping help

Usage:
  globalping [command]

Measurement Commands:
  dns         Use the native dig command
  http        Perform a HEAD or GET request to a host
  mtr         Use the native mtr command
  ping        Use the native ping command
  traceroute  Use the native traceroute command

Additional Commands:
  completion  Generate the autocompletion script for the specified shell
  help        Help about any command
  version     Print the version number of Globalping CLI

Flags:
  -C, --ci            Disable realtime terminal updates and color suitable for CI (default false)
  -F, --from string   A continent, region (e.g eastern europe), country, US state or city (default "world")
  -h, --help          help for globalping
  -J, --json          Output results in JSON format (default false)
  -L, --limit int     Limit the number of probes to use (default 1)

Use "globalping [command] --help" for more information about a command.</pre>
			</div>
			<a class="btn-primary gap-2 px-4" href="https://github.com/jsdelivr/globalping-cli" target="_blank" rel="noreferrer">
				<img class="size-5" src="~/assets/images/icons/github.small.svg" alt="GitHub">
				Learn more on GitHub
			</a>
		</section>
	</main>
</template>

<script setup lang="ts">
	import usePageHead from '~/composables/usePageHead';
	import useProbes from '~/composables/useProbes';

	const { data: probes } = await useProbes();
	const roundedProbeCount = computed(() => Math.floor((probes.value?.length ?? 0) / 100) * 100);

	usePageHead({ title: 'Globalping CLI - The perfect DevOps tool' });
</script>

<style scoped>
	.max-w-section {
		max-width: min(90vw, 1016px);
	}

	section > p {
		line-height: 2rem;
	}
</style>
