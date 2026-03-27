<template>
	<div class="flex w-full scroll-mt-4 flex-col gap-4">
		<template v-if="loading">
			<LeaderboardUserListItemSkeleton v-for="i in 10" :key="`skeleton-${i}`"/>
		</template>

		<div
			v-for="user in userList"
			v-else
			:key="user.username"
			class="bg-surface-50 border-surface-200 w-full rounded-lg border p-4 shadow-lg"
		>
			<div class="mb-4 flex items-center justify-between">
				<div class="flex items-center gap-3">
					<span
						class="text-surface-500 bg-surface-200 relative inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-linear-to-br px-2 text-lg"
						:class="{
							'from-[#ffeeb3] to-[#ffcd19] text-white': user.rank === 1,
							'from-[#e6e6e6] to-[#BBBBBB] text-white': user.rank === 2,
							'from-[#e1c3b7] to-[#c28369] text-white': user.rank === 3
						}"
					>
						<span
							class="absolute inset-0.5 rounded-full"
							:class="{
								'metallic-gradient bg-[#ffcd19]': user.rank === 1,
								'metallic-gradient bg-[#BBBBBB]': user.rank === 2,
								'metallic-gradient bg-[#c28369]': user.rank === 3
							}"/>
						<span class="z-10">
							{{ user.rank }}
						</span>
					</span>

					<FallbackImage
						:src="`https://img.jsdelivr.com/github.com/${user.username}.png`"
						:fallback="userFallbackIcon"
						class="size-8 rounded-full"
					/>

					<a :href="`/users/${user.username}`" class="text-base font-semibold">
						{{ user.username }}
					</a>
				</div>

				<div class="text-right">
					<div class="text-surface-500 text-[10px] font-medium uppercase">Probes</div>
					<div class="text-lg font-bold">{{ formatNumber(user.totalProbes) }}</div>
				</div>
			</div>

			<div class="border-surface-200 divide-surface-200 grid grid-cols-3 divide-x border-t pt-3">
				<div class="px-2 text-center first:pl-0">
					<div class="text-surface-500 text-xs">Cities</div>
					<div class="font-medium">{{ formatNumber(user.cities) }}</div>
				</div>
				<div class="px-2 text-center">
					<div class="text-surface-500 text-xs">Countries</div>
					<div class="font-medium">{{ formatNumber(user.countries) }}</div>
				</div>
				<div class="px-2 text-center last:pr-0">
					<div class="text-surface-500 text-xs">ASNs</div>
					<div class="font-medium">{{ formatNumber(user.asns) }}</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import userFallbackIcon from '~/assets/images/icons/user.svg';
	import type { UserList } from '~/composables/useUserLeaderboard';

	const props = defineProps<{
		loading: boolean;
		userList: UserList;
		scrollTopAnchorRef: HTMLElement | null;
	}>();

	const formatNumber = (num: number) => new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(num);

	watch(() => props.userList, () => {
		nextTick(() => {
			if (props.scrollTopAnchorRef) {
				const rectTop = props.scrollTopAnchorRef.getBoundingClientRect().top;

				if (rectTop < -50) {
					props.scrollTopAnchorRef.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}
			}
		});
	});
</script>
