import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import type { UsersRepository } from '@/models/index.js';
import { LoggerService } from '@/core/LoggerService.js';
import type { Schema } from '@/misc/json-schema.js';
import { IEndpointMeta } from '../../endpoints.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '../../error.js';
import ms from 'ms';
import { exec } from 'node:child_process';

export const meta = {
	stability: 'experimental',

	tags: ['honisskey', 'server'],

	errors: {
		unsupportedServerOperation: {
			message: 'The operation you requested is not supported on this server.',
			code: 'UNSUPPORTED_SERVER_OPERATION',
			id: '113e048e-badf-4c9c-98d8-cce1b9574cd4',
		},
		rebootFailed: {
			message: 'Reboot command was failed.',
			code: 'REBOOT_FAILED',
			id: 'a63b549f-6e98-45e6-b9fb-9ebe25014672',
		},
	},

	res: {
		type: 'string',
		example: 'ok',
		enum: ['ok'],
	},

	requireCredential: true,

	/* requireRolePolicy: 'TODO: 足す', */

	prohibitMoved: true,

	// limit: {
		// duration: ms('1days'),
		// max: 3,
		// minInterval: ms('1hours'),
	// },

	description: 'Reboot Honisskey server.',
} as const satisfies IEndpointMeta;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const satisfies Schema;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private loggerService: LoggerService,
	) {
		super(meta, paramDef, async (ps, _me) => {
			const logger = this.loggerService.getLogger('server');

			// const me = _me ? await this.usersRepository.findOneByOrFail({ id: _me.id }) : null;
			// TODO: RoleServiceでロールを参照してだめユーザーだったらエラーを流す

			const rebootCommand = this.config.serverCommands?.reboot;
			if (!rebootCommand) {
				throw new ApiError(meta.errors.unsupportedServerOperation);
			}

			await new Promise<void>((resolve, reject) => {
				exec(rebootCommand, (err, _stdout, _stderr) => {
					if (err) {
						logger.debug(`Reboot command (${rebootCommand}): --------`);
						logger.error(err.message);
						logger.debug('----------------');
						reject(new ApiError(meta.errors.rebootFailed));
					} else {
						resolve();
					}
				});
			});

			logger.info('I put server to sleep.');

			return 'ok';
		});
	}
}
