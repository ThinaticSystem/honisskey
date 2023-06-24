import { Inject, Injectable } from '@nestjs/common';
import si from 'systeminformation';
import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class HoniPlugService {
	constructor(
		@Inject(DI.config)
		private config: Config,
	) {
	}

	@bindThis
	public configurePlugins(): unknown | null {
		try {
			// TODO:
			return 'NOT IMPLEMENTED';
		} catch (err) {
			console.error(err);
			return null;
		}
	}
}
