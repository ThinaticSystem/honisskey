import { Inject, Injectable } from '@nestjs/common';
import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';

interface UserContent {
	type: UserContentType;
}

enum UserContentType {
	/** ノートの作成・削除 */
	Note,
	/** ドライブファイルの作成・削除 */
	Drive,
}

export abstract class HoniPlug {
	/** プラグインの名前 */
	name: string;

	/**
	 * 初期化処理
	 *
	 * Misskeyの起動時にコールされる
	 */
	onInit: () => void
		= () => { };

	/** ユーザー投稿コンテンツ(ノートやドライブなど)が作成・変更・削除されたときにコールされる */
	onUserContent: (content: UserContent) => void
		= () => { };
}

@Injectable()
export class HoniPlugService {
	#plugins: HoniPlug[];

	constructor(
		@Inject(DI.config)
		private config: Config,
	) { }

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
	@bindThis
	public configurePlugins(
		procLoadPlugins = this.#loadPlugins,
		procInitializePlugins = this.#initializePlugins,
		objConsole: Pick<typeof console, 'error'> = console,
	): boolean {
		try {
			// Load plugins
			const loadedPlugins = procLoadPlugins();
			if (!loadedPlugins) {
				objConsole.error('[HoniPlug] Failed to load plugins');

				return false;
			}

			// Initialize plugins
			const initializeResult = procInitializePlugins(loadedPlugins);
			const readyPlugins = loadedPlugins.filter((_plugin, index) => initializeResult[index]);

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
	#loadPlugins(
		objConsole: Pick<typeof console, 'error'> = console,
	): HoniPlug[] | null {
		try {
			return [/* TODO */];
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
	 * @param objConsole side-effects:
	 *     - 失敗時にerrorをコール
	 *
	 * @returns 引数で受け取ったプラグインを初期化し、その結果で(true:初期化処理成功 | false:初期化処理失敗)へとマッピングした配列
	 */
	#initializePlugins(
		plugins: HoniPlug[],

		objConsole: Pick<typeof console, 'error'> = console,
	): boolean[] {
		return plugins
			.map(plugin => {
				try {
					plugin.onInit();

					return true;
				} catch (err) {
					objConsole.error(`[HoniPlug] Failed to initialize: ${plugin.name}`);

					return false;
				}
			});
	}
}
