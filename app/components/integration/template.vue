<template>
	<main class="relative mb-16 flex w-full flex-col items-center justify-center gap-12 duration-200 ease-in-out max-md:mb-4 max-md:gap-6">
		<section class="from-bluegray-50 to-bluegray-0 relative flex w-full flex-col items-center overflow-hidden bg-linear-to-tr from-50% px-8 max-md:px-6 max-md:pb-6 md:min-h-154">
			<div class="z-10 flex max-w-196 flex-col gap-6 pt-25 pb-32 max-md:py-9">
				<h1>
					With the <span class="text-primary-500">Globalping App for {{ appName }}</span>
					all of your {{ appName }} members can run network commands such as ping, traceroute, mtr, http and DNS from a globally distributed network of probes.
				</h1>

				<div class="flex items-stretch gap-4">
					<slot name="actions"/>

					<a class="btn-secondary gap-2 px-4" href="mailto:d@jsdelivr.com">
						<img class="size-5" src="~/assets/images/icons/mail.svg" alt="Mail"> Contact us
					</a>
				</div>
			</div>

			<img
				class="pointer-events-none absolute inset-0 z-0 mx-auto h-full min-h-164 object-cover"
				src="~/assets/images/grid-2.svg"
				alt=""
			>
			<div class="absolute inset-x-0 bottom-0 h-25 w-full opacity-40 max-md:opacity-25">
				<span class="absolute inset-x-0 bottom-0 mx-auto h-30 w-150 max-w-1/3 translate-x-1/2 translate-y-3/5 rounded-full bg-blue-500 blur-3xl max-md:translate-x-full"/>
				<span class="bg-primary absolute inset-x-0 bottom-0 mx-auto h-30 w-150 max-w-1/3 translate-y-3/5 rounded-full blur-3xl"/>
				<span class="absolute inset-x-0 bottom-0 mx-auto h-30 w-150 max-w-1/3 -translate-x-1/2 translate-y-3/5 rounded-full bg-blue-500 blur-3xl max-md:-translate-x-full"/>
				<span class="bg-primary absolute inset-x-0 bottom-0 h-4 w-full translate-y-1/2 rounded-full blur-2xl"/>
			</div>
		</section>

		<section class="max-w-section flex w-full flex-col gap-16 px-6 max-md:gap-8 max-md:px-2">
			<div class="flex flex-col gap-4">
				<h1>Globalping Integration for {{ appName }} Quick Start</h1>
				<h4 class="text-xl">Simple to use, free and open source.</h4>
			</div>

			<div class="flex flex-col gap-24 max-md:gap-10">
				<div
					v-for="(item, index) in steps"
					:key="item.title"
					ref="stepRefs"
					:data-index="index"
					class="flex items-center justify-between gap-6 transition-all duration-500 ease-out max-md:flex-col"
					:class="[
						index % 2 ? 'md:flex-row-reverse' : '',
						activeStep === index
							? 'scale-100 opacity-100 blur-none'
							: 'scale-95 opacity-50 blur-[2px]'
					]"
				>
					<div class="flex gap-4">
						<div class="bg-primary relative flex size-10 shrink-0 items-center justify-center rounded-md text-xl font-bold text-white">
							{{ index + 1 }}
						</div>
						<div class="flex flex-col gap-2 leading-8 md:max-w-80">
							<h3>{{ item.title }}</h3>
							<p>{{ item.description }}</p>
						</div>
					</div>
					<img
						class="max-h-72 shrink-0 object-contain md:w-[40%]"
						:class="[index % 2 ? 'object-left' : 'object-right', item.class ?? '']"
						:src="item.image"
						:alt="item.title"
					>
				</div>
			</div>
		</section>

		<div class="mx-auto mt-8 max-md:mt-4">
			<slot name="bottom-cta"/>
		</div>
	</main>
</template>

<script setup lang="ts">
	import { useActiveStep } from '~/composables/useActiveStep';
	import usePageHead from '~/composables/usePageHead';

	interface Step {
		title: string;
		description: string;
		image: string;
		class?: string;
	}

	const props = defineProps<{
		steps: Step[];
		appName: string;
	}>();

	const { activeStep, stepRefs } = useActiveStep();

	usePageHead({
		title: `Globalping ${props.appName} App`,
		description: `A must have ${props.appName} App for devops and support teams, startups and corporations, that allows anyone to run global network tests in any channel and discuss the results.`,
	});
</script>

<style scoped>
	.max-w-section {
		max-width: min(90vw, 1064px);
	}

	section > p {
		line-height: 2rem;
	}
</style>
