<template>
<span v-if="disableLink" v-user-preview="disablePreview ? undefined : user.id" class="eiwwqkts _noSelect" :class="{ cat: user.isCat, square: $store.state.squareAvatars }" :style="{ color }" :title="acct(user)" @click="onClick">
	<img class="inner" :src="url" decoding="async"/>
	<MkUserOnlineIndicator v-if="showIndicator" class="indicator" :user="user"/>
</span>
<MkA v-else v-user-preview="disablePreview ? undefined : user.id" class="eiwwqkts _noSelect" :class="{ cat: user.isCat, square: $store.state.squareAvatars }" :style="{ color }" :to="userPage(user)" :title="acct(user)" :target="target" :additional-contextmenu-items="contextmenuItem(user)">
	<img class="inner" :src="url" decoding="async"/>
	<MkUserOnlineIndicator v-if="showIndicator" class="indicator" :user="user"/>
</MkA>
</template>

<script lang="ts" setup>
import { onMounted, watch } from 'vue';
import * as misskey from 'misskey-js';
import { getStaticImageUrl } from '@/scripts/get-static-image-url';
import { extractAvgColorFromBlurhash } from '@/scripts/extract-avg-color-from-blurhash';
import { acct, userPage } from '@/filters/user';
import MkUserOnlineIndicator from '@/components/MkUserOnlineIndicator.vue';
import { defaultStore } from '@/store';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { MenuItem } from '@/types/menu';

const props = withDefaults(defineProps<{
	user: misskey.entities.User;
	target?: string | null;
	disableLink?: boolean;
	disablePreview?: boolean;
	showIndicator?: boolean;
}>(), {
	target: null,
	disableLink: false,
	disablePreview: false,
	showIndicator: false,
});

const emit = defineEmits<{
	(ev: 'click', v: MouseEvent): void;
}>();

const url = $computed(() => defaultStore.state.disableShowingAnimatedImages
	? getStaticImageUrl(props.user.avatarUrl)
	: props.user.avatarUrl);

function onClick(ev: MouseEvent) {
	emit('click', ev);
}

let color = $ref();

watch(() => props.user.avatarBlurhash, () => {
	color = extractAvgColorFromBlurhash(props.user.avatarBlurhash);
}, {
	immediate: true,
});

const contextmenuItem = (user: misskey.entities.User): MenuItem[] => [
	{
		type: 'label',
		text: '@' + user.username + (user.host !== null ? `@${user.host}` : ''),
	}, {
		icon: 'fas fa-eye-slash',
		text: i18n.ts.mute,
		action: () => toggleMute(user),
	}, {
		icon: 'fa fa-user-times',
		text: i18n.ts.unfollow,
		action: async(): Promise<void> => {
			const { canceled } = await os.confirm({
				type: 'warning',
				text: i18n.t('unfollowConfirm', { name: props.user.name || props.user.username }),
			});

			if (canceled) return;

			os.api('following/delete', {
				userId: user.id,
			}).catch(err => {
				console.error('もげとるわこれ', err);
			});
		},
	},
];

async function toggleMute(user: misskey.entities.User): Promise<void> {
	const { canceled, result: period } = await os.select({
		title: i18n.ts.mutePeriod,
		items: [{
			value: 'indefinitely', text: i18n.ts.indefinitely,
		}, {
			value: 'tenMinutes', text: i18n.ts.tenMinutes,
		}, {
			value: 'oneHour', text: i18n.ts.oneHour,
		}, {
			value: 'oneDay', text: i18n.ts.oneDay,
		}, {
			value: 'oneWeek', text: i18n.ts.oneWeek,
		}],
		default: 'indefinitely',
	});
	if (canceled) return;

	const expiresAt = period === 'indefinitely' ? null
		: period === 'tenMinutes' ? Date.now() + (1000 * 60 * 10)
		: period === 'oneHour' ? Date.now() + (1000 * 60 * 60)
		: period === 'oneDay' ? Date.now() + (1000 * 60 * 60 * 24)
		: period === 'oneWeek' ? Date.now() + (1000 * 60 * 60 * 24 * 7)
		: null;

	os.apiWithDialog('mute/create', {
		userId: user.id,
		expiresAt,
	});
}
</script>

<style lang="scss" scoped>
@keyframes earwiggleleft {
	from { transform: rotate(37.6deg) skew(30deg); }
	25% { transform: rotate(10deg) skew(30deg); }
	50% { transform: rotate(20deg) skew(30deg); }
	75% { transform: rotate(0deg) skew(30deg); }
	to { transform: rotate(37.6deg) skew(30deg); }
}

@keyframes earwiggleright {
	from { transform: rotate(-37.6deg) skew(-30deg); }
	30% { transform: rotate(-10deg) skew(-30deg); }
	55% { transform: rotate(-20deg) skew(-30deg); }
	75% { transform: rotate(0deg) skew(-30deg); }
	to { transform: rotate(-37.6deg) skew(-30deg); }
}

.eiwwqkts {
	position: relative;
	display: inline-block;
	vertical-align: bottom;
	flex-shrink: 0;
	border-radius: 100%;
	line-height: 16px;

	> .inner {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		top: 0;
		border-radius: 100%;
		z-index: 1;
		overflow: hidden;
		object-fit: cover;
		width: 100%;
		height: 100%;
	}

	> .indicator {
		position: absolute;
		z-index: 1;
		bottom: 0;
		left: 0;
		width: 20%;
		height: 20%;
	}

	&.square {
		border-radius: 20%;

		> .inner {
			border-radius: 20%;
		}
	}

	&.cat {
		&:before, &:after {
			background: #df548f;
			border: solid 4px currentColor;
			box-sizing: border-box;
			content: '';
			display: inline-block;
			height: 50%;
			width: 50%;
		}

		&:before {
			border-radius: 0 75% 75%;
			transform: rotate(37.5deg) skew(30deg);
		}

		&:after {
			border-radius: 75% 0 75% 75%;
			transform: rotate(-37.5deg) skew(-30deg);
		}

		&:hover {
			&:before {
				animation: earwiggleleft 1s infinite;
			}

			&:after {
				animation: earwiggleright 1s infinite;
			}
		}
	}
}
</style>
