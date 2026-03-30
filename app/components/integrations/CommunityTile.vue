<template>
	<IntegrationsTileContainer>
		<div class="font-semibold">{{ props.tile.header }}</div>

		<div class="mb-1 flex items-center gap-2">
			<img alt="" :src="getImageAsset(`/integrations/${props.tile.img}`)" class="size-6 rounded-full">
			<span>{{ props.tile.author }}</span>
		</div>

		<p class="text-sm">{{ props.tile.description }}</p>

		<a :href="props.tile.href" class="mt-auto w-fit text-sm underline" target="_blank" rel="noreferrer">
			Learn more
		</a>
	</IntegrationsTileContainer>
</template>

<script setup lang="ts">
	import getImageAsset from '~/utils/getImageAsset';

	interface CommunityTile {
		header: string;
		description: string;
		author: string;
		img: string;
		href: string;
	}

	const props = defineProps({
		tile: {
			type: Object as PropType<CommunityTile>,
			required: true,
		},
	});
</script>
