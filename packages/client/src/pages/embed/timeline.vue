<template>
<MkSpacer :content-max="800">
	<div ref="rootEl" v-hotkey.global="keymap" class="cmuxhskf">
		<div v-if="queue > 0" class="new"><button class="_buttonPrimary" @click="top()">{{ $ts.newNoteRecived }}</button></div>
		<div class="tl _block">
			<XTimeline ref="tl" :key="src"
				class="tl"
				:src="src"
				:sound="false"
				@queue="queueUpdated"
			/>
		</div>
	</div>
</MkSpacer>
</template>

<script lang="ts">
export default {
	name: 'MkTimelinePage',
}
</script>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import XTimeline from '@/components/timeline.vue';
import { scroll } from '@/scripts/scroll';
import * as symbols from '@/symbols';
import { i18n } from '@/i18n';

const keymap = {
	't': focus,
};

const tlComponent = $ref<InstanceType<typeof XTimeline>>();
const rootEl = $ref<HTMLElement>();

let queue = $ref(0);
const src = document.location.pathname.slice(16); // /embed/timeline/home -> home

watch ($$(src), () => queue = 0);

function queueUpdated(q: number): void {
	queue = q;
}

function top(): void {
	scroll(rootEl, { top: 0 });
}

function focus(): void {
	tlComponent.focus();
}

defineExpose({
	[symbols.PAGE_INFO]: computed(() => ({
		title: i18n.ts.timeline,
		icon: src === 'local' ? 'fas fa-comments' : src === 'social' ? 'fas fa-share-alt' : src === 'global' ? 'fas fa-globe' : 'fas fa-home',
		bg: 'var(--bg)',
	})),
});
</script>

<style lang="scss" scoped>
.cmuxhskf {
	> .new {
		position: sticky;
		top: calc(var(--stickyTop, 0px) + 16px);
		z-index: 1000;
		width: 100%;

		> button {
			display: block;
			margin: var(--margin) auto 0 auto;
			padding: 8px 16px;
			border-radius: 32px;
		}
	}

	> .tl {
		background: var(--bg);
		border-radius: var(--radius);
		overflow: clip;
	}
}
</style>
