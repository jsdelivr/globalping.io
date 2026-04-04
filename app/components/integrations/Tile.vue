<template>
	<IntegrationsTileContainer :disabled="props.tile.disabled">
		<div class="relative flex size-12 items-center justify-center overflow-hidden rounded-full border bg-white shadow-sm">
			<img v-if="imgSrc" alt="" :src="imgSrc" class="size-full" :class="props.tile.imgClass">
			<span v-else class="select-none">
				{{ props.tile.header[0] }}
			</span>
		</div>

		<a v-if="props.tile.docsLink" class="text-h4 w-fit underline" target="_blank" rel="noreferrer" :href="props.tile.docsLink">{{ props.tile.header }}</a>
		<p v-else class="font-semibold">
			{{ props.tile.header }}
		</p>

		<p class="text-sm">{{ props.tile.description }}</p>

		<a v-if="props.tile.href" :href="props.tile.href" :target="isExternalLink ? '_blank' : '_self'" rel="noreferrer" class="mt-auto w-fit text-sm underline">
			Learn more
		</a>

		<p v-if="props.tile.disabled" class="text-surface-600 mt-auto text-sm">
			Coming soon
		</p>
	</IntegrationsTileContainer>
</template>

<script setup lang="ts">
	import getImageAsset from '~/utils/getImageAsset';

	interface Tile {
		header: string;
		description: string;
		href: string;
		img?: string;
		docsLink?: string;
		disabled?: boolean;
		imgClass?: string;
	}

	const props = defineProps({
		tile: {
			type: Object as PropType<Tile>,
			required: true,
		},
	});

	const imgSrc = computed(() => {
		return props.tile.img ? getImageAsset(`/integrations/${props.tile.img}`) : '';
	});

	const isExternalLink = computed(() => props.tile.href.includes('https'));
</script>
