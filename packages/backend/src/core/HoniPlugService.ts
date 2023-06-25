import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as fs from 'node:fs/promises';
import { Inject, Injectable } from '@nestjs/common';
import { bindThis } from '@/decorators.js';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { GlobalEventService } from './GlobalEventService';

/**
 * /packages/backend/plugins/ のパス
 * */
const pluginsDir = ((): string => {
	const thisFile = fileURLToPath(import.meta.url); // <- HoniPlugService.ts

	return path.resolve(
		path.dirname(thisFile), // <- core/
		'../../', // <- backend/
		'plugins',
	);
})();

/**
 * HoniPlugプラグインのベースクラス
 *
 * プラグインを実装する際はこれをextendsする
 */
export abstract class HoniPlug {
	public readonly meta: Readonly<{
		/** プラグインの名前 */
		name: string;
	}>;

	/////////////////////////
	//// Lifecycle Hooks ////
	/////////////////////////

	/**
	 * 初期化処理
	 *
	 * Misskeyの起動時にコールされる
	 *
	 * @param apis API関数群
	 */
	public onInit: (
		apis: {
			/**
			 * WebSocket(チャンネル)を送信する関数
			 *
			 * @param payload: WebSocketへ送信するデータ本文
			 */
			wsPublisher: (payload: Parameters<GlobalEventService['publishHoniPlugStream']>[1]) => void
		},
	) => void
		= () => { /* not implemented -> nop */ };

	/////////////////////
	//// Event Hooks ////
	/////////////////////

	/** ユーザー投稿コンテンツ(ノートやドライブなど)が作成・変更・削除されたときにコールされる */
	public onUserContent: (content: UserContent) => void
		= () => { /* not implemented -> nop */ };
}

interface UserContent {
	type: UserContentType;
}

enum UserContentType {
	/** ノートの作成・削除 */
	Note,
	/** ドライブファイルの作成・削除 */
	Drive,
}

@Injectable()
export class HoniPlugService {
	/** lateinit: configurePlugins()コール後 */
	#plugins: HoniPlug[];

	constructor(
		@Inject(DI.config)
		private config: Config,

		private globalEventService: GlobalEventService,
	) { }

	/** Prepare plugins */
	@bindThis
	public async start(): Promise<void> {
		const result = await this.#configurePlugins();
		if (!result) {
			throw new Error('[HoniPlug] Failed to configure plugins');
		}
	}

	/**
	 * プラグインの準備
	 *
	 * @param procLoadPlugins side-effects:
	 *     - プラグインを読み込む際にコール
	 * @param procInitializePlugins side-effects:
	 *     - 読み込んだプラグインを引数としてコール
	 * @param objConsole side-effects:
	 *     - 失敗時にerrorをコール
	 *
	 * @returns true:成功 | false:失敗
	 */
	async #configurePlugins(
		procLoadPlugins = this.#loadPlugins,
		procInitializePlugins = this.#initializePlugins,
		objConsole: Pick<typeof console, 'error'> = console,
	): Promise<boolean> {
		try {
			// Load plugins
			const loadedPlugins = await procLoadPlugins();
			if (!loadedPlugins) {
				objConsole.error('[HoniPlug] Failed to load plugins');

				return false;
			}

			// Initialize plugins
			const initializeResult = procInitializePlugins(loadedPlugins);
			const readyPlugins = loadedPlugins.filter((_plugin, index) => initializeResult[index]); // 初期化に成功したプラグインのみの配列にする

			this.#plugins = readyPlugins;

			return true;
		} catch (err) {
			objConsole.error(err);

			return false;
		}
	}

	/**
	 * プラグインの読み込み
	 *
	 * @param objConsole side-effects:
	 *     - 失敗時にerrorをコール
	 *
	 * @returns 成功:HoniPlug[] | 失敗:null
	 */
	async #loadPlugins(
		objConsole: Pick<typeof console, 'error'> = console,
	): Promise<HoniPlug[] | null> {
		try {
			const filePaths = await (async (): Promise<string[]> => {
				const directory = await fs.opendir(pluginsDir);

				const filePaths: string[] = [];
				for await (const dirent of directory) {
					if (
						dirent.isFile()
						&& dirent.name.endsWith('.is')
					) {
						filePaths.push(dirent.path);
					}
				}
				return filePaths;
			})();

			const scripts = filePaths.map(async path => {
				const buffer = await fs.readFile(path, 'utf8');
				return buffer.toString();
			});

			// TODO: - parse
			//       - interpret
			//         HoniPlugと接合する (HoniPlugクラスを介してAiScript側のAPIを操作できるようにする)

			return [/* TODO: 読み込んだプラグインと接合したHoniPlugオブジェクト */];
		} catch (err) {
			objConsole.error(err);

			return null;
		}
	}

	/**
	 * 各プラグインの初期化
	 *
	 * 引数で受け取った各プラグインを初期化する
	 *
	 * @param plugins プラグインの配列
	 *
	 * @param procPublishHoniPlugStream side-effects:
	 *     - カリー化して各プラグインに注入
	 * @param objConsole side-effects:
	 *     - 失敗時にerrorをコール
	 *
	 * @returns 引数で受け取ったプラグインを初期化し、その結果で(true:初期化処理成功 | false:初期化処理失敗)へとマッピングした配列
	 */
	#initializePlugins(
		plugins: HoniPlug[],

		procPublishHoniPlugStream = this.globalEventService.publishHoniPlugStream,
		objConsole: Pick<typeof console, 'error'> = console,
	): boolean[] {
		return plugins
			// 各プラグインの初期化処理を実行し、成功したらtrue | 失敗したらfalseにマップする
			.map(plugin => {
				try {
					plugin.onInit(
						{ // apis
							wsPublisher: (data: Parameters<GlobalEventService['publishHoniPlugStream']>[1]) =>
								procPublishHoniPlugStream(plugin.meta.name, data),
						},
					);

					return true;
				} catch (err) {
					objConsole.error(`[HoniPlug] Failed to initialize: ${plugin.meta.name}`);

					return false;
				}
			});
	}
}
