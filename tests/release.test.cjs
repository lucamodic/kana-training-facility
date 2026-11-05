const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {version,labelPattern,cachePattern}=require('./release-info.cjs');
test('every local script and stylesheet uses the release version and is cached offline',()=>{
  const html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('sw.js','utf8');
  const refs=[...html.matchAll(/(?:src|href)="\.\/([^"?]+\.(?:js|css))\?v=([^"?]+)"/g)];
  assert.ok(refs.length>10);
  for(const [,file,v] of refs){assert.equal(v,version,file);assert.ok(sw.includes(`'./${file}?v=${version}'`),file);assert.ok(fs.existsSync(file));}
  assert.match(html,labelPattern);assert.match(sw,cachePattern);
  for(const file of ['romaji.js','study-ui.js'])assert.ok(html.indexOf(file)<html.indexOf('app.js'));
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
});
