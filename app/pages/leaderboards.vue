<template>
	<main class="relative mb-16 flex w-full flex-col items-center gap-8 max-md:mb-4 max-md:gap-8">
		<section class="relative flex w-full flex-col items-center overflow-hidden py-16 max-md:py-8">
			<img
				class="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover object-center opacity-50 max-md:opacity-75"
				src="~/assets/images/backgrounds/lines.webp"
				alt=""
			>
			<div class="max-w-section flex w-full flex-col gap-4 text-left">
				<h1>
					Leaderboards
				</h1>
				<p class="pb-8 max-md:pb-4">
					The networks & providers powering the world’s largest open measurement platform.
				</p>
				<div class="flex gap-10 max-md:items-stretch max-md:justify-between max-md:gap-4">
					<div class="flex flex-col justify-between max-md:flex-1">
						<h4 class="pb-4 font-normal">Total registered contributors</h4>
						<span class="text-3xl max-md:text-xl">
							<b class="min-w-[3ch]">
								<AnimatedNumber :number="userCount"/>
							</b>
						</span>
					</div>
					<div class="flex flex-col justify-between max-md:flex-1">
						<h4 class="pb-4 font-normal">Probes hosted</h4>
						<p class="text-3xl max-md:text-xl">
							<b class="min-w-[4ch]">
								<AnimatedNumber :number="probesHosted"/>
							</b>
						</p>
					</div>
					<div class="flex flex-col justify-between max-md:flex-1">
						<h4 class="pb-4 font-normal">Countries covered</h4>
						<p class="text-3xl max-md:text-xl">
							<b class="min-w-[3ch]">
								<AnimatedNumber :number="countriesCovered"/>
							</b>
						</p>
					</div>
				</div>
			</div>
		</section>
		<section class="max-w-section w-full">
			<h2 class="mb-6">
				Most hosted probes
			</h2>
			<div class="border-surface-300 w-full overflow-hidden rounded-lg md:border">
				<div class="overflow-x-auto max-md:hidden">
					<LeaderboardsUserTable :user-list="userList"/>
				</div>
				<div class="mb-4 md:hidden">
					<LeaderboardsUserList :user-list="userList"/>
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
	const { userCount, userList, countriesCovered, probesHosted } = useUserLeaderboard({ page, itemsPerPage: ITEMS_PER_PAGE });

	watch(userCount, () => {
		console.log('userCount', userCount.value);
	}, { immediate: true });

	usePageHead({ title: 'Globalping User Leaderboard' });
</script>

<style scoped>
	.max-w-section {
		max-width: min(90vw, 1016px);
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
