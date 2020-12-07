import { ITranslateRequest, TranslateData } from './models';
const googleTranslate = require('google-translate-api');

export function translate(data: TranslateData): Promise<any> {

	let sequence: Promise<any> = new Promise<any>((resolve) => {
		return resolve(true);
	});
	data.requests.forEach((r: ITranslateRequest) => {
		console.log(`${r.lang}: ${r.path} : ${r.original}`);
		sequence = sequence.then(() => {
			return new Promise((resolve) => {
				console.log(`TRANS: ${r.lang}: ${r.original}`)
				googleTranslate(r.original, { from: r.srcLang, to: r.lang })
					.catch((e) => {
						console.error(e);
						resolve();
					})
					.then((res: any) => {
						console.log(`=> ${res.text}`);
						data.setTranslation(r, res.text);
						setTimeout(() => {
							resolve();
						}, 150)
					});
			});
		});
	});
	return sequence;
}
