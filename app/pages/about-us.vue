<template>
	<main class="flex flex-col items-center gap-16 pb-16 max-md:pb-4">
		<section class="max-w-section flex w-full flex-col gap-32 pt-36 max-md:gap-16 max-md:px-1 max-md:pt-20">
			<div class="from-primary-500 absolute top-0 left-0 h-120 w-screen overflow-hidden bg-linear-to-b from-50% to-white max-md:h-80">
				<img
					src="~/assets/images/backgrounds/grid-2.svg"
					alt=""
					class="absolute inset-0 z-0 mx-auto max-w-340 object-contain opacity-20"
				>
				<div class="mt-top absolute bottom-0 z-10 h-20 w-full bg-linear-to-t from-white to-transparent"/>
			</div>
			<h1 class="z-10 text-white">
				Globalping
				<br>
				A globally distributed network of probes or network vantage points.
			</h1>

			<div class="z-10 flex flex-col gap-6 text-xl leading-8">
				<p>
					Globalping is a free, open-source platform for network testing and monitoring. At its core is a robust API that can schedule and run network-related commands in real-time from any location in the world.
				</p>
				<p>
					It's a simple and secure way to test your web services, APIs, CDNs, DNS and edge compute services, to ensure their global availability, and understand their latency and performance on a global scale.
				</p>
				<div>
					<h4 class="mb-6 text-xl">
						We're focused on:
					</h4>
					<div class="grid w-full gap-6 text-base max-md:gap-3 md:grid-cols-3">
						<div class="flex items-center gap-4 rounded-md border-[1.5px] bg-white p-12 transition-shadow duration-300 ease-in-out hover:shadow-lg max-md:p-4 md:flex-col md:justify-center">
							<img src="~/assets/images/about/performance.svg" alt="" class="size-14 object-contain">
							Performance
						</div>
						<div class="flex items-center gap-4 rounded-md border-[1.5px] bg-white p-12 transition-shadow duration-300 ease-in-out hover:shadow-lg max-md:p-4 md:flex-col md:justify-center">
							<img src="~/assets/images/about/ux.svg" alt="" class="size-14 object-contain">
							User Experience
						</div>
						<div class="flex items-center gap-4 rounded-md border-[1.5px] bg-white p-12 transition-shadow duration-300 ease-in-out hover:shadow-lg max-md:p-4 md:flex-col md:justify-center">
							<img src="~/assets/images/about/security.svg" alt="" class="size-14 object-contain">
							Security
						</div>
					</div>
				</div>
			</div>
		</section>

		<section class="max-w-section flex w-full flex-col gap-6">
			<h2 class="text-primary max-md:text-3xl">
				Globalping in numbers
			</h2>
			<div class="grid gap-4 md:grid-cols-3">
				<div
					v-for="stat in stats"
					:key="stat.label"
					class="flex flex-col gap-2"
				>
					<p>
						{{ stat.label }}
					</p>
					<p class="from-dark-800 w-fit bg-linear-to-r from-30% to-green-700 bg-clip-text text-2xl font-semibold text-transparent">
						<AnimatedNumber class="text-dark-800" :prefix="stat.prefix || ''" :suffix="stat.suffix || ''" :number="stat.value"/>
						{{ stat.caption }}
					</p>
				</div>
			</div>
		</section>

		<section class="max-w-section flex flex-col gap-6">
			<h2 class="text-primary max-md:text-3xl">
				Ready for production
			</h2>
			<div class="flex flex-col gap-4 text-lg">
				<p>
					From solo developers to enterprises, our platform is designed as one-size-fits-all.
				</p>
				<p>
					We aim to keep the service useful to the majority of users for free, while heavier users and enterprise companies pay their fair share and help us keep improving it.
				</p>
				<p>
					Volentio Group proudly supports Globalping by funding the core team and providing governance to ensure the project&apos;s success for the public good.
				</p>
			</div>
		</section>

		<section class="max-w-section flex flex-col gap-5">
			<h2 class="text-primary max-md:text-3xl">
				The people behind
			</h2>

			<p class="text-lg">
				These people currently run or previously helped with running this project. Want to join them? We are always looking for help.
			</p>

			<div class="grid gap-6">
				<section
					v-for="group in collaboratorGroups"
					:key="group.title"
					class="rounded-lg border bg-white p-7.5"
				>
					<h3 class="text-dark-800 mb-4">
						{{ group.title }}
					</h3>
					<div class="grid gap-5 md:grid-cols-3">
						<article
							v-for="person in group.data"
							:key="person.name"
							class="flex gap-1.5 max-md:gap-4 md:flex-col"
						>
							<img
								:src="person.image"
								:srcset="person.image2x"
								:alt="person.name"
								class="size-16 rounded-full object-cover max-md:size-13"
							>
							<div class="flex min-w-0 flex-col md:gap-1">
								<h4 class="text-lg font-semibold">
									{{ person.name }}
								</h4>
								<p class="mb-1 text-sm">
									{{ person.position }}
								</p>
								<a
									:href="person.social.url"
									target="_blank"
									rel="noreferrer"
									class="inline-flex size-fit items-center justify-center"
									:aria-label="`${person.name} social profile`"
								>
									<img :src="person.social.icon" alt="" class="size-6">
								</a>
							</div>
						</article>
					</div>
				</section>
			</div>
		</section>
	</main>
</template>

<script setup lang="ts">
	import usePageHead from '~/composables/usePageHead';
	import useProbes from '~/composables/useProbes';
	import getImageAsset from '~/utils/getImageAsset';

	usePageHead({
		title: 'About - Globalping',
	});

	const { data: probes } = await useProbes();

	const getUniqueCount = (key: 'city' | 'country' | 'asn') => computed(() => {
		if (!probes.value?.length) {
			return 0;
		}

		return new Set(probes.value.map(probe => probe.location?.[key]).filter(Boolean)).size;
	});

	const totalProbes = computed(() => probes.value?.length ?? 0);
	const totalCities = getUniqueCount('city');
	const totalCountries = getUniqueCount('country');
	const totalAsns = getUniqueCount('asn');

	const stats = computed(() => [
		{ label: 'Eyeball and DC', value: totalProbes.value, suffix: '+', caption: 'probes' },
		{ label: 'Unique and global', value: totalCities.value, suffix: '+', caption: 'cities' },
		{ label: 'Every day', value: 300, suffix: 'k+', caption: 'measurements' },
		{ label: 'Global ISP reach', value: totalAsns.value, suffix: '+', caption: 'ASNs' },
		{ label: 'And growing', value: totalCountries.value, suffix: '+', caption: 'countries' },
		{ label: 'Low latency API', value: 14, prefix: '<', suffix: 'ms', caption: 'response time' },
	]);

	const collaboratorGroups = [
		{
			title: 'Core Team',
			data: [
				{
					name: 'Dmitriy Akulov',
					position: 'Founder',
					image: getImageAsset('/about/dmitriy-akulov.png'),
					image2x: `${getImageAsset('/about/dmitriy-akulov@2x.png')} 2x`,
					social: {
						url: 'https://twitter.com/jimaek',
						icon: getImageAsset(`/icons/twitter.svg`),
					},
				},
				{
					name: 'Martin Kolarik',
					position: 'Core Developer',
					image: getImageAsset('/about/martin-kolarik.png'),
					image2x: `${getImageAsset('/about/martin-kolarik@2x.png')} 2x`,
					social: {
						url: 'https://twitter.com/makolarik',
						icon: getImageAsset(`/icons/twitter.svg`),
					},
				},
				{
					name: 'Alexey Yarmosh',
					position: 'Software Engineer',
					image: getImageAsset('/about/alexey-yarmosh.jpeg'),
					social: {
						url: 'https://www.linkedin.com/in/alexey-yarmosh/',
						icon: getImageAsset(`/icons/linkedin.svg`),
					},
				},
			],
		},
		{
			title: 'Frequent Contributors',
			data: [
				{
					name: 'Artem Stoianov',
					position: 'Developer',
					image: getImageAsset('/about/artem-stoianov.png'),
					image2x: `${getImageAsset('/about/artem-stoianov@2x.png')} 2x`,
					social: {
						url: 'https://twitter.com/zarianec',
						icon: getImageAsset(`/icons/twitter.svg`),
					},
				},
				{
					name: 'Pavel Kopecky',
					position: 'Developer',
					image: getImageAsset('/about/pavel-kopecky.jpg'),
					social: {
						url: 'https://www.linkedin.com/in/pavel-kopecký-6a1997302',
						icon: getImageAsset(`/icons/linkedin.svg`),
					},
				},
				{
					name: 'Robert Zygmuntowski',
					position: 'UI/UX Designer',
					image: getImageAsset('/about/robert-zygmuntowski.jpeg'),
					social: {
						url: 'https://www.linkedin.com/in/robert-zygmuntowski-144865a9',
						icon: getImageAsset(`/icons/linkedin.svg`),
					},
				},
			],
		},
	];
</script>

<style scoped>
	.max-w-section {
		max-width: min(90vw, 808px);
	}
</style>

