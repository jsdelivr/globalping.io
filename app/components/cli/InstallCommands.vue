<template>
	<div class="border-surface-300 overflow-hidden rounded-xl border shadow-lg max-md:hidden">
		<div class="relative flex justify-evenly">
			<button
				v-for="os in OS_OPTIONS"
				:key="os.title"
				class="bg-surface-100 hover:bg-surface-50 flex flex-1 items-center justify-start gap-4 p-4"
				:data-testid="`cli-os-${os.title}`"
				@click="selectedOs = os">
				<img class="h-8 w-auto shrink-0 object-contain" :src="getImageAsset(os.img)" :alt="os.title">
				<div class="flex flex-col justify-center gap-1 text-start">
					<h4>{{os.title}}</h4>
					<p>{{os.systems}}</p>
				</div>
			</button>
			<span
				class="bg-primary absolute bottom-0 left-0 h-0.5 w-1/3 transition-transform duration-400 ease-in-out"
				:class="{'translate-x-full': selectedOs.title === 'RPM', 'translate-x-[200%]': selectedOs.title === 'Homebrew'}"
			/>
		</div>
		<div class="relative">
			<pre class="p-8 wrap-anywhere whitespace-break-spaces" data-testid="cli-os-cmd">{{selectedOs.command}}</pre>
			<CopyButton class="absolute right-6 bottom-6" :text="selectedOs.command" data-testid="copy-btn"/>
		</div>
	</div>
	<div class="flex flex-col gap-6 md:hidden">
		<div v-for="os in OS_OPTIONS" :key="os.title" class="flex flex-col overflow-hidden rounded-lg border shadow-md">
			<div class="bg-surface-100 flex items-center justify-start gap-4 p-4">
				<img class="h-8 w-auto shrink-0 object-contain" :src="getImageAsset(os.img)" :alt="os.title">
				<div class="flex flex-col justify-center gap-1 text-start">
					<h4>{{os.title}}</h4>
					<p>{{os.systems}}</p>
				</div>
			</div>
			<div class="relative">
				<pre class="p-4 wrap-anywhere whitespace-break-spaces">{{os.command}}</pre>
				<CopyButton class="absolute right-6 bottom-6" :text="os.command"/>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import getImageAsset from '~/utils/getImageAsset';

	const OS_OPTIONS = [
		{
			title: 'DEB',
			systems: 'Debian, UbuntuDEB, Ubuntu',
			command: 'curl -s https://packagecloud.io/install/repositories/jsdelivr/globalping/script.deb.sh | sudo bash\napt install globalping\nglobalping --help',
			img: 'icons/deb.svg',
		},
		{
			title: 'RPM',
			systems: 'CentOS, RHEL, Fedora',
			command: 'curl -s https://packagecloud.io/install/repositories/jsdelivr/globalping/script.rpm.sh | sudo bash\ndnf install globalping\nglobalping --help',
			img: 'icons/homebrew.svg',
		},
		{
			title: 'Homebrew',
			systems: 'macOS',
			command: 'brew tap jsdelivr/globalping\nbrew install globalping\nglobalping --help',
			img: 'icons/rpm.svg',
		},
	];

	const selectedOs = ref(OS_OPTIONS[0]!);
</script>
