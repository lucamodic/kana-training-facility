const {defineConfig}=require('@playwright/test');
const fs=require('node:fs');
const localBrowser=['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe'].find(file=>fs.existsSync(file));
module.exports=defineConfig({
  testDir:'./tests/browser',timeout:30000,workers:1,
  use:{baseURL:'http://127.0.0.1:4173',headless:true,serviceWorkers:'block',launchOptions:localBrowser?{executablePath:localBrowser}:{}},
});
