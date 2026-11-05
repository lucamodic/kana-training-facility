const {fork,spawn}=require('node:child_process');
const path=require('node:path');
const server=fork(path.join(__dirname,'serve.cjs'),[],{stdio:['ignore','inherit','inherit','ipc']});
let started=false;
server.on('message',message=>{
  if(message!=='ready'||started)return;started=true;
  const cli=path.join(path.dirname(require.resolve('@playwright/test/package.json')),'cli.js');
  const runner=spawn(process.execPath,[cli,'test',...process.argv.slice(2)],{stdio:'inherit'});
  runner.on('exit',code=>{server.kill();process.exitCode=code??1;});
  runner.on('error',error=>{console.error(error);server.kill();process.exitCode=1;});
});
server.on('exit',code=>{if(!started)process.exitCode=code||1;});
process.on('exit',()=>server.kill());
