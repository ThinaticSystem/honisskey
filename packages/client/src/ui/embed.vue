<template>
<div class="mk-app">
	<div class="contents">
		<main ref="main">
			<div class="content">
				<router-view v-slot="{ Component }">
					<transition :name="$store.state.animation ? 'page' : ''" mode="out-in" @enter="onTransition">
						<keep-alive :include="['MkTimelinePage']">
							<component :is="Component" :ref="changePage"/>
						</keep-alive>
					</transition>
				</router-view>
			</div>
		</main>
	</div>

	<XCommon/>
</div>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from 'vue';
import { host } from '@/config';
import XCommon from './_common_/common.vue';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		XCommon,
	},

	data() {
		return {
			host: host,
			pageInfo: null,
		};
	},

	created() {
		document.documentElement.style.overflowY = 'scroll';
	},

	methods: {
		changePage(page) {
			if (page == null) return;
			if (page[symbols.PAGE_INFO]) {
				this.pageInfo = page[symbols.PAGE_INFO];
			}
		},

		top() {
			window.scroll({ top: 0, behavior: 'smooth' });
		},

		help() {
			window.open(`https://misskey-hub.net/docs/keyboard-shortcut.md`, '_blank');
		},

		onTransition() {
			if (window._scroll) window._scroll();
		},
	}
});
</script>

<style lang="scss" scoped>
.mk-app {
	$ui-font-size: 1em; // TODO: どこかに集約したい

	// ほんとは単に 100vh と書きたいところだが... https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
	min-height: calc(var(--vh, 1vh) * 100);
	box-sizing: border-box;

	> .contents {
		> main {
			> .content {
				> * {
					// ほんとは単に calc(100vh) と書きたいところだが... https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
					min-height: calc((var(--vh, 1vh) * 100));
				}
			}
		}
	}
}
</style>
