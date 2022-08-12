import { ITranslateRequest, TranslateData, ITranslationObject, NgxTranslateData } from './models';
import * as fs from 'fs';
import { clone, eachObj, objValue, removePath } from './json-util';

const defaultOptions = () => {
	return { srcLang: 'en' };
}

export interface NgxOptions {
	workDir: string;
	srcLang: string;
	cleanup: boolean;
	srcKeys: boolean;
}


export class Ngx {

	private opts: NgxOptions;

	constructor(options: NgxOptions) {
		this.opts = {...defaultOptions(), ...options};
	}

	readData(): Promise<TranslateData> {
		const srcFile = `${this.opts.srcLang}.json`;
		return new Promise((resolve) => {
			const files = fs.readdirSync(this.opts.workDir);
			if (files.indexOf(srcFile) < 0) {
				// not an ngx-translate i18n dir
				return resolve(null);
			}
			const result: TranslateData = new NgxTranslateData();

			const srcLang = JSON.parse(fs.readFileSync(`${this.opts.workDir}/${srcFile}`).toString());
			files.forEach((file: string) => {
				if (file !== srcFile) {
					const lang = JSON.parse(fs.readFileSync(`${this.opts.workDir}/${file}`).toString());
					const object: ITranslationObject = { object: lang, file: file, isChange: false };
					result.objects.push(object);
					const langKey = file.replace('.json', '');
					eachObj(srcLang, [], (path, key, value) => {
						const original = value;
						const translation = objValue(lang, [...path, key]);
						// console.log(path, key, original, translation);
						if (!translation) {
							object.isChange = true;
							if (this.opts.srcKeys) {
								result.requests.push({
									srcLang: this.opts.srcLang,
									lang: langKey,
									object: lang,
									path: [...path, `${langKey}|${key}`],
									original: original,
									ignore: true,
								});
							}
							result.requests.push({
								srcLang: this.opts.srcLang,
								lang: langKey,
								object: lang,
								path: [...path, key],
								original: original
							});
						}
					});

					if (this.opts.cleanup) {
						// cleanup current translation if not present in original one
						const toRemove = [];
						eachObj(lang, [], (path, key, value) => {
							const p = [...path, key];
							const inOrig = objValue(srcLang, p);
							if (inOrig == null || inOrig === undefined) {
								toRemove.push(p);
							}
						});
						if (toRemove.length > 0) {
							object.isChange = true;
							console.log(`${file} => Cleaning up ${toRemove.length} translations, as those are no longer present in ${file}`)
							toRemove.forEach((p) => removePath(lang, p));
						}
					}
				}
			});
			resolve(result);
		});
	}

	writeData(data: TranslateData): Promise<any> {
		return new Promise((resolve) => {
			data.objects.forEach((t: ITranslationObject) => {
				if (t.isChange) {
					console.log(`Writing '${this.opts.workDir}/${t.file}' translation file`);
					fs.writeFileSync(`${this.opts.workDir}/${t.file}`, JSON.stringify(t.object, null, 2))
				}
			});
			resolve(null);
		});
	}

}
