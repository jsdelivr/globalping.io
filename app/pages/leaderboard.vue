<template>
	<main class="relative flex w-full flex-col items-center gap-6 overflow-hidden max-lg:gap-0">
		<section class="bg-surface-50 relative flex w-full flex-col items-center overflow-hidden py-16 pb-42 max-lg:py-12 max-md:py-8">
			<div class="max-w-section z-10 flex w-full max-w-[90vw] flex-col gap-4 text-left">
				<h1>
					Leaderboard
				</h1>
				<p class="mb-12 max-md:mb-4">
					The global community driving open internet measurements.
				</p>
				<div class="flex gap-16 max-md:items-stretch max-md:justify-between max-md:gap-4">
					<div class="flex flex-col gap-1 max-md:flex-1 md:w-48">
						<span class="text-[40px] max-md:text-2xl md:leading-11">
							<b class="min-w-[3ch]">
								<AnimatedNumber :number="userCount" underline/>
							</b>
						</span>
						<span class="font-normal max-md:text-sm">Registered contributors</span>
					</div>
					<div class="flex flex-col gap-1 max-md:flex-1 md:w-48">
						<p class="text-[40px] max-md:text-2xl md:leading-11">
							<b class="min-w-[4ch]">
								<AnimatedNumber :number="probesHosted" underline/>
							</b>
						</p>
						<span class="font-normal max-md:text-sm">Connected probes</span>
					</div>
					<div class="flex flex-col gap-1 max-md:flex-1 md:w-48">
						<p class="text-[40px] max-md:text-2xl md:leading-11">
							<b class="min-w-[3ch]">
								<AnimatedNumber :number="countriesCovered" underline/>
							</b>
						</p>
						<span class="font-normal max-md:text-sm">Countries covered</span>
					</div>
				</div>
			</div>
			<img
				class="pointer-events-none absolute inset-0 mx-auto h-96.5 w-full max-w-400 object-cover object-center opacity-70 max-lg:opacity-75"
				src="~/assets/images/backgrounds/arrows.svg"
				alt=""
			>
			<div class="absolute inset-x-0 bottom-0 h-25 w-full opacity-65 max-lg:-bottom-10 max-lg:opacity-40">
				<span class="absolute inset-x-0 bottom-0 mx-auto h-30 w-150 max-w-1/3 translate-x-1/2 translate-y-3/5 rounded-full bg-blue-500 blur-3xl max-lg:translate-x-full"/>
				<span class="bg-primary absolute inset-x-0 bottom-0 mx-auto h-30 w-150 max-w-1/3 translate-y-3/5 rounded-full blur-3xl"/>
				<span class="absolute inset-x-0 bottom-0 mx-auto h-30 w-150 max-w-1/3 -translate-x-1/2 translate-y-3/5 rounded-full bg-blue-500 blur-3xl max-lg:-translate-x-full"/>
				<span class="bg-primary absolute inset-x-0 bottom-0 h-4 w-full translate-y-1/2 rounded-full blur-2xl"/>
			</div>
		</section>
		<section class="max-w-section z-10 w-full bg-white px-14 pt-8 pb-14 max-lg:p-4 max-lg:pt-8 lg:-translate-y-26 lg:rounded-2xl lg:border lg:shadow-xl">
			<h3 class="mb-4">
				Most hosted probes
			</h3>
			<div class="border-surface-300 w-full rounded-lg lg:overflow-hidden lg:border lg:shadow-lg">
				<div class="overflow-x-auto max-lg:hidden">
					<LeaderboardUserTable :user-list="userList" :loading="loading"/>
				</div>
				<div class="mb-4 lg:hidden">
					<LeaderboardUserList :user-list="userList" :loading="loading"/>
				</div>
				<ClientOnly>
					<div class="relative flex justify-center">
						<span
							v-if="userCount > ITEMS_PER_PAGE && userList.length"
							class="absolute top-1/2 left-8 -translate-y-1/2 text-xs max-lg:hidden"
						>
							Results <strong class="font-medium">{{ first + 1 }} - {{ first + userList.length }}</strong> of <strong class="font-medium">{{ userCount }}</strong>
						</span>
						<pvPaginator
							v-if="userCount"
							:first="first"
							:rows="ITEMS_PER_PAGE"
							:total-records="userCount"
							:template="template"
							:page-link-size="pageLinkSize"
							@page="page = $event.page"
						/>
					</div>
				</ClientOnly>
			</div>
		</section>
	</main>
</template>

<script setup lang="ts">
	import usePageHead from '~/composables/usePageHead';
	import usePagination from '~/composables/usePagination';
	import useUserLeaderboard from '~/composables/useUserLeaderboard';

	const ITEMS_PER_PAGE = 100;

	const { page, first, template, pageLinkSize } = usePagination({ itemsPerPage: ITEMS_PER_PAGE });
	const { userCount, userList, countriesCovered, probesHosted, loading } = useUserLeaderboard({ page, itemsPerPage: ITEMS_PER_PAGE });

	usePageHead({ title: 'Globalping Leaderboard' });
</script>

<style scoped>
	@media (min-width: 768px) {
		.max-w-section {
			max-width: min(90vw, 1224px);
		}
	}

	:deep(.metallic-gradient) {
		color: #fff;
		background-blend-mode: soft-light;
		background-image: linear-gradient(125deg, #777 0%, #fff 25.11%, #777 50%, #fff 50%, #777 50%, #fff 75.69%, #777 100%);
	}
</style>
