export function nyaize(text: string): string {
	return text
		// ja-JP
		.replace(/な/g, 'にゃ').replace(/ナ/g, 'ニャ').replace(/ﾅ/g, 'ﾆｬ')
		.replace(/(?<=こ)んにち[は|わ]/g, 'にゃにゃちわ').replace(/(?<=コ)ンニチ[ハ|ワ]/g, 'ニャニャチワ').replace(/(?<=ｺ)ﾝﾆﾁ[ﾊ|ﾜ]/g, 'ﾆｬﾆｬﾁﾜ')
		.replace(/ございます/g, 'ごにゃいにゃす').replace(/ゴザイマス/g, 'ゴニャイニャス').replace(/ｺﾞｻﾞｲﾏｽ/g, 'ｺﾞﾆｬｲﾆｬｽ')
		// en-US
		.replace(/(?<=n)a/gi, x => x === 'A' ? 'YA' : 'ya')
		.replace(/(?<=morn)ing/gi, x => x === 'ING' ? 'YAN' : 'yan')
		.replace(/(?<=every)one/gi, x => x === 'ONE' ? 'NYAN' : 'nyan')
		// ko-KR
		.replace(/[나-낳]/g, match => String.fromCharCode(
			match.charCodeAt(0)! + '냐'.charCodeAt(0) - '나'.charCodeAt(0)
		))
		.replace(/(다$)|(다(?=\.))|(다(?= ))|(다(?=!))|(다(?=\?))/gm, '다냥')
		.replace(/(야(?=\?))|(야$)|(야(?= ))/gm, '냥');
}
