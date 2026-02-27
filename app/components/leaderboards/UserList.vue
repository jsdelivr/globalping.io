<template>
	<div class="flex w-full flex-col gap-3">
		<ClientOnly>
			<template #fallback>
				<div class="flex justify-center py-12">
					<Spinner size="w-8 h-8"/>
				</div>
			</template>

			<div v-if="userList.length === 0" class="flex justify-center py-12">
				<Spinner size="w-8 h-8"/>
			</div>

			<div
				v-for="user in userList"
				v-else
				:key="user.username"
				class="bg-surface-50 border-surface-200 w-full rounded-lg border p-4"
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

						<a :href="`/users/${user.username}`" class="text-base font-semibold">
							{{ user.username }}
						</a>
					</div>

					<div class="text-right">
						<div class="text-surface-400 text-[10px] font-medium uppercase">Probes</div>
						<div class="text-lg font-bold">{{ formatNumber(user.totalProbes) }}</div>
					</div>
				</div>

				<div class="border-surface-200 divide-surface-200 grid grid-cols-3 divide-x border-t pt-3">
					<div class="px-2 text-center first:pl-0">
						<div class="text-surface-400 text-xs">Cities</div>
						<div class="font-medium">{{ formatNumber(user.cities) }}</div>
					</div>
					<div class="px-2 text-center">
						<div class="text-surface-400 text-xs">Countries</div>
						<div class="font-medium">{{ formatNumber(user.countries) }}</div>
					</div>
					<div class="px-2 text-center last:pr-0">
						<div class="text-surface-400 text-xs">ASNs</div>
						<div class="font-medium">{{ formatNumber(user.asns) }}</div>
					</div>
				</div>
			</div>
		</ClientOnly>
	</div>
</template>

<script setup lang="ts">
	import type { UserList } from '~/composables/useUserLeaderboard';

	defineProps<{ userList: UserList }>();

	const formatNumber = (num: number) => new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(num);
</script>
