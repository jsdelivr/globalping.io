<template>
	<main class="bg-surface-50 relative -mb-4 flex w-full flex-col items-center gap-6 overflow-hidden max-md:gap-4 md:pb-16">
		<section class="relative flex w-full flex-col items-center py-16 max-md:py-8">
			<div class="max-w-section z-10 flex w-full max-w-[90vw] flex-col gap-4 text-left">
				<h1>
					Leaderboard
				</h1>
				<p class="mb-12 max-md:mb-4">
					The networks & providers powering the world’s largest open measurement platform.
				</p>
				<div class="flex gap-16 max-md:items-stretch max-md:justify-between max-md:gap-4">
					<div class="flex flex-col gap-1 max-md:flex-1 md:w-48">
						<span class="text-[40px] max-md:text-2xl md:leading-11">
							<b class="min-w-[3ch]">
								<AnimatedNumber :number="userCount" underline/>
							</b>
						</span>
						<h4 class="font-normal max-md:text-sm">Registered contributors</h4>
					</div>
					<div class="flex flex-col gap-1 max-md:flex-1 md:w-48">
						<p class="text-[40px] max-md:text-2xl  md:leading-11">
							<b class="min-w-[4ch]">
								<AnimatedNumber :number="probesHosted" underline/>
							</b>
						</p>
						<h4 class="font-normal max-md:text-sm">Connected probes</h4>
					</div>
					<div class="flex flex-col gap-1 max-md:flex-1 md:w-48">
						<p class="text-[40px] max-md:text-2xl  md:leading-11">
							<b class="min-w-[3ch]">
								<AnimatedNumber :number="countriesCovered" underline/>
							</b>
						</p>
						<h4 class="font-normal max-md:text-sm">Countries covered</h4>
					</div>
				</div>
			</div>
			<img
				class="pointer-events-none absolute inset-0 mx-auto h-full min-h-86 w-full max-w-400 object-cover object-center opacity-70 max-md:opacity-75"
				src="~/assets/images/backgrounds/arrows.svg"
				alt=""
			>
			<div class="absolute inset-x-0 -bottom-24 h-25 w-full opacity-30 max-md:-bottom-10">
				<span class="bg-primary absolute inset-x-0 bottom-0 mx-auto h-30 w-150 max-w-1/3 translate-x-1/3 translate-y-3/5 rounded-full blur-3xl max-md:translate-x-full"/>
				<span class="absolute inset-x-0 bottom-0 mx-auto h-30 w-150 max-w-1/3 translate-y-3/5 rounded-full bg-blue-400 blur-3xl"/>
				<span class="bg-primary absolute inset-x-0 bottom-0 mx-auto h-30 w-150 max-w-1/3 -translate-x-1/3 translate-y-3/5 rounded-full blur-3xl max-md:-translate-x-full"/>
			</div>
		</section>
		<section class="max-w-section z-10 w-full bg-white px-8 pt-4 pb-8 shadow-xl max-md:p-4 max-md:pt-8 md:rounded-xl md:border">
			<h3 class="mb-4">
				Most hosted probes
			</h3>
			<div class="border-surface-300 shadow-surface-100 w-full rounded-lg md:overflow-hidden md:border md:shadow-md">
				<div class="overflow-x-auto max-md:hidden">
					<LeaderboardUserTable :user-list="userList" :loading="loading"/>
				</div>
				<div class="mb-4 md:hidden">
					<LeaderboardUserList :user-list="userList" :loading="loading"/>
				</div>
				<ClientOnly>
					<pvPaginator
						v-if="userCount"
						:first="first"
						:rows="ITEMS_PER_PAGE"
						:total-records="userCount"
						:template="template"
						:page-link-size="pageLinkSize"
						@page="page = $event.page"
					/>
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

	usePageHead({ title: 'Globalping User Leaderboard' });
</script>

<style scoped>
	@media (min-width: 768px) {
		.max-w-section {
			max-width: min(90vw, 1224px);
		}
	}

	:deep(.metallic-gradient) {
		color: white;
		background-blend-mode: soft-light;
		background-image: linear-gradient(
			125deg,
			#777777 0%,
			#FFFFFF 25.11%,
			#777777 50%,
			#FFFFFF 50%,
			#777777 50%,
			#FFFFFF 75.69%,
			#777777 100%
		);
	}
</style>
