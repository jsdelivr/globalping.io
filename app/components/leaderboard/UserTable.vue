<template>
	<table class="relative flex max-h-137.5 w-full min-w-150 flex-col border-b text-left text-sm" :class="userList.length > 0 ? 'border-b-surface-300' : ''">
		<thead class="bg-surface-200 border-b-surface-300 table h-12.5 w-full shrink-0 table-fixed border-b">
			<tr>
				<th class="w-24 py-3 pr-6 pl-12 font-medium">#</th>
				<th class="px-4 py-3 font-medium">Contributor</th>
				<th
					v-for="col in columns"
					:key="col.key"
					class="border-surface-300 w-[15%] px-4 py-3 text-right font-medium select-none last:pr-12"
				>
					{{ col.label }}
				</th>
			</tr>
		</thead>

		<ClientOnly fallback-tag="tbody">
			<template #fallback>
				<tbody class="divide-surface-300 block w-full divide-y overflow-hidden">
					<LeaderboardUserTableRowSkeleton v-for="i in 10" :key="`skeleton-${i}`" class="table w-full table-fixed"/>
				</tbody>
			</template>

			<tbody v-if="loading" class="divide-surface-300 block w-full divide-y overflow-y-auto">
				<LeaderboardUserTableRowSkeleton v-for="i in 10" :key="`skeleton-${i}`" class="table w-full table-fixed"/>
			</tbody>

			<tbody v-else class="divide-surface-300 block w-full divide-y overflow-y-auto">
				<tr v-if="userList.length === 0" class="table w-full table-fixed">
					<td colspan="6" class="text-surface-500 py-12 text-center">
						No users found.
					</td>
				</tr>

				<tr
					v-for="user in userList"
					v-else
					:key="user.username"
					class="group hover:bg-surface-50 table h-12.5 w-full table-fixed text-right transition-colors"
				>
					<td class="w-24 py-2 pl-2 text-center">
						<span
							class="text-surface-500 relative inline-flex size-8 items-center justify-center rounded-full bg-linear-to-br text-lg"
							:class="{
								'from-[#ffeeb3] to-[#ffcd19] text-white': user.rank === 1,
								'from-[#e6e6e6] to-[#BBBBBB] text-white': user.rank === 2,
								'from-[#e1c3b7] to-[#c28369] text-white': user.rank === 3
							}"
						>
							<span
								class="absolute inset-0 m-auto size-7 rounded-full"
								:class="{
									'metallic-gradient bg-[#ffcd19]': user.rank === 1,
									'metallic-gradient bg-[#BBBBBB]': user.rank === 2,
									'metallic-gradient bg-[#c28369]': user.rank === 3
								}"/>
							<span class="z-10">
								{{ user.rank }}
							</span>
						</span>
					</td>
					<td class="px-4 py-2 text-left font-medium">
						<a :href="`/users/${user.username}`" class="hover:underline">
							{{ user.username }}
						</a>
					</td>
					<td class="w-[15%] px-4 py-2 tabular-nums">{{ formatNumber(user.cities) }}</td>
					<td class="w-[15%] px-4 py-2 tabular-nums">{{ formatNumber(user.countries) }}</td>
					<td class="w-[15%] px-4 py-2 tabular-nums">{{ formatNumber(user.asns) }}</td>
					<td class="w-[15%] py-2 pr-12 pl-4 tabular-nums">{{ formatNumber(user.totalProbes) }}</td>
				</tr>
			</tbody>
		</ClientOnly>
	</table>
</template>

<script setup lang="ts">
	import type { UserList } from '~/composables/useUserLeaderboard';

	defineProps<{ userList: UserList; loading: boolean }>();

	const columns = [
		{ key: 'cities', label: 'Cities' },
		{ key: 'countries', label: 'Countries' },
		{ key: 'asns', label: 'ASNs' },
		{ key: 'totalProbes', label: 'Probes' },
	] as const;

	const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);
</script>
