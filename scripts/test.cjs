const {readdirSync}=require('node:fs');
const {spawnSync}=require('node:child_process');
const files=readdirSync('tests').filter(file=>file.endsWith('.test.cjs')).map(file=>`tests/${file}`);
const result=spawnSync(process.execPath,['--test',...files],{stdio:'inherit'});
process.exit(result.status??1);
