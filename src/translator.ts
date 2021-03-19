import { ITranslateRequest, TranslateData } from './models';

const { Translate } = require('@google-cloud/translate').v2;

export function translate(key: string, data: TranslateData): Promise<any> {

	const gTrans = new Translate({ key });

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
				gTrans.translate(r.original, { from: r.srcLang, to: r.lang })
					.catch((e) => {
						console.error(e);
						failed = true;
						resolve();
					})
					.then((res: any) => {
						const trans = res[0];
						console.log(`=> ${trans}`);
						data.setTranslation(r, trans);
						setTimeout(() => {
							resolve();
						}, (1 + Math.random()) * 10)
					});
			});
		});
	});
	return sequence;
}
