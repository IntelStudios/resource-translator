import { Ngx } from './ngx';
import { Resx } from './resx';
import { TranslateData } from './models';
import { translate } from './translator';
const argv = require('yargs').argv

if (!argv.workDir) {
  console.error(`--work-dir option must be specified`)
  process.exit(1);
}

if (!argv.key) {
	console.error(`--key option must be specified (Goolge Translate API Key)`)
	process.exit(1);
}

const key = argv.key;
const cleanup = argv.cleanup !== 'false';
const ngx: Ngx = new Ngx(argv.workDir, argv.srcLang || 'en', cleanup);

ngx.readData()
	.then((data: TranslateData) => {
		if (data) {
			translate(key, data).then(() => {
				ngx.writeData(data);
				console.log('NGX Finished')
			});
		}
	});

const resx: Resx = new Resx(argv.workDir, cleanup);

resx.readData()
	.then((data: TranslateData) => {
		if (data) {
			translate(key, data).then(() => {
				resx.writeData(data);
				console.log('RESX Finished')
			});
		}
	});



