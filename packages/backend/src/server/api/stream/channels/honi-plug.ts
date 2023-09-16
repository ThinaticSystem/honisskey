import { Injectable } from '@nestjs/common';
import { bindThis } from '@/decorators.js';
import Channel from '../channel.js';
import type { Serialized } from '../types.js';

class HoniPlugChannel extends Channel {
	public readonly chName = 'honiPlug';
	public static shouldShare = true;
	public static requireCredential = true;

	@bindThis
	public init(): void {
		this.subscriber.on('honiPlug', this.onContent);
	}

	@bindThis
	public onContent(message: { type: string, body: Serialized<Record<string | number | symbol, unknown>> }): void {
		const [pluginName, content] = [message.type, message.body];

		this.send('honiPlug', {
			plugin: pluginName,
			content: content,
		});
	}

	@bindThis
	public dispose(): void {
		// Unsubscribe events
		this.subscriber.off('honiPlug', this.onContent);
	}
}

@Injectable()
export class HoniPlugChannelService {
	public readonly shouldShare = HoniPlugChannel.shouldShare;
	public readonly requireCredential = HoniPlugChannel.requireCredential;

	@bindThis
	public create(id: string, connection: Channel['connection']): HoniPlugChannel {
		return new HoniPlugChannel(
			id,
			connection,
		);
	}
}
