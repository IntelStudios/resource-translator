import { ITranslateRequest, TranslateData, ITranslationObject, ResxTranslateData } from './models';
import * as fs from 'fs';
import { clone, eachObj, objValue, setObjValue } from './json-util';

const XML = require('pixl-xml');

export class Resx {

	constructor(public workDir: string, private cleanup: boolean) {

	}

	readData(): Promise<TranslateData> {
		return new Promise((resolve) => {
			const files = fs.readdirSync(this.workDir);

			const origFiles = files.filter((file: string) => {
				if (file.match(/^\w+\.resx$/)) {
					return file;
				}
			});

			if (origFiles.length === 0) {
				return resolve(null);
			}
			const result: TranslateData = new ResxTranslateData();
			origFiles.forEach((file: string) => {
				const origFile = `${this.workDir}/${file}`;
				const orig = XML.parse(fs.readFileSync(origFile), { preserveDocumentNode: true, preserveAttributes: true });
				const langFiles = this.getLanguageFiles(file, files);

				langFiles.forEach((langFile: string) => {
					const lang = XML.parse(fs.readFileSync(`${this.workDir}/${langFile}`), { preserveDocumentNode: true, preserveAttributes: true });
					const object: ITranslationObject = { object: lang, file: langFile, isChange: false };
					result.objects.push(object);
					const langKey = langFile.replace('.resx', '').replace(/[^\.]+\./, '');
					orig.root.data.forEach((item: any) => {
						const original = item.value;

						const translation = lang.root.data ? lang.root.data.find((i: any) => i._Attribs.name === item._Attribs.name) : null;
						if (!translation) {
							object.isChange = true;
							result.requests.push({
								srcLang: 'en',
								lang: langKey,
								object: lang,
								path: [item._Attribs.name],
								original: original
							});
						}
						if (this.cleanup && lang.root.data) {
							// cleanup current translation if not present in original one
							const toRemove = [];
							lang.root.data.forEach((item) => {
								const inOrig = orig.root.data.find((i: any) => i._Attribs.name === item._Attribs.name);
								if (!inOrig) {
									toRemove.push(item._Attribs.name);
								}
							});
							if (toRemove.length > 0) {
								object.isChange = true;
								console.log(`${langFile} => Cleaning up ${toRemove.length} translations, as those are no longer present in ${file}`)
								lang.root.data = lang.root.data.filter((i) => toRemove.indexOf(i._Attribs.name) < 0);
							}
						}
					});
				});
			});
			resolve(result);
		});
	}

	writeData(data: TranslateData): Promise<any> {
		return new Promise((resolve) => {
			data.objects.forEach((t: ITranslationObject) => {
				if (t.isChange) {
					console.log(`Writing '${this.workDir}/${t.file}' translation file`);
					fs.writeFileSync(`${this.workDir}/${t.file}`, XML.stringify(t.object, undefined, 0, '  '));
				}
			});
			resolve(null);
		});
	}

	private getLanguageFiles(originalFile: string, files: string[]) {
		const noExt = originalFile.replace('.resx', '');
		return files.filter((file: string) => {
			if (file.startsWith(noExt) && file.endsWith('.resx') && file !== originalFile) {
				return file;
			}
		});
	}

}
