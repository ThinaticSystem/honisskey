import { Inject, Injectable } from '@nestjs/common';
import { bindThis } from '@/decorators.js';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { GlobalEventService } from './GlobalEventService';

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
	 */
	public onInit: () => void
		= () => { /* not implemented -> nop */ };

	/**
	 * チャンネル(WebSocket)へ送信する準備が整ったときにコールされる
	 */
	public onWebSocketReady: () => void
		= () => { /* not implemented -> nop */ };

	/////////////////////
	//// Event Hooks ////
	/////////////////////

	/** ユーザー投稿コンテンツ(ノートやドライブなど)が作成・変更・削除されたときにコールされる */
	public onUserContent: (content: UserContent) => void
		= () => { /* not implemented -> nop */ };

	/////////////
	//// API ////
	/////////////

	#sendWS(data: Parameters<GlobalEventService['publishHoniPlugStream']>[1]): void {
		this.#_wsPublisher(data);
	}

	//////////////////
	//// Internal ////
	//////////////////

	#_wsPublisher: (data: Parameters<GlobalEventService['publishHoniPlugStream']>[1]) => void;

	public _setWebSocketPublisher(publisher: (data: Parameters<GlobalEventService['publishHoniPlugStream']>[1]) => void): void {
		this.#_wsPublisher = publisher;
	}
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
	#plugins: HoniPlug[];

	constructor(
		@Inject(DI.config)
		private config: Config,

		private globalEventService: GlobalEventService,
	) { }

	/** Prepare plugins */
	@bindThis
	public start(): void {
		const result = this.#configurePlugins();
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
	#configurePlugins(
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
					plugin._setWebSocketPublisher(
						(data: Parameters<GlobalEventService['publishHoniPlugStream']>[1]) =>
							this.globalEventService.publishHoniPlugStream(plugin.meta.name, data),
					);

					plugin.onInit();

					return true;
				} catch (err) {
					objConsole.error(`[HoniPlug] Failed to initialize: ${plugin.meta.name}`);

					return false;
				}
			});
	}
}
