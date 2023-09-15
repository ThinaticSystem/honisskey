import { Inject, Injectable } from '@nestjs/common';
import ms from 'ms';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { Schema } from '@/misc/json-schema.js';
import { DI } from '@/di-symbols.js';
import type { UsersRepository } from '@/models/index.js';
import { IEndpointMeta } from '../../endpoints.js';
import { ApiError } from '../../error.js';

export const meta = {
	stability: 'experimental',

	tags: ['honisskey', 'server'],

	errors: {
		unsupportedServerOperation: {
			message: 'The operation you requested is not supported on this server.',
			code: 'UNSUPPORTED_SERVER_OPERATION',
			id: '113e048e-badf-4c9c-98d8-cce1b9574cd4',
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

	limit: {
		duration: ms('1days'),
		max: 3,
		minInterval: ms('1hours'),
	},

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
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,
	) {
		super(meta, paramDef, async (ps, _me) => {
			const me = _me ? await this.usersRepository.findOneByOrFail({ id: _me.id }) : null;
			// TODO: RoleServiceでロールを参照してだめユーザーだったらエラーを流す
			if (true/* TODO: .config/の記載を見てチェック */) {
				throw new ApiError(meta.errors.unsupportedServerOperation);
			}
			return 'ok';
		});
	}
}
