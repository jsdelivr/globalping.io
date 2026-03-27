<template>
	<table class="relative flex w-full min-w-150 scroll-mt-4 flex-col border-b text-left text-sm">
		<thead class="bg-surface-200 border-b-surface-300 table h-12.5 w-full shrink-0 table-fixed border-b">
			<tr>
				<th class="w-24 py-3 pr-6 pl-12 font-medium">#</th>
				<th class="px-4 py-3 font-medium">Contributor</th>
				<th
					v-for="col in columns"
					:key="col.key"
					class="border-surface-300 w-[15%] px-4 py-3 text-right font-medium select-none last:pr-12"
				>
					<button class="ml-auto flex items-center gap-1.5" role="button" @click="onSortChange(col.key)">
						<span>{{ col.label }}</span>
						<span class="w-3 text-center">
							<img v-if="sortBy === col.key && sortOrder === 'asc'" class="size-2" src="~/assets/images/icons/sort-asc.svg" alt="Ascending sort">
							<img v-else-if="sortBy === col.key" class="size-2" src="~/assets/images/icons/sort-desc.svg" alt="Descending sort">
							<img v-else class="size-2.5" src="~/assets/images/icons/sort-none.svg" alt="No sort">
						</span>
					</button>
				</th>
			</tr>
		</thead>

		<tbody v-if="loading" class="divide-surface-300 block w-full divide-y">
			<LeaderboardUserTableRowSkeleton v-for="i in 10" :key="`skeleton-${i}`" class="table w-full table-fixed"/>
		</tbody>

		<tbody v-else class="divide-surface-300 block w-full divide-y">
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
							class="absolute inset-0 m-auto size-7 rounded-full transition-none"
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
				<td class="inline-flex w-full items-center justify-start gap-3 px-4 py-2 text-left font-medium">
					<FallbackImage
						:src="`https://img.jsdelivr.com/github.com/${user.username}.png`"
						:fallback="userFallbackIcon"
						class="size-8 rounded-full"
					/>
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
	</table>
</template>

<script setup lang="ts">
	import userFallbackIcon from '~/assets/images/icons/user.svg';
	import useSort from '~/composables/useSort';
	import type { UserList, SortOption } from '~/composables/useUserLeaderboard';

	const columns = [
		{ key: 'cities', label: 'Cities' },
		{ key: 'countries', label: 'Countries' },
		{ key: 'asns', label: 'ASNs' },
		{ key: 'totalProbes', label: 'Probes' },
	] as const;

	const props = defineProps<{
		loading: boolean;
		userList: UserList;
		scrollTopAnchorRef: HTMLElement | null;
	}>();

	const { sortBy, sortOrder, onSortChange } = useSort<SortOption>('totalProbes', [ 'totalProbes', 'countries', 'cities', 'asns' ]);

	const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);

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
