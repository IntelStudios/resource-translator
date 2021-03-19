import { resolve } from 'url';
import { ITranslateRequest, TranslateData } from './models';
const googleTranslate = require('google-translate-api');

export function translate(data: TranslateData): Promise<any> {

	let sequence: Promise<any> = new Promise<any>((resolve) => {
		return resolve(true);
	});
	let failed = false;
	data.requests.forEach((r: ITranslateRequest) => {
		console.log(`${r.lang}: ${r.path} : ${r.original}`);
		sequence = sequence.then(() => {
			return new Promise((resolve) => {
				if (failed) {
					console.error('Failed to translate, translations are incomplete');
					resolve();
					return;
				}
				if (!r.original) {
					data.setTranslation(r, '');
					return resolve();
				}
				console.log(`TRANS: ${r.lang}: ${r.original}`)
				googleTranslate(r.original, { from: r.srcLang, to: r.lang })
					.catch((e) => {
						console.error(e);
						failed = true;
						resolve();
					})
					.then((res: any) => {
						console.log(`=> ${res.text}`);
						data.setTranslation(r, res.text);
						setTimeout(() => {
							resolve();
						}, (1 + Math.random()) * 200)
					});
			});
		});
	});
	return sequence;
}
