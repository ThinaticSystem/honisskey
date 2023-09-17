<template>
<MkStickyContainer>
	<template #header><MkPageHeader/></template>
	<MkSpacer :contentMax="900">
		<div class="erijffvb">
			<MkButton inline danger @click="reboot">{{ i18n.ts._serverManager.reboot }}</MkButton>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const reboot = (): void => {
	os.popupMenu([{
		icon: 'ti ti-refresh',
		text: i18n.ts._serverManager.rebootServer,
		action: async(): Promise<void> => {
			os.api('server/reboot')
				.then(() => {
					os.alert({
						type: 'success',
					});
				})
				.catch(err => {
					switch (err.code) {
						case 'UNSUPPORTED_SERVER_OPERATION':
						case 'REBOOT_FAILED':
							os.alert({
								type: 'error',
								text: err.message,
							});
							break;
						default:
							os.alert({
								type: 'info',
								text: err.message + '\n\n↑HTTPエラーであれば成功かも',
							});
					}
				});
		},
	}]);
};

definePageMetadata(computed(() => ({
	title: i18n.ts.manageServer,
	icon: 'ti ti-refresh',
})));
</script>

<style lang="scss" scoped>
.erijffvb {
}
</style>
