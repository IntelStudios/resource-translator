import { ITranslateRequest, TranslateData, ITranslationObject, NgxTranslateData } from './models';
import * as fs from 'fs';
import { clone, eachObj, objValue, setObjValue } from './json-util';


export class Ngx {

	constructor(public workDir: string) {

	}

	readData(): Promise<TranslateData> {
		return new Promise((resolve) => {
			const files = fs.readdirSync(this.workDir);
			if (files.indexOf('en.json') < 0) {
				// not an ngx-translate i18n dir
				return resolve(null);
			}
			const result: TranslateData = new NgxTranslateData();

			const english = JSON.parse(fs.readFileSync(`${this.workDir}/en.json`).toString());
			files.forEach((file: string) => {
				if (file !== 'en.json') {
					const lang = JSON.parse(fs.readFileSync(`${this.workDir}/${file}`).toString());
					const object: ITranslationObject = { object: lang, file: file, isChange: false };
					result.objects.push(object);
					const langKey = file.replace('.json', '');
					eachObj(english, [], (path, key, value) => {
						const original = value;
						const translation = objValue(lang, [...path, key]);
						// console.log(path, key, original, translation);
						if (!translation) {
							object.isChange = true;
							result.requests.push({
								lang: langKey,
								object: lang,
								path: [...path, key],
								original: original
							});
						}
					});
				}
			});
			resolve(result);
		});
	}

	writeData(data: TranslateData): Promise<any> {
		return new Promise((resolve) => {
			data.objects.forEach((t: ITranslationObject) => {
				if (t.isChange) {
					console.log(`Writing '${this.workDir}/${t.file}' translation file`);
					fs.writeFileSync(`${this.workDir}/${t.file}`, JSON.stringify(t.object, null, 2))
				}
			});
			resolve();
		});
	}

}
