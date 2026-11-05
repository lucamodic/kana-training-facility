const packageVersion=require('../package.json').version;
const version=packageVersion.split('.').slice(0,2).join('.');
module.exports={packageVersion,version,labelPattern:new RegExp(`id="appVersion">v${version.replace(/\./g,'\\.')}<`),cachePattern:new RegExp(`offline-v${version.split('.')[0]}-`)};
