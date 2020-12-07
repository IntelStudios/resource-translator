import { Ngx } from './ngx';
import { Resx } from './resx';
import { TranslateData } from './models';
import { translate } from './translator';
const argv = require('yargs').argv

if (!argv.workDir) {
  console.error(`--work-dir option must be specified`)
  process.exit(1);
}

const ngx: Ngx = new Ngx(argv.workDir, argv.srcLang || 'en');

ngx.readData()
	.then((data: TranslateData) => {
		if (data) {
			translate(data).then(() => {
				ngx.writeData(data);
				console.log('NGX Finished')
			});
		}
	});

const resx: Resx = new Resx(argv.workDir);

resx.readData()
	.then((data: TranslateData) => {
		if (data) {
			translate(data).then(() => {
				resx.writeData(data);
				console.log('RESX Finished')
			});
		}
	});



