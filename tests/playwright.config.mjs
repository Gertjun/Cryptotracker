// Testinstellingen: telefoon (iPhone-formaat) en laptop, met een vaste klok zodat koersen en bedragen voorspelbaar zijn.
import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
  testDir:'./specs',timeout:60_000,fullyParallel:true,retries:process.env.CI?1:0,
  reporter:process.env.CI?[['list'],['html',{open:'never'}]]:'list',
  use:{baseURL:'http://localhost:4173',...(process.env.CHROMIUM_PATH?{launchOptions:{executablePath:process.env.CHROMIUM_PATH}}:{})},
  webServer:{command:'node serve.mjs',url:'http://localhost:4173/index.html',reuseExistingServer:true},
  projects:[
    {name:'telefoon',use:{...devices['iPhone 13'],browserName:'chromium',defaultBrowserType:'chromium'}},
    {name:'laptop',use:{viewport:{width:1440,height:900}}},
  ],
});
