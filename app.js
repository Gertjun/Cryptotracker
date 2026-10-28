'use strict';
/* ---------- opslag ---------- */
const LS_DATA='cpt.data', LS_SET='cpt.settings', LS_PRICES='cpt.prices', LS_LOCK='cpt.lock', LS_VAULT='cpt.vault', LS_CHARTS='cpt.charts', LS_VCHARTS='cpt.vcharts';
const API='https://api.coingecko.com/api/v3';
const CUR='eur';
const APP_VERSION='3.10.4 (28 okt 2026)';
if(navigator.standalone)document.documentElement.classList.add('ios-standalone');   // oudere iOS kent display-mode: standalone niet
// Versienummer naast de appnaam; is er een nieuwe versie klaar, dan wordt het de knop "update beschikbaar"
let updReady=false;
const appVerHTML=()=>updReady?'<button type="button" class="app-ver upd" data-act="reload" title="Klik om de nieuwe versie te laden">update beschikbaar</button>':`<span class="app-ver">v${APP_VERSION.split(' ')[0]}</span>`;
function load(k,d){try{const v=JSON.parse(localStorage.getItem(k));return v?Object.assign(d,v):d}catch(e){return d}}
let data=load(LS_DATA,{txs:[],deleted:[],updated:0});
let settings=load(LS_SET,{privacy:false,plMode:'total',sort:'value',range:'30',pRange:'30',gh:{token:'',repo:'',path:'crypto-portfolio.enc.json',branch:'main',pass:''}});
let prices=load(LS_PRICES,{});
// weergave: automatisch (volgt het apparaat), donker of licht
const mqLight=window.matchMedia?matchMedia('(prefers-color-scheme: light)'):null;
function applyTheme(){
  const t=settings.theme||'auto',light=t==='light'||(t==='auto'&&!!mqLight?.matches);
  document.documentElement.classList.toggle('light',light);
  document.querySelector('meta[name=theme-color]')?.setAttribute('content',light?'#f3f4f7':'#0b0d12');
}
applyTheme();mqLight?.addEventListener?.('change',applyTheme);
let syncState={s:'off',msg:''},cgState={s:'off',msg:''};
let syncTimer=null;
let lockCfg=(()=>{try{return JSON.parse(localStorage.getItem(LS_LOCK))}catch(e){return null}})();
let DEK=null,dekRaw=null,locked=!!lockCfg,vaultQ=Promise.resolve();

// Met vergrendeling aan staan transacties, koersen en GitHub-gegevens alleen versleuteld in de 'vault'.
function persist(){
  if(lockCfg){
    localStorage.setItem(LS_SET,JSON.stringify({...settings,visit:undefined,gh:{path:settings.gh.path,branch:settings.gh.branch,token:'',repo:'',pass:''}}));
    if(!DEK)return;
    const k=DEK,snap=enc.encode(JSON.stringify({data,gh:settings.gh,prices,visit:settings.visit}));
    vaultQ=vaultQ.then(()=>aesEnc(k,snap)).then(o=>localStorage.setItem(LS_VAULT,JSON.stringify(o))).catch(()=>{});
  }else{
    localStorage.setItem(LS_SET,JSON.stringify(settings));localStorage.setItem(LS_DATA,JSON.stringify(data));localStorage.setItem(LS_PRICES,JSON.stringify(prices));
  }
}
function saveData(sync=true){data.updated=Date.now();persist();if(sync)scheduleSync()}
function saveSettings(){persist()}
function savePrices(){persist()}

/* ---------- helpers ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// kleurhulpjes: kies wit of zwart, afhankelijk van wat het meeste contrast geeft op een achtergrond
function hexRgb(h){h=h.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16))}
function lum(c){const f=x=>{x/=255;return x<=0.03928?x/12.92:((x+0.055)/1.055)**2.4};return 0.2126*f(c[0])+0.7152*f(c[1])+0.0722*f(c[2])}
function bestText(c){const l=lum(c);return 1.05/(l+0.05)>=(l+0.05)/0.05?'#ffffff':'#000000'}
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
function num(s){s=String(s??'').trim().replace(/\s/g,'').replace(/€/g,'');if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'');s=s.replace(',','.');const n=parseFloat(s);return isFinite(n)?n:NaN}
function decFor(v){const a=Math.abs(v);return !a||a>=1?2:Math.min(20,Math.ceil(-Math.log10(a))+3)}
/* ---------- weergave in euro, dollar of bitcoin (wens W13) ---------- */
// Alles blijft in euro opgeslagen en berekend. Alleen de schermen Overzicht, Munt en Transacties tonen (via money())
// de gekozen eenheid; formulieren, rapporten en het jaaroverzicht blijven altijd in euro.
// Dollar: omgerekend tegen de huidige koers. Bitcoin: huidige waarden tegen de bitcoinkoers van nu, maar aankopen,
// verkopen en stortingen tegen de bitcoinkoers van dat moment. Zo laat 'winst' in bitcoin zien of je beter deed dan
// gewoon bitcoin aanhouden. Intern: bedragen op moment t × K(t) = euro-equivalent van de bitcoin van toen, tegen de koers van nu.
let UNIT_ON=false,fx=load('cpt.fx',{});
const unitNow=()=>UNIT_ON&&settings.unit&&settings.unit!=='EUR'&&fx.btcEur>0&&fx.btcUsd>0?settings.unit:'EUR';
function inUnit(fn){const o=UNIT_ON;UNIT_ON=true;try{return fn()}finally{UNIT_ON=o}}
function inEUR(fn){const o=UNIT_ON;UNIT_ON=false;try{return fn()}finally{UNIT_ON=o}}
function btcAt(ts){if(Date.now()-ts<15*6e4)return fx.btcEur;return priceAt('bitcoin',ts)??priceEst('bitcoin',ts)??fx.btcEur}
// 7/30-dagenverandering; in bitcoin-weergave ten opzichte van bitcoin over dezelfde periode
function chP(ch,days){if(ch==null||unitNow()!=='BTC')return ch??null;const b0=btcAt(Date.now()-days*864e5);return b0>0&&fx.btcEur?((1+ch/100)/(fx.btcEur/b0)-1)*100:null}
function K(ts){if(unitNow()!=='BTC')return 1;const b=btcAt(ts);return b>0?fx.btcEur/b:1}
const atT=(v,t)=>v==null?v:v*K(typeof t==='number'?t:txTime(t));
const chU=ch=>ch==null||unitNow()!=='BTC'||fx.btcCh24==null?ch:((1+ch/100)/(1+fx.btcCh24/100)-1)*100;   // 24-uursverandering t.o.v. bitcoin
function money(v,d){if(v==null||!isFinite(v))return '–';const u=unitNow();
  if(u==='BTC'){v=v/fx.btcEur;if(Math.abs(v)<1e-13)v=0;const a=Math.abs(v),dd=d!=null&&d<=2?8:a>=1?4:Math.min(12,Math.max(4,decFor(v)));
    return (v<0?'-':'')+'₿ '+new Intl.NumberFormat('nl-NL',{minimumFractionDigits:Math.min(2,dd),maximumFractionDigits:dd}).format(a)}
  if(u==='USD')v=v*fx.btcUsd/fx.btcEur;
  if(Math.abs(v)<1e-9)v=0;d=d??decFor(v);return new Intl.NumberFormat('nl-NL',{style:'currency',currency:u==='USD'?'USD':'EUR',currencyDisplay:'narrowSymbol',minimumFractionDigits:Math.min(2,d),maximumFractionDigits:d}).format(v)}
function signed(v,d){if(v==null||!isFinite(v))return '–';d=d??2;if(Math.abs(v)<0.5*10**-d)v=0;return (v>=0?'+':'−')+money(Math.abs(v),d)}
function pct(p){if(p==null||!isFinite(p))return '–';if(Math.abs(p)<0.005)p=0;return (p>=0?'+':'−')+Math.abs(p).toFixed(2).replace('.',',')+'%'}
function qtyf(q){return new Intl.NumberFormat('nl-NL',{maximumFractionDigits:20}).format(+(+q).toPrecision(15))}
function plainNum(v){if(v==null||!isFinite(v))return '';return new Intl.NumberFormat('en-US',{maximumFractionDigits:20,useGrouping:false}).format(+(+v).toPrecision(15)).replace('.',',')}
// ingevoerde koers per munt: precies zoals ingevoerd tonen, met minimaal 2 decimalen
// Koers tonen: exact als het getal kort is (≤ 6 significante cijfers, zoals je het zelf intypt),
// anders afgerond (≥ € 1: 2 decimalen, < € 1: 4 significante cijfers) met ≈ ervoor. Opgeslagen waarde blijft exact.
function priceR(v){const a=Math.abs(v),d=(plainNum(v).split(',')[1]||'').length;
  const sig6=a>=1?Math.max(0,6-String(Math.floor(a)).length):Math.ceil(-Math.log10(a))+5;
  if(d<=Math.max(2,sig6))return {s:money(v,Math.max(2,Math.min(20,d))),r:false};
  return {s:money(v,decFor(v)),r:true}}
function priceF(v){if(v==null||!isFinite(v))return '–';if(unitNow()!=='EUR')return money(v);const o=priceR(v);return (o.r?'≈ ':'')+o.s}
function priceH(v){if(v==null||!isFinite(v))return '–';if(unitNow()!=='EUR')return money(v);const o=priceR(v);return o.r?`<span class="approx" title="Exacte koers: € ${plainNum(v)}"><span class="muted">≈ </span>${o.s}</span>`:`<span class="nowrap">${o.s}</span>`}
const cls=v=>v==null||!isFinite(v)||Math.abs(v)<1e-9?'flat':v>0?'up':'down';
function fmtDate(s){const d=new Date(s);if(isNaN(d))return s;return d.toLocaleDateString('nl-NL',{day:'numeric',month:'short',year:'numeric'})+(s.length>10?' · '+d.toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'}):'')}
function nowLocal(){const d=new Date();return new Date(d-d.getTimezoneOffset()*60000).toISOString().slice(0,16)}
function toast(msg){const t=$('#toast'),host=[...document.querySelectorAll('dialog[open]')].pop()||document.body;if(t.parentNode!==host)host.appendChild(t);t.textContent='';setTimeout(()=>{t.textContent=msg},40);   // even leegmaken, zodat een schermlezer ook een herhaalde melding voorleest
  t.classList.add('show');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('show'),2600)}
function coinIcon(m,size){const img=prices[m.coinId]?.image||m.image;return img?`<img class="coin-img" src="${esc(img)}" alt="" width="${size||36}" height="${size||36}" loading="lazy" decoding="async"${size?` style="width:${size}px;height:${size}px"`:''}>`:`<div class="coin-ph">${esc((m.symbol||'?').slice(0,3).toUpperCase())}</div>`}
const ICONS={
  eye:'<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  eyeOff:'<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18M10.6 5.1A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.8 8.3 2 12 2 12s3.5 7 10 7c1.7 0 3.2-.5 4.5-1.2M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
  gear:'<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  home:'<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
  list:'<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"/></svg>',
  reps:'<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  plus:'<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  lock:'<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
  key:'<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4"/><path d="M10.8 12.2L20 3M16 7l3 3M18 5l2 2"/></svg>',
  back:'<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>'
};

/* ---------- berekeningen (FIFO per transactie) ---------- */
/* ---------- meerdere portefeuilles (wens W14) ---------- */
// Alles blijft in één (versleuteld) bestand. Transacties, doelen en vaste-inlegplannen hebben een label 'pf'
// (zonder label = 'main', je eerste portefeuille). TX() geeft de transacties van de gekozen portefeuille, of van
// alles samen. Volglijst, prijsalerts, instellingen en het koersarchief zijn gedeeld.
const pfOf=x=>x.pf||'main';
const pfOthers=()=>live(data.portfolios).filter(p=>p.id!=='main');
const multiPf=()=>pfOthers().length>0;
function pfList(){const m=(data.portfolios||[]).find(p=>p.id==='main');return [{id:'main',name:m?.name||'Mijn portefeuille'},...pfOthers()]}
function curPf(){const p=settings.pf||'main';if(p==='__all')return multiPf()?p:'main';return p==='main'||pfOthers().some(x=>x.id===p)?p:'main'}
const pfName=id=>id==='__all'?'Alles samen':(pfList().find(p=>p.id===id)?.name||'Mijn portefeuille');
const pfMatch=x=>curPf()==='__all'||pfOf(x)===curPf();
const pfNew=()=>curPf()==='__all'?'main':curPf();   // nieuw item zonder keuze: in de huidige portefeuille
let _tx={k:'',src:null,v:[]};
function TX(){const pf=curPf();if(pf==='__all'||!multiPf())return data.txs;const k=pf+'|'+data.txs.length+'|'+data.updated;
  if(_tx.k!==k||_tx.src!==data.txs)_tx={k,src:data.txs,v:data.txs.filter(t=>pfOf(t)===pf)};return _tx.v}
function withPf(id,fn){const o=settings.pf;settings.pf=id;try{return fn()}finally{settings.pf=o}}
function pfStats(id){return withPf(id,()=>{const n=TX().length;if(!n)return{n,v:null};const v=visitNow();return{n,v:v.missing?null:v.total}})}
function pfBarHTML(){if(!multiPf())return '';
  return `<div class="pf-bar"><button type="button" class="pf-btn" data-act="pfpick" aria-haspopup="dialog"><span class="label">Portefeuille</span> <b>${esc(pfName(curPf()))}</b> <span aria-hidden="true">▾</span></button></div>`}
function openPfPick(){
  const opts=[...pfList().map(p=>p.id),'__all'];
  openSheet(`<h2 class="h3">Portefeuille kiezen</h2><ul class="pf-list">${inUnit(()=>opts.map(id=>{const st=pfStats(id),on=curPf()===id;
    return `<li><button type="button" class="pf-opt${on?' on':''}" data-act="pfset" data-id="${esc(id)}" aria-pressed="${on}"><span><b>${esc(pfName(id))}</b><span class="label note-sm">${st.n} ${st.n===1?'transactie':'transacties'}</span></span><span class="num m">${st.n?(st.v==null?'…':money(st.v)):''}</span></button></li>`}).join(''))}</ul>
  <button type="button" class="btn sec" data-act="pfmanage">Portefeuilles beheren</button>`);
}
function setPf(id){
  if(id!=='__all'&&id!=='main'&&!pfOthers().some(p=>p.id===id))id='main';
  if(curPf()===id)return;saveVisit();settings.pf=id;saveSettings();
  txf={q:'',type:'all',coin:'all',year:'all',acct:'all'};lastView=null;prevVisit=getVisit(id)?{...getVisit(id)}:null;sinceDismissed=false;
  if(/^#coin\//.test(location.hash))location.hash='';render();
}
function pfSettingsHTML(){
  return `<div class="section-t">Portefeuilles</div>
  <p class="mt-0 hint">Houd aparte portefeuilles bij, bijvoorbeeld voor je partner of een zakelijke rekening. Elke portefeuille heeft eigen transacties, cash, doelen, plannen en rapporten. Volglijst en prijsalerts gelden voor alle portefeuilles.</p>
  <ul class="pf-list">${pfList().map(p=>`<li class="pf-row"><b>${esc(p.name)}</b><button type="button" class="link" data-act="pfedit" data-id="${esc(p.id)}">Wijzig<span class="sr-only"> ${esc(p.name)}</span></button></li>`).join('')}</ul>
  <button type="button" class="btn sec" data-act="pfedit" data-id="">+ Portefeuille toevoegen</button>`}
function openPfEdit(id){
  const p=id?pfList().find(x=>x.id===id):null;
  openSheet(`<h2 class="h3">${p?'Portefeuille wijzigen':'Nieuwe portefeuille'}</h2><form class="js-form" novalidate>
  <div class="field"><label for="pf_name">Naam</label><input type="text" id="pf_name" value="${esc(p?.name||'')}" placeholder="bijv. Partner" maxlength="40"></div>
  <button type="submit" class="btn" data-act="pfsave" data-id="${esc(p?.id||'')}">Opslaan</button><button type="button" class="btn sec" data-act="settings">Annuleren</button></form>
  ${p&&p.id!=='main'?`<button type="button" class="btn danger" data-act="pfdel" data-id="${esc(p.id)}">Portefeuille verwijderen</button>`:''}`);
  $('#pf_name').focus();
}
function savePf(id){
  const name=$('#pf_name').value.trim();if(!name)return fieldErr('pf_name','Vul een naam in');
  if(pfList().some(p=>p.id!==id&&p.name.toLowerCase()===name.toLowerCase()))return fieldErr('pf_name','Die naam bestaat al');
  const L=data.portfolios||(data.portfolios=[]),now=Date.now();let e=id&&L.find(x=>x.id===id);
  if(e)Object.assign(e,{name,mod:now});else if(id==='main')L.push({id:'main',name,mod:now});
  else{e={id:uid(),name,mod:now};L.push(e);saveData();toast('Portefeuille “'+name+'” gemaakt');closeSheet();setPf(e.id);return}
  saveData();render();toast('Opgeslagen');openSettings();
}
function delPf(id){
  const p=pfOthers().find(x=>x.id===id);if(!p)return;const tx=data.txs.filter(t=>pfOf(t)===id);
  if(!confirm(`Portefeuille “${p.name}” verwijderen?${tx.length?` De ${tx.length} ${tx.length===1?'transactie':'transacties'} erin worden ook verwijderd, op al je apparaten.`:''}`))return;
  const now=Date.now(),ids=new Set(tx.map(t=>t.id));data.txs=data.txs.filter(t=>!ids.has(t.id));data.deleted.push(...ids);
  for(const k of ['goals','plans','allocs'])for(const x of data[k]||[])if(pfOf(x)===id&&!x.del){x.del=true;x.mod=now}
  p.del=true;p.mod=now;if(settings.pf===id){settings.pf='main';saveSettings();prevVisit=getVisit('main')?{...getVisit('main')}:null}
  saveData();lastView=null;render();toast('Portefeuille verwijderd');openSettings();
}
function coinIds(){return [...new Set(TX().filter(t=>t.coinId).map(t=>t.coinId))]}
// Volglijst en prijsalerts: lijsten met 'del'-markering, zodat verwijderen ook via sync naar andere apparaten gaat
const live=a=>(a||[]).filter(x=>!x.del);
// nieuwste wijziging wint; bij precies hetzelfde tijdstip wint verwijderen (anders kan iets dat weg is terugkomen)
function mergeList(a,b){const m=new Map();for(const x of [...(a||[]),...(b||[])]){const e=m.get(x.id);if(!e||(x.mod||0)>(e.mod||0)||((x.mod||0)===(e.mod||0)&&x.del&&!e.del))m.set(x.id,x)}return[...m.values()]}
const isWatched=id=>live(data.watch).some(w=>w.id===id);
const watchOnly=()=>{const held=new Set(coinIds().filter(id=>computeCoin(id).qty>1e-12));return live(data.watch).filter(w=>!held.has(w.id))};   // munten die je al hebt staan al bij Bezittingen
function priceIds(){return [...new Set([...coinIds(),...live(data.watch).map(w=>w.id),...live(data.alerts).filter(a=>!a.hit).map(a=>a.coinId)])]}
// Totaal = aantal × koers + kosten (verkoop: − kosten). Ontvangen/overboeking kosten geen euro's.
const txTotal=t=>t.type==='receive'||t.type==='transfer'?0:t.qty*t.price+(t.type==='sell'?-1:1)*(t.fee||0);
const isIn=t=>t.type==='buy'||t.type==='receive';   // voegt munten toe met een aankoopprijs (ontvangen = € 0)
const isOther=t=>t==='receive'||t==='transfer';
function totalF(t){if(isOther(t.type))return '–';const v=txTotal(t),off=unitNow()==='EUR'&&Math.abs(v*100-Math.round(v*100))>1e-6;
  return (off?`<span class="warn-mark" title="Geen hele centen (${plainNum(v)}): controleer aantal, betaald bedrag en kosten met je afschrift">≈ </span>`:'')+money(atT(v,t),2)}
const isCash=t=>t==='deposit'||t==='withdraw';
const TYPE_L={buy:'Koop',sell:'Verkoop',deposit:'Storting',withdraw:'Opname',receive:'Ontvangen',transfer:'Overboeking'};
const hasCashTx=()=>TX().some(t=>isCash(t.type));
// Effect van een transactie op je cash en op 'netto gestort' (stortingen − opnames)
// 'Alles samen': in een portefeuille zonder cash-transacties telt een aankoop als inleg (en een verkoop als opname),
// net zoals die portefeuille los wordt getoond; anders zou zijn aankoop de cash van een andere portefeuille verlagen.
let _cp={k:'',src:null,v:null};
function noCashPf(x){if(curPf()!=='__all')return false;const k=data.txs.length+'|'+data.updated;
  if(_cp.k!==k||_cp.src!==data.txs){const s=new Set();data.txs.forEach(t=>{if(isCash(t.type))s.add(pfOf(t))});_cp={k,src:data.txs,v:s}}return !_cp.v.has(pfOf(x))}
function cashEffect(x){const f=x.fee||0;
  if((x.type==='buy'||x.type==='sell')&&noCashPf(x))return[0,x.type==='buy'?txTotal(x):-txTotal(x)];
  if(x.type==='deposit')return[x.amount-f,x.amount];
  if(x.type==='withdraw')return[-(x.amount+f),-x.amount];
  if(x.type==='buy')return[-(x.qty*x.price+f),0];
  if(isOther(x.type))return[0,0];
  return[x.qty*x.price-f,0];
}
function computeCoin(coinId){
  const txs=TX().filter(t=>t.coinId===coinId).sort((a,b)=>a.date.localeCompare(b.date)||(a.created||0)-(b.created||0));
  const last=txs[txs.length-1]||{};
  const w=live(data.watch).find(x=>x.id===coinId)||live(data.alerts).find(x=>x.coinId===coinId)||{};
  const meta={coinId,name:last.name||w.name,symbol:last.symbol||w.symbol,image:last.image||w.image};
  const lots=[],sellInfo={};let realized=0,totalBought=0;
  for(const t of txs){
    const fee=t.fee||0;
    if(isIn(t)){const pr=t.price||0,k=K(txTime(t)),unit=(t.qty*pr+fee)/t.qty*k;lots.push({tx:t,remaining:t.qty,unit});totalBought+=(t.qty*pr+fee)*k}
    else if(t.type==='transfer'){   // overboeking: alleen de netwerkkosten (in munten) verdwijnen uit je bezit
      let left=t.feeQty||0,cost=0;
      for(const l of lots){if(left<=1e-12)break;const take=Math.min(l.remaining,left);l.remaining-=take;left-=take;cost+=take*l.unit;if(l.remaining<1e-12)l.remaining=0}
      realized-=cost;sellInfo[t.id]={pl:cost?-cost:null,cost,pct:null,transfer:true};
    }
    else{
      let left=t.qty,cost=0;
      for(const l of lots){if(left<=1e-12)break;const take=Math.min(l.remaining,left);l.remaining-=take;left-=take;cost+=take*l.unit;if(l.remaining<1e-12)l.remaining=0}
      const matched=t.qty-left;
      const proceeds=(matched*t.price-fee*(t.qty?matched/t.qty:1))*K(txTime(t));
      const pl=proceeds-cost;realized+=pl;
      sellInfo[t.id]={pl,cost,pct:cost>0?(proceeds/cost-1)*100:null,oversold:left>1e-12};
    }
  }
  const lotMap={};lots.forEach(l=>lotMap[l.tx.id]=l);
  const qty=lots.reduce((s,l)=>s+l.remaining,0);
  const cost=lots.reduce((s,l)=>s+l.remaining*l.unit,0);
  const P=prices[coinId];const price=P?.price;
  const value=price!=null?qty*price:null;
  const unreal=value!=null?value-cost:null;
  return{coinId,meta,txs,lotMap,sellInfo,qty,cost,avg:qty>1e-12?cost/qty:null,price,ch24:chU(P?.ch24),ch7:chP(P?.m?.ch7,7),ch30:chP(P?.m?.ch30,30),value,unreal,unrealPct:cost>0&&unreal!=null?unreal/cost*100:null,realized,totalBought};
}
/* ---------- brokers en wallets ---------- */
const accounts=()=>[...new Set(TX().flatMap(t=>[t.acct,t.to]).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
// Bezit en cash per broker/wallet. Overboeking: 'aantal' gaat eruit bij Van, (aantal − netwerkkosten) komt binnen bij Naar.
function acctSummary(){
  const m={},A=n=>m[n||'']||(m[n||'']={name:n||'',coins:{},cash:0,hasCash:false});
  for(const t of TX()){
    const a=A(t.acct);
    if(isCash(t.type)){a.hasCash=true;a.cash+=cashEffect(t)[0];continue}
    if(t.type==='transfer'){a.coins[t.coinId]=(a.coins[t.coinId]||0)-t.qty;const b=A(t.to);b.coins[t.coinId]=(b.coins[t.coinId]||0)+t.qty-(t.feeQty||0);continue}
    a.coins[t.coinId]=(a.coins[t.coinId]||0)+(isIn(t)?t.qty:-t.qty);
    a.cash+=cashEffect(t)[0];
  }
  return Object.values(m).map(a=>{let v=0,miss=false;const coins=Object.entries(a.coins).filter(([,q])=>Math.abs(q)>1e-12).map(([id,q])=>{const pr=prices[id]?.price;if(pr==null)miss=true;else v+=q*pr;const c=data.txs.find(t=>t.coinId===id)||{};return{id,qty:q,value:pr!=null?q*pr:null,name:c.name,symbol:c.symbol,image:c.image}}).sort((x,y)=>(y.value??0)-(x.value??0));
    const cash=Math.round(a.cash*1e8)/1e8;return{...a,coins,crypto:v,cash,total:v+cash,miss}}).filter(a=>a.coins.length||Math.abs(a.cash)>0.005||a.hasCash).sort((x,y)=>y.total-x.total);
}
// eenmalig: als je de broker als notitie had ingevuld, wordt dat de broker/wallet van de transactie
function migrateAccounts(){
  const known=['Bitvavo','eToro','Coinbase','Binance','Kraken','Bybit','Bitpanda','Bitstamp','Crypto.com','OKX','Ledger','Trezor','MetaMask'];let ch=false;
  for(const t of data.txs){if(t.acct)continue;const k=known.find(n=>n.toLowerCase()===(t.note||'').trim().toLowerCase());if(k){t.acct=k;t.note='';t.mod=Date.now();ch=true}}
  if(ch)saveData();
}
function portfolio(){
  const coins=coinIds().map(computeCoin);
  const open=coins.filter(c=>c.qty>1e-12),closed=coins.filter(c=>c.qty<=1e-12);
  let value=0,cost=0,ch=0,missing=false,realized=0;
  for(const c of coins){realized+=c.realized}
  for(const c of open){cost+=c.cost;if(c.value==null){missing=true;continue}value+=c.value;if(c.ch24!=null)ch+=c.value-c.value/(1+c.ch24/100)}
  const unreal=value-cost;
  const hasCash=hasCashTx();let cash=0,dep=0;
  if(hasCash)for(const x of TX()){const [c,d]=cashEffect(x);cash+=c;dep+=d*K(txTime(x))}
  cash=Math.round(cash*1e8)/1e8;dep=Math.round(dep*1e8)/1e8;   // rekenruis (0,000000000009) wegwerken
  const total=value+cash,ret=total-dep;
  return{open,closed,value,cost,unreal,unrealPct:cost>0?unreal/cost*100:null,ch24:ch,ch24Pct:value-ch>0?ch/(value-ch)*100:null,realized,missing,
    hasCash,cash,dep,total,ret,retPct:dep>0?ret/dep*100:null};
}

/* ---------- koersen ---------- */
// Alle CoinGecko-verzoeken gaan via één wachtrij (max. 2 tegelijk). Bij een weigering (429, of een
// geblokkeerd antwoord zonder CORS-header) wacht de app en probeert het automatisch opnieuw.
let cgActive=0;const cgWait=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
// fetch met tijdslimiet: bij slecht of geen netwerk krijg je binnen enkele seconden een melding in plaats van na een minuut
function fetchT(url,opt={},ms=12000){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);
  return fetch(url,{...opt,signal:c.signal}).catch(e=>{throw new Error(navigator.onLine?'Geen antwoord (verbinding te traag)':'Geen internetverbinding')}).finally(()=>clearTimeout(t))}
// Alle CoinGecko-verzoeken gaan via deze wachtrij: hooguit 2 tegelijk, met een vaste tussenpoos tussen de starts
// en een 'emmer' die zich vanzelf bijvult volgens de limieten van CoinGecko: zonder sleutel 6 verzoeken direct en daarna
// 15 per minuut, met een gratis Demo-sleutel 10 direct en daarna 30 per minuut:
// een paar verzoeken bij het openen gaan direct, een lange reeks wordt rustig gespreid. Bij 'te veel verzoeken' (429)
// pauzeert de hele wachtrij zo lang als CoinGecko vraagt, in plaats van dat elk verzoek los opnieuw probeert.
const mono=()=>performance.now();   // monotone klok voor wachttijden (verandert niet als de systeemtijd verspringt)
let cgTok=6,cgTokAt=mono(),cgPauseUntil=0;
const cgKeyed=()=>!!(data.cfg?.cgKey||'').trim(),cgFast=()=>globalThis.__cgFast===true,   // __cgFast: alleen voor de automatische tests (nep-CoinGecko kent geen limiet)
  cgRate=()=>cgFast()?50:cgKeyed()?0.5:0.25,cgCap=()=>cgFast()?50:cgKeyed()?10:6;   // verzoeken per seconde, emmergrootte
function cgTake(){const now=mono();cgTok=Math.min(cgCap(),cgTok+(now-cgTokAt)/1000*cgRate());cgTokAt=now;
  if(cgTok>=1){cgTok--;return 0}const w=(1-cgTok)/cgRate()*1000;cgTok--;return w}
// low=true: achtergrondwerk (koersarchief aanvullen) wacht tot er geen gewone verzoeken meer openstaan
let cgHigh=0;
async function cg(path,low){
  if(low){while(cgHigh>0)await sleep(400)}else cgHigh++;
  try{return await cg0(path)}finally{if(!low)cgHigh--}}
async function cg0(path){
  while(cgActive>=2)await new Promise(r=>cgWait.push(r));
  cgActive++;
  try{
    const key=(data.cfg?.cgKey||'').trim();
    const url=API+path+(key?(path.includes('?')?'&':'?')+'x_cg_demo_api_key='+encodeURIComponent(key):'');
    for(let i=0;;i++){
      let r=null;
      if(!navigator.onLine)throw new Error('Geen internetverbinding');
      const pz=cgPauseUntil-mono();if(pz>0)await sleep(pz);
      const w=cgTake();if(w>0)await sleep(w);
      try{r=await fetchT(url)}catch(e){if(!navigator.onLine||i>=2)throw new Error(navigator.onLine?'Geen antwoord van CoinGecko (verbinding of te veel verzoeken)':'Geen internetverbinding')}
      if(r&&r.status===429){const ra=+r.headers.get('retry-after');cgPauseUntil=Math.max(cgPauseUntil,mono()+(ra>0?Math.min(ra,120)*1000:(i?30000:15000)))}
      if(r&&(r.status!==429||i>=2))return r;
      if(!r)await sleep([4000,10000][i]);
    }
  }finally{cgActive--;const n=cgWait.shift();if(n)n()}
}
const BUSY='CoinGecko is even druk; de app probeert het zo opnieuw';

let priceBusy=false;
async function refreshFx(){   // bitcoinkoers in euro en dollar (alleen nodig als je niet in euro kijkt)
  if(!settings.unit||settings.unit==='EUR'||locked)return;
  try{const r=await cg('/simple/price?ids=bitcoin&vs_currencies=eur,usd&include_24hr_change=true');if(!r.ok)return;const j=await r.json();
    if(j.bitcoin?.eur>0&&j.bitcoin?.usd>0){fx={btcEur:j.bitcoin.eur,btcUsd:j.bitcoin.usd,btcCh24:j.bitcoin.eur_24h_change??null,ts:Date.now()};try{localStorage.setItem('cpt.fx',JSON.stringify(fx))}catch(e){}}}catch(e){}}
async function ensureBtcHist(){   // bitcoinkoersen van vroeger, voor de weergave in bitcoin
  if(settings.unit!=='BTC'||locked)return;const h=data.hist?.bitcoin,first=Math.min(...data.txs.map(txTime).filter(isFinite));
  const have=h?Object.keys(h).length:0;if(have>=300||(have&&first>=Date.now()-have*DAY))return;
  try{await fetchChart('bitcoin','365')}catch(e){}}
// Valuta wisselen vanaf het Overzicht: tik op het valutateken bij de totale waarde
const UNITS=[['EUR','Euro','€'],['USD','Dollar','$'],['BTC','Bitcoin','₿']];
function heroValHTML(v){const u=unitNow(),[,name,sym]=UNITS.find(x=>x[0]===u)||UNITS[0],s=money(v,2),num=s.replace(sym,'').replace(/^[\s\u00a0]+/,'');
  return `<button type="button" class="unit-btn" data-act="unitmenu" popovertarget="unitMenu" aria-haspopup="menu" aria-label="Valuta: ${name}. Wijzigen">${sym}<span class="unit-caret" aria-hidden="true">▾</span></button> <span class="m">${num}</span>`}
function unitMenuHTML(){const u=settings.unit||'EUR';
  return `<div id="unitMenu" class="unit-menu" popover role="menu" aria-label="Bedragen tonen in">${UNITS.map(([k,n,sy])=>`<button type="button" role="menuitemradio" aria-checked="${u===k}" data-unit="${k}" class="${u===k?'on':''}"><span class="unit-sym" aria-hidden="true">${sy}</span>${n}</button>`).join('')}</div>`}
const hasPopover=typeof HTMLElement!=='undefined'&&HTMLElement.prototype.hasOwnProperty('popover');
// De knop wordt bij het bewegen over de grafiek opnieuw getekend: zoek hem dus pas op bij het openen
function placeUnitMenu(){const m=$('#unitMenu');if(!m)return;
  m.addEventListener('toggle',e=>{const b=$('#heroVal .unit-btn');if(e.newState!=='open'||!b)return;const r=b.getBoundingClientRect(),w=m.offsetWidth;
    m.style.top=Math.round(r.bottom+6)+'px';m.style.left=Math.round(Math.max(8,Math.min(innerWidth-w-8,r.left+r.width/2-w/2)))+'px';
    (m.querySelector('[aria-checked=true]')||m.querySelector('button'))?.focus()})}
async function setUnit(u,btn){settings.unit=u;saveSettings();document.querySelectorAll('[data-unit]').forEach(b=>b.classList.toggle('on',b.dataset.unit===u));
  if(u!=='EUR'){toast('Koers ophalen…');await refreshFx();if(u==='BTC')await ensureBtcHist();if(!(fx.btcEur>0)){toast('Koers niet beschikbaar; bedragen blijven in euro tot de koers binnen is')}}
  const fromMenu=!!btn?.closest?.('#unitMenu');try{$('#unitMenu')?.hidePopover?.()}catch(e){}
  render();if(fromMenu)$('.unit-btn')?.focus();toast(u==='EUR'?'Bedragen in euro':u==='USD'?'Bedragen in dollar':'Bedragen in bitcoin')}
async function refreshPrices(force){
  const ids=priceIds();if(locked||!ids.length||priceBusy)return;
  priceBusy=true;cgState={s:'busy',msg:''};updBadges();
  try{
    const r=await cg(`/coins/markets?vs_currency=${CUR}&ids=${encodeURIComponent(ids.join(','))}&per_page=250&price_change_percentage=24h,7d,30d`);
    if(!r.ok)throw new Error(r.status===429?BUSY:r.status===401?'CoinGecko-sleutel ongeldig':'Koersen ophalen mislukt ('+r.status+')');
    const arr=await r.json();if(locked)return;
    // koers + marktinformatie (zelfde aanvraag, dus geen extra verzoeken)
    for(const c of arr)prices[c.id]={price:c.current_price,ch24:c.price_change_percentage_24h,image:c.image,ts:Date.now(),
      m:{ch7:c.price_change_percentage_7d_in_currency,ch30:c.price_change_percentage_30d_in_currency,cap:c.market_cap,rank:c.market_cap_rank,vol:c.total_volume,
         hi:c.high_24h,lo:c.low_24h,ath:c.ath,athPct:c.ath_change_percentage,athDate:c.ath_date,atl:c.atl,atlDate:c.atl_date,circ:c.circulating_supply,max:c.max_supply}};
    cgState={s:'ok',msg:''};savePrices();checkAlerts();await refreshFx();render();saveVisit();
  }catch(e){cgState={s:'err',msg:e.message||'Geen verbinding'};updBadges();if(force)toast(e.message||'Geen verbinding')}
  finally{priceBusy=false}
}
async function fetchPrice(id){
  try{const r=await cg(`/simple/price?ids=${encodeURIComponent(id)}&vs_currencies=${CUR}&include_24hr_change=true`);const j=await r.json();if(j[id]){prices[id]=Object.assign(prices[id]||{},{price:j[id][CUR],ch24:j[id][CUR+'_24h_change'],ts:Date.now()});savePrices();return j[id][CUR]}}catch(e){}
  return null;
}
// Koersgeschiedenis wordt bewaard (versleuteld als de app-vergrendeling aan staat) en pas opnieuw
// opgehaald als hij verouderd is: 24U na 5 min, 1W na 15 min, 1M na 1 uur, langer na 6 uur.
let chartCache=lockCfg?{}:load(LS_CHARTS,{});
// Hoe lang een opgehaalde grafiek vers blijft (korter bij korte periodes, waar de laatste koersen er meer toe doen)
const chartTtl=d=>d==='1'?5*6e4:d==='7'?30*6e4:d==='30'?3*3600e3:12*3600e3;
function thin(pts,max=500){
  const step=Math.max(1,Math.ceil(pts.length/max)),out=[];
  for(let i=0;i<pts.length;i+=step)out.push(pts[i]);
  if(pts.length&&out[out.length-1]!==pts[pts.length-1])out.push(pts[pts.length-1]);
  return out.map(([t,v])=>[Math.round(t/6e4)*6e4,+(+v).toPrecision(7)]);
}
let chartSaveT=null;
function saveCharts(){clearTimeout(chartSaveT);chartSaveT=setTimeout(()=>{
  const now=Date.now();for(const k in chartCache)if(now-chartCache[k].ts>7*864e5)delete chartCache[k];
  try{
    if(lockCfg){if(!DEK)return;const k=DEK,snap=enc.encode(JSON.stringify(chartCache));
      vaultQ=vaultQ.then(()=>aesEnc(k,snap)).then(o=>localStorage.setItem(LS_VCHARTS,JSON.stringify(o))).catch(()=>{})}
    else localStorage.setItem(LS_CHARTS,JSON.stringify(chartCache));
  }catch(e){/* opslag vol: cache blijft alleen in het geheugen */}
},1500)}
// Eigen koersarchief: per munt één koers per dag (zo dicht mogelijk bij 00:00 UTC), voorgoed bewaard
// in data.hist en dus ook versleuteld gesynchroniseerd. Zo reikt 'Max' na verloop van tijd verder dan
// de 365 dagen die de gratis CoinGecko-API teruggeeft.
const DAY=864e5;
let histT=null;
function histDirty(){clearTimeout(histT);histT=setTimeout(()=>{if(!locked)saveData()},3000)}
function addHist(id,pts){
  if(!pts?.length)return;
  const h=((data.hist||(data.hist={}))[id])||(data.hist[id]={});let ch=false;
  for(const [t,v] of pts){
    if(!(v>0))continue;
    const d=Math.floor(t/DAY),e=h[d];
    if(!e||t-d*DAY<e[0]-d*DAY){h[d]=[Math.round(t/6e4)*6e4,+(+v).toPrecision(7)];ch=true}
  }
  if(ch)histDirty();
}
function withHist(id,pts){   // archiefpunten toevoegen vóór het begin van de opgehaalde reeks
  const h=data.hist?.[id];if(!h)return pts;
  const start=pts.length?pts[0][0]:Infinity;
  const old=Object.values(h).filter(e=>e[0]<start-36e5).sort((a,b)=>a[0]-b[0]);
  return old.length?[...old,...pts]:pts;
}
async function collectHistory(){
  if(locked)return;
  for(const id of coinIds()){
    const n=Object.keys(data.hist?.[id]||{}).length;
    try{await fetchChart(id,n<300?'365':'30',true)}catch(e){}   // eerste keer een heel jaar, daarna de laatste maand (op de achtergrond)
  }
}
const chartInflight={};   // dezelfde grafiek die tegelijk op twee plekken nodig is, maar één keer ophalen
function fetchChart(id,days,low){const key=id+'|'+days,c=chartCache[key];
  if(c&&Date.now()-c.ts<chartTtl(days))return Promise.resolve(c.pts);
  return chartInflight[key]||(chartInflight[key]=fetchChart0(id,days,low).finally(()=>{delete chartInflight[key]}))}
async function fetchChart0(id,days,low){
  const key=id+'|'+days,c=chartCache[key];
  try{
    let r=await cg(`/coins/${encodeURIComponent(id)}/market_chart?vs_currency=${CUR}&days=${days}`,low);
    if(!r.ok&&r.status!==429&&days==='max')r=await cg(`/coins/${encodeURIComponent(id)}/market_chart?vs_currency=${CUR}&days=365`);
    if(!r.ok)throw new Error(r.status===429?BUSY:r.status===401?'CoinGecko-sleutel ongeldig':'Grafiek niet beschikbaar');
    const j=await r.json();addHist(id,j.prices||[]);chartCache[key]={ts:Date.now(),pts:thin(j.prices||[])};saveCharts();return chartCache[key].pts;
  }catch(e){if(c)return c.pts;throw e}   // bij een fout: laatst bekende grafiek tonen
}

/* ---------- weergave ---------- */
// Na het opnieuw opbouwen van het scherm de toetsenbordfocus terugzetten op hetzelfde element
function focusKey(e){if(!e||e===document.body)return null;if(e.id)return '#'+CSS.escape(e.id);
  if(e.dataset?.act==='pview')return `[data-act="pview"][data-v="${CSS.escape(e.dataset.v)}"]`;
  for(const k of ['act','sort','prange','range','tf','rp','theme','cal','type'])if(e.dataset?.[k]!=null)return `[data-${k}="${CSS.escape(e.dataset[k])}"]`;
  if(e.getAttribute?.('href'))return `a[href="${CSS.escape(e.getAttribute('href'))}"]`;
  const row=e.closest?.('[data-tx],[data-coin],[data-goal]');if(row){const k=row.dataset.tx!=null?'tx':row.dataset.coin!=null?'coin':'goal';return `[data-${k}="${CSS.escape(row.dataset[k])}"] .rowlink`}
  return null}
function keepFocus(fn){const k=focusKey(document.activeElement);fn();if(k&&(document.activeElement===document.body||!document.activeElement)){const el=[...document.querySelectorAll(k)].find(x=>x.getClientRects().length);if(el)el.focus({preventScroll:true})}}
function render(){keepFocus(()=>inUnit(renderInner));setTimeout(markScrollers,0)}
function renderInner(){
  if(locked)return renderLock();
  document.body.classList.toggle('private',!!settings.privacy);
  const m=location.hash.match(/^#coin\/(.+)$/);
  const cid=m&&(TX().some(t=>t.coinId===decodeURIComponent(m[1]))||isWatched(decodeURIComponent(m[1])))?decodeURIComponent(m[1]):null;
  const isTx=location.hash==='#transacties',isRep=/^#rapporten(\/|$)/.test(location.hash);
  const bar=()=>{if(multiPf())$('#view').insertAdjacentHTML('afterbegin',pfBarHTML())};
  if(isRep){inEUR(renderReports);bar();lastView='rep';renderSide('__rep')}
  else if(isTx){
    if(lastView==='tx'&&$('#txOut')){$('#topbar').innerHTML=topbarHTML(null,'Transacties');fillTxs()}  // focus in zoekveld behouden
    else{renderTxs();bar()}
    lastView='tx';renderSide('__tx');
  }else{
    if(cid)renderCoin(cid);else{renderHome();bar()}
    lastView=cid?'coin':'home';renderSide(cid);
  }
  document.querySelectorAll('.tabbar a').forEach(b=>{const on=b.dataset.tab===(isRep?'reps':isTx?'txs':'home');b.classList.toggle('on',on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
  clearTimeout(window._fabR);window._fabR=setTimeout(()=>{const f=$('#btnAdd');if(f)f.classList.toggle('away',fabCovers()||(f.classList.contains('away')&&scrollY>60))},150);
}
let lastView=null;
function renderSide(cid){
  const el=$('#side');if(!el)return;
  const p=portfolio(),list=[...p.open].sort((a,b)=>(b.value??0)-(a.value??0));
  el.innerHTML=`<div class="brand"><img src="icon.svg" alt="" width="32" height="32">Crypto Portfolio ${appVerHTML()}</div>
  <nav aria-label="Hoofdnavigatie"><a class="nav ${cid?'':'on'}" href="#"${cid?'':' aria-current="page"'}>${ICONS.home} Overzicht</a>
  <a class="nav ${cid==='__tx'?'on':''}" href="#transacties"${cid==='__tx'?' aria-current="page"':''}>${ICONS.list} Transacties</a>
  <a class="nav ${cid==='__rep'?'on':''}" href="#rapporten"${cid==='__rep'?' aria-current="page"':''}>${ICONS.reps} Rapporten</a></nav>
  ${p.hasCash?`<div class="side-t">Cash</div><a class="side-coin" href="#transacties" data-act="cashtx"><div class="coin-ph cash-ic">€</div><div class="grow"><div class="name-sm name">Beschikbaar</div><div class="meta m">${money(p.cash,2)}</div></div></a>`:''}
  ${list.length?`<div class="side-t">Bezittingen</div>${list.map(c=>`<a class="side-coin ${c.coinId===cid?'on':''}" href="#coin/${encodeURIComponent(c.coinId)}" data-coin="${esc(c.coinId)}">${coinIcon(c.meta)}<div class="grow"><div class="name-sm name">${esc(c.meta.name)}</div><div class="meta m">${money(c.value,2)}</div></div><div class="chg ${cls(c.unreal)}">${pct(c.unrealPct)}</div></a>`).join('')}`:''}
  ${p.closed.length?`<div class="side-t">Gesloten</div>${p.closed.map(c=>`<a class="side-coin ${c.coinId===cid?'on':''}" href="#coin/${encodeURIComponent(c.coinId)}" data-coin="${esc(c.coinId)}">${coinIcon(c.meta)}<div class="grow"><div class="name-sm name">${esc(c.meta.name)}</div></div><div class="chg ${cls(c.realized)} m">${signed(c.realized)}</div></a>`).join('')}`:''}
  ${watchOnly().length?`<div class="side-t">Volglijst</div>${watchOnly().map(x=>{const P=prices[x.id]||{};return `<a class="side-coin ${x.id===cid?'on':''}" href="#coin/${encodeURIComponent(x.id)}" data-coin="${esc(x.id)}">${coinIcon({coinId:x.id,symbol:x.symbol,image:x.image})}<div class="grow"><div class="name-sm name">${esc(x.name)}</div><div class="meta">${money(P.price)}</div></div><div class="chg ${cls(chU(P.ch24))}">${pct(chU(P.ch24))}</div></a>`}).join('')}`:''}
  <div class="side-foot">Koersdata: CoinGecko</div>`;
}
function topbarHTML(c,pageTitle){
  const eye=`<button type="button" class="icon-btn" data-act="privacy" aria-label="Bedragen verbergen">${settings.privacy?ICONS.eyeOff:ICONS.eye}</button>`;
  const lockB=lockCfg?`<button type="button" class="icon-btn" data-act="lock" aria-label="Nu vergrendelen">${ICONS.lock}</button>`:'';
  const gear=`<button type="button" class="icon-btn" data-act="settings" aria-label="Instellingen">${ICONS.gear}</button>`;
  const back=`<button type="button" class="icon-btn" data-act="home" aria-label="Terug">${ICONS.back}</button>`;
  const title=c?`${esc(c.meta.name)} <span class="sym">${esc((c.meta.symbol||'').toUpperCase())}</span>`:(pageTitle||'Overzicht');
  const mob=c?`${back}<h1>${title}</h1>${eye}`:`<div class="tb-group">${eye}${lockB}</div>${pageTitle?`<h1>${pageTitle}</h1>`:`<h1 class="sr-only">Overzicht</h1>${syncBadge()}`}<div class="tb-group">${lockCfg?'<span class="tb-spacer"></span>':''}${gear}</div>`;
  return `<div class="m-top only-m">${mob}</div><div class="d-top only-d">${c?back:''}<h1>${title}</h1><span class="grow"></span>${syncBadge()}${eye}${lockB}${gear}<button type="button" class="btn-add" data-act="add">${ICONS.plus} Transactie</button></div>`;
}
/* ---------- transactie-overzicht ---------- */
let txf={q:'',type:'all',coin:'all',year:'all',acct:'all'};
function renderTxs(){
  $('#topbar').innerHTML=topbarHTML(null,'Transacties');
  if(!TX().length){$('#view').innerHTML=`<div class="empty"><b>Nog geen transacties</b>Tik op + om je eerste aankoop toe te voegen,<br>of <button type="button" class="link-lg link" data-act="bvimport">importeer ze uit Bitvavo</button>.</div>`;return}
  const coins=coinIds().map(computeCoin).sort((a,b)=>(a.meta.name||'').localeCompare(b.meta.name||''));
  const years=[...new Set(TX().map(t=>t.date.slice(0,4)))].sort().reverse();
  if(txf.coin!=='all'&&!coins.some(c=>c.coinId===txf.coin))txf.coin='all';
  if(txf.year!=='all'&&!years.includes(txf.year))txf.year='all';
  const accts=accounts();if(txf.acct!=='all'&&!accts.includes(txf.acct))txf.acct='all';
  $('#view').innerHTML=`<div class="tx-actions"><button type="button" class="link" data-act="csvfiltered">Exporteren (CSV)</button><button type="button" class="link" data-act="bvimport">Importeren uit Bitvavo</button></div><div class="filters">
    <label class="sr-only" for="tf_q">Zoek op munt of notitie</label><input id="tf_q" type="search" enterkeyhint="search" placeholder="Zoek op munt of notitie" value="${esc(txf.q)}" autocomplete="off">
    <fieldset class="seg"><legend class="sr-only">Soort transactie</legend>${[['all','Alle'],['buy','Koop'],['sell','Verkoop'],...(hasCashTx()?[['cash','Cash']]:[]),...(data.txs.some(t=>isOther(t.type))?[['other','Overig']]:[])].map(([v,l])=>`<button type="button" data-tf="${v}" class="${v} ${txf.type===v?'on':''}">${l}</button>`).join('')}</fieldset>
    <label class="sr-only" for="tf_coin">Munt</label><select id="tf_coin"><option value="all">Alle munten</option>${coins.map(c=>`<option value="${esc(c.coinId)}"${txf.coin===c.coinId?' selected':''}>${esc(c.meta.name)}</option>`).join('')}</select>
    <label class="sr-only" for="tf_year">Jaar</label><select id="tf_year"><option value="all">Alle jaren</option>${years.map(y=>`<option${txf.year===y?' selected':''}>${y}</option>`).join('')}</select>
    ${accts.length?`<label class="sr-only" for="tf_acct">Broker of wallet</label><select id="tf_acct"><option value="all">Alle brokers/wallets</option>${accts.map(a=>`<option${txf.acct===a?' selected':''}>${esc(a)}</option>`).join('')}</select>`:''}
  </div><div id="txOut"></div>`;
  if($('#tf_acct'))$('#tf_acct').onchange=e=>{txf.acct=e.target.value;txLimit=100;fillTxs()};
  $('#tf_q').oninput=e=>{txf.q=e.target.value;txLimit=100;fillTxs()};
  $('#tf_coin').onchange=e=>{txf.coin=e.target.value;txLimit=100;fillTxs()};
  $('#tf_year').onchange=e=>{txf.year=e.target.value;txLimit=100;fillTxs()};
  fillTxs();
}
function txWhat(t,sym){   // korte omschrijving: aantal @ koers / ontvangen / van → naar
  const q=`<span class="m">${qtyf(t.qty)}</span> ${sym}`;
  if(t.type==='receive')return `${q} <span class="sym">ontvangen</span>`;
  if(t.type==='transfer')return `${q} <span class="sym">${esc(t.acct||'?')} → ${esc(t.to||'?')}</span>`;
  return `${q} <span class="sym">@ ${priceH(atT(t.price,t))}</span>`;
}
const feeTxt=(t,sym)=>t.type==='transfer'?(t.feeQty?`${qtyf(t.feeQty)} ${sym}`:'–'):(t.fee?money(atT(t.fee,t),2):'–');
function txOutcome(t,c){
  if(!c)return{};
  if(isIn(t)){const l=c.lotMap[t.id];
    if(!l)return{};
    if(l.remaining<=1e-12)return{sold:true};
    if(c.price==null)return{rem:l.remaining};
    return{rem:l.remaining,val:l.remaining*c.price,pl:l.remaining*(c.price-l.unit),pp:l.unit>0?(c.price/l.unit-1)*100:null,partial:l.remaining<t.qty-1e-12}}
  const s=c.sellInfo[t.id]||{};
  if(t.type==='transfer')return{transfer:true,pl:s.pl??null,pp:null};
  return{realized:true,pl:s.pl,pp:s.pct};
}
let txLimit=100;   // transacties per keer tonen (sneller bij een lange lijst)
function fillTxs(){inUnit(fillTxsInner)}
function fillTxsInner(){
  const out=$('#txOut');if(!out)return;
  document.querySelectorAll('[data-tf]').forEach(b=>b.classList.toggle('on',b.dataset.tf===txf.type));
  const cm={};coinIds().forEach(id=>cm[id]=computeCoin(id));
  const q=txf.q.trim().toLowerCase();
  let list=TX().filter(t=>(txf.type==='all'||t.type===txf.type||(txf.type==='cash'&&isCash(t.type))||(txf.type==='other'&&isOther(t.type)))&&(txf.acct==='all'||t.acct===txf.acct||t.to===txf.acct)&&(txf.coin==='all'||t.coinId===txf.coin)&&(txf.year==='all'||t.date.startsWith(txf.year))
      &&(!q||[t.name,t.symbol,t.note,t.acct,t.to,TYPE_L[t.type],isCash(t.type)?'cash':''].some(x=>(x||'').toLowerCase().includes(q))))
    .sort((a,b)=>b.date.localeCompare(a.date)||(b.created||0)-(a.created||0));
  let bought=0,sold=0,fees=0,real=0,dep=0;const showDep=hasCashTx();
  for(const t of list){fees+=atT(t.fee||0,t);if(isCash(t.type)){dep+=atT(t.type==='deposit'?t.amount:-t.amount,t);continue}const tot=atT(txTotal(t),t);if(t.type==='buy')bought+=tot;else if(t.type==='sell')sold+=tot;if(t.type==='sell'||t.type==='transfer'){const o=txOutcome(t,cm[t.coinId]);if(o.pl!=null)real+=o.pl}}
  const sum=`<div class="tx-sum${showDep?'':' odd'}">
    <div class="stat"><div class="label">Transacties</div><div class="val">${list.length}</div></div>
    <div class="stat"><div class="label">Gekocht</div><div class="val m">${money(bought,2)}</div></div>
    <div class="stat"><div class="label">Verkocht</div><div class="val m">${money(sold,2)}</div></div>
    <div class="stat"><div class="label">Betaalde kosten</div><div class="val m">${money(fees,2)}</div></div>
    <div class="stat"><div class="label">Gerealiseerd</div><div class="val m ${cls(real)}">${Math.abs(real)>0.005?signed(real):'–'}</div></div>${showDep?`<div class="stat"><div class="label">Netto gestort</div><div class="val m">${money(dep,2)}</div></div>`:''}</div>`;
  if(!list.length){out.innerHTML=sum+'<div class="empty-card card">Geen transacties gevonden</div>';return}
  const all=list.length;list=list.slice(0,txLimit);
  let mob='',cur='',items='';
  const flush=()=>{if(items)mob+=`<div class="month-h">${cur}</div><ul class="list">${items}</ul>`;items=''};
  for(const t of list){
    const o=txOutcome(t,cm[t.coinId]),sym=esc((t.symbol||'').toUpperCase()),d=new Date(t.date);
    const mk=isNaN(d)?'':d.toLocaleDateString('nl-NL',{month:'long',year:'numeric'});
    if(mk!==cur){flush();cur=mk}
    if(isCash(t.type)){const sg=t.type==='deposit'?1:-1;
      items+=`<li class="row" data-tx="${esc(t.id)}"><div class="coin-ph cash-ic">€</div>
      <div class="grow"><div class="name"><button type="button" class="rowlink">Cash<span class="sr-only"> – transactie bewerken</span></button> <span class="tx-type ${t.type}">${TYPE_L[t.type]}</span></div>
      <div class="meta">${isNaN(d)?esc(t.date):tm(d,d.toLocaleDateString('nl-NL',{day:'numeric',month:'short'}))}${t.acct?' · '+esc(t.acct):''}${t.note?' · '+esc(t.note):''}</div></div>
      <div class="right"><div class="v m ${sg>0?'up':''}">${sg>0?'+':'−'}${money(atT(t.amount,t),2)}</div>${t.fee?`<div class="note-xs label">kosten <span class="m">${money(atT(t.fee,t),2)}</span></div>`:''}</div></li>`;continue}
    const right=o.sold?'<div class="note-sm label">volledig verkocht</div>':o.pl==null?'':`<div class="chg ${cls(o.pl)}"><span class="m">${signed(o.pl)}</span>${o.pp==null?'':' '+pct(o.pp)}</div>${o.realized?'<div class="note-xs label">gerealiseerd</div>':o.transfer?'<div class="note-xs label">netwerkkosten</div>':''}`;
    items+=`<li class="row" data-tx="${esc(t.id)}">${coinIcon({coinId:t.coinId,symbol:t.symbol,image:t.image})}
      <div class="grow"><div class="name nt"><button type="button" class="rowlink nm">${esc(t.name)}<span class="sr-only"> – transactie bewerken</span></button><span class="tx-type ${t.type}">${TYPE_L[t.type]}</span></div>
      <div class="meta">${isNaN(d)?esc(t.date):tm(d,d.toLocaleDateString('nl-NL',{day:'numeric',month:'short'}))}${t.acct&&t.type!=='transfer'?' · '+esc(t.acct):''} · ${txWhat(t,sym)}</div></div>
      <div class="right"><div class="v m">${totalF(t)}</div>${right}</div></li>`;
  }
  flush();
  const tbl=`<div class="tbl-wrap only-d"><table class="tbl"><caption class="sr-only">Transacties</caption><thead><tr><th scope="col" class="l">Datum</th><th scope="col" class="l">Munt</th><th scope="col" class="l">Type</th><th scope="col">Aantal</th><th scope="col">Koers</th><th scope="col">Totaal</th><th scope="col">Kosten</th><th scope="col" class="l">Broker · notitie</th><th scope="col">Waarde nu</th><th scope="col">Winst/verlies</th><th scope="col">%</th></tr></thead><tbody>${list.map(t=>{
    if(isCash(t.type))return `<tr data-tx="${esc(t.id)}"><td class="l"><button type="button" class="rowlink">${tm(t.date,new Date(t.date).toLocaleDateString('nl-NL',{day:'numeric',month:'short',year:'numeric'}))}<span class="sr-only"> – transactie bewerken</span></button></td><td class="l"><div class="coin-cell"><div class="ph-sm coin-ph cash-ic">€</div><span>Cash</span></div></td><td class="l"><span class="tx-type ${t.type}">${TYPE_L[t.type]}</span></td><td>–</td><td>–</td><td class="m ${t.type==='deposit'?'up':''}">${t.type==='deposit'?'+':'−'}${money(atT(t.amount,t),2)}</td><td class="m">${t.fee?money(atT(t.fee,t),2):'–'}</td><td class="l note-cell">${esc([t.acct,t.note].filter(Boolean).join(' · '))}</td><td>–</td><td>–</td><td>–</td></tr>`;
    const o=txOutcome(t,cm[t.coinId]),sym=esc((t.symbol||'').toUpperCase());
    const val=o.sold?'<span class="label">verkocht</span>':o.realized?'<span class="label">gerealiseerd</span>':o.transfer?'<span class="label">overboeking</span>':o.val!=null?money(o.val,2)+(o.partial?`<div class="note-xs label">nog ${qtyf(o.rem)} ${sym}</div>`:''):'–';
    return `<tr data-tx="${esc(t.id)}"><td class="l"><button type="button" class="rowlink">${tm(t.date,new Date(t.date).toLocaleDateString('nl-NL',{day:'numeric',month:'short',year:'numeric'}))}<span class="sr-only"> – transactie bewerken</span></button></td><td class="l"><div class="coin-cell">${coinIcon({coinId:t.coinId,symbol:t.symbol,image:t.image},28)}<span>${esc(t.name)}</span></div></td><td class="l"><span class="tx-type ${t.type}">${TYPE_L[t.type]}</span></td><td class="m">${qtyf(t.qty)} ${sym}</td><td>${isOther(t.type)?'–':priceH(atT(t.price,t))}</td><td class="m">${totalF(t)}</td><td class="m">${feeTxt(t,sym)}</td><td class="l note-cell">${esc([t.type==='transfer'?`${t.acct||'?'} → ${t.to||'?'}`:t.acct,t.note].filter(Boolean).join(' · '))}</td><td class="m">${val}</td><td class="m ${cls(o.pl)}"><b>${o.pl==null?'–':signed(o.pl)}</b></td><td class="${cls(o.pp)}"><b>${pct(o.pp)}</b></td></tr>`}).join('')}</tbody></table></div>`;
  out.innerHTML=sum+`<div class="only-m">${mob}</div>`+tbl+(all>list.length?`<button type="button" class="mt-14 btn sec" data-act="txmore">Toon meer (${list.length} van ${all})</button>`:'');
}
function holdingsTable(list){
  const th=(l,k,cl='')=>`<th scope="col" class="${cl} ${settings.sort===k?'on':''}"${settings.sort===k?' aria-sort="descending"':''}><button type="button" class="rowlink" data-sort="${k}">${l}${settings.sort===k?' <span aria-hidden="true">↓</span>':''}</button></th>`;
  return `<div class="tbl-wrap only-d"><table class="tbl hold-tbl"><caption class="sr-only">Bezittingen</caption><thead><tr>${th('Munt','name','l')}<th scope="col">Aantal</th><th scope="col"><abbr title="Gemiddelde aankoopprijs">Gem. prijs</abbr></th><th scope="col">Koers</th><th scope="col">24 uur</th><th scope="col">7 dagen</th><th scope="col">30 dagen</th>${th('Waarde','value')}<th scope="col">Geïnvesteerd</th>${th('Winst/verlies','plabs')}${th('%','pl')}</tr></thead><tbody>${list.map(c=>`<tr data-coin="${esc(c.coinId)}">
    <td class="l"><div class="coin-cell" title="${esc(c.meta.name)}">${coinIcon(c.meta)}<div class="name"><a class="rowlink" href="#coin/${encodeURIComponent(c.coinId)}">${esc((c.meta.symbol||'').toUpperCase()||c.meta.name)}<span class="sr-only"> ${esc(c.meta.name)}</span></a></div></div></td>
    <td class="m">${qtyf(c.qty)}</td><td class="m">${money(c.avg)}</td><td>${money(c.price)}</td><td class="${cls(c.ch24)}">${pct(c.ch24)}</td><td class="${cls(c.ch7)}">${pct(c.ch7)}</td><td class="${cls(c.ch30)}">${pct(c.ch30)}</td>
    <td class="m"><b>${money(c.value,2)}</b></td><td class="m">${money(c.cost,2)}</td><td class="m ${cls(c.unreal)}"><b>${signed(c.unreal)}</b></td><td class="${cls(c.unreal)}"><b>${pct(c.unrealPct)}</b></td></tr>`).join('')}</tbody></table></div>`;
}
function txTable(txs,c){
  const sym=esc((c.meta.symbol||'').toUpperCase());
  return `<div class="tbl-wrap only-d"><table class="tbl"><caption class="sr-only">Transacties ${esc(c.meta.name||'')}</caption><thead><tr><th scope="col" class="l">Type</th><th scope="col" class="l">Datum</th><th scope="col">Aantal</th><th scope="col">Koers</th><th scope="col">Totaal</th><th scope="col">Kosten</th><th scope="col" class="l">Broker · notitie</th><th scope="col">Waarde nu</th><th scope="col">Winst/verlies</th><th scope="col">%</th></tr></thead><tbody>${txs.map(t=>{
    let val='–',pl=null,pp=null;
    if(isIn(t)){const l=c.lotMap[t.id];
      if(l&&l.remaining<=1e-12)val='<span class="label">verkocht</span>';
      else if(l&&c.price!=null){val=money(l.remaining*c.price,2)+(l.remaining<t.qty-1e-12?`<div class="note-xs label">nog ${qtyf(l.remaining)} ${sym}</div>`:'');pl=l.remaining*(c.price-l.unit);pp=l.unit>0?(c.price/l.unit-1)*100:null}}
    else if(t.type==='transfer'){const s=c.sellInfo[t.id]||{};pl=s.pl??null;val='<span class="label">overboeking</span>'}
    else{const s=c.sellInfo[t.id]||{};pl=s.pl;pp=s.pct;val='<span class="label">gerealiseerd</span>'}
    return `<tr data-tx="${esc(t.id)}"><td class="l"><span class="tx-type ${t.type}">${TYPE_L[t.type]}</span></td><td class="l"><button type="button" class="rowlink">${tm(t.date,fmtDate(t.date),t.date.length>10)}<span class="sr-only"> – transactie bewerken</span></button></td><td class="m">${qtyf(t.qty)} ${sym}</td><td>${isOther(t.type)?'–':priceH(atT(t.price,t))}</td><td class="m">${totalF(t)}</td><td class="m">${feeTxt(t,sym)}</td><td class="l note-cell">${esc([t.type==='transfer'?`${t.acct||'?'} → ${t.to||'?'}`:t.acct,t.note].filter(Boolean).join(' · '))}</td><td class="m">${val}</td><td class="m ${cls(pl)}"><b>${pl==null?'–':signed(pl)}</b></td><td class="${cls(pp)}"><b>${pp==null?(t.type==='receive'?'<span class="w-normal label">gratis</span>':'–'):pct(pp)}</b></td></tr>`}).join('')}</tbody></table></div>`;
}
// <time datetime="…"> voor datums in de HTML (machineleesbaar; de tekst blijft Nederlands)
const isoD=v=>{const d=new Date(v);if(isNaN(d))return '';const z=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`};
const isoDT=v=>{const d=new Date(v);if(isNaN(d))return '';const z=n=>String(n).padStart(2,'0');return `${isoD(d)}T${z(d.getHours())}:${z(d.getMinutes())}`};
function tm(v,text,withTime){const iso=withTime?isoDT(v):isoD(v);return iso?`<time datetime="${iso}">${text}</time>`:text}
function pTime(u,ts,long){const d=new Date(ts),z=n=>String(n).padStart(2,'0');
  const iso=u==='year'?String(d.getFullYear()):u==='month'?`${d.getFullYear()}-${z(d.getMonth()+1)}`:u==='week'?`${d.getFullYear()}-W${z(isoWeek(d))}`:isoD(d);
  return `<time datetime="${iso}">${pLabel(u,ts,long)}</time>`}
function fmtTs(ts){const d=new Date(ts);return d.toLocaleDateString('nl-NL',{day:'numeric',month:'short'})+', '+d.toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'})}
const lastCgTs=()=>Math.max(0,...Object.values(prices).map(x=>x?.ts||0));
function syncBadge(){
  const g=settings.gh,ghOn=g.token&&g.repo&&g.pass,cgT=lastCgTs();
  const line=(lbl,st,txt)=>`<span class="sl"><span class="dot ${st}"></span>${lbl} <b>${txt}</b></span>`;
  const ghTxt=settings.lastGh?fmtTs(settings.lastGh):syncState.s==='busy'?'bezig…':syncState.s==='err'?'mislukt':'nog niet';
  const cgTxt=cgT?fmtTs(cgT):cgState.s==='busy'?'bezig…':cgState.s==='err'?'mislukt':'–';
  const cgSt=cgState.s==='off'&&cgT?'ok':cgState.s;
  const tip=[ghOn?'GitHub: '+(syncState.msg||ghTxt):'',coinIds().length?'Koersen: '+(cgState.msg||cgTxt):''].filter(Boolean).join(' · ');
  if(!navigator.onLine)return `<button type="button" class="sync" data-act="syncinfo" title="Geen internet. Je ziet de laatst bekende koersen${cgT?' ('+fmtTs(cgT)+')':''}; wijzigingen worden gesynchroniseerd zodra je weer online bent.">${line('Offline','err',cgT?'koersen '+tm(cgT,fmtTs(cgT),true):'')}</button>`;
  return `<button type="button" class="sync" data-act="syncinfo" title="${esc(tip)}"><span class="sr-only">Nu synchroniseren. </span>${ghOn?line('GitHub',syncState.s,settings.lastGh?tm(settings.lastGh,ghTxt,true):ghTxt):''}${coinIds().length?line('Koersen',cgSt,cgT?tm(cgT,cgTxt,true):cgTxt):''}</button>`;
}
function updBadges(){document.querySelectorAll('.sync').forEach((el,i)=>{const f=el===document.activeElement;el.outerHTML=syncBadge();if(f)document.querySelectorAll('.sync')[i]?.focus()})}   // focus blijft op de statusknop staan
window.addEventListener('offline',()=>{updBadges();if(!locked)toast('Geen internet: je ziet de laatst bekende koersen')});
window.addEventListener('online',()=>{updBadges();if(locked)return;toast('Weer online');refreshPrices();syncNow(true)});
function renderHome(){
  $('#topbar').innerHTML=topbarHTML(null);
  const p=portfolio();
  if(!TX().length){
    $('#view').innerHTML=`<div class="empty"><b>Nog geen investeringen</b>Tik op + om je eerste aankoop toe te voegen.<br>Koersen worden automatisch opgehaald.${settings.gh.token?'':'<br><button type="button" class="link-lg link" data-act="pairopen">Al in gebruik op een ander apparaat? Koppelcode invoeren</button>'}</div>${watchSection()}`;return;
  }
  const mode=settings.plMode;
  const plV=mode==='24h'?p.ch24:p.unreal,plP=mode==='24h'?p.ch24Pct:p.unrealPct;
  const palette=['#4f8cff','#1fd17a','#f5b942','#b56cff','#ff7a59','#34c6d3','#8b93a5'];
  const sorted=[...p.open].sort(sorter());
  const byVal=[...p.open].filter(c=>c.value).sort((a,b)=>b.value-a.value);
  let segs=byVal.slice(0,6).map((c,i)=>({n:(c.meta.symbol||'').toUpperCase(),v:c.value,col:palette[i]}));
  const rest=byVal.slice(6).reduce((s,c)=>s+c.value,0);if(rest>0)segs.push({n:'Overig',v:rest,col:palette[6]});
  if(p.hasCash&&p.cash>0.005)segs.push({n:'Cash',v:p.cash,col:'#c9ced8'});
  const cashCard=p.hasCash?`<div class="card kv">
    <div class="kv-h"><b>Cash</b><button type="button" class="link" data-act="addcash">+ Storting / opname</button></div>
    <div><span class="label">Beschikbaar</span><b class="m">${money(p.cash,2)}</b></div>
    <div><span class="label">Netto gestort</span><b class="m">${money(p.dep,2)}</b></div>
    <div><span class="label">Totaal rendement</span><b class="${cls(p.ret)}"><span class="m">${signed(p.ret)}</span> <small>${pct(p.retPct)}</small></b></div>
    ${p.cash<-0.005?'<p class="warn">Je cash staat negatief: er zijn aankopen zonder bijbehorende storting. Voeg je eerdere stortingen toe.</p>':''}</div>`
    :`<div class="cash-hint card"><span class="label">Houd ook je cash bij de broker bij</span><button type="button" class="link" data-act="addcash">+ Storting</button></div>`;
  const tot=segs.reduce((s,x)=>s+x.v,0);
  const kv=`<div class="card only-d kv">
    <div><span class="label">Geïnvesteerd</span><b class="m">${money(p.cost,2)}</b></div>
    <div><span class="label">Ongerealiseerd</span><b class="${cls(p.unreal)}"><span class="m">${signed(p.unreal)}</span> <small>${pct(p.unrealPct)}</small></b></div>
    <div><span class="label">Laatste 24 uur</span><b class="${cls(p.ch24)}"><span class="m">${signed(p.ch24)}</span> <small>${pct(p.ch24Pct)}</small></b></div>
    <div><span class="label">Gerealiseerd</span><b class="m ${cls(p.realized)}">${signed(p.realized)}</b></div>
    <div><span class="label">Open posities</span><b>${p.open.length}</b></div></div>`;
  $('#view').innerHTML=`${issuesBanner()}${sinceCard()}${inEUR(planDueCard)}<div class="home-grid"><div class="panel">
  <section class="hero">
    <div class="label">${p.hasCash?'Totale waarde':'Portfoliowaarde'}</div>
    <div class="big" id="heroVal">${heroValHTML(p.hasCash?p.total:p.value)}</div>${unitMenuHTML()}
    <div id="heroPl"><button type="button" class="pl-toggle ${cls(plV)}" data-act="plmode"><span class="m">${signed(plV)}</span> <span>(${pct(plP)})</span> <small>${mode==='24h'?'24 uur':'Totaal ongerealiseerd'} ⇄</small></button></div>
    <div class="sub" id="heroSub">${heroSub(p.hasCash,p.value,p.cash,p.cost,p.realized)}${p.missing?' · koers ontbreekt voor sommige munten':''}</div>
  </section>
  <div class="pc-tools">${pviewSeg()}<button type="button" class="link zoom-hint pz-open" data-act="pzoom">Vergroten <span aria-hidden="true">⤢</span></button></div>
  <div class="chart-wrap" id="pchart"><div class="chart-msg">Grafiek laden…</div></div><div id="plegend"></div>
  <fieldset class="ranges"><legend class="sr-only">Periode van de grafiek</legend>${PRANGES.map(([d,l])=>`<button type="button" data-prange="${d}" class="${settings.pRange===d?'on':''}">${l}</button>`).join('')}</fieldset>
  <div class="period" id="pperiod"></div></div>
  <div class="side-col">${tot>0?`<div class="card"><div class="alloc-bar" aria-hidden="true">${segs.map(s=>`<div style="flex:${s.v};background:${s.col}"></div>`).join('')}</div><div class="legend">${segs.map(s=>`<span><i style="background:${s.col}"></i>${esc(s.n)} ${(s.v/tot*100).toFixed(1).replace('.',',')}%</span>`).join('')}</div></div>`:''}${cashCard}${inEUR(()=>goalsCard(true))}${kv}</div></div>
  <div class="list-head"><h2>Bezittingen</h2>
    <label class="sr-only" for="sortSel">Sorteer bezittingen op</label><select id="sortSel" data-act="sort" class="only-m"><option value="value"${settings.sort==='value'?' selected':''}>Waarde</option><option value="pl"${settings.sort==='pl'?' selected':''}>Winst/verlies %</option><option value="plabs"${settings.sort==='plabs'?' selected':''}>Winst/verlies €</option><option value="name"${settings.sort==='name'?' selected':''}>Naam</option></select></div>
  ${sorted.length?`<ul class="list only-m">${sorted.map(c=>{
    const v=mode==='24h'?c.ch24:c.unrealPct;
    return `<li class="row" data-coin="${esc(c.coinId)}">${coinIcon(c.meta)}
      <div class="grow"><div class="name"><a class="rowlink" href="#coin/${encodeURIComponent(c.coinId)}">${esc(c.meta.name)}</a></div><div class="meta"><span class="m">${qtyf(c.qty)}</span> ${esc((c.meta.symbol||'').toUpperCase())} · gem. <span class="m">${money(c.avg)}</span></div></div>
      <div class="right"><div class="v m">${money(c.value,2)}</div><div class="chg ${cls(mode==='24h'?c.ch24:c.unreal)}"><span class="m">${mode==='24h'?'':signed(c.unreal)+' '}</span>${pct(v)}</div></div>
      <div class="mkt-chg"><span class="sr-only">Koersverandering: </span>${[['24u','24 uur',c.ch24],['7d','7 dagen',c.ch7],['30d','30 dagen',c.ch30]].map(([l,L,v])=>`<span><abbr class="label" title="${L}">${l}</abbr> <span class="${cls(v)}">${pct1(v)}</span></span>`).join('')}</div></li>`}).join('')}</ul>${holdingsTable(sorted)}`:'<div class="empty-card card">Geen open posities</div>'}
  ${p.closed.length?`<details class="closed"><summary>Gesloten posities (${p.closed.length})</summary><ul class="list">${p.closed.map(c=>`<li class="row" data-coin="${esc(c.coinId)}">${coinIcon(c.meta)}<div class="grow"><div class="name"><a class="rowlink" href="#coin/${encodeURIComponent(c.coinId)}">${esc(c.meta.name)}</a></div><div class="meta">${c.txs.length} transacties</div></div><div class="right"><div class="label">Gerealiseerd</div><div class="semibold ${cls(c.realized)} m">${signed(c.realized)}</div></div></li>`).join('')}</ul></details>`:''}
  ${watchSection()}`;
  drawPortfolioChart();placeUnitMenu();
}
/* ---------- import uit Bitvavo (CSV) ---------- */
// Kolommen: Timezone, Date, Time, Type, Currency, Amount, Quote Currency, Quote Price, Received / Paid Currency,
// Received / Paid Amount, Fee currency, Fee amount, Status, Transaction ID, Address
const CG_MAP={btc:'bitcoin',eth:'ethereum',ada:'cardano',xlm:'stellar',usdt:'tether',usdc:'usd-coin',sol:'solana',xrp:'ripple',doge:'dogecoin',dot:'polkadot',link:'chainlink',avax:'avalanche-2',ltc:'litecoin',bnb:'binancecoin',shib:'shiba-inu',pepe:'pepe',trx:'tron',atom:'cosmos',near:'near',uni:'uniswap',fet:'fetch-ai',iost:'iostoken',algo:'algorand',xtz:'tezos',vet:'vechain',hbar:'hedera-hashgraph',icp:'internet-computer',arb:'arbitrum',op:'optimism',sui:'sui',apt:'aptos',grt:'the-graph',aave:'aave',sand:'the-sandbox',mana:'decentraland',chz:'chiliz',bch:'bitcoin-cash',etc:'ethereum-classic',kas:'kaspa',ton:'the-open-network'};
function parseCSV(text){
  text=text.replace(/^﻿/,'');const first=text.split('\n')[0],d=(first.match(/;/g)||[]).length>(first.match(/,/g)||[]).length?';':',';
  const rows=[];let row=[],f='',q=false;
  for(let i=0;i<text.length;i++){const c=text[i];
    if(q){if(c==='"'){if(text[i+1]==='"'){f+='"';i++}else q=false}else f+=c}
    else if(c==='"')q=true;else if(c===d){row.push(f);f=''}else if(c==='\n'){row.push(f);rows.push(row);row=[];f=''}else if(c!=='\r')f+=c}
  if(f||row.length){row.push(f);rows.push(row)}
  return rows.filter(r=>r.some(x=>x.trim()));
}
let imp=null;
function parseBitvavo(text){
  const rows=parseCSV(text);if(rows.length<2)throw new Error('Leeg bestand');
  const H=rows[0].map(h=>h.trim().toLowerCase()),col=n=>H.indexOf(n);
  const need=['type','currency','amount','date'];if(need.some(n=>col(n)<0))throw new Error('Dit lijkt geen Bitvavo-export (kolommen ontbreken)');
  const g=(r,n)=>{const i=col(n);return i<0?'':(r[i]||'').trim()},N=v=>{const x=parseFloat(String(v).replace(/\s/g,''));return isFinite(x)?x:0};
  const items=[],skipped=[];
  rows.slice(1).forEach((r,ix)=>{
    const type=g(r,'type').toLowerCase(),cur=g(r,'currency').toUpperCase(),amt=N(g(r,'amount')),status=g(r,'status').toLowerCase();
    const txid=g(r,'transaction id')||`${g(r,'date')}-${g(r,'time')}-${type}-${cur}-${amt}`;
    const date=`${g(r,'date')}T${(g(r,'time')||'00:00:00').slice(0,8)}`;
    const feeCur=g(r,'fee currency').toUpperCase(),fee=Math.abs(N(g(r,'fee amount'))),feeE=feeCur==='EUR'?fee:0;
    const rp=Math.abs(N(g(r,'received / paid amount'))),qp=N(g(r,'quote price')),quote=g(r,'quote currency').toUpperCase();
    const base={id:'bv-'+txid,ext:'bitvavo',date,acct:'Bitvavo',note:'',row:ix+2};
    const skip=why=>skipped.push({row:ix+2,type,cur,why});
    if(status&&!['completed','distributed','voltooid','uitgekeerd'].includes(status))return skip('status: '+status);
    if(!amt)return skip('geen aantal');
    if(cur==='EUR'){
      if(type==='deposit')items.push({...base,type:'deposit',amount:Math.abs(amt),fee:feeE});
      else if(type==='withdrawal')items.push({...base,type:'withdraw',amount:Math.abs(amt),fee:feeE});
      else skip('onbekend type');return;
    }
    const sym=cur.toLowerCase(),q=Math.abs(amt);
    if((type==='buy'||type==='sell')&&quote&&quote!=='EUR')return skip('niet in euro ('+quote+')');
    if(type==='buy')items.push({...base,type:'buy',sym,qty:q,price:rp?(rp-feeE)/q:qp,fee:feeE});
    else if(type==='sell')items.push({...base,type:'sell',sym,qty:q,price:rp?(rp+feeE)/q:qp,fee:feeE});
    else if(type==='withdrawal')items.push({...base,type:'transfer',sym,qty:q,feeQty:feeCur===cur?Math.min(fee,q*0.999999):0,to:'Externe wallet',price:0,fee:0});
    else if(type==='deposit')items.push({...base,type:'receive',sym,qty:q,price:0,fee:0,note:'Storting van externe wallet: vul zo nodig de aankoopprijs aan'});
    else if(amt>0)items.push({...base,type:'receive',sym,qty:q,price:0,fee:0,note:type.charAt(0).toUpperCase()+type.slice(1).replace(/_/g,' ')});
    else skip('onbekend type');
  });
  return{items,skipped};
}
async function startImport(file){
  let res;try{res=parseBitvavo(await file.text())}catch(e){return toast(e.message||'Bestand niet leesbaar')}
  const syms=[...new Set(res.items.filter(i=>i.sym).map(i=>i.sym))];
  imp={...res,map:{},cands:{},replace:true,fname:file.name};
  // koppeling symbool → CoinGecko-munt: eerst je eigen transacties, dan bekende munten, dan zoeken
  for(const s of syms){const own=data.txs.find(t=>(t.symbol||'').toLowerCase()===s&&t.coinId);imp.map[s]=own?own.coinId:CG_MAP[s]||null;
    imp.cands[s]=own?[{id:own.coinId,name:own.name,symbol:own.symbol,image:own.image}]:[]}
  renderImport();
  await Promise.all(syms.map(async s=>{try{const r=await cg(`/search?query=${encodeURIComponent(s)}`);const j=await r.json();
    const ex=(j.coins||[]).filter(c=>c.symbol.toLowerCase()===s).sort((a,b)=>(a.market_cap_rank||1e9)-(b.market_cap_rank||1e9)).slice(0,6).map(c=>({id:c.id,name:c.name,symbol:c.symbol,image:c.large||c.thumb}));
    for(const c of ex)if(!imp.cands[s].some(x=>x.id===c.id))imp.cands[s].push(c);
    if(!imp.map[s]&&imp.cands[s].length)imp.map[s]=imp.cands[s][0].id;
  }catch(e){}if(imp)renderImport()}));
}
function importPlan(){
  const seen=new Set([...data.txs.map(t=>t.id),...(data.deleted||[])]),used=new Set();
  const fresh=imp.items.filter(i=>!seen.has(i.id)),already=imp.items.length-fresh.length;
  const ready=fresh.filter(i=>!i.sym||imp.map[i.sym]),unmapped=fresh.length-ready.length;
  const dups=[];
  for(const i of ready){
    const coinId=i.sym?imp.map[i.sym]:null;
    const m=data.txs.filter(t=>pfOf(t)===(imp?.pf||pfNew())).find(t=>!t.ext&&!used.has(t.id)&&t.type===i.type&&t.date.slice(0,10)===i.date.slice(0,10)&&(coinId?t.coinId===coinId&&Math.abs(t.qty-i.qty)<=1e-9+1e-6*i.qty:Math.abs((t.amount||0)-i.amount)<0.005));
    if(m){used.add(m.id);dups.push([i,m])}
  }
  return{fresh,ready,already,unmapped,dups};
}
function renderImport(){
  if(!imp)return;const P=importPlan(),cnt={};P.ready.forEach(i=>cnt[i.type]=(cnt[i.type]||0)+1);
  const syms=Object.keys(imp.map);
  openSheet(`<h2 class="h3">Importeren uit Bitvavo</h2><p class="mt-0 hint">${esc(imp.fname)} · ${imp.items.length+imp.skipped.length} regels</p>
  ${multiPf()?`<div class="field"><label for="imp_pf">Importeren in portefeuille</label><select id="imp_pf">${pfList().map(p=>`<option value="${esc(p.id)}"${(imp.pf||pfNew())===p.id?' selected':''}>${esc(p.name)}</option>`).join('')}</select></div>`:''}
  <div class="card-alt card kv">
    <div><span class="label">Nieuw om te importeren</span><b>${P.ready.length}</b></div>
    ${Object.entries(cnt).map(([t,n])=>`<div><span class="indent label">${TYPE_L[t]}</span><span>${n}</span></div>`).join('')}
    <div><span class="label">Al geïmporteerd of eerder verwijderd</span><span>${P.already}</span></div>
    ${imp.skipped.length?`<div><span class="label">Overgeslagen</span><span>${imp.skipped.length}</span></div>`:''}
    ${P.unmapped?`<div><span class="warn-mark label">Wacht op muntkoppeling</span><span>${P.unmapped}</span></div>`:''}
  </div>
  ${P.dups.length?`<label class="chk"><input type="checkbox" id="imp_rep" ${imp.replace?'checked':''}><span><b>${P.dups.length} transactie${P.dups.length>1?'s':''} heb je al met de hand ingevoerd.</b> Vervang die door de exacte gegevens uit Bitvavo (aanbevolen; je notities blijven bewaard). Anders worden ze overgeslagen.</span></label>`:''}
  ${syms.length?`<div class="section-t">Munten koppelen</div>${syms.map(s=>`<div class="imp-map"><label for="imp_${esc(s)}"><b>${esc(s.toUpperCase())}</b><span class="sr-only"> koppelen aan munt</span></label><select id="imp_${esc(s)}" data-impmap="${esc(s)}">${imp.cands[s].length?'':`<option value="">${imp.map[s]?esc(imp.map[s]):'zoeken…'}</option>`}${imp.cands[s].map(c=>`<option value="${esc(c.id)}"${imp.map[s]===c.id?' selected':''}>${esc(c.name)} (${esc(c.id)})</option>`).join('')}</select></div>`).join('')}`:''}
  ${imp.skipped.length?`<details class="mt-12"><summary class="label">Overgeslagen regels bekijken</summary>${imp.skipped.map(x=>`<div class="skip-row label">Regel ${x.row}: ${esc(x.type)} ${esc(x.cur)} (${esc(x.why)})</div>`).join('')}</details>`:''}
  <p class="mt-12 hint">Crypto-opnames worden een <b>overboeking</b> van Bitvavo naar "Externe wallet" (de naam kun je later aanpassen). Staking en andere beloningen worden <b>Ontvangen</b>. Alles krijgt broker/wallet "Bitvavo".</p>
  <button type="button" class="btn" data-act="doimport" ${P.ready.length-(imp.replace?0:P.dups.length)>0||(imp.replace&&P.dups.length)?'':'disabled'}>Importeer ${P.ready.length-(imp.replace?0:P.dups.length)} transacties</button>
  <button type="button" class="btn sec" data-act="cancelimport">Annuleren</button>`);
  document.querySelectorAll('[data-impmap]').forEach(el=>el.onchange=()=>{imp.map[el.dataset.impmap]=el.value||null;renderImport()});
  const rc=$('#imp_rep');if(rc)rc.onchange=()=>{imp.replace=rc.checked;renderImport()};
}
function doImport(){
  if($('#imp_pf'))imp.pf=$('#imp_pf').value;
  const P=importPlan(),dupIds=new Map(P.dups.map(([i,m])=>[i.id,m])),now=Date.now();let n=0,k=0;
  for(const i of P.ready){
    const m=dupIds.get(i.id);
    if(m&&!imp.replace)continue;
    if(m){data.txs=data.txs.filter(t=>t.id!==m.id);data.deleted.push(m.id);k++}
    const c=i.sym?(imp.cands[i.sym].find(x=>x.id===imp.map[i.sym])||{id:imp.map[i.sym],name:i.sym.toUpperCase(),symbol:i.sym}):null;
    const {sym,row,...t}=i;
    const tp=imp.pf||pfNew();data.txs.push({...t,...(c?{coinId:c.id,name:c.name,symbol:c.symbol,image:c.image}:{}),note:m?.note||t.note||'',created:now+n,mod:now,dev:devId(),...(tp!=='main'?{pf:tp}:{})});n++;
  }
  imp=null;saveData();closeSheet();refreshPrices();setTimeout(collectHistory,3000);render();
  toast(`${n} transacties geïmporteerd${k?` (${k} handmatige vervangen)`:''}`);
}
/* ---------- rapporten ---------- */
// Rapporten in drie tabbladen; '#rapporten' zonder tabblad opent het laatst bekeken tabblad
const REP_TABS=[['rendement','Rendement'],['analyse','Analyse'],['plannen','Plannen'],['administratie','Administratie']];
function repTab(){const m=location.hash.match(/^#rapporten\/(\w+)/),t=m?m[1]:settings.repTab;return REP_TABS.some(([k])=>k===t)?t:'rendement'}
function repTabsHTML(cur){return `<nav class="rep-tabs" aria-label="Onderdelen van Rapporten">${REP_TABS.map(([k,l])=>`<a href="#rapporten/${k}" class="${k===cur?'on':''}"${k===cur?' aria-current="page"':''}>${l}</a>`).join('')}</nav>`}
// Koers op een moment: uit het eigen koersarchief (dagkoersen) of de bewaarde grafieken; 'nu' = actuele koers.
function priceAt(id,ts){
  if(Date.now()-ts<15*6e4)return prices[id]?.price??null;
  let best=null,bd=Infinity;const h=data.hist?.[id];
  if(h){const d=Math.floor(ts/DAY);for(let k=d-2;k<=d+2;k++){const e=h[k];if(e&&Math.abs(e[0]-ts)<bd){bd=Math.abs(e[0]-ts);best=e[1]}}}
  for(const k in chartCache){if(!k.startsWith(id+'|'))continue;const pts=chartCache[k].pts;if(!pts.length)continue;
    const i=Math.max(0,lastAtOrBefore(pts,ts));for(const j of [i,i+1])if(pts[j]&&Math.abs(pts[j][0]-ts)<bd){bd=Math.abs(pts[j][0]-ts);best=pts[j][1]}}
  return bd<=1.5*DAY?best:null;
}
// Geen koers in het archief (bijv. ouder dan CoinGecko's 365 dagen)? Schat hem uit de dichtstbijzijnde bekende
// koersen ervoor en erna: je eigen aankoop-/verkoopkoersen, het koersarchief en bewaarde grafieken (lineair ertussen).
// Is er helemaal niets, dan tellen de munten mee tegen je aankoopwaarde (resultaat 0) in plaats van € 0.
let estPts={},estSig='';
function knownPts(id){
  const sig=data.txs.length+'|'+Object.keys(chartCache).length+'|'+Object.keys(data.hist||{}).reduce((n,k)=>n+Object.keys(data.hist[k]).length,0);
  if(sig!==estSig){estPts={};estSig=sig}
  if(estPts[id])return estPts[id];
  const a=[];for(const t of data.txs)if(t.coinId===id&&(t.type==='buy'||t.type==='sell')&&t.price>0)a.push([txTime(t),+t.price]);
  const h=data.hist?.[id];if(h)for(const k in h)if(h[k]&&h[k][1]>0)a.push([h[k][0],h[k][1]]);
  for(const k in chartCache)if(k.startsWith(id+'|'))for(const q of chartCache[k].pts)if(q[1]>0)a.push(q);
  a.sort((x,y)=>x[0]-y[0]);return estPts[id]=a;
}
function priceEst(id,ts){const a=knownPts(id);if(!a.length)return null;const i=lastAtOrBefore(a,ts),b=a[i],n=a[i+1];
  if(b&&n&&n[0]>b[0])return b[1]+(n[1]-b[1])*(ts-b[0])/(n[0]-b[0]);return (b||n)[1]}
function snapshot(ts,S){   // stand van je portfolio op tijdstip ts
  const o={coins:[],crypto:0,inv:0,real:0,cash:0,dep:0,missing:[]};
  for(const id in S){const st=S[id],i=lastAtOrBefore(st,ts);if(i<0)continue;const [,q,cost,r]=st[i];o.inv+=cost;o.real+=r;if(q<=1e-12)continue;
    const c=TX().find(t=>t.coinId===id)||{};let pr=priceAt(id,ts),v;
    if(pr!=null)v=q*pr;else{o.missing.push((c.symbol||id).toUpperCase());pr=priceEst(id,ts);v=pr!=null?q*pr:cost}   // geschat
    o.crypto+=v;
    o.coins.push({id,name:c.name,symbol:c.symbol,qty:q,price:pr,value:v,est:o.missing.includes((c.symbol||id).toUpperCase())})}
  for(const x of TX())if(txTime(x)<=ts){const [c,d]=cashEffect(x);o.cash+=c;o.dep+=d}
  o.cash=Math.round(o.cash*1e8)/1e8;o.total=o.crypto+o.cash;o.coins.sort((a,b)=>(b.value??0)-(a.value??0));return o;
}
// bedragen in de staafdiagrammen: € 1.000 (heel bedrag) of € 43,50 (altijd 2 decimalen)
function cmp(v,sign){const a=Math.round(Math.abs(v)*100)/100,whole=Math.abs(a-Math.round(a))<0.005;
  return (v<0?'−':sign&&v>0?'+':'')+'€ '+new Intl.NumberFormat('nl-NL',{minimumFractionDigits:whole?0:2,maximumFractionDigits:whole?0:2}).format(a)}
// zet bedragen verticaal als ze niet naast elkaar passen
// Vakken die opzij scrollen (grafiek in het vergrote scherm, brede tabellen op smalle schermen) moeten
// met het toetsenbord te scrollen zijn: zonder eigen knoppen/links erin krijgen ze tabindex=0 en een naam.
function markScrollers(){document.querySelectorAll('.cc-scroll,.tbl-wrap,.tbl-scroll,.rep-grid .card,.zoom .card').forEach(el=>{
  const scrolls=el.scrollWidth>el.clientWidth+1,hasFocus=!!el.querySelector('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])');
  if(scrolls&&!hasFocus){if(el.tabIndex!==0){el.tabIndex=0;el.setAttribute('role','region');
      const h=(el.closest('.card')?.querySelector('h2,h3')||el.closest('dialog')?.querySelector('h2'))?.textContent?.trim();el.setAttribute('aria-label',(el.classList.contains('cc-scroll')?'Grafiek':'Tabel')+(h?' '+h.toLowerCase():'')+', scroll opzij met de pijltjestoetsen')}}
  else if(el.getAttribute('role')==='region'){el.removeAttribute('tabindex');el.removeAttribute('role');el.removeAttribute('aria-label')}})}
function fitBars(){setTimeout(markScrollers,0);document.querySelectorAll('.bars,.cc').forEach(b=>{b.classList.remove('vt');const bar=b.querySelector('.bar,.cb');if(!bar)return;const w=bar.clientWidth;
  if([...b.querySelectorAll('em')].some(e=>e.scrollWidth>w+3))b.classList.add('vt')})}
window.addEventListener('resize',()=>{clearTimeout(window._fb);window._fb=setTimeout(fitBars,150)});
function bars(items,neutral){
  const mx=Math.max(1e-9,...items.map(i=>Math.abs(i.v||0))),neg=items.some(i=>i.v<0),vt=items.length>6;   // veel staven: ruimte houden voor verticale bedragen
  const lab=(v,c)=>Math.abs(v)<0.005?'':`<em class="m ${c}">${cmp(v,!neutral)}</em>`,H=v=>Math.max(1,Math.abs(v)/mx*(vt?50:78));
  return `${neutral&&items.some(i=>i.title)?`<p class="sr-only">${esc(seriesAlt(items,'Staafdiagram inleg',true))}</p>`:''}<div class="bars${neg?' neg':''}" aria-hidden="true">${items.map(i=>`<div class="bar" title="${esc(i.title||'')}">
    <div class="bp">${i.v>0?`${lab(i.v,neutral?'':'up')}<i class="${neutral?'n':'u'}" style="height:${H(i.v)}%"></i>`:''}</div>
    ${neg?`<div class="bn">${i.v<0?`<i class="d" style="height:${H(i.v)}%"></i>${lab(i.v,'down')}`:''}</div>`:''}<span>${i.label}</span></div>`).join('')}</div>`;
}
const monthStart=(y,m)=>new Date(y,m,1).getTime();
// Periodes voor rapporten: dag, week (ma–zo), maand, jaar — in lokale tijd
const PU={day:['Dag','dag',30],week:['Week','week',12],month:['Maand','maand',12],year:['Jaar','jaar',99]};
function pStart(u,ts){const d=new Date(ts);let s=new Date(d.getFullYear(),d.getMonth(),d.getDate());
  if(u==='week')s.setDate(s.getDate()-((s.getDay()+6)%7));else if(u==='month')s=new Date(d.getFullYear(),d.getMonth(),1);else if(u==='year')s=new Date(d.getFullYear(),0,1);return s.getTime()}
function pNext(u,ts){const s=new Date(ts);if(u==='day')s.setDate(s.getDate()+1);else if(u==='week')s.setDate(s.getDate()+7);else if(u==='month')s.setMonth(s.getMonth()+1);else s.setFullYear(s.getFullYear()+1);return s.getTime()}
function pList(u,from,to){const out=[];for(let s=pStart(u,from);s<=to;s=pNext(u,s))out.push(s);return out}
function isoWeek(d){const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));const w=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-w);return Math.ceil(((t-Date.UTC(t.getUTCFullYear(),0,1))/864e5+1)/7)}
function pLabel(u,ts,long){const d=new Date(ts);
  if(u==='day')return long?d.toLocaleDateString('nl-NL',{weekday:'short',day:'numeric',month:'short',year:'numeric'}):String(d.getDate());
  if(u==='week')return long?`Week ${isoWeek(d)} · ${d.toLocaleDateString('nl-NL',{day:'numeric',month:'short',year:'numeric'})}`:String(isoWeek(d));
  if(u==='month')return long?monthLbl(ts,{month:'long',year:'numeric'}):monthLbl(ts);
  return String(d.getFullYear())}
// rendementsreeks per periode (los van het rapportscherm, ook gebruikt door het vergrote scherm)
function retSeries(u,n){
  const S={};coinIds().forEach(id=>S[id]=coinStates(id));
  const hc=hasCashTx(),now=Date.now(),first=Math.min(...TX().map(txTime)),metric=o=>hc?o.total-o.dep:o.crypto-o.inv+o.real;
  const st=pList(u,first,now).slice(-n);let prev=snapshot(st[0],S);
  return st.map(a=>{const o=snapshot(Math.min(pNext(u,a),now),S),r={ts:a,v:metric(o)-metric(prev),end:hc?o.total:o.crypto,miss:o.missing.length>0||prev.missing.length>0};prev=o;return r});
}
const ZN={day:90,week:52,month:36,year:99};
function renderRetZoom(){
  const u=PU[settings.repRet]?settings.repRet:'month',[L,l]=PU[u],res=retSeries(u,ZN[u]),hc=hasCashTx();
  const tot=res.reduce((s,r)=>s+r.v,0),best=res.reduce((a,r)=>r.v>a.v?r:a,res[0]),worst=res.reduce((a,r)=>r.v<a.v?r:a,res[0]),pos=res.filter(r=>r.v>0.005).length;
  const many=u==='day'?'dagen':u==='week'?'weken':u==='month'?'maanden':'jaar';
  let cum=0;const rows=res.map(r=>({...r,cum:cum+=r.v})).reverse();
  let z=$('#zoom'),fresh=!z;if(!z){z=document.createElement('dialog');z.id='zoom';z.className='zoom';z.setAttribute('aria-labelledby','zoomTitle');z.addEventListener('cancel',e=>{e.preventDefault();closeZoom()});document.body.appendChild(z);document.body.style.overflow='hidden';zoomReturn=rememberFocus()}
  z.innerHTML=`<div class="zoom-in"><div class="zoom-top"><h2>Rendement per ${l}</h2><button type="button" class="icon-btn" data-act="zoomclose" aria-label="Sluiten"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
  ${pSeg('repRet',u)}
  <div class="zstats">
    <div class="stat"><div class="label">Totaal (${res.length} ${many})</div><div class="val m ${cls(tot)}">${signed(tot)}</div></div>
    <div class="stat"><div class="label">Gemiddeld per ${l}</div><div class="val m ${cls(tot)}">${signed(tot/res.length)}</div></div>
    <div class="stat"><div class="label">Beste ${l}</div><div class="val m up">${signed(best.v)}</div><div class="note-sm label">${pLabel(u,best.ts,true)}</div></div>
    <div class="stat"><div class="label">Slechtste ${l}</div><div class="val m ${cls(worst.v)}">${signed(worst.v)}</div><div class="note-sm label">${pLabel(u,worst.ts,true)}</div></div>
    <div class="stat"><div class="label">In de plus</div><div class="val">${pos} van ${res.length}</div><div class="note-sm label">${Math.round(pos/res.length*100)}% van de ${many}</div></div>
  </div>
  <div class="card">${retChart(res.map((r,i)=>({v:r.v,label:(res.length-1-i)%(u==='day'?7:u==='week'?4:1)?'':pLabel(u,r.ts),title:`${pLabel(u,r.ts,true)}: ${signed(r.v)}`})),{h:360,id:'zchart',minW:res.length*(u==='day'?18:30)})}
  <div class="zlegend"><span><i></i>Resultaat per ${l}</span><span><i class="ln"></i>Cumulatief resultaat</span></div>
  <p class="mt-8 hint">Koerswinst/-verlies plus gerealiseerde winst, min kosten. ${hc?'Stortingen':'Aankopen'} tellen niet als winst. Veeg of scroll de grafiek opzij voor eerdere periodes; op de laptop toont de muis op een staaf de details.</p></div>
  <div class="mt-14 card"><table class="rt"><caption class="sr-only">Rendement per ${l}</caption><tr><th scope="col">${L}</th><th scope="col">Resultaat</th><th scope="col">Cumulatief</th><th scope="col">${hc?'Totale waarde':'Waarde crypto'} aan eind</th></tr>
  ${rows.map((r,i)=>`<tr><th scope="row">${pTime(u,r.ts,true)}${i===0?' (tot nu)':''}</th><td class="m ${cls(r.v)}">${r.miss?'≈ ':''}${signed(r.v)}</td><td class="m ${cls(r.cum)}">${signed(r.cum)}</td><td class="m">${money(r.end,2)}</td></tr>`).join('')}</table>${rows.some(r=>r.miss)?'<p class="note-after hint">≈ = geen dagkoers bewaard; waarde geschat uit de dichtstbijzijnde bekende koersen (bijv. je eigen aankoopkoers).</p>':''}</div></div>`;
  titleDialog(z,'zoomTitle');if(fresh&&!z.open){try{z.showModal()}catch(e){z.setAttribute('open','')}}
  fitBars();const zc=$('#zchart');zc.scrollLeft=zc.scrollWidth;   // nieuwste periode in beeld
}
// Rendementsgrafiek met één y-as voor staven (resultaat per periode) én lijn (cumulatief)
function niceStep(raw){const p=10**Math.floor(Math.log10(raw)),r=raw/p;return (r<1.5?1:r<3?2:r<7?5:10)*p}
function retChart(items,o={}){
  const n=items.length;if(!n)return '';
  const H=o.h||200;let c=0;const cum=items.map(i=>c+=i.v);
  let lo=Math.min(0,...items.map(i=>i.v),...cum),hi=Math.max(0,...items.map(i=>i.v),...cum);if(hi-lo<1e-9)hi=lo+1;
  const pad=(hi-lo)*(n>6?0.28:0.14);if(hi>0)hi+=pad;if(lo<0)lo-=pad;   // ruimte voor de bedragen bij de staven
  const step=niceStep((hi-lo)/4),ticks=[];for(let t=Math.ceil(lo/step)*step;t<=hi+1e-9;t+=step)ticks.push(Math.abs(t)<step/1e6?0:t);
  lo=Math.min(lo,ticks[0]);hi=Math.max(hi,ticks[ticks.length-1]);
  const Y=v=>(hi-v)/(hi-lo)*100,y0=Y(0),w=100/n;
  const fmtT=v=>(v<0?'−':'')+'€ '+new Intl.NumberFormat('nl-NL',{maximumFractionDigits:step<1?2:0,minimumFractionDigits:step<1?2:0}).format(Math.abs(v));
  const bars=items.map((it,i)=>{const v=it.v,a=Math.min(Y(v),y0),h=Math.abs(Y(v)-y0),lab=Math.abs(v)<0.005?'':cmp(v,true);
    return `<div class="cb" style="left:${(i*w).toFixed(4)}%;width:${w.toFixed(4)}%" title="${esc(it.title||'')}"><i class="${v>=0?'u':'d'}" style="top:${a.toFixed(3)}%;height:${Math.max(h,0.4).toFixed(3)}%"></i>
      ${lab?`<em class="m ${v>=0?'up':'down'}" style="${v>=0?`bottom:calc(${(100-a).toFixed(3)}% + 2px)`:`top:calc(${(a+h).toFixed(3)}% + 2px)`}">${lab}</em>`:''}</div>`}).join('');
  const pts=cum.map((v,i)=>`${((i+0.5)*w*10).toFixed(2)},${Y(v).toFixed(3)}`).join(' ');
  const line=o.line===false?'':`<svg aria-hidden="true" focusable="false" class="cc-line" viewBox="0 0 1000 100" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="#f5b942" stroke-width="2.5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>
    <span class="cc-last m" style="top:${Y(cum[n-1]).toFixed(3)}%">${signed(cum[n-1])}</span>`;
  return `<p class="sr-only">${esc(seriesAlt(items,o.alt||'Staafdiagram rendement met cumulatieve lijn'))}</p><div class="cc" style="--h:${H}px"><div class="cc-axis" aria-hidden="true">${ticks.map(t=>`<span class="m" style="top:${Y(t).toFixed(3)}%">${fmtT(t)}</span>`).join('')}</div>
  <div class="cc-scroll"${o.id?` id="${o.id}"`:''}><div style="min-width:${o.minW||0}px"><div class="cc-plot" aria-hidden="true">${ticks.map(t=>`<div class="cc-grid${t===0?' z':''}" style="top:${Y(t).toFixed(3)}%"></div>`).join('')}${bars}${line}</div>
  <div class="cc-x" aria-hidden="true">${items.map((it,i)=>it.label?`<span style="left:${((i+0.5)*w).toFixed(3)}%">${it.label}</span>`:'').join('')}</div></div></div></div>`;
}
// lijn met het opgetelde resultaat over de staven heen (eigen schaal, zodat hij altijd goed zichtbaar is)
function cumLine(res){
  if(res.length<2)return '';
  let c=0;const cum=res.map(r=>c+=r.v),lo=Math.min(0,...cum),hi=Math.max(0,...cum),sp=hi-lo||1,n=res.length;
  const Y=v=>8+(1-(v-lo)/sp)*84,X=i=>(i+0.5)/n*1000;
  const pts=cum.map((v,i)=>`${X(i).toFixed(1)},${Y(v).toFixed(2)}`).join(' ');
  return `<svg aria-hidden="true" focusable="false" class="zc-line" viewBox="0 0 1000 100" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="#f5b942" stroke-width="2.5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>
  <div class="zc-line"><span class="zc-last m" style="top:${Y(cum[n-1]).toFixed(2)}%">${signed(cum[n-1])}</span></div>`;
}
let zoomReturn=null;
function closeZoom(){const z=$('#zoom');if(z){if(z.open)z.close();z.remove();document.body.style.overflow='';const r=zoomReturn;zoomReturn=null;restoreFocus(r)}}
const pSeg=(key,u)=>`<fieldset class="seg mini"><legend class="sr-only">Periode ${/Ret/.test(key)?'rendement':'inleg'}</legend>${Object.entries(PU).map(([k,v])=>`<button type="button" data-rp="${key}:${k}" class="${u===k?'on':''}">${v[0]}</button>`).join('')}</fieldset>`;
const monthLbl=(ts,o={month:'short'})=>new Date(ts).toLocaleDateString('nl-NL',o).replace('.','');
function repJanCard(){
  const S={};coinIds().forEach(id=>S[id]=coinStates(id));
  const hasCash=hasCashTx(),now=Date.now(),first=Math.min(...TX().map(txTime)),fd=new Date(first),nd=new Date(now);
  // 1. waarde op 1 januari
  const years=[];for(let y=fd.getFullYear()+1;y<=nd.getFullYear();y++)years.push(y);
  const jan=years.reverse().map(y=>({y,o:snapshot(new Date(y,0,1).getTime(),S)}));
  const janCard=`<div class="card"><h2 class="h3">Waarde op 1 januari</h2><p class="hint">De peildatum voor box 3 in je belastingaangifte. Controleer altijd de actuele regels en waarderingen bij de Belastingdienst.</p>
  ${jan.length?jan.map(({y,o})=>`<details><summary class="yr"><span>1 januari ${y}</span><b class="m">${o.missing.length?'≈ ':''}${money(o.total,2)}</b></summary><div class="yr-d">
    ${o.coins.map(c=>`<div><span>${esc(c.name||c.id)} · <span class="m">${qtyf(c.qty)}</span> ${esc((c.symbol||'').toUpperCase())}${c.price!=null?` à ${c.est?'≈ ':''}${money(c.price)}`:c.est?' · tegen aankoopwaarde':''}</span><span class="m">${c.est?'≈ ':''}${money(c.value,2)}</span></div>`).join('')}
    ${hasCash?`<div><span>Cash</span><span class="m">${money(o.cash,2)}</span></div>`:''}
    ${o.missing.length?`<p class="note-after hint">≈ Geen dagkoers bewaard voor ${o.missing.join(', ')}; geschat uit de dichtstbijzijnde bekende koersen.</p>`:''}</div></details>`).join('')
  :`<p class="hint">Je eerste peildatum is 1 januari ${nd.getFullYear()+1}.</p>`}</div>`;

  return janCard;
}
function repAccCard(){
  const hasCash=hasCashTx();
  // 5. per broker / wallet
  const acc=acctSummary(),named=acc.some(a=>a.name);
  const accCard=`<div class="card"><h2 class="h3">Per broker / wallet</h2>
  ${named?`<table class="rt"><caption class="sr-only">Waarde per broker of wallet</caption><tr><th scope="col">Broker / wallet</th><th scope="col">Crypto</th>${hasCash?'<th scope="col">Cash</th>':''}<th scope="col">Totaal</th></tr>${acc.map(a=>`<tr><th scope="row">${esc(a.name||'Niet ingevuld')}</th><td class="m">${a.miss?'≈ ':''}${money(a.crypto,2)}</td>${hasCash?`<td class="m">${money(a.cash,2)}</td>`:''}<td class="m"><b>${money(a.total,2)}</b></td></tr>`).join('')}</table>
  ${acc.map(a=>a.coins.length?`<details><summary class="yr"><span class="label">${esc(a.name||'Niet ingevuld')}: ${a.coins.length} munt${a.coins.length>1?'en':''}</span><span class="label">▾</span></summary><div class="yr-d">${a.coins.map(c=>`<div><span>${esc(c.name||c.id)} · <span class="m">${qtyf(c.qty)}</span> ${esc((c.symbol||'').toUpperCase())}</span><span class="m">${money(c.value,2)}</span></div>`).join('')}</div></details>`:'').join('')}
  ${acc.some(a=>a.coins.some(c=>c.qty<0)||a.cash<-0.005)?'<p class="warn">Een broker of wallet staat negatief: controleer of alle overboekingen en stortingen erin staan.</p>':''}`
  :'<p class="hint">Vul bij je transacties in bij welke broker of wallet ze horen; dan zie je hier per plek je bezit en cash.</p>'}</div>`;

  return accCard;
}
/* ---------- analyse: wat als (wens W1) en risico (wens W9) ---------- */
let wif={coin:'__all',pct:0};
const symOf=c=>(c.meta.symbol||'').toUpperCase()||c.meta.name||c.coinId;
const pct1=v=>v==null||!isFinite(v)?'–':(v<-0.05?'−':v>0.05?'+':'')+Math.abs(v).toFixed(1).replace('.',',')+'%';
const pct0=v=>v==null||!isFinite(v)?'–':Math.round(v)+'%';
function openCoins(){return coinIds().map(computeCoin).filter(c=>c.qty>1e-12&&c.price!=null&&c.cost>=0).sort((a,b)=>b.value-a.value)}
function whatIfCard(){
  const cs=openCoins();if(!cs.length)return '';
  if(wif.coin!=='__all'&&!cs.some(c=>c.coinId===wif.coin))wif.coin='__all';
  const one=cs.find(c=>c.coinId===wif.coin);
  return `<div class="card what-if"><h2 class="h3">Wat als…</h2><p class="hint">Verschuif de koers en zie wat je portfolio dan waard is en wanneer je quitte speelt. Er wordt niets opgeslagen.</p>
  <div class="field"><label for="wi_coin">Munt</label><select id="wi_coin"><option value="__all">Alle munten tegelijk (zelfde %)</option>${cs.map(c=>`<option value="${esc(c.coinId)}"${c.coinId===wif.coin?' selected':''}>${esc(c.meta.name||c.coinId)}</option>`).join('')}</select></div>
  <div class="field"><label for="wi_range">Koersverandering</label><input type="range" id="wi_range" min="-90" max="300" step="1" value="${Math.max(-90,Math.min(300,Math.round(wif.pct)))}"></div>
  <div class="two"><div class="field"><label for="wi_pct">Verandering (%)</label><input type="text" id="wi_pct" inputmode="decimal" value="${plainNum(+wif.pct.toFixed(2))}"></div>
  ${one?`<div class="field"><label for="wi_price">Koers ${esc(symOf(one))} (€)</label><input type="text" id="wi_price" inputmode="decimal" value="${plainNum(+(one.price*(1+wif.pct/100)).toPrecision(8))}"></div>`:''}</div>
  <output id="wi_out" class="ac-out" for="wi_coin wi_range wi_pct${one?' wi_price':''}" aria-live="polite"></output>
  <p class="hint mb-0">Onder elke munt staat de waarde dan. <b>Resultaat</b>: waarde min wat je voor je huidige bezit betaalde. <b>Break-even</b>: de koers waarbij je na verkoopkosten quitte speelt, met eronder hoeveel de koers daarvoor nog moet bewegen. Als verkoopkosten neemt de app je gemiddelde kostenpercentage bij aankopen, of 0,25% als dat onbekend is.</p></div>`}
function initWhatIf(){
  const card=$('.what-if');if(!card)return;
  const cs=openCoins(),p=portfolio(),one=cs.find(c=>c.coinId===wif.coin),out=$('#wi_out'),R=$('#wi_range'),P=$('#wi_pct'),X=$('#wi_price');
  const now=p.hasCash?p.total:p.value;
  const calc=()=>inEUR(()=>{const k=1+wif.pct/100;R.setAttribute('aria-valuetext',pct1(wif.pct));
    if(!(k>0)){out.innerHTML='<span class="warn-mark">Kies een verandering groter dan −100%.</span>';return}
    let dv=0;const rows=(one?[one]:cs).map(c=>{const pr=c.price*k,v=c.qty*pr,f=coinFeePct(c)/100,be=c.cost/(c.qty*(1-f));dv+=v-c.value;
      return{c,pr,v,res:v-c.cost,rp:c.cost>0?(v/c.cost-1)*100:null,be,beP:c.price>0?(be/c.price-1)*100:null}});
    let h=`<div class="kv"><div><span class="label">Portfoliowaarde nu</span><span class="m">${money(now,2)}</span></div>
      <div><span class="label">Portfoliowaarde dan</span><b class="m">${money(now+dv,2)} <span class="${cls(dv)}">(${signed(dv)})</span></b></div></div>
      <div class="tbl-scroll"><table class="rt mt-10"><caption class="sr-only">Per munt bij deze koers</caption><tr><th scope="col">Munt</th><th scope="col">Koers dan</th><th scope="col">Resultaat</th><th scope="col">Break-even</th></tr>
      ${rows.map(r=>`<tr><th scope="row">${esc(symOf(r.c))}<div class="note-xs label m"><span class="sr-only">waarde dan </span>${money(r.v,2)}</div></th><td class="m">${money(r.pr)}</td><td class="m ${cls(r.res)}">${signed(r.res)}<div class="note-xs">${pct(r.rp)}</div></td><td class="m">${money(r.be)}<div class="note-xs label">${r.beP==null?'':pct1(r.beP)+'<span class="sr-only"> vanaf nu</span>'}</div></td></tr>`).join('')}</table></div>`;
    if(one){const pr=one.price*k,lots=one.txs.filter(t=>isIn(t)&&one.lotMap[t.id]?.remaining>1e-12),buys=lots.filter(t=>t.type==='buy'),rec=lots.filter(t=>t.type!=='buy');
      const recQ=rec.reduce((s,t)=>s+one.lotMap[t.id].remaining,0);
      const lr=(when,q,unit,extra)=>{const r=q*(pr-unit);return `<tr><th scope="row">${when}${extra||''}</th><td class="m">${qtyf(+q.toPrecision(6))}</td><td class="m">${money(unit)}</td><td class="m ${cls(r)}">${signed(r)}<div class="note-xs">${unit>0?pct((pr/unit-1)*100):''}</div></td></tr>`};
      if(lots.length)h+=`<details class="mt-10 wi-lots"${wif.lotsOpen?' open':''}><summary>Per aankoop die je nog hebt (${buys.length}${rec.length?' + ontvangen':''})</summary><div class="tbl-scroll"><table class="rt"><caption class="sr-only">Resultaat per aankoop bij deze koers, volgens FIFO</caption><tr><th scope="col">Datum</th><th scope="col">Nog in bezit</th><th scope="col">Aankoop­koers</th><th scope="col">Resultaat dan</th></tr>
        ${buys.map(t=>lr(tm(t.date,new Date(t.date).toLocaleDateString('nl-NL',{day:'numeric',month:'short',year:'2-digit'})),one.lotMap[t.id].remaining,one.lotMap[t.id].unit)).join('')}${rec.length?lr('Ontvangen',recQ,0,`<div class="note-xs label">${rec.length}×</div>`):''}</table></div></details>`;}
    out.innerHTML=h;setTimeout(markScrollers,0)});
  const sync=src=>{if(src!==R)R.value=Math.max(-90,Math.min(300,Math.round(wif.pct)));if(src!==P)P.value=plainNum(+wif.pct.toFixed(2));if(X&&src!==X)X.value=plainNum(+(one.price*(1+wif.pct/100)).toPrecision(8));calc()};
  R.oninput=()=>{wif.pct=+R.value;sync(R)};
  P.oninput=()=>{const v=num(P.value);if(isFinite(v)&&P.value.trim()!==''){wif.pct=v;sync(P)}};
  if(X)X.oninput=()=>{const v=num(X.value);if(v>0){wif.pct=(v/one.price-1)*100;sync(X)}};
  card.addEventListener('toggle',e=>{if(e.target.matches?.('.wi-lots'))wif.lotsOpen=e.target.open},true);
  $('#wi_coin').onchange=e=>{wif.coin=e.target.value;render()};
  calc()}

// Dagkoersen van het afgelopen jaar uit het koersarchief, met de koers van nu als laatste punt
function dailySeries(id,days=365){const h=data.hist?.[id],d1=Math.floor(Date.now()/DAY),a=[];if(h)for(let d=d1-days;d<d1;d++)if(h[d]?.[1]>0)a.push([d,h[d][1]]);
  const p=prices[id]?.price;if(p>0)a.push([d1,p]);return a}
function riskOf(a){
  const r=[];for(let i=1;i<a.length;i++)if(a[i][0]-a[i-1][0]===1)r.push(Math.log(a[i][1]/a[i-1][1]));
  let peak=0,mdd=0;for(const [,v] of a){if(v>peak)peak=v;mdd=Math.min(mdd,v/peak-1)}
  const n=r.length,m=n?r.reduce((s,x)=>s+x,0)/n:0,sd=n>1?Math.sqrt(r.reduce((s,x)=>s+(x-m)**2,0)/(n-1)):0,hi=a.length?Math.max(...a.map(x=>x[1])):0;
  return{n,vol:n>=30?sd*Math.sqrt(365)*100:null,mdd:a.length>=30?mdd*100:null,fromHi:a.length>=30?(a[a.length-1][1]/hi-1)*100:null}}
// Je crypto als geheel, met de huidige verdeling teruggerekend over het afgelopen jaar
function pfRiskSeries(W){
  const S=W.map(x=>{const m=new Map(dailySeries(x.c.coinId));return{w:x.w,m}}),d1=Math.floor(Date.now()/DAY),a=[];let I=1,started=false;
  for(let d=d1-364;d<=d1;d++){let s=0,ws=0;for(const x of S){const p0=x.m.get(d-1),p1=x.m.get(d);if(p0>0&&p1>0){s+=x.w*(p1/p0-1);ws+=x.w}}
    if(ws>=0.5){if(!started){a.push([d-1,1]);started=true}I*=1+s/ws;a.push([d,I])}else if(started){a.push([d,I])}}
  return a}
let riskFetch={},riskQ=null;
function riskLoad(ids){
  const need=ids.filter(id=>!riskFetch[id]&&dailySeries(id).length<300);if(!need.length||riskQ)return !!riskQ;
  need.forEach(id=>riskFetch[id]=1);
  riskQ=(async()=>{for(const id of need){try{await fetchChart(id,'365',true)}catch(e){}}riskQ=null;if(/^#rapporten/.test(location.hash)&&repTab()==='analyse')render()})();return true}
function riskCard(){
  const cs=openCoins(),tot=cs.reduce((s,c)=>s+c.value,0);if(!cs.length||!(tot>0))return '';
  const loading=riskLoad(cs.map(c=>c.coinId));
  const W=cs.map(c=>({c,w:c.value/tot,r:riskOf(dailySeries(c.coinId))}));
  const top=W[0],top3=W.slice(0,3).reduce((s,x)=>s+x.w,0)*100,eff=1/W.reduce((s,x)=>s+x.w*x.w,0),P=riskOf(pfRiskSeries(W));
  const p=portfolio(),cashPct=p.hasCash&&p.total>0&&p.cash>0?p.cash/p.total*100:null,miss=W.some(x=>x.r.vol==null);
  const row=(name,share,r,b)=>`<tr><th scope="row">${b?`<b>${name}</b>`:name}</th><td class="m">${share}</td><td>${pct0(r.vol)}</td><td class="${r.mdd<0?'down':''}">${pct1(r.mdd)}</td><td>${pct1(r.fromHi)}</td></tr>`;
  return `<div class="card risk"><h2 class="h3">Risico</h2>
  <p class="risk-lead"><b>${pct0(top.w*100)}</b> van je crypto zit in ${esc(top.c.meta.name||symOf(top.c))}.${W.length>3?` Je grootste drie munten zijn samen <b>${pct0(top3)}</b>.`:''}${cashPct!=null?` Daarnaast is ${pct0(cashPct)} van je totale waarde cash.`:''}</p>
  <p class="hint">Gespreid over effectief <b>${eff.toFixed(1).replace('.',',')}</b> ${eff>=1.95?'munten':'munt'}: zoveel munten in gelijke delen geven dezelfde spreiding als jouw verdeling.</p>
  ${loading?'<p class="hint">Koersen van het afgelopen jaar ophalen…</p>':''}
  <div class="tbl-scroll"><table class="rt"><caption class="sr-only">Risico per munt over het afgelopen jaar</caption><tr><th scope="col">Munt</th><th scope="col">Aandeel</th><th scope="col">Beweeglijk­heid</th><th scope="col">Grootste daling</th><th scope="col">Nu onder top</th></tr>
  ${row('Je crypto samen','100%',P,true)}${W.map(x=>row(esc(symOf(x.c)),pct0(x.w*100),x.r)).join('')}</table></div>
  <p class="hint mb-0">Over het afgelopen jaar. <b>Beweeglijkheid</b>: hoe sterk de koers van dag tot dag schommelt, omgerekend naar een jaar (standaarddeviatie); hoger is onrustiger. <b>Grootste daling</b>: het grootste verlies van een top naar een later dal. <b>Nu onder top</b>: hoe ver de koers nu onder de hoogste koers van het jaar staat. "Je crypto samen" rekent met je huidige verdeling, alsof je die het hele jaar had gehad.${miss?' – = minder dan 30 dagen koersen bekend.':''}</p></div>`}
/* ---------- doelverdeling en herbalanceren (wens W3) ---------- */
// Eén doelverdeling per portefeuille: {id:'alloc-<pf>', items:{coinId|'__cash': procent}}
const allocOf=pf=>live(data.allocs).find(a=>a.id==='alloc-'+pf);
let rebMode='full',rebIn='';
const fmtPP=v=>(v<-0.05?'−':v>0.05?'+':'')+Math.abs(v).toFixed(1).replace('.',',')+'%-pt';
const pctTxt=v=>(Math.round(v*10)/10).toString().replace('.',',')+'%';
function allocKeyInfo(k){if(k==='__cash')return{name:'Cash',sym:'Cash'};const t=data.txs.find(x=>x.coinId===k)||{};return{name:t.name||k,sym:(t.symbol||'').toUpperCase()||t.name||k}}
function allocNow(){
  const p=portfolio(),hc=p.hasCash;
  const cur=[...openCoins().map(c=>({k:c.coinId,name:c.meta.name||c.coinId,sym:symOf(c),v:c.value})),...(hc?[{k:'__cash',name:'Cash',sym:'Cash',v:Math.max(0,p.cash)}]:[])];
  return{cur,total:cur.reduce((s,x)=>s+x.v,0),hc}}
function allocCard(){
  const head=a=>`<div class="row-between kv-h"><h2 class="h-inline h3">Doelverdeling</h2>${curPf()==='__all'?'':`<button type="button" class="link" data-act="editalloc">${a?'Wijzig':'+ Instellen'}</button>`}</div>`;
  if(curPf()==='__all')return `<div class="card">${head()}<p class="hint mb-0">Kies bovenaan één portefeuille om een doelverdeling in te stellen of te bekijken.</p></div>`;
  const a=allocOf(curPf()),{total}=allocNow();
  if(!a)return `<div class="card">${head()}<p class="hint mb-0">Leg vast hoe je je geld wilt verdelen, bijvoorbeeld 50% BTC, 30% ETH en 20% cash. Je ziet dan hoeveel je ervan afwijkt en hoeveel je per munt moet bij- of verkopen om weer in balans te komen.</p></div>`;
  if(!(total>0))return `<div class="card">${head(a)}<p class="hint mb-0">Je hebt nu nog geen bezit om te verdelen.</p></div>`;
  return `<div class="card alloc">${head(a)}
  <fieldset class="seg mini"><legend class="sr-only">Manier van herbalanceren</legend><button type="button" data-rebmode="full" class="${rebMode==='full'?'on':''}" aria-pressed="${rebMode==='full'}">Kopen en verkopen</button><button type="button" data-rebmode="buy" class="${rebMode==='buy'?'on':''}" aria-pressed="${rebMode==='buy'}">Alleen bijkopen</button></fieldset>
  <div class="field" id="rebInField"${rebMode==='buy'?'':' hidden'}><label for="reb_in">Bedrag dat je wilt inleggen (€)</label><input type="text" id="reb_in" inputmode="decimal" value="${esc(rebIn)}" placeholder="bijv. 200"></div>
  <output id="rebOut" class="ac-out" for="reb_in" aria-live="polite"></output>
  <p class="hint mb-0">Afwijking: verschil tussen nu en je doel, in procentpunten. Bedragen zonder transactiekosten. "Koop" en "Verkoop" openen het transactieformulier, al ingevuld; er wordt pas iets opgeslagen als jij op Opslaan tikt.</p></div>`}
function fillReb(){
  const out=$('#rebOut'),a=allocOf(curPf());if(!out||!a)return;
  inEUR(()=>{
  const {cur,total}=allocNow(),keys=[...new Set([...cur.map(x=>x.k),...Object.keys(a.items)])];
  const rows=keys.map(k=>{const c=cur.find(x=>x.k===k),inf=c||allocKeyInfo(k),v=c?.v||0,t=(a.items[k]||0)/100;return{k,name:inf.name,sym:inf.sym,v,t,now:v/total*100,tgt:t*100}}).filter(r=>r.t>0||r.v>0.005);
  let A=0;
  if(rebMode==='buy'){A=num(rebIn);if(!(A>0)){out.innerHTML=`${allocTable(rows,null)}<p class="hint">Vul hierboven het bedrag in dat je wilt inleggen; de app verdeelt het over de munten die het verst onder hun doel zitten.</p>`;return}
    const T=total+A;rows.forEach(r=>r.def=Math.max(0,r.t*T-r.v));const S=rows.reduce((s,r)=>s+r.def,0);
    rows.forEach(r=>r.d=S<=A?r.def+(A-S)*r.t:A*r.def/S)}
  else rows.forEach(r=>r.d=r.t*total-r.v);
  const buy=rows.filter(r=>r.k!=='__cash'&&r.d>=1).reduce((s,r)=>s+r.d,0),sell=rows.filter(r=>r.k!=='__cash'&&r.d<=-1).reduce((s,r)=>s-r.d,0);
  const worst=rows.reduce((m,r)=>Math.abs(r.now-r.tgt)>Math.abs(m.now-m.tgt)?r:m,rows[0]);
  out.innerHTML=`<p class="alloc-sum">${Math.abs(worst.now-worst.tgt)<1?'<span class="up">✓</span> Je zit overal binnen 1%-punt van je doel.':`Grootste afwijking: <b>${esc(worst.sym)}</b> ${fmtPP(worst.now-worst.tgt)}.`}${rebMode==='buy'?` Je legt <b class="m">${money(A,2)}</b> in.`:buy||sell?` Om in balans te komen: <b class="m">${money(buy,2)}</b> kopen${sell?` en <b class="m">${money(sell,2)}</b> verkopen`:''}.`:''}</p>${allocTable(rows,true)}`});
}
function allocTable(rows,act){
  return `<div class="tbl-scroll"><table class="rt"><caption class="sr-only">Huidige verdeling tegenover je doel${act?', met wat je moet kopen of verkopen':''}</caption><tr><th scope="col">Munt</th><th scope="col">Nu</th><th scope="col">Doel</th><th scope="col">Afwijking<span class="sr-only"> in procentpunten</span></th>${act?'<th scope="col">Actie</th>':''}</tr>
  ${rows.map(r=>{const dev=r.now-r.tgt;let ac='';
    if(act){if(r.k==='__cash')ac=Math.abs(r.d)<1?'–':`<span class="m">${r.d>0?'+':'−'}${money(Math.abs(r.d),2)}</span>`;
      else if(r.d>=1)ac=`<button type="button" class="link" data-act="rebtx" data-rtype="buy" data-coin-id="${esc(r.k)}" data-total="${(Math.round(r.d*100)/100)}">Koop ${money(r.d,2)}</button>`;
      else if(r.d<=-1)ac=`<button type="button" class="link sell-link" data-act="rebtx" data-rtype="sell" data-coin-id="${esc(r.k)}" data-total="${(Math.round(-r.d*100)/100)}">Verkoop ${money(-r.d,2)}</button>`;
      else ac='–'}
    return `<tr><th scope="row">${esc(r.sym)}${r.t===0?'<div class="note-xs label">geen doel</div>':''}</th><td class="m">${pctTxt(r.now)}<div class="note-xs label m">${money(r.v,2)}</div></td><td>${pctTxt(r.tgt)}</td><td class="${Math.abs(dev)<1?'':'warn-mark'}">${fmtPP(dev).replace('%-pt','')}</td>${act?`<td>${ac}</td>`:''}</tr>`}).join('')}</table></div>`}
function initAlloc(){
  const card=$('.alloc');if(!card)return;
  card.querySelectorAll('[data-rebmode]').forEach(b=>b.onclick=()=>{rebMode=b.dataset.rebmode;card.querySelectorAll('[data-rebmode]').forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-pressed',x===b)});
    $('#rebInField').hidden=rebMode!=='buy';fillReb();if(rebMode==='buy')$('#reb_in').focus()});
  const i=$('#reb_in');if(i)i.oninput=()=>{rebIn=i.value;fillReb()};
  fillReb()}
function openAlloc(){
  const a=allocOf(curPf()),{cur,total}=allocNow(),keys=cur.map(x=>x.k);if(a)for(const k in a.items)if(!keys.includes(k))keys.push(k);
  if(!keys.length){toast('Voeg eerst munten toe aan je portefeuille');return}
  const info=k=>cur.find(x=>x.k===k)||{...allocKeyInfo(k),v:0};
  openSheet(`<h2 class="h3">Doelverdeling${multiPf()?' – '+esc(pfName(curPf())):''}</h2><p class="mt-0 hint">Vul per munt het percentage in dat je wilt aanhouden. Samen moet het 100% zijn. Laat een munt op 0 als je hem helemaal wilt afbouwen.</p>
  <form class="js-form" novalidate>
  <div class="two"><button type="button" class="btn sec" data-allocfill="now">Huidige verdeling</button><button type="button" class="btn sec" data-allocfill="equal">Gelijk verdelen</button></div>
  ${keys.map((k,i)=>{const x=info(k);return `<div class="field alloc-f"><label for="al_${i}">${esc(x.name)}${x.sym&&x.sym!==x.name?` <span class="label">${esc(x.sym)}</span>`:''}<span class="label note-sm"> · nu ${total>0?pctTxt(x.v/total*100):'0%'}</span></label><input type="text" id="al_${i}" data-k="${esc(k)}" data-now="${total>0?(x.v/total*100).toFixed(1):0}" inputmode="decimal" value="${a?.items[k]!=null?plainNum(a.items[k]):''}" placeholder="0"></div>`}).join('')}
  <p class="alloc-total">Totaal: <output id="al_sum">0%</output></p>
  <button type="submit" class="btn" data-act="savealloc">Opslaan</button></form>
  ${a?'<button type="button" class="btn danger" data-act="delalloc">Doelverdeling verwijderen</button>':''}`);
  const ins=[...document.querySelectorAll('[id^="al_"][data-k]')],sum=()=>{const s=ins.reduce((t,i)=>t+(num(i.value)||0),0);$('#al_sum').textContent=pctTxt(s);$('#al_sum').className=Math.abs(s-100)<0.05?'up':'warn-mark'};
  ins.forEach(i=>i.oninput=sum);
  document.querySelectorAll('[data-allocfill]').forEach(b=>b.onclick=()=>{
    if(b.dataset.allocfill==='now')ins.forEach(i=>i.value=String(+i.dataset.now).replace('.',','));
    else{const n=ins.length,base=Math.floor(1000/n)/10;ins.forEach((i,j)=>i.value=String(j===0?Math.round((100-base*(n-1))*10)/10:base).replace('.',','))}
    // afronden kan net naast 100 uitkomen: verschil bij de grootste
    const s=ins.reduce((t,i)=>t+(num(i.value)||0),0);if(Math.abs(s-100)>=0.05&&ins.length){const big=ins.reduce((m,i)=>(num(i.value)||0)>(num(m.value)||0)?i:m);big.value=String(Math.round(((num(big.value)||0)+100-s)*10)/10).replace('.',',')}
    sum()});
  sum();ins[0]?.focus();
}
function saveAlloc(){
  const ins=[...document.querySelectorAll('[id^="al_"][data-k]')],items={};let s=0;
  for(const i of ins){const v=i.value.trim()===''?0:num(i.value);if(!(v>=0&&v<=100))return fieldErr(i.id,'Vul een percentage tussen 0 en 100 in');if(v>0)items[i.dataset.k]=v;s+=v}
  if(Math.abs(s-100)>=0.05)return fieldErr(ins[ins.length-1].id,`Samen is het nu ${pctTxt(s)}; dat moet 100% zijn`);
  const pf=curPf(),id='alloc-'+pf,L=data.allocs||(data.allocs=[]),e=L.find(x=>x.id===id),now=Date.now();
  if(e){e.items=items;e.mod=now;delete e.del}else L.push({id,items,mod:now,...(pf!=='main'?{pf}:{})});
  saveData();closeSheet();render();toast('Doelverdeling opgeslagen')}
function renderReports(){
  $('#topbar').innerHTML=topbarHTML(null,'Rapporten');
  const tab=repTab();if(settings.repTab!==tab){settings.repTab=tab;saveSettings()}
  const note=settings.unit&&settings.unit!=='EUR'?'<p class="hint rep-note">Rapporten staan altijd in euro, ook als je bedragen elders in '+(settings.unit==='USD'?'dollar':'bitcoin')+' bekijkt.</p>':'';
  const cols=(a,b)=>`${repTabsHTML(tab)}${note}<div class="rep-grid"><div class="rep-col">${a}</div><div class="rep-col">${b}</div></div>`;
  const ord0=(h,n)=>h.replace('<div class="card','<div style="order:'+n+'" class="card');
  if(tab==='plannen'){$('#view').innerHTML=cols(ord0(goalsCard(false),1)+ord0(allocCard(),3),ord0(plansCard(),2));initAlloc();return}
  if(!TX().length){$('#view').innerHTML=`${repTabsHTML(tab)}<div class="empty"><b>Nog geen gegevens</b>Voeg transacties toe om rapporten te zien.</div>`;return}
  if(tab==='analyse'){$('#view').innerHTML=cols(ord0(whatIfCard(),1)+ord0(benchCard(),3),ord0(riskCard(),2)+ord0(dcaCard(),4));initWhatIf();fitBars();return}
  if(tab==='administratie'){$('#view').innerHTML=cols(ord0(repAccCard(),1)+ord0(checkCard(),3),ord0(repJanCard(),2)+ord0(exportCard(),4));return}
  const S={};coinIds().forEach(id=>S[id]=coinStates(id));
  const p=portfolio(),hasCash=p.hasCash,now=Date.now(),first=Math.min(...TX().map(txTime)),fd=new Date(first),nd=new Date(now);
  const metric=o=>hasCash?o.total-o.dep:o.crypto-o.inv+o.real;   // resultaat tot dan toe (stortingen/aankopen tellen niet als winst)

  // 2. rendement per dag/week/maand/jaar
  const ru=PU[settings.repRet]?settings.repRet:'month',[RL,rl,RN]=PU[ru];
  const resFor=(u,n)=>{const st=pList(u,first,now).slice(-n);let prev=snapshot(st[0],S);
    return st.map(a=>{const o=snapshot(Math.min(pNext(u,a),now),S),r={ts:a,v:metric(o)-metric(prev),miss:o.missing.length>0||prev.missing.length>0};prev=o;return r})};
  const res=resFor(ru,RN),yrs=ru==='year'?null:resFor('year',99);
  const lblEvery=ru==='day'?5:1;
  const retCard=`<div class="card zoomable" data-act="zoomret"><button type="button" class="zoom-hint" data-act="zoomret">Vergroten <span aria-hidden="true">⤢</span></button><h2 class="h3">Rendement per ${rl}</h2>${pSeg('repRet',ru)}<p class="hint">Koerswinst/-verlies plus gerealiseerde winst, min kosten. ${hasCash?'Stortingen':'Aankopen'} tellen niet als winst.${ru==='day'?' Per dag rekent de app met de dagkoers uit het archief.':''}</p>
  ${retChart(res.map((r,i)=>({v:r.v,label:(res.length-1-i)%lblEvery?'':pLabel(ru,r.ts),title:`${pLabel(ru,r.ts,true)}: ${signed(r.v)}`})),{h:210})}
  <div class="legend-tight zlegend"><span><i></i>Resultaat per ${rl}</span><span><i class="ln"></i>Cumulatief</span></div>
  <table class="rt"><caption class="sr-only">Rendement per ${rl}</caption><tr><th scope="col">${RL}</th><th scope="col">Resultaat</th></tr>${[...res].reverse().map((r,i)=>`<tr><th scope="row">${pTime(ru,r.ts,true)}${i===0?' (tot nu)':''}</th><td class="m ${cls(r.v)}">${r.miss?'≈ ':''}${signed(r.v)}</td></tr>`).join('')}
  <tr><th scope="row"><b>Totaal deze ${res.length} ${ru==='day'?'dagen':ru==='week'?'weken':ru==='month'?'maanden':'jaar'}</b></th><td class="m ${cls(res.reduce((s,r)=>s+r.v,0))}"><b>${signed(res.reduce((s,r)=>s+r.v,0))}</b></td></tr></table>${res.some(r=>r.miss)?'<p class="note-after hint">≈ = geen dagkoers bewaard; waarde geschat uit de dichtstbijzijnde bekende koersen (bijv. je eigen aankoopkoers).</p>':''}
  ${yrs?`<table class="mt-10 rt"><caption class="sr-only">Rendement per jaar</caption><tr><th scope="col">Jaar</th><th scope="col">Resultaat</th></tr>${[...yrs].reverse().map((r,i)=>`<tr><th scope="row">${pTime('year',r.ts)}${i===0?' (tot nu)':''}</th><td class="m ${cls(r.v)}"><b>${signed(r.v)}</b></td></tr>`).join('')}</table>`:''}</div>`;

  // 3. beste en slechtste munt
  const perf=coinIds().map(computeCoin).map(c=>{const r=(c.unreal||0)+c.realized;return{c,r,pc:c.totalBought>0?r/c.totalBought*100:null}}).sort((a,b)=>b.r-a.r);
  const perfCard=`<div class="card"><h2 class="h3">Beste en slechtste munt</h2><p class="hint">Totaal resultaat per munt: ongerealiseerd + gerealiseerd, afgezet tegen alles wat je erin hebt gestoken.</p>
  <table class="rt"><caption class="sr-only">Beste en slechtste munt: resultaat in euro en procent</caption>${perf.map((x,i)=>`<tr class="clickable" data-coin="${esc(x.c.coinId)}"><td>${i===0&&perf.length>1?'🏆 ':i===perf.length-1&&perf.length>1?'↓ ':''}<a class="rowlink" href="#coin/${encodeURIComponent(x.c.coinId)}">${esc(x.c.meta.name)}</a></td><td class="m ${cls(x.r)}">${signed(x.r)}</td><td class="${cls(x.r)}">${pct(x.pc)}</td></tr>`).join('')}</table></div>`;

  // 4. inleg per dag/week/maand/jaar
  const iu=PU[settings.repIn]?settings.repIn:'month',[IL,il,IN]=PU[iu];
  const flowFor=(u,n)=>pList(u,first,now).slice(-n).map(a=>{const b=pNext(u,a);let v=0;for(const t of TX()){const tt=txTime(t);if(tt<a||tt>=b)continue;
    if(hasCash){if(t.type==='deposit')v+=t.amount;else if(t.type==='withdraw')v-=t.amount}else if(t.type==='buy')v+=txTotal(t);else if(t.type==='sell')v-=txTotal(t)}return{ts:a,v}});
  const avgOf=fl=>{const f=fl.findIndex(x=>Math.abs(x.v)>0.005),n=f<0?fl.length:fl.length-f;return{n,avg:fl.slice(-n).reduce((s,x)=>s+x.v,0)/n}};
  const inflow=flowFor(iu,IN),A=avgOf(inflow),M=avgOf(flowFor('month',12));   // vooruitblik altijd op basis van het maandgemiddelde
  const totalIn=hasCash?p.dep:p.cost,curVal=hasCash?p.total:p.value;
  const inCard=`<div class="card kv"><h2 class="h3">Inleg</h2>${pSeg('repIn',iu)}<p class="hint">${hasCash?'Netto gestort (stortingen − opnames)':'Netto gekocht (aankopen − verkopen)'} per ${il}.</p>
  ${bars(inflow.map((x,i)=>({v:x.v,label:(inflow.length-1-i)%(iu==='day'?5:1)?'':pLabel(iu,x.ts),title:`${pLabel(iu,x.ts,true)}: ${money(x.v,2)}`})),true)}
  <div><span class="label">Gemiddeld per ${il} (laatste ${A.n} ${iu==='day'?(A.n>1?'dagen':'dag'):iu==='week'?(A.n>1?'weken':'week'):iu==='month'?'mnd':'jaar'})</span><b class="m">${money(A.avg,2)}</b></div>
  <div><span class="label">Totaal ingelegd</span><b class="m">${money(totalIn,2)}</b></div>
  <div><span class="label">Inleg over 12 maanden bij huidig maandtempo</span><b class="m">${money(totalIn+M.avg*12,2)}</b></div>
  <div><span class="label">Waarde over 12 maanden bij gelijkblijvende koersen</span><b class="m">${money(curVal+M.avg*12,2)}</b></div></div>`;

    // Rendement: laptop links rendement en beste/slechtste munt, rechts inleg en kalender
  const ord=ord0;
  $('#view').innerHTML=cols(ord(retCard,1)+ord(perfCard,4),ord(inCard,2)+ord(calCard(),3));
  fitBars();
}
/* ---------- sinds je vorige bezoek ---------- */
// Bij het openen (of na ruim een uur weg) vergelijkt de app met de stand van je vorige bezoek.
let prevVisit=null,sinceDismissed=false;
function visitNow(){const p=portfolio(),P={};coinIds().forEach(id=>{const pr=prices[id]?.price;if(pr!=null)P[id]=pr});
  return{ts:Date.now(),total:p.hasCash?p.total:p.value,metric:p.hasCash?p.ret:p.value-p.cost+p.realized,prices:P,missing:p.missing}}
function devId(){if(!settings.dev){settings.dev=uid();saveSettings()}return settings.dev}   // herkent transacties die op dít apparaat zijn gemaakt
function getVisit(pf){const v=settings.visit;if(!v)return null;if(v.ts)return pf==='main'?v:null;return v[pf]||null}   // oud formaat: één bezoek
function setVisit(pf,val){let v=settings.visit;if(!v||v.ts)v=v?.ts?{main:v}:{};v[pf]=val;settings.visit=v}
function saveVisit(){if(locked||!TX().length)return;const v=visitNow();if(v.missing)return;delete v.missing;setVisit(curPf(),v);saveSettings()}
function sinceCard(){
  const v=prevVisit;if(!v||sinceDismissed||Date.now()-v.ts<3600e3)return '';
  // Resultaat = waardeverandering min wat je er sindsdien in stopte (stortingen, of zonder cash: aankopen − verkopen).
  // In bitcoin telt alles tegen de bitcoinkoers van het moment zelf (K).
  const n=visitNow(),k0=K(v.ts),hc=hasCashTx(),flow=TX().filter(t=>txTime(t)>v.ts).reduce((a,t)=>a+K(txTime(t))*(hc?cashEffect(t)[1]:t.type==='buy'?txTotal(t):t.type==='sell'?-txTotal(t):0),0);
  const vt=v.total*k0,dv=n.total-vt,dm=dv-flow;
  const mv=coinIds().map(computeCoin).filter(c=>c.qty>1e-12&&v.prices[c.coinId]&&c.price!=null).map(c=>{const b=v.prices[c.coinId]*k0;return {c,ch:(c.price/b-1)*100,eur:c.qty*(c.price-b)}}).sort((a,b)=>b.ch-a.ch);
  const hits=live(data.alerts).filter(a=>a.hit&&a.hit>v.ts),newTx=TX().filter(t=>(t.created||0)>v.ts&&t.dev!==devId()).length;
  const d=new Date(v.ts),dd=Math.round((pStart('day',Date.now())-pStart('day',v.ts))/864e5);
  const when=(dd===0?'vandaag':dd===1?'gisteren':dd<7?d.toLocaleDateString('nl-NL',{weekday:'long'}):d.toLocaleDateString('nl-NL',{day:'numeric',month:'short'}))+' '+d.toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'});
  const mvTxt=x=>`${esc((x.c.meta.symbol||'').toUpperCase())} <span class="${cls(x.ch)}">${pct(x.ch)}</span><span class="mv-eur label m ${cls(x.eur)}">${signed(x.eur)}</span>`;
  return `<div class="card since"><button type="button" class="x" data-act="sinceclose" aria-label="Sluiten">×</button><b>Sinds je vorige bezoek</b> <span class="label">(${when})</span>
  <div class="since-g">
    <div><span class="label">Waarde</span><b class="m">${money(n.total,2)}</b><span class="note-sm label m">was ${money(vt,2)}</span></div>
    <div><span class="label">Resultaat</span><b class="m ${cls(dm)}">${signed(dm)}</b><span class="note-sm label">${Math.abs(dv-dm)>0.005?`zonder ${hasCashTx()?'stortingen':'aankopen'}`:'koersverandering'}</span></div>
    <div><span class="label">Grootste stijger</span><b>${mv.length&&mv[0].ch>0.005?mvTxt(mv[0]):'–'}</b></div>
    <div><span class="label">Grootste daler</span><b>${mv.length&&mv[mv.length-1].ch<-0.005?mvTxt(mv[mv.length-1]):'–'}</b></div>
  </div>
  ${hits.length||newTx?`<p class="since-note hint">${hits.length?`🔔 ${hits.map(a=>`${esc(a.name)} ${a.dir==='above'?'boven':'onder'} ${money(a.price)}`).join(', ')}. `:''}${newTx?`${newTx} nieuwe transactie${newTx>1?'s':''} (bijv. van een ander apparaat).`:''}</p>`:''}</div>`;
}

/* ---------- rendementskalender ---------- */
function retRange(u,from,to){   // resultaat per periode voor periodes die beginnen tussen from en to
  const S={};coinIds().forEach(id=>S[id]=coinStates(id));
  const hc=hasCashTx(),now=Date.now(),metric=o=>hc?o.total-o.dep:o.crypto-o.inv+o.real;
  const st=pList(u,from,to).filter(a=>a<=now);if(!st.length)return[];let prev=snapshot(st[0],S);
  return st.map(a=>{const o=snapshot(Math.min(pNext(u,a),now),S),r={ts:a,v:metric(o)-metric(prev),miss:o.missing.length>0};prev=o;return r});
}
function calCard(){
  const now=Date.now(),cur=pStart('month',now),minM=pStart('month',Math.min(...TX().map(txTime)));
  let m=+settings.calMonth||cur;if(m>cur)m=cur;if(m<minM)m=minM;
  const first=Math.min(...TX().map(txTime)),res=retRange('day',m,pNext('month',m)-1),by={};res.forEach(r=>by[r.ts]=r);
  const mx=Math.max(1e-9,...res.map(r=>Math.abs(r.v))),tot=res.reduce((s,r)=>s+r.v,0),pos=res.filter(r=>r.v>0.005).length,neg=res.filter(r=>r.v<-0.005).length;
  const lead=(new Date(m).getDay()+6)%7,days=pList('day',m,pNext('month',m)-1),today=pStart('day',now);
  const cell=ts=>{const r=by[ts],dn=new Date(ts).getDate();
    if(ts>now||ts<pStart('day',first))return `<div class="cd f"><span class="n">${dn}</span></div>`;
    const v=r?r.v:0,a=0.12+0.68*Math.min(1,Math.abs(v)/mx),rgb=v>0?[31,209,122]:[255,90,95];
    let bg='';if(Math.abs(v)>=0.005){const base=hexRgb(getComputedStyle(document.body).getPropertyValue('--card').trim()||'#151922'),mix=rgb.map((c,i)=>Math.round(a*c+(1-a)*base[i]));
      bg=`background:rgb(${mix});color:${bestText(mix)}`}
    return `<div class="cd${ts===today?' today':''}${bg?' c':''}" style="${bg}" title="${pLabel('day',ts,true)}: ${signed(v)}"><span class="n">${dn}</span><span class="v m">${Math.abs(v)<0.005?'':(v>0?'+':'−')+new Intl.NumberFormat('nl-NL',{minimumFractionDigits:Math.abs(v)>=100?0:2,maximumFractionDigits:Math.abs(v)>=100?0:2}).format(Math.abs(v))}</span></div>`};
  return `<div class="card"><h2 class="h3">Rendementskalender</h2><p class="hint">Resultaat per dag in euro's: groen is winst, rood is verlies. Hoe feller, hoe groter.</p>
  <div class="cal-nav"><button type="button" data-cal="-1" ${m<=minM?'disabled':''} aria-label="Vorige maand">‹</button><b>${monthLbl(m,{month:'long',year:'numeric'})}</b><button type="button" data-cal="1" ${m>=cur?'disabled':''} aria-label="Volgende maand">›</button></div>
  <div class="cal">${['ma','di','wo','do','vr','za','zo'].map(d=>`<div class="h">${d}</div>`).join('')}${'<div class="cd e"></div>'.repeat(lead)}${days.map(cell).join('')}</div>
  <div class="mt-10 kv"><div><span class="label">Totaal ${monthLbl(m,{month:'long'})}</span><b class="m ${cls(tot)}">${signed(tot)}</b></div>
  <div><span class="label">Dagen in de plus / min</span><b><span class="up">${pos}</span> / <span class="down">${neg}</span></b></div></div></div>`;
}

/* ---------- exporteren ---------- */
function download(name,text,mime){const b=new Blob([text],{type:mime}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000)}
// CSV voor Nederlandse Excel: puntkomma als scheidingsteken, komma als decimaalteken, UTF-8 met BOM
function exportCSV(list,name){
  const n=v=>v==null||v===''?'':String(+(+v).toPrecision(15)).replace('.',','),q=v=>{v=String(v??'');return /[;"\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
  const rows=[['Datum','Tijd','Type','Munt','Symbool','Aantal','Koers (EUR)','Totaal (EUR)','Kosten (EUR)','Netwerkkosten (munt)','Broker/wallet','Naar','Notitie','ID']];
  for(const t of [...list].sort((a,b)=>a.date.localeCompare(b.date))){
    const cash=isCash(t.type);
    rows.push([t.date.slice(0,10),t.date.slice(11,19),TYPE_L[t.type],cash?'Cash':t.name,cash?'EUR':(t.symbol||'').toUpperCase(),cash?'':n(t.qty),cash||isOther(t.type)?'':n(t.price),
      cash?n(t.amount):isOther(t.type)?'':n(Math.round(txTotal(t)*100)/100),n(t.fee||''),t.feeQty?n(t.feeQty):'',t.acct||'',t.to||'',t.note||'',t.id]);
  }
  download(name||`crypto-transacties-${new Date().toISOString().slice(0,10)}.csv`,'﻿'+rows.map(r=>r.map(q).join(';')).join('\r\n'),'text/csv;charset=utf-8');
}
// Jaaroverzicht: opgemaakt om af te drukken of als PDF op te slaan (via het printvenster)
function printYear(Y){
  const S={};coinIds().forEach(id=>S[id]=coinStates(id));
  const a=new Date(Y,0,1).getTime(),bEnd=new Date(Y+1,0,1).getTime(),now=Date.now(),isCur=bEnd>now,b=isCur?now:bEnd;
  const o1=snapshot(a,S),o2=snapshot(b,S),hc=hasCashTx(),metric=o=>hc?o.total-o.dep:o.crypto-o.inv+o.real;
  const inY=TX().filter(t=>{const tt=txTime(t);return tt>=a&&tt<bEnd}).sort((x,y)=>x.date.localeCompare(y.date));
  let real=0,fees=0,dep=0,wd=0,buy=0,sell=0;
  for(const id of coinIds()){const c=computeCoin(id);for(const t of c.txs){const tt=txTime(t);if(tt<a||tt>=bEnd)continue;const si=c.sellInfo[t.id];if(si?.pl!=null)real+=si.pl}}
  for(const t of inY){fees+=t.fee||0;if(t.type==='deposit')dep+=t.amount;else if(t.type==='withdraw')wd+=t.amount;else if(t.type==='buy')buy+=txTotal(t);else if(t.type==='sell')sell+=txTotal(t)}
  const dl=ts=>new Date(ts).toLocaleDateString('nl-NL',{day:'numeric',month:'long',year:'numeric'});
  const snapT=(o,label)=>`<h2>${label}</h2><table><caption class="sr-only">${label}</caption><tr><th scope="col">Munt</th><th scope="col">Aantal</th><th scope="col">Koers</th><th scope="col">Waarde</th></tr>
    ${o.coins.map(c=>`<tr><td>${esc(c.name||c.id)} (${esc((c.symbol||'').toUpperCase())})</td><td>${qtyf(c.qty)}</td><td>${c.price!=null?(c.est?'≈ ':'')+money(c.price):'aankoopwaarde'}</td><td>${c.est?'≈ ':''}${money(c.value,2)}</td></tr>`).join('')}
    ${hc?`<tr><td>Cash</td><td></td><td></td><td>${money(o.cash,2)}</td></tr>`:''}
    <tr class="tot"><td>Totaal</td><td></td><td></td><td>${money(hc?o.total:o.crypto,2)}</td></tr></table>${o.missing.length?`<p class="sm">≈ Geen dagkoers bewaard voor ${o.missing.join(', ')}; geschat uit de dichtstbijzijnde bekende koersen.</p>`:''}`;
  let el=$('#print');if(!el){el=document.createElement('div');el.id='print';document.body.appendChild(el)}
  el.innerHTML=`<h1>Crypto Portfolio · Jaaroverzicht ${Y}</h1><div class="sm">Gemaakt op ${dl(now)}${isCur?' · lopend jaar, eindstand is vandaag':''}</div>
  ${snapT(o1,`Stand op 1 januari ${Y} (peildatum)`)}
  ${snapT(o2,isCur?`Stand vandaag (${dl(now)})`:`Stand op 1 januari ${Y+1}`)}
  <h2>Samenvatting ${Y}</h2><table><caption class="sr-only">Samenvatting ${Y}</caption>
    ${hc?`<tr><td>Gestort</td><td>${money(dep,2)}</td></tr><tr><td>Opgenomen</td><td>${money(wd,2)}</td></tr>`:''}
    <tr><td>Gekocht (incl. kosten)</td><td>${money(buy,2)}</td></tr><tr><td>Verkocht (na kosten)</td><td>${money(sell,2)}</td></tr>
    <tr><td>Betaalde transactiekosten</td><td>${money(fees,2)}</td></tr>
    <tr><td>Gerealiseerde winst/verlies (FIFO)</td><td>${signed(real)}</td></tr>
    <tr class="tot"><td>Rendement ${Y}${isCur?' (tot nu)':''}</td><td>${signed(metric(o2)-metric(o1))}</td></tr></table>
  <h2>Transacties ${Y} (${inY.length})</h2><table><caption class="sr-only">Alle transacties in ${Y}</caption><tr><th scope="col">Datum</th><th scope="col">Type</th><th scope="col">Munt</th><th scope="col">Aantal</th><th scope="col">Koers</th><th scope="col">Totaal</th><th scope="col">Kosten</th><th scope="col">Broker/wallet</th></tr>
    ${inY.map(t=>`<tr><td>${new Date(t.date).toLocaleDateString('nl-NL')}</td><td>${TYPE_L[t.type]}</td><td>${isCash(t.type)?'Cash':esc((t.symbol||'').toUpperCase())}</td><td>${isCash(t.type)?'':qtyf(t.qty)}</td><td>${isCash(t.type)||isOther(t.type)?'':priceH(t.price)}</td><td>${isCash(t.type)?money(t.amount,2):isOther(t.type)?'':money(txTotal(t),2)}</td><td>${t.type==='transfer'?(t.feeQty?qtyf(t.feeQty)+' '+esc((t.symbol||'').toUpperCase()):''):t.fee?money(t.fee,2):''}</td><td>${esc(t.type==='transfer'?`${t.acct||''} → ${t.to||''}`:t.acct||'')}</td></tr>`).join('')}</table>
  <p class="print-foot sm">Waarden op basis van dagkoersen (CoinGecko) uit het koersarchief van de app. Dit overzicht is een hulpmiddel, geen fiscaal advies; controleer de regels van de Belastingdienst.</p>`;
  document.body.classList.add('printing');
  const done=()=>{document.body.classList.remove('printing');window.removeEventListener('afterprint',done)};
  window.addEventListener('afterprint',done);setTimeout(()=>window.print(),50);
}
function exportCard(){
  const ys=[...new Set(TX().map(t=>+t.date.slice(0,4)))].sort((a,b)=>b-a);
  return `<div class="card"><h2 class="h3">Exporteren</h2><p class="hint">Je transacties voor Excel, of een jaaroverzicht om te bewaren of af te drukken (kies "Opslaan als PDF" in het printvenster).</p>
  <div class="export-row"><label class="sr-only" for="py">Jaar voor het jaaroverzicht</label><select class="bench-sel" id="py">${ys.map(y=>`<option>${y}</option>`).join('')}</select>
  <button type="button" class="btn-inline btn sec" data-act="printyear">Jaaroverzicht (PDF)</button>
  <button type="button" class="btn-inline btn sec" data-act="csvall">Transacties (CSV)</button></div></div>`;
}

/* ---------- controle van je gegevens ---------- */
function dataIssues(){
  const out=[],p=portfolio(),d=ts=>new Date(ts).toLocaleDateString('nl-NL',{day:'numeric',month:'short',year:'numeric'}),S=t=>esc((t.symbol||'').toUpperCase());
  if(p.hasCash&&p.cash<-0.005)out.push({lvl:'warn',t:`Je cash staat negatief (${money(p.cash,2)}). Er ontbreekt een storting, of een aankoop of de kosten zijn te hoog ingevoerd.`,act:'cashtx'});
  for(const a of acctSummary()){
    if(a.hasCash&&a.cash<-0.005&&Math.abs(a.cash-p.cash)>0.005)out.push({lvl:'warn',t:`${esc(a.name||'Zonder broker/wallet')}: cash staat negatief (${money(a.cash,2)}).`,act:'cashtx'});
    for(const c of a.coins)if(c.qty<-1e-9)out.push({lvl:'warn',t:`${esc(a.name||'Zonder broker/wallet')}: ${qtyf(c.qty)} ${esc((c.symbol||'').toUpperCase())}, dat kan niet. Controleer de overboekingen van en naar deze plek.`});
  }
  if(accounts().length){const noA=TX().filter(t=>!t.acct);if(noA.length)out.push({lvl:'info',t:`${noA.length} transactie${noA.length>1?'s hebben':' heeft'} geen broker/wallet. Die tellen apart mee als "Niet ingevuld" in het overzicht per broker; vul de broker in voor een kloppende stand per plek.`,tx:noA.length===1?noA[0].id:undefined})}
  for(const id of coinIds()){const c=computeCoin(id);
    for(const t of c.txs)if(c.sellInfo[t.id]?.oversold)out.push({lvl:'warn',t:`Verkoop ${qtyf(t.qty)} ${S(t)} op ${d(txTime(t))}: meer verkocht dan je op dat moment had.`,tx:t.id});
    if(c.qty>1e-12&&c.price==null)out.push({lvl:'info',t:`Nog geen actuele koers voor ${esc(c.meta.name)}. Klopt de munt-koppeling?`});
  }
  const off=TX().filter(t=>(t.type==='buy'||t.type==='sell')&&Math.abs(txTotal(t)*100-Math.round(txTotal(t)*100))>1e-6);
  off.slice(0,5).forEach(t=>out.push({lvl:'warn',t:`${esc(t.name)} op ${d(txTime(t))}: totaal ${plainNum(txTotal(t))} is geen heel bedrag in centen. Neem het betaalde bedrag over van je afschrift.`,tx:t.id}));
  if(off.length>5)out.push({lvl:'warn',t:`En nog ${off.length-5} transactie${off.length-5>1?'s':''} met een totaal dat niet op hele centen uitkomt (zie ≈ bij Transacties).`});
  TX().filter(t=>txTime(t)>Date.now()+6e4).forEach(t=>out.push({lvl:'warn',t:`${TYPE_L[t.type]} ${isCash(t.type)?money(t.amount,2):esc(t.name)} heeft een datum in de toekomst (${d(txTime(t))}).`,tx:t.id}));
  const seen={};for(const t of TX()){const k=[t.type,t.coinId,t.qty??t.amount,t.date.slice(0,16)].join('|');if(seen[k])out.push({lvl:'info',t:`Mogelijk dubbel ingevoerd: ${TYPE_L[t.type]} ${isCash(t.type)?money(t.amount,2):qtyf(t.qty)+' '+S(t)} op ${d(txTime(t))}.`,tx:t.id});seen[k]=1}
  TX().filter(t=>t.type==='receive'&&/externe wallet/i.test(t.note||'')).slice(0,3).forEach(t=>out.push({lvl:'info',t:`${qtyf(t.qty)} ${S(t)} van een externe wallet (${d(txTime(t))}) staat op aankoopprijs € 0. Was dit een aankoop elders, voer die dan in als Koop.`,tx:t.id}));
  if(syncState.s==='err')out.push({lvl:'info',t:`GitHub-synchronisatie mislukt: ${esc(syncState.msg)}.`,act:'settings'});
  if(data.txs.length&&!(settings.gh.token&&settings.gh.repo)&&Date.now()-(settings.lastExport||0)>60*864e5)out.push({lvl:'info',t:'Je gegevens staan alleen op dit apparaat. Maak een back-up of zet GitHub-synchronisatie aan.',act:'export'});
  return out;
}
function issuesList(list){return list.map(i=>{const el=i.tx||i.act?'button':'div';return `<${el}${el==='button'?' type="button"':''} class="iss ${i.lvl}"${i.tx?` data-tx="${esc(i.tx)}"`:i.act?` data-act="${i.act}"`:''}><b aria-hidden="true">${i.lvl==='warn'?'⚠':'ℹ'}</b><span>${i.lvl==='warn'?'<span class="sr-only">Waarschuwing: </span>':''}${i.t}</span>${i.tx||i.act?'<span class="go" aria-hidden="true">›</span>':''}</${el}>`}).join('')}
function issuesBanner(){const w=dataIssues().filter(i=>i.lvl==='warn');return w.length?`<button type="button" class="banner" data-act="issues"><b>⚠</b><span>${w.length} aandachtspunt${w.length>1?'en':''} in je gegevens</span><span>Bekijken</span></button>`:''}
function checkCard(){const l=dataIssues();return `<div class="card"><h2 class="h3">Controle</h2>${l.length?`<p class="hint">De app controleert je gegevens op dingen die niet kloppen. Tik op een punt om het te bekijken.</p>${issuesList(l)}`:'<p class="mb-0 hint"><span class="up">✓ Alles klopt.</span> Geen negatieve saldi, afrondingsverschillen of dubbele transacties gevonden.</p>'}</div>`}
function openIssues(){openSheet(`<h2 class="h3">Controle</h2>${issuesList(dataIssues())||'<p class="hint">Alles klopt.</p>'}`)}

/* ---------- doelen ---------- */
// Doel: streefbedrag op een datum. Voortgang = je huidige waarde (crypto + cash als je cash bijhoudt).
function monthlyInflow(){   // gemiddelde netto inleg per maand over de laatste 12 maanden
  const hc=hasCashTx(),now=Date.now(),a=pStart('month',now),from=new Date(a);from.setMonth(from.getMonth()-11);let v=0,firstT=Infinity;
  for(const t of TX()){const tt=txTime(t);if(hc?isCash(t.type):(t.type==='buy'||t.type==='sell')){firstT=Math.min(firstT,tt);if(tt>=from.getTime())v+=hc?(t.type==='deposit'?t.amount:-t.amount):(t.type==='buy'?txTotal(t):-txTotal(t))}}
  if(!isFinite(firstT))return 0;
  const months=Math.min(12,Math.max(1,(new Date(now).getFullYear()-new Date(Math.max(firstT,from.getTime())).getFullYear())*12+new Date(now).getMonth()-new Date(Math.max(firstT,from.getTime())).getMonth()+1));
  return v/months;
}
function goalsHTML(compact){
  const gl=live(data.goals).filter(pfMatch).sort((a,b)=>a.date.localeCompare(b.date));if(!gl.length)return '';
  const p=portfolio(),cur=p.hasCash?p.total:p.value,avg=monthlyInflow(),nd=new Date();
  return gl.map(g=>{
    const [y,m]=g.date.split('-').map(Number),left=Math.max(0,(y-nd.getFullYear())*12+(m-1-nd.getMonth())),pc=Math.max(0,Math.min(100,cur/g.target*100)),done=cur>=g.target;
    const need=done?0:(g.target-cur)/Math.max(1,left);
    const when=new Date(y,m-1,1).toLocaleDateString('nl-NL',{month:'long',year:'numeric'});
    const status=done?'<span class="up">Behaald 🎉</span>':left===0?'<span class="down">Deadline is deze maand</span>':avg>=need?`<span class="up">Op schema</span> bij je huidige inleg van <span class="m">${money(avg,2)}</span>/mnd`:`Nodig: <span class="m">${money(need,2)}</span>/mnd · je legt nu <span class="m">${money(avg,2)}</span>/mnd in`;
    return `<div class="goal" data-goal="${esc(g.id)}"><div class="goal-top"><button type="button" class="rowlink"><b>${esc(g.name||'Doel')}</b><span class="sr-only"> – doel bewerken</span></button><span class="label">${when}</span></div>
      <div class="gbar"><i class="${done?'done':''}" style="width:${pc.toFixed(1)}%"></i></div>
      <div class="goal-top"><span class="label"><span class="m">${money(cur,2)}</span> van <span class="m">${money(g.target,0)}</span> · ${pc.toFixed(0)}%</span></div>
      ${compact?'':`<div class="goal-status label">${status}${!done&&left>0?` · nog ${left} maand${left>1?'en':''}`:''}</div>`}</div>`}).join('');
}
function goalsCard(compact){
  const h=goalsHTML(compact);
  if(compact&&!h)return '';
  return `<div class="card"><div class="row-between kv-h"><h2 class="h-inline h3">Doelen</h2><button type="button" class="link" data-act="addgoal">+ Doel</button></div>
  ${h||'<p class="note-after hint">Stel een doel in, bijvoorbeeld € 5.000 in december 2027. Je ziet dan je voortgang en wat je per maand moet inleggen (bij gelijkblijvende koersen).</p>'}
  ${h&&!compact?'<p class="note-after hint">"Nodig per maand" gaat uit van gelijkblijvende koersen.</p>':''}</div>`;
}
function openGoal(id){
  const g=id?(data.goals||[]).find(x=>x.id===id):null,d=new Date();d.setFullYear(d.getFullYear()+1);
  openSheet(`<h2 class="h3">${g?'Doel bewerken':'Nieuw doel'}</h2><form class="js-form" novalidate>
  <div class="field"><label for="g_name">Naam</label><input type="text" id="g_name" value="${esc(g?.name||'')}" placeholder="bijv. Eerste € 5.000"></div>
  <div class="two"><div class="field"><label for="g_target">Streefbedrag (€)</label><input type="text" id="g_target" inputmode="decimal" value="${g?plainNum(g.target):''}" placeholder="5000"></div>
  <div class="field"><label for="g_date">Te halen in</label><input id="g_date" type="month" value="${esc(g?.date||d.toISOString().slice(0,7))}"></div></div>
  <button type="submit" class="btn" data-act="savegoal" data-id="${esc(g?.id||'')}">Opslaan</button></form>
  ${g?`<button type="button" class="btn danger" data-act="delgoal" data-id="${esc(g.id)}">Doel verwijderen</button>`:''}`);
}
function saveGoal(id){
  const target=num($('#g_target').value),date=$('#g_date').value;
  if(!(target>0))return fieldErr('g_target','Vul een streefbedrag in');if(!/^\d{4}-\d{2}$/.test(date))return fieldErr('g_date','Kies een maand');
  const now=Date.now(),name=$('#g_name').value.trim(),e=id&&(data.goals||[]).find(x=>x.id===id);
  if(e)Object.assign(e,{name,target,date,mod:now});else(data.goals||(data.goals=[])).push({id:uid(),name,target,date,mod:now,...(pfNew()!=='main'?{pf:pfNew()}:{})});
  saveData();closeSheet();render();toast('Doel opgeslagen');
}

/* ---------- vaste maandelijkse inleg (DCA) ---------- */
// Een plan = "elke maand € X in munt Y". Per maand wordt bijgehouden of de aankoop is ingevoerd of overgeslagen.
const ymOf=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
const ymLabel=ym=>{const [y,m]=ym.split('-').map(Number);return new Date(y,m-1,1).toLocaleDateString('nl-NL',{month:'long',year:'numeric'})};
function planMonths(pl){   // maanden vanaf de start t/m nu waarin de plandag al geweest is
  const out=[],now=new Date(),[sy,sm]=pl.start.split('-').map(Number);
  for(let d=new Date(sy,sm-1,1);d<=now;d.setMonth(d.getMonth()+1)){const ym=ymOf(d);if(ym===ymOf(now)&&now.getDate()<pl.day)break;out.push(ym)}
  return out}
const planOpen=pl=>planMonths(pl).filter(ym=>!pl.done?.[ym]);
const coinChoices=()=>{const m=new Map();coinIds().forEach(id=>{const c=computeCoin(id);m.set(id,{id,name:c.meta.name,symbol:c.meta.symbol,image:c.meta.image})});
  live(data.watch).forEach(w=>{if(!m.has(w.id))m.set(w.id,{id:w.id,name:w.name,symbol:w.symbol,image:w.image})});return [...m.values()].sort((a,b)=>(a.name||'').localeCompare(b.name||''))};
function planDueCard(){   // herinnering op het overzicht
  const due=live(data.plans).filter(pfMatch).map(pl=>({pl,open:planOpen(pl)})).filter(x=>x.open.length);if(!due.length)return '';
  return `<div class="card plan-due"><h2 class="h3">Vaste inleg</h2>${due.map(({pl,open})=>`<div class="row-between plan-row">
    <span><b class="m">${money(pl.amount,2)}</b> ${esc(pl.name)} <span class="label">voor ${ymLabel(open[0])}${open.length>1?` (nog ${open.length-1} maand${open.length>2?'en':''} open)`:''}</span></span>
    <span class="plan-btns"><button type="button" class="btn-inline btn sec" data-act="planskip" data-id="${esc(pl.id)}" data-ym="${open[0]}">Overslaan</button><button type="button" class="btn-inline btn" data-act="plando" data-id="${esc(pl.id)}" data-ym="${open[0]}">Invoeren</button></span></div>`).join('')}
    <p class="note-after hint">"Invoeren" opent het formulier, vooraf ingevuld met het bedrag, de plandag en de koers van die dag. Neem bij voorkeur de exacte bedragen van je afschrift over.</p></div>`}
function plansCard(){   // beheer in Rapporten
  const pls=live(data.plans).filter(pfMatch);
  return `<div class="card"><div class="row-between kv-h"><h2 class="h-inline h3">Vaste inleg</h2><button type="button" class="link" data-act="addplan">+ Plan</button></div>
  ${pls.length?pls.map(pl=>{const ms=planMonths(pl),n=ms.filter(ym=>pl.done?.[ym]&&pl.done[ym]!=='skip').length,o=ms.filter(ym=>!pl.done?.[ym]).length;
    return `<div class="goal" data-plan="${esc(pl.id)}"><div class="goal-top"><button type="button" class="rowlink" data-act="editplan" data-id="${esc(pl.id)}"><b class="m">${money(pl.amount,2)}</b> <b>${esc(pl.name)}</b><span class="sr-only"> – plan bewerken</span></button><span class="label">elke ${pl.day}e</span></div>
      <div class="goal-status label">Sinds ${ymLabel(pl.start)} · ${n} van ${ms.length} maand${ms.length===1?'':'en'} ingevoerd${o?` · <span class="warn-mark">${o} open</span>`:''}${pl.acct?' · '+esc(pl.acct):''}</div></div>`}).join('')
  :'<p class="note-after hint">Leg vast dat je elke maand een vast bedrag in een munt steekt, bijvoorbeeld € 100 in Bitcoin op de 5e. Op de plandag herinnert het overzicht je eraan, en met één tik open je het ingevulde formulier.</p>'}</div>`}
function openPlan(id){
  const pl=id?(data.plans||[]).find(x=>x.id===id):null,cs=coinChoices();
  if(!pl&&!cs.length)return toast('Voeg eerst een munt toe (aankoop of volglijst)');
  openSheet(`<h2 class="h3">${pl?'Plan bewerken':'Nieuw plan voor vaste inleg'}</h2><form class="js-form" novalidate>
  <div class="field"><label for="pl_coin">Munt</label><select id="pl_coin">${cs.map(c=>`<option value="${esc(c.id)}"${pl?.coinId===c.id?' selected':''}>${esc(c.name)} (${esc((c.symbol||'').toUpperCase())})</option>`).join('')}</select></div>
  <div class="two"><div class="field"><label for="pl_amount">Bedrag per maand (€, incl. kosten)</label><input type="text" id="pl_amount" inputmode="decimal" value="${pl?plainNum(pl.amount):''}" placeholder="100"></div>
  <div class="field"><label for="pl_day">Dag van de maand</label><select id="pl_day">${Array.from({length:28},(_,i)=>i+1).map(d=>`<option${(pl?.day||Math.min(28,new Date().getDate()))===d?' selected':''}>${d}</option>`).join('')}</select></div></div>
  <div class="two"><div class="field"><label for="pl_start">Vanaf</label><input id="pl_start" type="month" value="${esc(pl?.start||ymOf(new Date()))}"></div>
  <div class="field"><label for="pl_acct">Broker / wallet</label><input type="text" id="pl_acct" list="plAcct" value="${esc(pl?pl.acct||'':settings.lastAcct||topAcct())}" autocomplete="off"><datalist id="plAcct">${accounts().map(a=>`<option value="${esc(a)}">`).join('')}</datalist></div></div>
  <button type="submit" class="btn" data-act="saveplan" data-id="${esc(pl?.id||'')}">Opslaan</button></form>
  ${pl?`<button type="button" class="btn danger" data-act="delplan" data-id="${esc(pl.id)}">Plan verwijderen</button>`:''}`);
}
function savePlan(id){
  const amount=num($('#pl_amount').value),day=+$('#pl_day').value,start=$('#pl_start').value,cid=$('#pl_coin').value;
  if(!(amount>0))return fieldErr('pl_amount','Vul een bedrag in');if(!/^\d{4}-\d{2}$/.test(start))return fieldErr('pl_start','Kies een maand');
  const c=coinChoices().find(x=>x.id===cid);if(!c)return fieldErr('pl_coin','Kies een munt');
  const now=Date.now(),e=id&&(data.plans||[]).find(x=>x.id===id),v={coinId:c.id,name:c.name,symbol:c.symbol,image:c.image,amount,day,start,acct:$('#pl_acct').value.trim(),mod:now};
  if(e)Object.assign(e,v);else(data.plans||(data.plans=[])).push({id:uid(),done:{},...v,...(pfNew()!=='main'?{pf:pfNew()}:{})});
  saveData();closeSheet();render();toast('Plan opgeslagen');
}
function planDo(id,ym){   // formulier openen, vooraf ingevuld
  const pl=(data.plans||[]).find(x=>x.id===id);if(!pl)return;
  const [y,m]=ym.split('-').map(Number),cur=ym===ymOf(new Date()),d=cur?null:new Date(y,m-1,pl.day,12,0);
  const hp=d?(priceAt(pl.coinId,d.getTime())??priceEst(pl.coinId,d.getTime())):null;   // eerdere maand: koers van die dag
  openTx({coinId:pl.coinId,type:'buy',total:pl.amount,price:hp,acct:pl.acct,pf:pfOf(pl),date:d?new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,16):null,plan:{id,ym}});
}
function planMark(id,ym,val){const pl=(data.plans||[]).find(x=>x.id===id);if(!pl)return;pl.done={...(pl.done||{}),[ym]:val};pl.mod=Date.now()}

// "Had je elke maand een vast bedrag gekocht": zelfde totale inleg per munt, gelijk verdeeld over de maanden
// vanaf je eerste aankoop, op dezelfde dag van de maand. Verkopen tellen niet mee (vergelijking van de aankopen zelf).
function dcaRows(){
  const now=Date.now(),rows=[];
  for(const id of coinIds()){const c=computeCoin(id),buys=c.txs.filter(t=>t.type==='buy');if(!buys.length||c.price==null)continue;
    const T=buys.reduce((a,t)=>a+txTotal(t),0),Q=buys.reduce((a,t)=>a+ +t.qty,0),F=buys.reduce((a,t)=>a+(+t.fee||0),0);if(!(T>0&&Q>0))continue;
    const f0=new Date(Math.min(...buys.map(txTime))),dates=[];
    for(let d=new Date(f0);d.getTime()<=now;d.setMonth(d.getMonth()+1))dates.push(d.getTime());
    if(dates.length<2)continue;
    const per=T/dates.length,r=F/T;let q=0,est=false;
    for(const ts of dates){let p=priceAt(id,ts);if(p==null){p=priceEst(id,ts);est=true}if(!(p>0)){q=NaN;break}q+=per*(1-r)/p}
    if(!(q>0))continue;
    rows.push({c,T,n:dates.length,per,avgYou:T/Q,avgDca:T/q,valYou:Q*c.price,valDca:q*c.price,est,from:f0})}
  return rows}
function dcaCard(){
  const rows=dcaRows();if(!rows.length)return '';
  const tY=rows.reduce((a,r)=>a+r.valYou,0),tD=rows.reduce((a,r)=>a+r.valDca,0),est=rows.some(r=>r.est);
  return `<div class="card"><h2 class="h3">Vaste inleg vergeleken</h2>
  <p class="mt-0 hint">Stel dat je per munt hetzelfde totaalbedrag had ingelegd, maar gelijk verdeeld over elke maand sinds je eerste aankoop. "Jij" en "Vast" zijn de gemiddelde aankoopprijzen: lager is beter. "Verschil" is wat jouw aankopen nu meer (+) of minder (−) waard zijn. Verkopen tellen niet mee.</p>
  <table class="rt"><caption class="sr-only">Jouw aankopen vergeleken met een vaste maandelijkse inleg</caption><tr><th scope="col">Munt</th><th scope="col">Jij</th><th scope="col">Vast</th><th scope="col">Verschil</th></tr>
  ${rows.map(r=>{const dv=r.valYou-r.valDca;return `<tr><th scope="row">${esc(r.c.meta.name)}<div class="label note-xs">${r.n}× ${money(r.per,2)}</div></th><td class="m">${money(r.avgYou)}</td><td class="m">${r.est?'≈ ':''}${money(r.avgDca)}</td><td class="m ${cls(dv)}">${r.est?'≈ ':''}${signed(dv)}</td></tr>`}).join('')}
  <tr><th scope="row"><b>Totaal</b></th><td></td><td></td><td class="m ${cls(tY-tD)}"><b>${est?'≈ ':''}${signed(tY-tD)}</b></td></tr></table>
  <p class="note-after hint">${tY>=tD?`Jouw timing leverde <b class="up">${money(tY-tD,2)}</b> meer op dan een vaste maandelijkse inleg.`:`Met een vaste maandelijkse inleg had je <b class="down">${money(tD-tY,2)}</b> meer gehad.`} Waarde gemeten tegen de huidige koersen.${est?' ≈ = voor sommige maanden geschat uit de dichtstbijzijnde bekende koersen.':''}</p></div>`}

/* ---------- vergelijking met één munt (benchmark) ---------- */
// Elke storting (of, zonder cash: elke aankoop) gaat in gedachten direct naar de gekozen munt; opnames/verkopen halen er weer uit.
let benchFetch={};
function benchData(bid){
  const hc=hasCashTx(),now=Date.now();
  const flows=TX().filter(t=>hc?isCash(t.type)||(t.type==='buy'||t.type==='sell')&&noCashPf(t):(t.type==='buy'||t.type==='sell')).map(t=>({t:txTime(t),v:hc?cashEffect(t)[isCash(t.type)?0:1]:(t.type==='buy'?txTotal(t):-txTotal(t))})).sort((a,b)=>a.t-b.t);
  if(!flows.length)return null;
  const h=data.hist?.[bid];let firstKnown=Infinity;if(h)for(const d in h)firstKnown=Math.min(firstKnown,h[d][0]);
  const px=t=>priceAt(bid,Math.max(t,firstKnown))??priceAt(bid,t);
  const S={};coinIds().forEach(id=>S[id]=coinStates(id));
  let units=0,early=false;const ev=[];
  for(const f of flows){const pr=px(f.t);if(pr==null)return{pending:true};if(f.t<firstKnown-1.5*DAY)early=true;units+=f.v/pr;ev.push([f.t,units])}
  const t0=flows[0].t,span=now-t0,step=span>400*DAY?7*DAY:span>3*DAY?DAY:36e5;
  const pts=[];let k=0,u=0;
  for(let t=t0;t<now+step;t+=step){const tt=Math.min(t,now);while(k<ev.length&&ev[k][0]<=tt){u=ev[k][1];k++}
    const o=snapshot(tt,S),pr=tt>=now-15*6e4?prices[bid]?.price:px(tt);if(pr==null)continue;pts.push([tt,hc?o.total:o.crypto,u*pr]);if(tt===now)break}
  const last=pts[pts.length-1];
  return{pts,you:last?.[1],bench:last?.[2],early,firstKnown,hc};
}
function benchCard(){
  const opts=[...new Set(['bitcoin','ethereum',...coinIds(),...live(data.watch).map(w=>w.id)])];
  const nameOf=id=>(data.txs.find(t=>t.coinId===id)||live(data.watch).find(w=>w.id===id)||{}).name||({bitcoin:'Bitcoin',ethereum:'Ethereum'}[id])||id;
  const bid=opts.includes(settings.bench)?settings.bench:'bitcoin',nm=nameOf(bid);
  // koersen van de vergelijkingsmunt nog niet in het archief? eenmalig ophalen
  if(!prices[bid]||!data.hist?.[bid]){if(!benchFetch[bid]){benchFetch[bid]=1;Promise.all([prices[bid]?null:fetchPrice(bid),data.hist?.[bid]?null:fetchChart(bid,'365').catch(()=>{})]).then(()=>{if(/^#rapporten/.test(location.hash)&&repTab()==='analyse')inEUR(renderReports)})}}
  const B=benchData(bid);
  const sel=`<select class="bench-sel" data-act="bench">${opts.map(id=>`<option value="${esc(id)}"${id===bid?' selected':''}>${esc(nameOf(id))}</option>`).join('')}</select>`;
  let body;
  if(!B)body='<p class="hint">Nog geen stortingen of aankopen om te vergelijken.</p>';
  else if(B.pending||!B.pts.length)body='<p class="hint">Koersgeschiedenis wordt opgehaald…</p>';
  else{
    const d=B.you-B.bench,dp=B.bench>0?d/B.bench*100:null,pts=B.pts,t0=pts[0][0],t1=pts[pts.length-1][0];
    let lo=Infinity,hi=-Infinity;pts.forEach(p=>{lo=Math.min(lo,p[1],p[2]);hi=Math.max(hi,p[1],p[2])});if(hi-lo<1e-9){hi+=1;lo-=1}
    const X=t=>(t-t0)/(t1-t0||1)*1000,Y=v=>6+(1-(v-lo)/(hi-lo))*88,L=i=>pts.map((p,j)=>(j?'L':'M')+X(p[0]).toFixed(1)+' '+Y(p[i]).toFixed(2)).join('');
    body=`<div class="mt-6 kv">
      <div><span class="label"><span class="accent">●</span> Jouw portfolio</span><b class="m">${money(B.you,2)}</b></div>
      <div><span class="label"><span class="warn-mark">●</span> Alles in ${esc(nm)}</span><b class="m">${money(B.bench,2)}</b></div>
      <div><span class="label">Verschil</span><b class="${cls(d)}"><span class="m">${signed(d)}</span> <small>${pct(dp)}</small></b></div></div>
      <div class="bchart"><svg aria-hidden="true" focusable="false" viewBox="0 0 1000 100" preserveAspectRatio="none"><path d="${L(2)}" fill="none" stroke="var(--yellow)" stroke-width="2" stroke-dasharray="5 4" vector-effect="non-scaling-stroke"/><path d="${L(1)}" fill="none" stroke="var(--accent)" stroke-width="2.5" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg></div>
      <div class="spread zlegend"><span>${new Date(t0).toLocaleDateString('nl-NL',{day:'numeric',month:'short',year:'numeric'})}</span><span>vandaag</span></div>
      <p class="note-after hint">${d>=0?`Je doet het <b class="up">beter</b> dan alles in ${esc(nm)}.`:`Met alles in ${esc(nm)} had je <b class="down">meer</b> gehad.`} De vergelijking rekent zonder transactiekosten voor ${esc(nm)}.${B.early?` Voor stortingen vóór ${new Date(B.firstKnown).toLocaleDateString('nl-NL',{day:'numeric',month:'short',year:'numeric'})} is de oudst bekende koers gebruikt.`:''}</p>`;
  }
  return `<div class="card"><h2 class="h3">Vergelijking</h2><p class="hint">Wat als je elke ${hasCashTx()?'storting':'aankoop'} direct in één munt had gestoken?</p>
  <label class="bench-label label">Vergelijk met ${sel}</label>${body}</div>`;
}
/* ---------- volglijst ---------- */
function watchSection(){
  const w=watchOnly();
  return `<div class="list-head"><h2>Volglijst</h2><button type="button" class="link" data-act="addwatch">+ Toevoegen</button></div>
  ${w.length?`<ul class="list">${w.map(x=>{const P=prices[x.id]||{},n=live(data.alerts).filter(a=>a.coinId===x.id&&!a.hit).length;
    return `<li class="row" data-coin="${esc(x.id)}">${coinIcon({coinId:x.id,symbol:x.symbol,image:x.image})}<div class="grow"><div class="name"><a class="rowlink" href="#coin/${encodeURIComponent(x.id)}">${esc(x.name)}</a></div><div class="meta">${esc((x.symbol||'').toUpperCase())}${n?` · ${n} alert${n>1?'s':''}`:''}</div></div>
    <div class="right"><div class="v">${money(P.price)}</div><div class="chg ${cls(chU(P.ch24))}">${pct(chU(P.ch24))}</div></div></li>`}).join('')}</ul>`
  :'<div class="empty-card empty-sm card">Volg munten die je (nog) niet hebt: koers, grafiek en prijsalerts.</div>'}`;
}
function openWatchAdd(){
  openSheet(`<h2 class="h3">Munt volgen</h2><div class="field"><label for="w_search">Munt zoeken</label><input type="text" id="w_search" enterkeyhint="search" placeholder="bijv. Solana, XRP" autocomplete="off"></div><ul class="results" id="f_results"></ul>`);
  const s=$('#w_search');s.focus();s.oninput=()=>{clearTimeout(s._t);s._t=setTimeout(()=>searchCoins(s.value,'wpick'),300)};
}
function setWatch(c,on){
  const now=Date.now(),e=(data.watch||(data.watch=[])).find(w=>w.id===c.id);
  if(e){e.del=!on;e.mod=now;Object.assign(e,{name:c.name||e.name,symbol:c.symbol||e.symbol,image:c.image||e.image})}
  else if(on)data.watch.push({id:c.id,name:c.name,symbol:c.symbol,image:c.image,mod:now});
  saveData();if(on&&!prices[c.id])fetchPrice(c.id).then(()=>render());
}
/* ---------- prijsalerts ---------- */
let alertForm=null;
// grote bedragen leesbaar: € 1,23 bln · € 45,6 mld · € 789 mln
function bigEur(v){if(v==null||!isFinite(v))return '–';const un=unitNow();if(un==='USD')v=v*fx.btcUsd/fx.btcEur;if(un==='BTC'&&Math.abs(v)<1e9*fx.btcEur)return money(v,2);if(un==='BTC')v=v/fx.btcEur;
  const a=Math.abs(v),f=(x,u)=>(un==='BTC'?'₿ ':un==='USD'?'$ ':'€ ')+x.toLocaleString('nl-NL',{maximumFractionDigits:x<10?2:x<100?1:0})+' '+u;
  return a>=1e12?f(a/1e12,'bln'):a>=1e9?f(a/1e9,'mld'):a>=1e6?f(a/1e6,'mln'):un==='EUR'?money(v,0):inEUR(()=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:un==='USD'?'USD':'EUR',currencyDisplay:'narrowSymbol',maximumFractionDigits:0}).format(v))}
function bigNum(v){if(v==null||!isFinite(v))return '–';const a=Math.abs(v),f=(x,u)=>x.toLocaleString('nl-NL',{maximumFractionDigits:x<10?2:x<100?1:0})+' '+u;
  return a>=1e9?f(a/1e9,'mld'):a>=1e6?f(a/1e6,'mln'):Math.round(a).toLocaleString('nl-NL')}
/* ---------- gemiddelde-prijs-calculator (wens W12) ---------- */
// Wat wordt je gemiddelde aankoopprijs als je bijkoopt, of hoeveel moet je bijkopen voor een bepaald gemiddelde?
// Rekent met je huidige positie (FIFO, kosten inbegrepen) en een kostenpercentage over het aankoopbedrag.
let avgMode='amount',avgIn={coin:null};   // invoer blijft bewaard als de pagina ververst (koersupdate)
function coinFeePct(c){const b=c.txs.filter(t=>t.type==='buy'),T=b.reduce((a,t)=>a+txTotal(t),0),F=b.reduce((a,t)=>a+(+t.fee||0),0);return T>0&&F>0?F/T*100:0.25}
function avgCalcCard(c){
  if(!(c.qty>1e-12)||c.price==null||!c.avg)return '';
  const sym=esc((c.meta.symbol||'').toUpperCase());if(avgIn.coin!==c.coinId)avgIn={coin:c.coinId};const v=k=>esc(avgIn[k]??'');
  return `<div class="card avg-calc"><h2 class="h3">Gemiddelde aankoopprijs berekenen</h2>
  <p class="mt-0 hint">Nu: <b class="m">${qtyf(c.qty)} ${sym}</b> met een gemiddelde van <b class="m">${money(c.avg)}</b>.</p>
  <fieldset class="seg"><legend class="sr-only">Wat wil je berekenen</legend><button type="button" data-avgmode="amount" class="all ${avgMode==='amount'?'on':''}">Bijkopen voor bedrag</button><button type="button" data-avgmode="target" class="all ${avgMode==='target'?'on':''}">Naar doelgemiddelde</button></fieldset>
  <div class="field"${avgMode==='amount'?'':' hidden'}><label for="ac_amount">Bedrag (€, incl. kosten)</label><input type="text" id="ac_amount" inputmode="decimal" enterkeyhint="done" placeholder="bijv. 200" value="${v('amount')}"></div>
  <div class="field"${avgMode==='target'?'':' hidden'}><label for="ac_target">Gewenst gemiddelde (€)</label><input type="text" id="ac_target" inputmode="decimal" enterkeyhint="done" placeholder="${plainNum(+(c.avg*0.95).toPrecision(4))}" value="${v('target')}"></div>
  <div class="two"><div class="field"><label for="ac_price">Koers bij aankoop (€)</label><input type="text" id="ac_price" inputmode="decimal" value="${avgIn.price??plainNum(+c.price.toPrecision(8))}"></div>
  <div class="field"><label for="ac_fee">Kosten (%)</label><input type="text" id="ac_fee" inputmode="decimal" value="${avgIn.fee??plainNum(+coinFeePct(c).toFixed(3))}"></div></div>
  <output id="ac_out" for="ac_amount ac_target ac_price ac_fee" class="ac-out" aria-live="polite"></output>
  <button type="button" class="btn sec" data-act="avgbuy" hidden>Als aankoop invoeren</button></div>`}
/* ---------- verkoopsimulator (wens W2) ---------- */
// Wat gebeurt er als je (een deel) verkoopt: welke aankopen via FIFO worden afgeboekt, je gerealiseerde resultaat na kosten
// en wat je overhoudt. Er wordt niets opgeslagen; met de knop open je het verkoopformulier al ingevuld.
let simMode='pct',simIn={coin:null},simSell=null;
function sellSimCard(c){
  if(!(c.qty>1e-12)||c.price==null)return '';
  const sym=esc((c.meta.symbol||'').toUpperCase());if(simIn.coin!==c.coinId)simIn={coin:c.coinId};const v=k=>esc(simIn[k]??'');
  const lbl={qty:`Aantal (${sym})`,amount:'Bedrag dat je wilt ontvangen (€, na kosten)',pct:'Deel van je positie (%)'};
  return `<div class="card sell-sim"><h2 class="h3">Verkoop simuleren</h2>
  <p class="mt-0 hint">Zie wat een verkoop oplevert en welke aankopen worden afgeboekt (FIFO: oudste eerst). Er wordt niets opgeslagen.</p>
  <fieldset class="seg"><legend class="sr-only">Hoe wil je de verkoop opgeven</legend>${[['pct','Percentage'],['qty','Aantal'],['amount','Bedrag']].map(([k,l])=>`<button type="button" data-simmode="${k}" class="all ${simMode===k?'on':''}" aria-pressed="${simMode===k}">${l}</button>`).join('')}</fieldset>
  <div class="field"><label for="ss_val" id="ss_lbl">${lbl[simMode]}</label><input type="text" id="ss_val" inputmode="decimal" enterkeyhint="done" placeholder="${simMode==='pct'?'bijv. 25':simMode==='qty'?plainNum(+(c.qty/2).toPrecision(4)):'bijv. 200'}" value="${v('val')}"></div>
  <div class="sim-quick">${[25,50,100].map(p=>`<button type="button" class="link" data-simpct="${p}">${p===100?'Alles':p+'%'}</button>`).join('')}</div>
  <div class="two"><div class="field"><label for="ss_price">Verkoopkoers (€)</label><input type="text" id="ss_price" inputmode="decimal" value="${simIn.price??plainNum(+c.price.toPrecision(8))}"></div>
  <div class="field"><label for="ss_fee">Kosten (%)</label><input type="text" id="ss_fee" inputmode="decimal" value="${simIn.fee??plainNum(+coinFeePct(c).toFixed(3))}"></div></div>
  <output id="ss_out" for="ss_val ss_price ss_fee" class="ac-out" aria-live="polite"></output>
  <button type="button" class="btn sec" data-act="simsell" hidden>Als verkoop invoeren</button></div>`}
function initSellSim(c){
  const card=$('.sell-sim');if(!card)return;
  const sym=esc((c.meta.symbol||'').toUpperCase()),out=$('#ss_out'),btn=card.querySelector('[data-act=simsell]');
  const lots=c.txs.filter(t=>isIn(t)&&c.lotMap[t.id]?.remaining>1e-12).map(t=>({t,q:c.lotMap[t.id].remaining,unit:c.lotMap[t.id].unit}));
  const lbl={qty:`Aantal (${sym})`,amount:'Bedrag dat je wilt ontvangen (€, na kosten)',pct:'Deel van je positie (%)'};
  const calc=()=>inEUR(()=>{simSell=null;btn.hidden=true;
    const P=num($('#ss_price').value),f=(num($('#ss_fee').value)||0)/100,V=num($('#ss_val').value),Q=c.qty;
    if(!(P>0)||!(f>=0&&f<1)){out.innerHTML='<span class="hint">Vul een geldige koers en kosten in.</span>';return}
    if(!(V>0)){out.innerHTML='';return}
    let q=simMode==='pct'?Q*V/100:simMode==='qty'?V:V/(P*(1-f));
    if(q>Q*(1+1e-9)){out.innerHTML=`<span class="warn-mark">Je hebt maar ${qtyf(+Q.toPrecision(10))} ${sym}${simMode==='amount'?`; dat levert na kosten hooguit ${money(Q*P*(1-f),2)} op`:''}.</span>`;return}
    q=Math.min(q,Q);
    const gross=q*P,fee=gross*f,net=gross-fee;let left=q,cost=0;const used=[];
    for(const l of lots){if(left<=1e-12)break;const take=Math.min(l.q,left);used.push({...l,take});cost+=take*l.unit;left-=take}
    const res=net-cost,rest=Q-q,restCost=c.cost-cost,p=portfolio();
    out.innerHTML=`<div class="kv">
      <div><span class="label">Je verkoopt</span><b class="m">${qtyf(+q.toPrecision(8))} ${sym}</b></div>
      <div><span class="label">Opbrengst</span><span class="m">${money(gross,2)} <span class="label">− kosten ${money(fee,2)}</span></span></div>
      <div><span class="label">Je ontvangt</span><b class="m">${money(net,2)}</b></div>
      <div><span class="label">Gerealiseerd resultaat</span><b class="m ${cls(res)}">${signed(res)} <span>(${pct(cost>0?res/cost*100:null)})</span></b></div>
      <div><span class="label">Daarna in bezit</span><span class="m">${rest>1e-12?`${qtyf(+rest.toPrecision(10))} ${sym} · ${money(rest*P,2)}`:'niets meer'}</span></div>
      ${rest>1e-12?`<div><span class="label">Gemiddelde aankoopprijs daarna</span><span class="m">${money(restCost/rest)} <span class="label">(nu ${money(c.avg)})</span></span></div>`:''}
      ${p.hasCash?`<div><span class="label">Cash daarna</span><span class="m">${money(p.cash+net,2)}</span></div>`:''}</div>
      <details class="mt-10 sim-lots"><summary>Afgeboekte aankopen (${used.length})</summary><div class="tbl-scroll"><table class="rt"><caption class="sr-only">Aankopen die bij deze verkoop worden afgeboekt, oudste eerst</caption>
      <tr><th scope="col">Aankoop</th><th scope="col">Afgeboekt</th><th scope="col">Aankoopkoers</th><th scope="col">Resultaat</th></tr>
      ${used.map(u=>{const r=u.take*(P*(1-f)-u.unit);return `<tr><th scope="row">${tm(u.t.date,new Date(u.t.date).toLocaleDateString('nl-NL',{day:'numeric',month:'short',year:'2-digit'}))}${u.t.type==='receive'?'<div class="note-xs label">ontvangen</div>':''}</th><td class="m">${qtyf(+u.take.toPrecision(8))}${u.take<u.q-1e-12?`<div class="note-xs label">van ${qtyf(+u.q.toPrecision(8))}</div>`:''}</td><td class="m">${money(u.unit)}</td><td class="m ${cls(r)}">${signed(r)}</td></tr>`}).join('')}</table></div></details>`;
    simSell={coinId:c.coinId,total:Math.round(net*100)/100,price:P,fee:Math.round(fee*100)/100};btn.hidden=false;setTimeout(markScrollers,0)});
  const val=$('#ss_val');
  card.querySelectorAll('input').forEach(i=>i.oninput=()=>{simIn[i.id.slice(3)]=i.value;calc()});
  card.querySelectorAll('[data-simmode]').forEach(b=>b.onclick=()=>{
    // omrekenen naar de nieuwe invoer zodat je dezelfde verkoop houdt
    const P=num($('#ss_price').value),f=(num($('#ss_fee').value)||0)/100,V=num(val.value),Q=c.qty;let q=null;
    if(V>0&&P>0)q=simMode==='pct'?Q*V/100:simMode==='qty'?V:V/(P*(1-f));
    simMode=b.dataset.simmode;card.querySelectorAll('[data-simmode]').forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-pressed',x===b)});
    $('#ss_lbl').textContent=lbl[simMode];
    if(q!=null){val.value=String(simMode==='pct'?+(q/Q*100).toFixed(2):simMode==='qty'?+q.toPrecision(8):+(q*P*(1-f)).toFixed(2)).replace('.',',');simIn.val=val.value}
    val.placeholder=simMode==='pct'?'bijv. 25':simMode==='qty'?plainNum(+(Q/2).toPrecision(4)):'bijv. 200';calc();val.focus()});
  card.querySelectorAll('[data-simpct]').forEach(b=>b.onclick=()=>{simMode='pct';card.querySelectorAll('[data-simmode]').forEach(x=>{const on=x.dataset.simmode==='pct';x.classList.toggle('on',on);x.setAttribute('aria-pressed',on)});
    $('#ss_lbl').textContent=lbl.pct;val.value=b.dataset.simpct;simIn.val=val.value;calc()});
  calc()}
let avgBuy=null;
function initAvgCalc(c){
  const card=$('.avg-calc');if(!card)return;
  const sym=esc((c.meta.symbol||'').toUpperCase()),out=$('#ac_out'),btn=card.querySelector('[data-act=avgbuy]');
  const calc=()=>{const P=num($('#ac_price').value),f=(num($('#ac_fee').value)||0)/100,Q=c.qty,C=c.cost,avg=C/Q;avgBuy=null;btn.hidden=true;
    if(!(P>0)||!(f>=0&&f<1)){out.innerHTML='<span class="hint">Vul een geldige koers en kosten in.</span>';return}
    let A;
    if(avgMode==='amount'){A=num($('#ac_amount').value);if(!(A>0)){out.innerHTML='';return}}
    else{const X=num($('#ac_target').value);if(!(X>0)){out.innerHTML='';return}
      const lim=P/(1-f);   // grens: lager (of hoger) dan de bijkoopprijs incl. kosten kan je gemiddelde nooit komen
      if(Math.abs(X-avg)/avg<1e-6){out.innerHTML='<span class="hint">Dat is al je huidige gemiddelde.</span>';return}
      A=(X*Q-C)/(1-X*(1-f)/P);
      if(!(A>0)||!isFinite(A)){const why=X<avg
          ?(lim>=avg?`Je gemiddelde verlagen kan nu niet: de koers met kosten (${money(lim)}) ligt boven je gemiddelde (${money(avg)}), dus bijkopen verhoogt het. Vul hierboven een lagere koers in om te zien wat er nodig is als de koers daalt.`
                    :`Lager dan ${money(lim)} kan niet: bijkopen tegen ${money(P)} (met kosten ${money(lim)}) brengt je gemiddelde nooit verder omlaag dan dat.`)
          :(lim<=avg?`Je gemiddelde verhogen kan alleen door duurder bij te kopen dan je huidige gemiddelde (${money(avg)}). Vul hierboven een hogere koers in.`
                    :`Hoger dan ${money(lim)} kan niet: bijkopen tegen ${money(P)} (met kosten ${money(lim)}) brengt je gemiddelde nooit verder omhoog dan dat.`);
        out.innerHTML=`<span class="warn-mark">${why}</span>`;return}}
    const nq=A*(1-f)/P,fee=A*f,na=(C+A)/(Q+nq),ch=(na/avg-1)*100;
    out.innerHTML=`<div class="kv"><div><span class="label">${avgMode==='amount'?'Je koopt':'Nodig'}</span><b class="m">${money(A,2)}</b></div>
      <div><span class="label">Dat is</span><b class="m">${qtyf(+nq.toPrecision(8))} ${sym}</b></div>
      <div><span class="label">Kosten</span><span class="m">${money(fee,2)}</span></div>
      <div><span class="label">Nieuw gemiddelde</span><b class="m">${money(na)} <span class="${cls(-ch)}">(${pct(ch)})</span></b></div>
      <div><span class="label">Daarna in bezit</span><span class="m">${qtyf(+(Q+nq).toPrecision(10))} ${sym}</span></div></div>`;
    avgBuy={coinId:c.coinId,total:Math.round(A*100)/100,price:P,fee:fee};btn.hidden=false};
  card.querySelectorAll('input').forEach(i=>i.oninput=()=>{avgIn[i.id.slice(3)]=i.value;calc()});
  card.querySelectorAll('[data-avgmode]').forEach(b=>b.onclick=()=>{avgMode=b.dataset.avgmode;card.querySelectorAll('[data-avgmode]').forEach(x=>x.classList.toggle('on',x===b));
    $('#ac_amount').closest('.field').hidden=avgMode!=='amount';$('#ac_target').closest('.field').hidden=avgMode!=='target';calc();(avgMode==='amount'?$('#ac_amount'):$('#ac_target')).focus()});
  calc()}

function marketCard(c){
  const P=prices[c.coinId]||{},m=P.m;if(!m)return '';
  const sym=esc((c.meta.symbol||'').toUpperCase()),dd=s=>s?new Date(s).toLocaleDateString('nl-NL',{day:'numeric',month:'short',year:'numeric'}):'';
  const range=m.lo!=null&&m.hi!=null&&m.hi>m.lo&&P.price!=null?Math.max(0,Math.min(100,(P.price-m.lo)/(m.hi-m.lo)*100)):null;
  return `<div class="mt-10 card kv"><div class="kv-h"><b>Marktinformatie${settings.unit&&settings.unit!=='EUR'?' <span class="label w-normal">(in euro)</span>':''}</b>${m.rank?`<span class="label">#${m.rank} op marktwaarde</span>`:''}</div>
  <div class="chg-grid">${[['24 uur',P.ch24],['7 dagen',m.ch7],['30 dagen',m.ch30]].map(([l,v])=>`<div class="chg-cell"><div class="note-sm label">${l}</div><b class="${cls(v)}">${pct(v)}</b></div>`).join('')}</div>
  ${range!=null?`<div class="block"><div class="spread-row"><span class="label">Dagbereik</span><span class="label">${money(m.lo)} – ${money(m.hi)}</span></div>
    <div class="range-bar gbar"><i class="range-fill" style="width:${range.toFixed(1)}%"></i></div></div>`:''}
  ${m.ath?`<div><span class="label">All-time high${m.athDate?` (${dd(m.athDate)})`:''}</span><b>${money(m.ath)} <small class="${cls(m.athPct)}">${pct(m.athPct)}</small></b></div>`:''}
  ${m.atl?`<div><span class="label">All-time low${m.atlDate?` (${dd(m.atlDate)})`:''}</span><b>${money(m.atl)}</b></div>`:''}
  <div><span class="label">Marktwaarde</span><b>${bigEur(m.cap)}</b></div>
  <div><span class="label">Handelsvolume 24 uur</span><b>${bigEur(m.vol)}</b></div>
  ${m.circ?`<div><span class="label">In omloop${m.max?' / maximaal':''}</span><b>${bigNum(m.circ)}${m.max?` / ${bigNum(m.max)}`:''} ${sym}</b></div>`:''}
  </div>`;
}
function alertsCard(c){
  const list=live(data.alerts).filter(a=>a.coinId===c.coinId).sort((a,b)=>(a.hit?1:0)-(b.hit?1:0)||a.price-b.price);
  return `<div class="mt-10 card kv"><div class="kv-h"><b>Prijsalerts</b><button type="button" class="link" data-act="addalert">+ Alert</button></div>
  ${list.length?list.map(a=>`<div><span class="label${a.hit?'':' alert-active'}">${a.dir==='above'?'Boven':'Onder'} ${priceH(a.price)}${a.hit?` · bereikt ${fmtTs(a.hit)}`:''}</span><button type="button" class="danger link" data-act="delalert" data-id="${esc(a.id)}">Verwijder</button></div>`).join('')
  :'<div><span class="label">Krijg een melding als de koers een grens bereikt.</span></div>'}</div>`;
}
function openAlert(c){
  const cur=c.price;alertForm={c,dir:'above'};
  const N='Notification' in window?Notification.permission:'none';
  openSheet(`<h2 class="h3">Prijsalert ${esc(c.meta.name||'')}</h2><form class="js-form" novalidate>
  <fieldset class="seg"><legend class="sr-only">Richting van de alert</legend><button type="button" data-adir="above" class="buy on">Koers stijgt boven</button><button type="button" data-adir="below" class="sell">Koers daalt onder</button></fieldset>
  <div class="field"><label for="a_price">Grens (€)</label><input type="text" id="a_price" inputmode="decimal" value="${cur?plainNum(cur):''}"></div>
  <p class="hint">Huidige koers: ${money(cur)}. De app controleert elke minuut zolang hij open staat; met de app dicht krijg je geen melding.</p>
  ${N==='default'?'<button type="button" class="btn sec" data-act="notifperm">Meldingen op dit apparaat toestaan</button>':N==='denied'?'<p class="warn">Meldingen zijn geblokkeerd in je browser: je ziet alerts alleen in de app.</p>':''}
  <button type="submit" class="btn" data-act="savealert">Alert opslaan</button></form>`);
  $('#a_price').oninput=e=>{const v=num(e.target.value);if(cur&&v>0)setAlertDir(v<cur?'below':'above')};
}
function setAlertDir(d){alertForm.dir=d;document.querySelectorAll('[data-adir]').forEach(b=>b.classList.toggle('on',b.dataset.adir===d))}
function saveAlert(){
  const v=num($('#a_price').value);if(!(v>0))return fieldErr('a_price','Vul een geldige koers in');
  const c=alertForm.c,now=Date.now();
  (data.alerts||(data.alerts=[])).push({id:uid(),coinId:c.coinId,name:c.meta.name,symbol:c.meta.symbol,image:c.meta.image,dir:alertForm.dir,price:v,created:now,mod:now});
  saveData();closeSheet();render();toast('Alert opgeslagen');
}
function notify(title,body){
  toast(title);
  try{if('Notification' in window&&Notification.permission==='granted'){
    const o={body,icon:'icon-192.png',tag:title};
    if(navigator.serviceWorker?.controller)navigator.serviceWorker.ready.then(r=>r.showNotification(title,o));else new Notification(title,o);
  }}catch(e){}
}
function checkAlerts(){
  let ch=false;
  for(const a of live(data.alerts)){
    if(a.hit)continue;const p=prices[a.coinId]?.price;if(p==null)continue;
    if(a.dir==='above'?p>=a.price:p<=a.price){a.hit=a.mod=Date.now();ch=true;notify(`${a.name}: koers ${a.dir==='above'?'boven':'onder'} ${money(a.price)}`,`Huidige koers: ${money(p)}`)}
  }
  if(ch)saveData();
}
function heroSub(hasCash,value,cash,cost,realized){
  return `${hasCash?`Crypto <span class="m">${money(value,2)}</span> · Cash <span class="m ${cash<-0.005?'down':''}">${money(cash,2)}</span> · `:''}Geïnvesteerd <span class="m">${money(cost,2)}</span>${Math.abs(realized)>0.005?` · Gerealiseerd <span class="m ${cls(realized)}">${signed(realized)}</span>`:''}`;
}
function sorter(){
  const s=settings.sort;
  if(s==='name')return(a,b)=>(a.meta.name||'').localeCompare(b.meta.name||'');
  if(s==='pl')return(a,b)=>(b.unrealPct??-1e9)-(a.unrealPct??-1e9);
  if(s==='plabs')return(a,b)=>(b.unreal??-1e18)-(a.unreal??-1e18);
  return(a,b)=>(b.value??0)-(a.value??0);
}

/* ---------- portfoliografiek ---------- */
// Per tijdstip: wat je toen in bezit had × de koers van dat moment, plus je geïnvesteerde bedrag (FIFO).
const txTime=t=>new Date(t.date).getTime();
function coinStates(id){
  const txs=TX().filter(t=>t.coinId===id).sort((a,b)=>a.date.localeCompare(b.date)||(a.created||0)-(b.created||0));
  const lots=[],st=[];let q=0,real=0;
  for(const t of txs){
    const fee=t.fee||0;
    if(isIn(t)){lots.push({rem:t.qty,unit:(t.qty*(t.price||0)+fee)/t.qty*K(txTime(t))});q+=t.qty}
    else if(t.type==='transfer'){let left=t.feeQty||0,c=0;for(const l of lots){if(left<=1e-12)break;const k=Math.min(l.rem,left);l.rem-=k;left-=k;c+=k*l.unit}real-=c;q-=(t.feeQty||0)-left}
    else{let left=t.qty,c=0;for(const l of lots){if(left<=1e-12)break;const k=Math.min(l.rem,left);l.rem-=k;left-=k;c+=k*l.unit}const m=t.qty-left;real+=(m*t.price-fee*(t.qty?m/t.qty:1))*K(txTime(t))-c;q-=m}
    st.push([txTime(t),Math.max(0,q),lots.reduce((s,l)=>s+l.rem*l.unit,0),real]);
  }
  return st;
}
function lastAtOrBefore(arr,t){let lo=0,hi=arr.length-1,r=-1;while(lo<=hi){const m=(lo+hi)>>1;if(arr[m][0]<=t){r=m;lo=m+1}else hi=m-1}return r}
async function portfolioSeries(range,unit){
  const ids=coinIds(),now=Date.now();
  const first=Math.min(...TX().map(txTime).filter(isFinite));
  const hrs=range==='1h'?1:range==='4h'?4:0;
  const days=hrs?'1':range==='max'?String(Math.min(365,Math.max(1,Math.ceil((now-first)/864e5)+1))):range;
  const charts={},queue=[...ids];let err=null;
  await Promise.all([0,1].map(async()=>{while(queue.length){const id=queue.shift();try{charts[id]=await fetchChart(id,days)}catch(e){err=e}}}));
  if(err&&!Object.keys(charts).length)throw err;
  const U0=UNIT_ON;UNIT_ON=!!unit;try{   // na het wachten: rekenen in de gekozen eenheid
  const states={};ids.forEach(id=>states[id]=coinStates(id));
  let grid,t0,earliest=Infinity;
  if(range==='max'){
    for(const id of ids){charts[id]=withHist(id,charts[id]||[]);if(charts[id].length)earliest=Math.min(earliest,charts[id][0][0])}
    t0=isFinite(earliest)?Math.max(first,earliest):first;
    const times=new Set();for(const id in charts)for(const p of charts[id])if(p[0]>t0&&p[0]<now-60000)times.add(p[0]);
    grid=[t0,...[...times].sort((a,b)=>a-b),now];
  }else{
    let base=[];for(const id in charts)if(charts[id].length>base.length)base=charts[id];
    t0=hrs?Math.max(first,now-hrs*3600e3):base.length?Math.max(first,base[0][0]):first;
    grid=[t0,...base.map(p=>p[0]).filter(t=>t>t0&&t<now-60000),now];
  }
  {const tt=TX().map(txTime).filter(t=>t>t0&&t<now-60000);if(tt.length)grid=[...new Set([...grid,...tt])].sort((a,b)=>a-b)}
  // Met cash: totale waarde (crypto + cash) afgezet tegen netto gestort; anders crypto tegen geïnvesteerd.
  const withCash=hasCashTx(),cev=withCash?TX().map(x=>[txTime(x),...cashEffect(x)]).sort((a,b)=>a[0]-b[0]):[];
  let ci=0,cumC=0,cumD=0;
  const pts=grid.map(t=>{
    let value=0,inv=0,real=0;const coins={},pxs={},costs={};
    for(const id of ids){
      let px;
      if(t===now||!charts[id]?.length)px=prices[id]?.price;
      else{const c=charts[id],j=lastAtOrBefore(c,t);px=c[Math.max(0,j)][1]}
      if(px==null){const c=charts[id];px=c?.length?c[c.length-1][1]:0}
      if(px>0)pxs[id]=px;   // koers, ook als je de munt (nog) niet had: voor de weergave '% per munt'
      const st=states[id],i=lastAtOrBefore(st,t);if(i<0)continue;
      const [,q,cost,r]=st[i];inv+=cost;real+=r;if(q<=1e-12)continue;
      value+=q*px;coins[id]=q*px;costs[id]=cost;
    }
    const k=K(t);for(const id in coins)coins[id]*=k;for(const id in pxs)pxs[id]*=k;
    if(withCash){while(ci<cev.length&&cev[ci][0]<=t){cumC+=cev[ci][1];cumD+=cev[ci][2]*K(cev[ci][0]);ci++}return[t,(value+cumC)*k,cumD,0,{v:value*k,cash:cumC*k,inv,real,coins,pxs,costs}]}
    return[t,value*k,inv,real,{v:value*k,cash:0,inv,real,coins,pxs,costs}];
  });
  return{pts,partial:!!err,from:range==='max'&&first<t0-2*DAY?t0:null};
  }finally{UNIT_ON=U0}
}
let pChartTok=0;
// Tekstalternatief voor grafieken (schermlezers): korte samenvatting in plaats van de tekening
const RANGE_L={'1h':'afgelopen uur','4h':'afgelopen 4 uur','1':'afgelopen 24 uur','7':'afgelopen week','30':'afgelopen maand','90':'afgelopen 3 maanden','365':'afgelopen jaar','max':'volledige periode'};
function chartAlt(el,txt){if(!el)return;if(txt){el.setAttribute('role','img');el.setAttribute('aria-label',txt)}else{el.removeAttribute('role');el.removeAttribute('aria-label')}}
function seriesAlt(items,what,neutral){   // items: {v,title} — titel is bijv. "oktober 2026: +€ 12,30"
  if(!items.length)return '';const sum=items.reduce((a,i)=>a+i.v,0),best=items.reduce((a,i)=>i.v>a.v?i:a),worst=items.reduce((a,i)=>i.v<a.v?i:a),per=t=>(t||'').split(':')[0];
  return `${what}, ${items.length} perioden van ${per(items[0].title)} tot ${per(items[items.length-1].title)}. Totaal ${neutral?money(sum,2):signed(sum)}. Hoogste: ${best.title}. Laagste: ${worst.title}. De bedragen staan ook in de tabel.`}
// Portfoliografiek: ook voor het afgelopen uur en 4 uur (uit de 5-minutenkoersen van de 24-uursgrafiek), met y-as en vergroot venster
const PRANGES=[['1h','1U'],['4h','4U'],['1','24U'],['7','1W'],['30','1M'],['90','3M'],['365','1J'],['max','Max']];
const PLBL={'1h':'afgelopen uur','4h':'afgelopen 4 uur','1':'24 uur','7':'deze week','30':'deze maand','90':'3 maanden','365':'dit jaar','max':'sinds start'};
const shortRange=r=>['1h','4h','1','7'].includes(r);
function unitF(){const u=unitNow();return u==='BTC'?1/fx.btcEur:u==='USD'?fx.btcUsd/fx.btcEur:1}
function axisTicks(lo,hi,n){const step=niceStep((hi-lo)/n),t=[];for(let v=Math.ceil(lo/step)*step;v<=hi+step*1e-9;v+=step)t.push(Math.abs(v)<step/1e6?0:v);return{step,t}}
function tickLbl(v,step){const u=unitNow(),d=u==='BTC'?Math.max(0,Math.ceil(-Math.log10(step)-1e-9)):step>=1?0:2;
  return (v<0?'−':'')+(u==='BTC'?'₿':u==='USD'?'$':'€')+' '+new Intl.NumberFormat('nl-NL',{minimumFractionDigits:d,maximumFractionDigits:d}).format(Math.abs(v))}
function xLbl(t,range){const d=new Date(t);
  return ['1h','4h','1'].includes(range)?d.toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'})
    :['7','30','90'].includes(range)?d.toLocaleDateString('nl-NL',{day:'numeric',month:'short'}):d.toLocaleDateString('nl-NL',{month:'short',year:'2-digit'})}
// Tekent de grafiek in wrap; geeft terug wat nodig is voor de muis/vinger
function paintPf(wrap,res,o){
  const pts=res.pts,big=!!o.big,my=o.my;
  if(pts.length<2){wrap.innerHTML='<div class="chart-msg">Nog te weinig gegevens</div>';return null}
  const W=360,H=170,pt=10,pb=10,t0=pts[0][0],t1=pts[pts.length-1][0];
  // 1U, 4U en 24U: schaal op de waarde zelf, anders is de beweging naast de geïnvesteerd-lijn niet te zien
  const tight=['1h','4h','1'].includes(settings.pRange);
  let lo=Infinity,hi=-Infinity;pts.forEach(p=>{lo=Math.min(lo,p[1],tight?p[1]:p[2]);hi=Math.max(hi,p[1],tight?p[1]:p[2])});
  if(tight&&hi-lo<Math.abs(hi)*2e-4){const m=(hi+lo)/2,h=Math.max(Math.abs(hi)*1e-4,0.5);lo=m-h;hi=m+h}
  if(hi-lo<1e-9*Math.max(1,Math.abs(hi))){hi+=Math.max(1,Math.abs(hi)*0.01);lo-=Math.max(1,Math.abs(lo)*0.01)}
  const pad=(hi-lo)*.06;lo-=pad;hi+=pad;
  const X=t=>(t-t0)/(t1-t0||1)*W,Y=v=>pt+(1-(v-lo)/(hi-lo))*(H-pt-pb);
  const tr=p=>p[1]-p[2]+p[3],dPL=tr(pts[pts.length-1])-tr(pts[0]);
  const vp=pts.map(p=>[X(p[0]),Y(p[1])]),ip=[];
  pts.forEach((p,i)=>{if(i)ip.push([X(p[0]),Y(pts[i-1][2])]);ip.push([X(p[0]),Y(p[2])])});
  const P=a=>a.map((q,i)=>(i?'L':'M')+q[0].toFixed(1)+' '+q[1].toFixed(1)).join('');
  const dv=P(vp),di=P(ip),band=dv+ip.slice().reverse().map(q=>'L'+q[0].toFixed(1)+' '+q[1].toFixed(1)).join('')+'Z';
  const above=`${di}L${W} -10L0 -10Z`,below=`${di}L${W} ${H+10}L0 ${H+10}Z`;
  // y-as: ronde bedragen in de gekozen eenheid
  const f=unitF(),A=axisTicks(lo*f,hi*f,big?6:4),ticks=A.t.map(v=>v/f).filter(v=>Y(v)>=2&&Y(v)<=H-2);
  const labs=ticks.map(v=>tickLbl(v*f,A.step)),aw=Math.max(...labs.map(l=>l.length),4);
  const grid=ticks.map(v=>`<line class="pc-grid" x1="0" x2="${W}" y1="${Y(v).toFixed(2)}" y2="${Y(v).toFixed(2)}" vector-effect="non-scaling-stroke"/>`).join('');
  const xs=big?[0,.25,.5,.75,1].map(k=>t0+k*(t1-t0)):[];
  wrap.innerHTML=`<div class="pc"><div class="pc-plot"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <defs><clipPath id="ca${my}"><path d="${above}"/></clipPath><clipPath id="cb${my}"><path d="${below}" transform="translate(0 1.5)"/></clipPath></defs>
    ${grid}
    <path d="${band}" fill="#1fd17a" fill-opacity=".16" clip-path="url(#ca${my})"/>
    <path d="${band}" fill="#ff5a5f" fill-opacity=".16" clip-path="url(#cb${my})"/>
    <path d="${di}" fill="none" stroke="#8b93a5" stroke-width="1.5" stroke-dasharray="4 4" vector-effect="non-scaling-stroke"/>
    <path class="line-up" d="${dv}" fill="none" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round" clip-path="url(#ca${my})"/>
    <path class="line-down" d="${dv}" fill="none" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round" clip-path="url(#cb${my})"/>
    <line class="cur" x1="0" x2="0" y1="0" y2="${H}" stroke="#8b93a5" vector-effect="non-scaling-stroke" style="display:none"/>
  </svg>${big?`<div class="pc-x" aria-hidden="true">${xs.map((t,i)=>`<span style="left:${(i*25)}%">${xLbl(t,settings.pRange)}</span>`).join('')}</div>`:''}</div>
  <div class="pc-axis m" aria-hidden="true" style="width:${(aw*0.6+0.7).toFixed(1)}em"><div class="pc-axis-in">${ticks.map((v,i)=>`<span style="top:${(Y(v)/H*100).toFixed(2)}%">${labs[i]}</span>`).join('')}</div></div></div>`;
  return{pts,X,Y,W,H,t0,t1,dPL,plot:wrap.querySelector('.pc-plot'),line:wrap.querySelector('.cur')}
}
// Muis/vinger over de grafiek, en met het toetsenbord: de grafiek is een schuifregelaar door de tijd
// (pijltjes: één punt, Shift+pijltje of PageUp/PageDown: grotere stap, Home/End: begin/eind, Esc: terug naar nu).
function pfHover(g,onPoint,onReset){
  const el=g.plot,n=g.pts.length;let ki=null;
  const showAt=i=>{const p=g.pts[i];g.line.setAttribute('x1',g.X(p[0]));g.line.setAttribute('x2',g.X(p[0]));g.line.style.display='';inUnit(()=>onPoint(p))};
  const move=e=>{const r=el.getBoundingClientRect(),x=((e.touches?e.touches[0].clientX:e.clientX)-r.left)/r.width;
    const t=g.t0+Math.max(0,Math.min(1,x))*(g.t1-g.t0);let i=Math.max(0,lastAtOrBefore(g.pts,t));if(i<n-1&&t-g.pts[i][0]>g.pts[i+1][0]-t)i++;showAt(i)};
  const reset=()=>{g.line.style.display='none';inUnit(onReset)};
  el.onmousemove=move;el.ontouchmove=move;el.ontouchstart=move;el.onmouseleave=()=>{if(ki==null)reset()};el.ontouchend=reset;
  const vtext=i=>inUnit(()=>{const p=g.pts[i],d0=new Date(p[0]);let t=d0.toLocaleDateString('nl-NL',{day:'numeric',month:'long',year:'numeric'})+' '+d0.toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'})+': totaal '+money(p[1],2);
    if(g.S)t+='. '+g.S.map(s=>s.name+' '+(s.v[i]==null?'geen':g.pct?pct1(s.v[i]):money(s.v[i],2))).join(', ');
    const d=el.querySelector(`.pdot[data-i="${i}"]`);if(d)t+='. '+(d.classList.contains('sell')?'Verkoop':'Aankoop')+' op dit moment';return t});
  el.tabIndex=0;el.setAttribute('role','slider');el.setAttribute('aria-label',(g.alt||'Grafiek')+' Gebruik de pijltjestoetsen om door de tijd te gaan.');
  el.setAttribute('aria-valuemin','0');el.setAttribute('aria-valuemax',String(n-1));el.setAttribute('aria-valuenow',String(n-1));el.setAttribute('aria-valuetext',vtext(n-1));
  const setI=i=>{ki=Math.max(0,Math.min(n-1,i));showAt(ki);el.setAttribute('aria-valuenow',String(ki));el.setAttribute('aria-valuetext',vtext(ki));
    const d=el.querySelector(`.pdot[data-i="${ki}"]`);if(d)el._showTip?.(d);else el._hideTip?.()};
  el.onkeydown=e=>{let i=ki??n-1;const big=Math.max(1,Math.ceil(n/10));
    switch(e.key){case 'ArrowLeft':case 'ArrowDown':i-=e.shiftKey?big:1;break;case 'ArrowRight':case 'ArrowUp':i+=e.shiftKey?big:1;break;
      case 'PageUp':i-=big;break;case 'PageDown':i+=big;break;case 'Home':i=0;break;case 'End':i=n-1;break;
      case 'Escape':if(ki==null)return;ki=null;el._hideTip?.();reset();e.preventDefault();e.stopPropagation();return;default:return}
    e.preventDefault();setI(i)};
  el.onfocus=()=>{if(el.matches(':focus-visible'))setI(ki??n-1)};
  el.onblur=()=>{if(ki!=null){ki=null;el._hideTip?.();reset()}}}
const pfWhen=p=>{const d=new Date(p[0]),s=shortRange(settings.pRange);return d.toLocaleDateString('nl-NL',{day:'numeric',month:'short',year:s?undefined:'numeric'})+(s?' '+d.toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'}):'')};
function pfAlt(res){const a=res.pts[0],z=res.pts[res.pts.length-1],ch=a[1]?(z[1]/a[1]-1)*100:null;
  return `Grafiek portfoliowaarde, ${RANGE_L[settings.pRange]||''}: van ${money(a[1],2)} naar ${money(z[1],2)}${ch!=null?' ('+pct(ch)+')':''}. Geïnvesteerd aan het eind: ${money(z[2],2)}.`}
// Grafiekweergave "Per munt": een lijn per munt (de 6 grootste, de rest samen als Overig) en voor cash
const PAL=['#4f8cff','#1fd17a','#f5b942','#b56cff','#ff7a59','#34c6d3','#8b93a5'];
// '% Totaal': op elk moment je ongerealiseerde resultaat ten opzichte van wat je op dat moment had geïnvesteerd
// (waarde crypto − geïnvesteerd) / geïnvesteerd; het laatste punt is gelijk aan het percentage bij 'Totaal ongerealiseerd'.
function twrSeries(res){const v=res.pts.map(p=>{const x=p[4];return x&&x.inv>0.005?(x.v-x.inv)/x.inv*100:null});const last=[...v].reverse().find(x=>x!=null)??0;
  return[{id:'__tot',name:'Portfolio',col:last>=0?'#1fd17a':'#ff5a5f',v}]}
function assetSeries(res,pct){
  const pts=res.pts,last=pts[pts.length-1][4]?.coins||{},ids=new Set();pts.forEach(p=>Object.keys(p[4]?.coins||{}).forEach(id=>ids.add(id)));
  const order=[...ids].filter(id=>pts.some(p=>(p[4].coins[id]||0)>0.005)).sort((a,b)=>(last[b]||0)-(last[a]||0)||(Math.max(...pts.map(p=>p[4].coins[b]||0))-Math.max(...pts.map(p=>p[4].coins[a]||0))));
  const top=order.slice(0,6),rest=order.slice(6);
  // % per munt: op elk moment je ongerealiseerde resultaat op die munt, (waarde − wat je nog in bezit hebt gekost) / kosten,
  // net als het percentage in de tabel Bezittingen; bijkopen en verkopen tellen dus mee. Zolang je de munt niet had: geen lijn.
  if(pct)return top.map((id,i)=>{const v=pts.map(p=>{const c=p[4].costs?.[id],w=p[4].coins?.[id];return c>0.005&&w>0?(w/c-1)*100:null});return v.some(x=>x!=null)?{id,name:allocKeyInfo(id).sym,col:PAL[i],v}:null}).filter(Boolean);
  const S=top.map((id,i)=>({id,name:allocKeyInfo(id).sym,col:PAL[i],v:pts.map(p=>p[4].coins[id]||0)}));
  if(rest.length)S.push({id:'__rest',name:'Overig',col:PAL[6],v:pts.map(p=>rest.reduce((s,id)=>s+(p[4].coins[id]||0),0))});
  if(hasCashTx()&&pts.some(p=>Math.abs(p[4].cash)>0.005))S.push({id:'__cash',name:'Cash',col:'var(--muted)',dash:true,v:pts.map(p=>p[4].cash)});
  return S}
let ptClip=0;
function paintAssets(wrap,res,o){
  const pts=res.pts,big=!!o.big;
  if(pts.length<2){wrap.innerHTML='<div class="chart-msg">Nog te weinig gegevens</div>';return null}
  const pc=!!o.pct,S=o.tot?twrSeries(res):assetSeries(res,pc);if(!S.length){wrap.innerHTML='<div class="chart-msg">Nog geen bezit in deze periode</div>';return null}
  const W=360,H=170,pt=10,pb=10,t0=pts[0][0],t1=pts[pts.length-1][0],all=S.flatMap(s=>s.v).filter(v=>v!=null);
  // '% Totaal' bij 1U, 4U en 24U: schaal op de lijn zelf (zoals bij € Totaal), anders zie je de beweging niet naast de 0%-lijn
  const tight=o.tot&&['1h','4h','1'].includes(settings.pRange);
  let lo=tight?Math.min(...all):Math.min(0,...all),hi=tight?Math.max(...all):Math.max(0,...all);if(hi-lo<(tight?0.02:1e-9)){const m=(hi+lo)/2;lo=m-0.01;hi=m+0.01}const pd=(hi-lo)*.06;hi+=pd;if((pc&&lo<0)||tight)lo-=pd;
  const X=t=>(t-t0)/(t1-t0||1)*W,Y=v=>pt+(1-(v-lo)/(hi-lo))*(H-pt-pb);
  const f=pc?1:unitF(),A=axisTicks(lo*f,hi*f,big?6:4),ticks=A.t.map(v=>v/f).filter(v=>Y(v)>=2&&Y(v)<=H-2);
  const pLbl=v=>(v>0?'+':v<0?'−':'')+(d=>new Intl.NumberFormat('nl-NL',{minimumFractionDigits:d,maximumFractionDigits:d}))(A.step<1?Math.max(1,Math.ceil(-Math.log10(A.step)-1e-9)):0).format(Math.abs(v))+'%';
  const labs=ticks.map(v=>pc?pLbl(v):tickLbl(v*f,A.step)),aw=Math.max(...labs.map(l=>l.length),4);
  const grid=ticks.map(v=>`<line class="pc-grid${pc&&Math.abs(v)<1e-9?' z':''}" x1="0" x2="${W}" y1="${Y(v).toFixed(2)}" y2="${Y(v).toFixed(2)}" vector-effect="non-scaling-stroke"/>`).join('');
  const lines=S.map(s=>`<path d="${s.v.map((v,i)=>v==null?'':(i&&s.v[i-1]!=null?'L':'M')+X(pts[i][0]).toFixed(1)+' '+Y(v).toFixed(1)).join('')}" fill="none" style="stroke:${s.col}" stroke-width="2" ${s.dash?'stroke-dasharray="4 4" ':''}vector-effect="non-scaling-stroke" stroke-linejoin="round"/>`).join('');
  // '% Totaal': boven 0% groen, eronder rood (zelfde lijn twee keer, elk afgeknipt op de 0%-lijn)
  let lines2=lines;if(o.tot){const y0=Math.max(-10,Math.min(H+10,Y(0))).toFixed(2),id='pt'+(++ptClip),d=lines.match(/ d="([^"]*)"/)[1];
    lines2=`<defs><clipPath id="${id}a"><rect x="0" y="-10" width="${W}" height="${(+y0+10).toFixed(2)}"/></clipPath><clipPath id="${id}b"><rect x="0" y="${y0}" width="${W}" height="${(H+10-y0).toFixed(2)}"/></clipPath></defs>
    <path d="${d}" fill="none" style="stroke:#1fd17a" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round" clip-path="url(#${id}a)"/>
    <path d="${d}" fill="none" style="stroke:#ff5a5f" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round" clip-path="url(#${id}b)"/>`}
  const xs=big?[0,.25,.5,.75,1].map(k=>t0+k*(t1-t0)):[];
  wrap.innerHTML=`<div class="pc"><div class="pc-plot"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true" focusable="false">${grid}${lines2}
    <line class="cur" x1="0" x2="0" y1="0" y2="${H}" stroke="#8b93a5" vector-effect="non-scaling-stroke" style="display:none"/></svg>${big?`<div class="pc-x" aria-hidden="true">${xs.map((t,i)=>`<span style="left:${(i*25)}%">${xLbl(t,settings.pRange)}</span>`).join('')}</div>`:''}</div>
  <div class="pc-axis m" aria-hidden="true" style="width:${(aw*0.6+0.7).toFixed(1)}em"><div class="pc-axis-in">${ticks.map((v,i)=>`<span style="top:${(Y(v)/H*100).toFixed(2)}%">${labs[i]}</span>`).join('')}</div></div></div>`;
  const tr=p=>p[1]-p[2]+p[3];
  return{pts,X,Y,W,H,t0,t1,S,pct:pc,tot:!!o.tot,dPL:tr(pts[pts.length-1])-tr(pts[0]),plot:wrap.querySelector('.pc-plot'),line:wrap.querySelector('.cur')}
}
// Legenda met de waarde per munt op het gekozen moment (standaard: nu)
function assetLegend(g,i){return `<ul class="pa-legend">${g.S.map(s=>`<li><i style="background:${s.col}"${s.dash?' class="dash"':''}></i>${esc(s.name)} <b class="${g.pct?cls(s.v[i]):'m'}">${g.pct?pct1(s.v[i]):money(s.v[i],2)}</b></li>`).join('')}</ul>`}
function assetAlt(g){const n=g.pts.length-1;if(g.tot)return `Grafiek resultaat ten opzichte van geïnvesteerd, ${RANGE_L[settings.pRange]||''}: van ${pct1(g.S[0].v.find(x=>x!=null))} naar ${pct1(g.S[0].v[n])}.`;return g.pct?`Grafiek resultaat per munt in procenten, ${RANGE_L[settings.pRange]||''}: ${g.S.map(s=>`${s.name} ${pct1(s.v[n])}`).join('; ')}.`
  :`Grafiek waarde per munt, ${RANGE_L[settings.pRange]||''}: ${g.S.map(s=>`${s.name} van ${money(s.v[0],2)} naar ${money(s.v[n],2)}`).join('; ')}.`}
const pviewSeg=()=>`<span class="seg mini pview" role="group" aria-label="Grafiekweergave">${[['total','€ Totaal'],['ptotal','% Totaal'],['assets','€ per munt'],['pct','% per munt']].map(([v,l])=>`<button type="button" data-act="pview" data-v="${v}" class="${(settings.pView||'total')===v?'on':''}" aria-pressed="${(settings.pView||'total')===v}">${l}</button>`).join('')}</span>`;
// Aan- en verkoopmomenten als stip op de lijn (aankoop: open stip, verkoop: dichte stip), met een venstertje met de gegevens
function txDots(g,mode){
  const plot=g?.plot;if(!plot)return;const pts=g.pts;
  const buys=TX().filter(t=>(t.type==='buy'||t.type==='sell')&&t.coinId&&txTime(t)>=g.t0&&txTime(t)<=g.t1);if(!buys.length)return;
  const at=t=>{let i=Math.max(0,lastAtOrBefore(pts,t));if(pts[i][0]<t&&i<pts.length-1)i++;return i};   // eerste punt ná de aankoop
  const groups=new Map();
  for(const t of buys){const i=at(txTime(t)),kind=t.type;let key=kind+'|'+i,val,col;
    if(mode==='total')val=pts[i][1];
    else if(mode==='ptotal')val=g.S[0].v[i];
    else{const s=g.S.find(x=>x.id===t.coinId)||(mode==='assets'?g.S.find(x=>x.id==='__rest'):null);if(!s)continue;val=s.v[i];key=kind+'|'+s.id+'|'+i;col=s.col}
    if(val==null||!isFinite(val))continue;
    // bij een verkoop telt het punt vóór de verkoop (daarna kan de lijn van die munt ophouden)
    if(kind==='sell'&&mode!=='total'&&mode!=='ptotal'&&(val==null||!isFinite(val))&&i>0){const s=g.S.find(x=>x.id===t.coinId);val=s?.v[i-1]}
    if(val==null||!isFinite(val))continue;
    const gr=groups.get(key)||{i,val,col,kind,txs:[]};gr.txs.push(t);groups.set(key,gr)}
  const G=[...groups.values()];if(!G.length)return;
  // laag die precies over de grafiek ligt (in het vergrote venster staat de tijdas eronder)
  plot.insertAdjacentHTML('beforeend','<div class="pdot-layer"></div>');const layer=plot.querySelector('.pdot-layer');
  layer.insertAdjacentHTML('beforeend',G.map((gr,n)=>`<span class="pdot${gr.kind==='sell'?' sell':''}" aria-hidden="true" data-n="${n}" data-i="${gr.i}" style="left:${(g.X(pts[gr.i][0])/g.W*100).toFixed(3)}%;top:${(g.Y(gr.val)/g.H*100).toFixed(3)}%${gr.col?';border-color:'+gr.col+(gr.kind==='sell'?';background:'+gr.col:''):''}"></span>`).join('')+'<div class="pdot-tip" role="tooltip" hidden></div>');
  const tip=plot.querySelector('.pdot-tip');
  const tipHTML=gr=>inUnit(()=>{const sell=gr.kind==='sell',si={};if(sell)for(const id of new Set(gr.txs.map(t=>t.coinId)))Object.assign(si,computeCoin(id).sellInfo);
    return `<b>${sell?(gr.txs.length>1?'Verkopen':'Verkoop'):(gr.txs.length>1?'Aankopen':'Aankoop')} · ${esc(fmtDate(gr.txs[0].date))}</b>`+gr.txs.map(t=>{const sym=esc((t.symbol||'').toUpperCase()||t.name||''),pl=si[t.id]?.pl;
    return `<div><span class="m">${qtyf(+(+t.qty).toPrecision(8))}</span> ${sym} à <span class="m">${money(atT(t.price,t))}</span> = <b class="m">${money(atT(txTotal(t),t),2)}</b>${t.fee?` <span class="label">(kosten <span class="m">${money(atT(t.fee,t),2)}</span>)</span>`:''}${t.acct?` <span class="label">· ${esc(t.acct)}</span>`:''}${sell&&pl!=null?`<div>Resultaat <b class="m ${cls(pl)}">${signed(pl)}</b>${si[t.id]?.pct!=null?` <span class="${cls(pl)}">${pct(si[t.id].pct)}</span>`:''}</div>`:''}</div>`}).join('')});
  const show=d=>{const gr=G[+d.dataset.n];tip.innerHTML=tipHTML(gr);tip.hidden=false;tip.style.left=d.style.left;tip.style.top=d.style.top;
    tip.classList.remove('below');tip.style.marginLeft='0';const r=tip.getBoundingClientRect(),pr=plot.getBoundingClientRect();
    if(r.top<8)tip.classList.add('below');   // te dicht bij de bovenkant: venster onder de stip
    const box=(plot.closest('.panel,.card')||document.documentElement).getBoundingClientRect(),over=r.right-Math.min(innerWidth-8,box.right-8),under=Math.max(8,box.left+8)-r.left;tip.style.marginLeft=over>0?(-over)+'px':under>0?under+'px':'0';};
  const hide=()=>{tip.hidden=true};
  plot._showTip=show;plot._hideTip=hide;
  plot.addEventListener('pointerover',e=>{const d=e.target.closest?.('.pdot');if(d)show(d)});
  plot.addEventListener('pointerout',e=>{if(e.target.closest?.('.pdot')&&e.pointerType==='mouse')hide()});
  plot.addEventListener('pointerdown',e=>{const d=e.target.closest?.('.pdot');if(d)show(d);else hide()});
}
async function drawPortfolioChart(){
  const my=++pChartTok;if(!$('#pchart'))return;chartAlt($('#pchart'),'');
  let res;
  try{res=await portfolioSeries(settings.pRange,true)}catch(e){if(my===pChartTok&&$('#pchart'))$('#pchart').innerHTML=`<div class="chart-msg">${esc(e.message||'Grafiek niet beschikbaar')}</div>`;return}
  const wrap=$('#pchart');if(my!==pChartTok||!wrap)return;
  return inUnit(()=>{   // tekenen in de gekozen weergave-eenheid
  const pv=settings.pView,as=['assets','pct','ptotal'].includes(pv),g=as?paintAssets(wrap,res,{pct:pv!=='assets',tot:pv==='ptotal'}):paintPf(wrap,res,{my}),leg=$('#plegend');
  if(leg)leg.innerHTML=g&&as?assetLegend(g,g.pts.length-1):'';
  if(!g){$('#pperiod').innerHTML='';return}
  txDots(g,pv==='ptotal'?'ptotal':as?pv:'total');
  chartAlt(wrap,'');g.alt=as?assetAlt(g):pfAlt(res);
  $('#pperiod').innerHTML=`<span>Rendement ${PLBL[settings.pRange]||''}: <b class="m ${cls(g.dPL)}">${signed(g.dPL)}</b></span>${res.partial?'<span class="warn-mark">niet alle koersen geladen</span>':''}${res.from?`<span>koersen beschikbaar vanaf ${new Date(res.from).toLocaleDateString('nl-NL',{day:'numeric',month:'short',year:'numeric'})}</span>`:''}`;
  const hv=$('#heroVal'),hp=$('#heroPl'),hs=$('#heroSub'),oV=hv.innerHTML,oP=hp.innerHTML,oS=hs?hs.innerHTML:'',wc=hasCashTx();
  pfHover(g,p=>{const pl=p[1]-p[2];hv.innerHTML=heroValHTML(p[1]);if(hs&&p[4])hs.innerHTML=heroSub(wc,p[4].v,p[4].cash,p[4].inv,p[4].real);
      hp.innerHTML=`<span class="static pl-toggle ${cls(pl)}"><span class="m">${signed(pl)}</span> <span>(${pct(p[2]>0?pl/p[2]*100:null)})</span> <small>${pfWhen(p)}</small></span>`;
      if(as&&leg)leg.innerHTML=assetLegend(g,g.pts.indexOf(p))},
    ()=>{hv.innerHTML=oV;hp.innerHTML=oP;if(hs)hs.innerHTML=oS;if(as&&leg)leg.innerHTML=assetLegend(g,g.pts.length-1)});
  })}
// Vergroot venster met de portfoliografiek
function renderPfZoom(){
  let z=$('#zoom'),fresh=!z;if(!z){z=document.createElement('dialog');z.id='zoom';z.className='zoom';z.setAttribute('aria-labelledby','zoomTitle');z.addEventListener('cancel',e=>{e.preventDefault();closeZoom()});document.body.appendChild(z);document.body.style.overflow='hidden';zoomReturn=rememberFocus()}
  const hc=hasCashTx();
  z.innerHTML=`<div class="zoom-in pz-wide"><div class="zoom-top"><h2>${hc?'Totale waarde':'Portfoliowaarde'}</h2><button type="button" class="icon-btn" data-act="zoomclose" aria-label="Sluiten"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
  <fieldset class="ranges"><legend class="sr-only">Periode van de grafiek</legend>${PRANGES.map(([d,l])=>`<button type="button" data-prange="${d}" class="${settings.pRange===d?'on':''}">${l}</button>`).join('')}</fieldset>
  <div class="pz-view">${pviewSeg()}</div>
  <div class="card"><div class="pz-info" id="pzInfo"></div><div class="chart-wrap pz" id="pzchart"><div class="chart-msg">Grafiek laden…</div></div>
  <p class="mt-8 hint mb-0" id="pzHint"></p></div></div>`;
  titleDialog(z,'zoomTitle');if(fresh&&!z.open){try{z.showModal()}catch(e){z.setAttribute('open','')}}
  drawPfZoom();
}
let pzTok=0;
async function drawPfZoom(){
  const my=++pzTok;let res;const el=()=>$('#pzchart');if(!el())return;
  try{res=await portfolioSeries(settings.pRange,true)}catch(e){if(my===pzTok&&el())el().innerHTML=`<div class="chart-msg">${esc(e.message||'Grafiek niet beschikbaar')}</div>`;return}
  const wrap=el();if(my!==pzTok||!wrap)return;
  inUnit(()=>{const pv=settings.pView,as=['assets','pct','ptotal'].includes(pv),g=as?paintAssets(wrap,res,{big:true,pct:pv!=='assets',tot:pv==='ptotal'}):paintPf(wrap,res,{my:'z'+my,big:true});if(!g){$('#pzInfo').innerHTML='';return}txDots(g,pv==='ptotal'?'ptotal':as?pv:'total');chartAlt(wrap,'');g.alt=as?assetAlt(g):pfAlt(res);
    const info=$('#pzInfo'),line=p=>{const pl=p[1]-p[2];return `<span class="label">${p===g.pts[g.pts.length-1]?'Nu':pfWhen(p)}</span><b class="m">${money(p[1],2)}</b><span class="m ${cls(pl)}">${signed(pl)} (${pct(p[2]>0?pl/p[2]*100:null)})</span>`};
    const def=()=>`${line(g.pts[g.pts.length-1])}<span class="label">Rendement ${PLBL[settings.pRange]||''}: <b class="m ${cls(g.dPL)}">${signed(g.dPL)}</b></span>`;
    const L=p=>as?assetLegend(g,g.pts.indexOf(p)):'',hc=hasCashTx();
    $('#pzHint').textContent='Beweeg de muis of je vinger over de grafiek voor de waarde op elk moment. Een open stip is een aankoop, een dichte stip een verkoop: ga erover of tik erop voor de details. '+(as
      ?(g.tot?'De lijn is op elk moment hoeveel je crypto waard was ten opzichte van wat je er op dat moment in had geïnvesteerd, in procenten. Boven 0% sta je in de plus. Het laatste punt is gelijk aan het percentage bij Totaal ongerealiseerd.':g.pct?'Elke lijn is op elk moment je resultaat op die munt: de waarde ten opzichte van wat je ervoor betaalde (gemiddelde aankoopprijs, met kosten). Bijkopen en verkopen tellen mee, en het laatste punt is gelijk aan het percentage in de tabel Bezittingen. Zolang je een munt niet had, staat er geen lijn. Alleen je zes grootste munten staan erin.'
        :`Elke lijn is de waarde van wat je op dat moment van die munt had; aan- en verkopen zie je als sprong.${hc?' Cash is de stippellijn.':''} De zes grootste munten krijgen een eigen lijn, de rest staat samen onder Overig.`)
      :`De stippellijn is wat je ${hc?'netto hebt gestort':'hebt geïnvesteerd'}; groen erboven is winst, rood eronder verlies. Bij 1U, 4U en 24U loopt de schaal alleen over de waarde zelf, zodat je kleine bewegingen ziet; de stippellijn valt dan meestal buiten beeld.`);
    info.innerHTML=def()+L(g.pts[g.pts.length-1]);pfHover(g,p=>{info.innerHTML=line(p)+L(p)},()=>{info.innerHTML=def()+L(g.pts[g.pts.length-1])})});
}

let chartToken=0;
function renderCoin(id){
  const c=computeCoin(id),sym=(c.meta.symbol||'').toUpperCase();
  $('#topbar').innerHTML=topbarHTML(c);
  const ranges=[['1','24U'],['7','1W'],['30','1M'],['90','3M'],['365','1J'],['max','Max']];
  const txs=[...c.txs].reverse();
  $('#view').innerHTML=`<div class="coin-grid"><div class="panel">
  <div class="coin-head">${coinIcon(c.meta,44)}
    <div><div class="price-big" id="pxMain">${money(c.price)}</div><div id="pxSub" class="px-sub ${cls(c.ch24)}">${pct(c.ch24)} <span class="sym">24 uur</span></div></div>
    <button type="button" class="watch-btn link" data-act="watch">${isWatched(id)?'★ Volg je':'☆ Volgen'}</button></div>
  <div class="chart-wrap" id="chart"><div class="chart-msg">Grafiek laden…</div></div>
  <fieldset class="ranges"><legend class="sr-only">Periode van de grafiek</legend>${ranges.map(([d,l])=>`<button type="button" data-range="${d}" class="${settings.range===d?'on':''}">${l}</button>`).join('')}</fieldset></div>
  <div class="coin-side">${!c.txs.length?`<div class="card"><b>Je hebt nog geen ${esc(sym)}</b><p class="watch-hint hint">Deze munt staat op je volglijst.</p><button type="button" class="btn" data-act="addbuy">Aankoop toevoegen</button></div>`:c.qty>1e-12?`
  <div class="pl-card stat wide card">
    <div class="label">Ongerealiseerde winst/verlies</div>
    <div class="pl-big ${cls(c.unreal)}"><span class="m">${signed(c.unreal)}</span> <span class="pl-pct">${pct(c.unrealPct)}</span></div>
  </div>
  <div class="stats">
    <div class="stat"><div class="label">Waarde</div><div class="val m">${money(c.value,2)}</div></div>
    <div class="stat"><div class="label">In bezit</div><div class="val m">${qtyf(c.qty)} ${esc(sym)}</div></div>
    <div class="stat"><div class="label">Gem. aankoopprijs</div><div class="val m">${money(c.avg)}</div></div>
    <div class="stat"><div class="label">Geïnvesteerd</div><div class="val m">${money(c.cost,2)}</div></div>
    <div class="stat"><div class="label">Koers t.o.v. gemiddelde</div><div class="val ${cls(c.price-c.avg)}">${c.price!=null&&c.avg?pct((c.price/c.avg-1)*100):'–'}</div></div>
    <div class="stat"><div class="label">Gerealiseerd</div><div class="val m ${cls(c.realized)}">${Math.abs(c.realized)>0.005?signed(c.realized):'–'}</div></div>
  </div>`:`<div class="stats"><div class="stat wide"><div class="label">Positie gesloten · gerealiseerde winst/verlies</div><div class="val-lg val m ${cls(c.realized)}">${signed(c.realized)}</div></div></div>`}${inEUR(()=>marketCard(c))}${inEUR(()=>alertsCard(c))}</div>
  <div class="coin-tools">${inEUR(()=>avgCalcCard(computeCoin(c.coinId)))}${inEUR(()=>sellSimCard(computeCoin(c.coinId)))}</div></div>
  ${c.txs.length?`<div class="list-head"><h2>Transacties</h2><span class="label">${c.txs.length}</span></div>
  <ul class="list only-m">${txs.map(t=>txRow(t,c)).join('')}</ul>${txTable(txs,c)}
  <div class="note">Winst per transactie wordt berekend met FIFO: verkopen worden afgeboekt op je oudste aankopen eerst. Transactiekosten tellen mee in de aankoopprijs.</div>`:''}`;
  drawChart(c);initAvgCalc(inEUR(()=>computeCoin(c.coinId)));initSellSim(inEUR(()=>computeCoin(c.coinId)));
}
function txRow(t,c){
  const sym=(c.meta.symbol||'').toUpperCase();
  let right='';
  if(isIn(t)){
    const l=c.lotMap[t.id],unit=l?l.unit:t.price;
    if(!l||l.remaining<=1e-12)right=`<div class="label">Volledig verkocht</div>`;
    else if(c.price==null)right=`<div class="label">Geen koers</div>`;
    else{const val=l.remaining*c.price,pl=l.remaining*(c.price-unit),pp=unit>0?(c.price/unit-1)*100:null;
      right=`<div class="v m">${money(val,2)}</div><div class="chg ${cls(pl)}"><span class="m">${signed(pl)}</span>${pp==null?'':' '+pct(pp)}</div>${l.remaining<t.qty-1e-12?`<div class="note-xs label">nog <span class="m">${qtyf(l.remaining)}</span> over</div>`:''}`}
  }else if(t.type==='transfer'){const s=c.sellInfo[t.id]||{};
    right=s.pl?`<div class="note-xs label">Netwerkkosten</div><div class="chg down m">${signed(s.pl)}</div>`:'';
  }else{
    const s=c.sellInfo[t.id]||{};
    right=`<div class="note-xs label">Gerealiseerd</div><div class="chg ${cls(s.pl)}"><span class="m">${signed(s.pl)}</span> ${pct(s.pct)}</div>${s.oversold?'<div class="oversold label">meer verkocht dan gekocht</div>':''}`;
  }
  return `<li class="row" data-tx="${esc(t.id)}"><div class="grow">
    <div class="tx-head"><span class="tx-type ${t.type}">${TYPE_L[t.type]}</span><button type="button" class="rowlink meta">${tm(t.date,fmtDate(t.date),t.date.length>10)}<span class="sr-only"> – transactie bewerken</span></button></div>
    <div class="tx-what">${txWhat(t,esc(sym))}</div>
    <div class="meta">${[isOther(t.type)?'':`Totaal <span class="m">${totalF(t)}</span>`,(t.type==='transfer'?t.feeQty:t.fee)?`kosten <span class="m">${feeTxt(t,esc(sym))}</span>`:'',t.acct&&t.type!=='transfer'?esc(t.acct):'',t.note?esc(t.note):''].filter(Boolean).join(' · ')}</div>
  </div><div class="right">${right}</div></li>`;
}

async function drawChart(c){
  const my=++chartToken,el=$('#chart');if(!el)return;chartAlt(el,'');
  let pts;
  try{pts=await fetchChart(c.coinId,settings.range);if(settings.range==='max')pts=withHist(c.coinId,pts)}catch(e){if(my===chartToken&&$('#chart'))$('#chart').innerHTML=`<div class="chart-msg">${esc(e.message)}</div>`;return}
  if(my!==chartToken||!$('#chart'))return;
  if(!pts.length){$('#chart').innerHTML='<div class="chart-msg">Geen koersdata</div>';return}
  return inUnit(()=>{   // tekenen in de gekozen weergave-eenheid (koers in bitcoin: koers ÷ bitcoinkoers van dat moment)
  c=computeCoin(c.coinId);if(unitNow()==='BTC')pts=pts.map(p=>[p[0],p[1]*K(p[0])]);
  if(c.price!=null&&Date.now()-pts[pts.length-1][0]>6e4)pts=[...pts,[Date.now(),c.price]];
  const W=360,H=190,pt=14,pb=14;
  const t0=pts[0][0],t1=pts[pts.length-1][0];
  let lo=Math.min(...pts.map(p=>p[1])),hi=Math.max(...pts.map(p=>p[1]));
  const avg=c.qty>1e-12?c.avg:null;
  // Stip = prijs incl. kosten (betaald ÷ aantal), net als de gemiddelde aankoopprijs
  const buys=c.txs.filter(t=>t.type==='buy').map(t=>({t:new Date(t.date).getTime(),p:atT(txTotal(t)/t.qty,t),k:atT(t.price,t)})).filter(b=>b.t>=t0&&b.t<=t1);
  const showAvg=avg&&avg>lo*0.6&&avg<hi*1.4;
  if(showAvg){lo=Math.min(lo,avg);hi=Math.max(hi,avg)}
  buys.forEach(b=>{lo=Math.min(lo,b.p);hi=Math.max(hi,b.p)});
  if(hi===lo){hi*=1.01;lo*=0.99}
  const X=t=>(t-t0)/(t1-t0||1)*W,Y=v=>pt+(1-(v-lo)/(hi-lo))*(H-pt-pb);
  const up=pts[pts.length-1][1]>=pts[0][1],col=up?'var(--green)':'var(--red)';
  const d=pts.map((p,i)=>(i?'L':'M')+X(p[0]).toFixed(1)+' '+Y(p[1]).toFixed(1)).join('');
  const gid='g'+my;
  {const a=pts[0][1],z=pts[pts.length-1][1],mx=Math.max(...pts.map(p=>p[1])),mn=Math.min(...pts.map(p=>p[1]));
   chartAlt($('#chart'),`Koersgrafiek ${c.meta.name||''}, ${RANGE_L[settings.range]||''}: van ${money(a)} naar ${money(z)} (${pct((z/a-1)*100)}). Hoogste ${money(mx)}, laagste ${money(mn)}.${c.avg?' Je gemiddelde aankoopprijs: '+money(c.avg)+'.':''}`)}
  $('#chart').innerHTML=`<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
    <defs><linearGradient id="${gid}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${up?'#1fd17a':'#ff5a5f'}" stop-opacity=".25"/><stop offset="1" stop-color="${up?'#1fd17a':'#ff5a5f'}" stop-opacity="0"/></linearGradient></defs>
    <path d="${d}L${W} ${H}L0 ${H}Z" fill="url(#${gid})"/>
    <path d="${d}" fill="none" stroke="${col}" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>
    ${showAvg?`<line x1="0" x2="${W}" y1="${Y(avg)}" y2="${Y(avg)}" stroke="#8b93a5" stroke-dasharray="4 4" vector-effect="non-scaling-stroke"/>`:''}
    <line id="cur" x1="0" x2="0" y1="0" y2="${H}" stroke="#8b93a5" vector-effect="non-scaling-stroke" style="display:none"/>
  </svg>
  ${buys.map(b=>`<span title="Aankoop ${fmtDate(new Date(b.t).toISOString().slice(0,10))}: ${money(b.p)} incl. kosten (koers ${priceF(b.k)})" class="buy-dot" style="left:calc(${X(b.t)/W*100}% - 5px);top:calc(${(Y(b.p)/H*100).toFixed(2)}% - 5px)"></span>`).join('')}
  ${showAvg?`<span class="avg-lbl m" style="top:calc(${(Y(avg)/H*100).toFixed(2)}% - 18px)">gem. ${money(avg)}</span>`:''}`;
  // scrubben
  const wrap=$('#chart'),line=wrap.querySelector('#cur');
  const reset=()=>{line.style.display='none';$('#pxMain').textContent=money(c.price);$('#pxSub').className=cls(c.ch24);$('#pxSub').innerHTML=`${pct(c.ch24)} <span class="sym">24 uur</span>`};
  const move=e=>{const r=wrap.getBoundingClientRect(),x=((e.touches?e.touches[0].clientX:e.clientX)-r.left)/r.width;
    const tt=t0+Math.max(0,Math.min(1,x))*(t1-t0);let i=0,lo2=0,hi2=pts.length-1;while(lo2<hi2){const m=(lo2+hi2)>>1;if(pts[m][0]<tt)lo2=m+1;else hi2=m}i=lo2;
    const p=pts[i];line.setAttribute('x1',X(p[0]));line.setAttribute('x2',X(p[0]));line.style.display='';
    $('#pxMain').textContent=money(p[1]);const ch=(p[1]/pts[0][1]-1)*100;$('#pxSub').className=cls(ch);
    const dt=new Date(p[0]);$('#pxSub').innerHTML=`${pct(ch)} <span class="sym">${dt.toLocaleDateString('nl-NL',{day:'numeric',month:'short',year:settings.range==='1'?undefined:'numeric'})}${['1','7'].includes(settings.range)?' '+dt.toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'}):''}</span>`};
  const mvU=e=>inUnit(()=>move(e)),rsU=()=>inUnit(reset);
  wrap.onmousemove=mvU;wrap.ontouchmove=mvU;wrap.ontouchstart=mvU;wrap.onmouseleave=rsU;wrap.ontouchend=rsU;
  })}

/* ---------- bladen (sheets) ---------- */
// Bladen zijn een <dialog> (showModal): de achtergrond is dan niet bereikbaar met Tab, Esc sluit,
// en na sluiten gaat de focus terug naar de knop waarmee je het blad opende.
let sheetReturn=null;
function rememberFocus(){const e=document.activeElement;return e&&e!==document.body?{el:e,key:focusKey(e)}:null}
function restoreFocus(r){if(!r)return;let el=r.el?.isConnected&&r.el.getClientRects().length?r.el:null;
  if(!el&&r.key)el=[...document.querySelectorAll(r.key)].find(x=>x.getClientRects().length);if(el)el.focus({preventScroll:true})}
function titleDialog(d,id){const h=d.querySelector('h1,h2,h3');d.querySelectorAll('#'+id).forEach(x=>x!==h&&x.removeAttribute('id'));if(h)h.id=id}
// Enter-toets op het schermtoetsenbord: "Gereed" in formulieren; in een zoekveld kiest Enter het eerste resultaat
function enterHints(root){root.querySelectorAll('form.js-form input:not([enterkeyhint]):not([type=hidden])').forEach(i=>i.setAttribute('enterkeyhint','done'))}
document.addEventListener('keydown',e=>{if(e.key!=='Enter'||!e.target.matches?.('#f_search,#w_search'))return;e.preventDefault();
  const first=$('#f_results [data-pick] .rowlink,#f_results [data-wpick] .rowlink');if(first)first.click()});
// Elk blad heeft een sluitknop rechtsboven die bij scrollen in beeld blijft (op de iPhone was buiten het blad tikken soms niet mogelijk)
const SHEET_X='<div class="sheet-x-wrap"><button type="button" class="icon-btn sheet-x" data-act="closesheet" aria-label="Sluiten"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>';
function openSheet(html){const d=$('#sheet');$('#sheetCard').innerHTML='<div class="grab" aria-hidden="true"></div>'+SHEET_X+html;enterHints($('#sheetCard'));titleDialog(d,'sheetTitle');
  if(!d.open){sheetReturn=rememberFocus();d.classList.remove('hidden');try{d.showModal()}catch(e){d.setAttribute('open','')}}
  document.body.style.overflow='hidden'}
function closeSheet(){const d=$('#sheet');if(!d.open&&d.classList.contains('hidden'))return;d.classList.add('hidden');if(d.open)d.close();
  document.body.style.overflow=$('#zoom')?'hidden':'';const r=sheetReturn;sheetReturn=null;restoreFocus(r)}
$('#sheet').addEventListener('cancel',e=>{e.preventDefault();closeSheet()});
$('#sheetBg').onclick=closeSheet;

let form=null;
// meest gebruikte broker/wallet (voor een nieuw formulier als je nog niets handmatig hebt ingevoerd, bijv. na een import)
function topAcct(){const n={};for(const t of TX())if(t.acct)n[t.acct]=(n[t.acct]||0)+1;return Object.keys(n).sort((a,b)=>n[b]-n[a])[0]||''}
function openTx(opts={}){
  const t=opts.txId?data.txs.find(x=>x.id===opts.txId):null;
  let coin=null;
  if(t&&t.coinId)coin={id:t.coinId,name:t.name,symbol:t.symbol,image:t.image};
  else if(opts.coinId){const c=computeCoin(opts.coinId);coin={id:opts.coinId,name:c.meta.name,symbol:c.meta.symbol,image:c.meta.image}}
  form={id:t?.id,coin,type:t?.type||opts.type||'buy',amount:t?.amount!=null?plainNum(t.amount):'',qty:t?.qty!=null?plainNum(t.qty):'',price:t&&!isOther(t.type)&&t.price!=null?plainNum(t.price):'',
    total:t&&t.qty&&!isOther(t.type)?plainNum(Math.round(txTotal(t)*100)/100):'',fee:t?.fee?plainNum(t.fee):opts.fee>0?plainNum(Math.round(opts.fee*100)/100):'',feeQty:t?.feeQty?plainNum(t.feeQty):'',
    acct:t?(t.acct||''):(opts.acct||settings.lastAcct||topAcct()),to:t?.to||'',date:t?.date||opts.date||nowLocal(),plan:opts.plan||null,note:t?.note||'',pf:t?pfOf(t):(opts.pf||pfNew()),edits:t?['qty','price']:[]};
  if(coin&&!t&&prices[coin.id]?.price){form.price=plainNum(prices[coin.id].price);form.edits=['price']}
  if(opts.price>0){form.price=plainNum(+(+opts.price).toPrecision(10));form.edits=['price']}
  if(opts.total){form.total=(Math.round(opts.total*100)/100).toFixed(2).replace('.',',');form.edits=['total',...form.edits]}
  renderTxSheet();if(opts.total)recalc('total');
  if(coin&&!t&&!prices[coin.id]?.price)fetchPrice(coin.id).then(p=>{const el=$('#f_price');if(p&&form&&el&&!el.value&&form.edits.length<2){form.price=el.value=plainNum(p);recalc('price')}});
}
function renderTxSheet(){
  const f=form,cash=isCash(f.type),sym=esc(((f.coin||{}).symbol||'').toUpperCase());
  const seg=`<fieldset class="seg seg4"><legend class="sr-only">Soort transactie</legend>${['buy','sell','deposit','withdraw','receive','transfer'].map(k=>`<button type="button" data-type="${k}" class="${k} ${f.type===k?'on':''}">${TYPE_L[k]}</button>`).join('')}</fieldset>`;
  const accts=accounts();
  const dl=`<datalist id="acctList">${[...new Set([...accts,'Bitvavo','eToro','Ledger','Eigen wallet'])].map(a=>`<option value="${esc(a)}">`).join('')}</datalist>`;
  const acctF=(id,label,val)=>`<div class="field"><label for="${id}">${label}</label><input type="text" id="${id}" list="acctList" value="${esc(val)}" placeholder="bijv. Bitvavo" autocomplete="off"></div>`;
  const coinPick=f.coin?`<div class="chosen">${coinIcon({coinId:f.coin.id,symbol:f.coin.symbol,image:f.coin.image},28)}<div><b>${esc(f.coin.name)}</b> <span class="muted">${sym}</span></div>${f.id?'':'<button type="button" data-act="changecoin">Wijzig</button>'}</div>`
    :`<div class="field"><label for="f_search">Munt zoeken</label><input type="text" id="f_search" enterkeyhint="search" placeholder="bijv. Bitcoin, ETH, Solana" autocomplete="off"></div><ul class="results" id="f_results"></ul>`;
  const dateF=`<div class="field"><label for="f_date">Datum en tijd</label><input id="f_date" type="datetime-local" step="60" value="${esc((f.date||'').slice(0,16))}"></div>`;
  const feeF=`<div class="field"><label for="f_fee">Kosten (€, optioneel)</label><input type="text" id="f_fee" inputmode="decimal" value="${esc(f.fee)}" placeholder="0"></div>`;
  let body;
  if(cash)body=`<div class="field"><label for="f_amount">${f.type==='deposit'?'Gestort bedrag':'Opgenomen bedrag'} (€)</label><input type="text" id="f_amount" inputmode="decimal" value="${esc(f.amount)}" placeholder="0,00"></div>
    <p class="hint">${f.type==='deposit'?'Geld dat je naar je broker hebt overgemaakt.':'Geld dat je van je broker terug naar je bank hebt gehaald.'} Eventuele kosten gaan van je cash af.</p>
    <div class="two">${dateF}${feeF}</div>${acctF('f_acct','Broker / wallet',f.acct)}`;
  else if(f.type==='receive')body=`${coinPick}<div class="field"><label for="f_qty">Aantal ontvangen</label><input type="text" id="f_qty" inputmode="decimal" value="${esc(f.qty)}" placeholder="0"></div>
    <p class="hint">Voor staking-beloningen, airdrops en andere munten die je zonder te betalen krijgt. Ze tellen mee in je bezit met een aankoopprijs van € 0.</p>
    ${dateF}${acctF('f_acct','Broker / wallet',f.acct)}`;
  else if(f.type==='transfer')body=`${coinPick}<div class="two"><div class="field"><label for="f_qty">Aantal verstuurd</label><input type="text" id="f_qty" inputmode="decimal" value="${esc(f.qty)}" placeholder="0"></div>
    <div class="field"><label for="f_feeq">Netwerkkosten (${sym||'munt'})</label><input type="text" id="f_feeq" inputmode="decimal" value="${esc(f.feeQty)}" placeholder="0"></div></div>
    <div class="two">${acctF('f_acct','Van',f.acct)}${acctF('f_to','Naar',f.to)}</div>
    <p class="hint">Munten verplaatsen tussen je eigen brokers en wallets. Er komt aan: aantal − netwerkkosten. Je aankoopprijs blijft gelijk; alleen de netwerkkosten tellen als verlies.</p>${dateF}`;
  else body=`${coinPick}
  <div class="field" id="w_total"><label for="f_total">${f.type==='sell'?'Opbrengst na kosten (€)':'Totaalbedrag incl. kosten (€)'}</label><input type="text" id="f_total" inputmode="decimal" value="${esc(f.total)}" placeholder="0,00"></div>
  <div class="two">
    <div class="field" id="w_price"><label for="f_price">Koers per munt (€)</label><input type="text" id="f_price" inputmode="decimal" value="${esc(f.price)}" placeholder="0,00"></div>
    <div class="field" id="w_qty"><label for="f_qty">Aantal</label><input type="text" id="f_qty" inputmode="decimal" value="${esc(f.qty)}" placeholder="0"></div>
  </div>
  <p class="hint">${f.type==='sell'?'Opbrengst = aantal × koers − kosten.':'Totaal = aantal × koers + kosten.'} Vul twee van de drie velden in; het derde wordt berekend.<br><b>Tip:</b> neem het aantal en het ${f.type==='sell'?'ontvangen':'betaalde'} bedrag en de kosten precies over van je afschrift. De app berekent dan de exacte koers, zodat je cash op de cent klopt.</p>
  <div class="two">${dateF}${feeF}</div>${acctF('f_acct','Broker / wallet',f.acct)}`;
  openSheet(`<h2 class="h3">${f.id?'Transactie bewerken':'Transactie toevoegen'}</h2><form class="js-form" novalidate>${seg}${body}${dl}
  ${multiPf()?`<div class="field"><label for="f_pf">Portefeuille</label><select id="f_pf">${pfList().map(p=>`<option value="${esc(p.id)}"${(f.pf||pfNew())===p.id?' selected':''}>${esc(p.name)}</option>`).join('')}</select></div>`:''}
  <div class="field"><label for="f_note">Notitie (optioneel)</label><input type="text" id="f_note" value="${esc(f.note)}" placeholder="${f.type==='receive'?'bijv. Staking, airdrop':'optioneel'}"></div>
  <button type="submit" class="btn" data-act="savetx">${f.id?'Opslaan':'Toevoegen'}</button></form>
  ${f.id?'<button type="button" class="btn danger" data-act="deltx">Transactie verwijderen</button>':''}`);
  if(cash){$('#f_amount').focus();return}
  const s=$('#f_search');if(s){s.focus();s.oninput=()=>{clearTimeout(s._t);s._t=setTimeout(()=>searchCoins(s.value),300)}}
  if(!$('#f_total'))return;
  $('#f_total').oninput=()=>recalc('total');$('#f_qty').oninput=()=>recalc('qty');$('#f_price').oninput=()=>recalc('price');$('#f_fee').oninput=()=>recalc('fee');
  recalc('fee');   // derde veld bijwerken (ook na wisselen tussen koop/verkoop)
}
// Totaal = aantal × koers + kosten (verkoop: − kosten). De twee laatst ingevulde velden van
// totaal/koers/aantal zijn leidend; het derde wordt berekend.
function recalc(src){
  if(!$('#f_total'))return;
  if(['total','qty','price'].includes(src))form.edits=[src,...form.edits.filter(x=>x!==src)];
  const e=form.edits.slice(0,2);
  const d=e.length<2?null:['total','qty','price'].find(x=>!e.includes(x));
  ['total','qty','price'].forEach(x=>$('#w_'+x).classList.toggle('calc',x===d));
  if(!d)return;
  const T=num($('#f_total').value),Q=num($('#f_qty').value),P=num($('#f_price').value),K=num($('#f_fee').value)||0,sg=form.type==='sell'?-1:1;
  if(d==='total'&&isFinite(Q)&&isFinite(P))$('#f_total').value=(Q*P+sg*K).toFixed(2).replace('.',',');
  else if(d==='qty'&&isFinite(T)&&P>0)$('#f_qty').value=plainNum(+Math.max(0,(T-sg*K)/P).toFixed(8));   // 8 decimalen, zoals brokers aantallen tonen
  else if(d==='price'&&isFinite(T)&&Q>0)$('#f_price').value=plainNum(+((T-sg*K)/Q).toPrecision(8));
}
async function searchCoins(q,attr='pick'){
  const ul=$('#f_results');if(!ul)return;q=q.trim();
  if(q.length<2){ul.innerHTML='';return}
  ul.innerHTML='<li class="muted">Zoeken…</li>';
  try{const r=await cg(`/search?query=${encodeURIComponent(q)}`);const j=await r.json();
    const list=(j.coins||[]).slice(0,8);
    if(!$('#f_results'))return;
    ul.innerHTML=list.length?list.map(c=>`<li data-${attr}='${esc(JSON.stringify({id:c.id,name:c.name,symbol:c.symbol,image:c.large||c.thumb}))}'><img src="${esc(c.thumb)}" alt="" width="26" height="26" loading="lazy" decoding="async"><div class="grow"><button type="button" class="rowlink"><b>${esc(c.name)}</b></button> <span class="muted">${esc(c.symbol)}</span></div>${c.market_cap_rank?`<span class="label">#${c.market_cap_rank}</span>`:''}</li>`).join(''):'<li class="muted">Niets gevonden</li>';
  }catch(e){ul.innerHTML='<li class="muted">Zoeken mislukt (offline?)</li>'}
}
function readForm(){
  const v=(id,k)=>{const el=$('#'+id);if(el)form[k]=el.value};v('f_pf','pf');
  v('f_qty','qty');v('f_price','price');v('f_total','total');v('f_amount','amount');v('f_fee','fee');v('f_feeq','feeQty');v('f_acct','acct');v('f_to','to');v('f_date','date');v('f_note','note');
}
function saveTx(){
  readForm();const f=form;
  const fee=f.fee&&!isOther(f.type)?num(f.fee):0;
  if(!(fee>=0))return fieldErr('f_fee','Kosten zijn ongeldig');
  if(!f.date)return fieldErr('f_date','Vul een datum en tijd in');
  const prevD=f.id?data.txs.find(t=>t.id===f.id)?.date:null;if(prevD&&f.date.slice(0,16)===prevD.slice(0,16))f.date=prevD;   // seconden van een import bewaren als de tijd niet is aangepast
  const now=Date.now(),created=f.id?(data.txs.find(t=>t.id===f.id)?.created||now):now,acct=(f.acct||'').trim();
  const prev=f.id?data.txs.find(t=>t.id===f.id):null,tpf=f.pf||pfNew(),base={...(tpf!=='main'?{pf:tpf}:{}),id:f.id||uid(),type:f.type,date:f.date,note:(f.note||'').trim(),acct,created,mod:now,dev:prev?prev.dev:devId(),...(prev?.ext?{ext:prev.ext}:{})};
  let tx;
  if(isCash(f.type)){
    const amount=num(f.amount);if(!(amount>0))return fieldErr('f_amount','Vul een bedrag in');
    tx={...base,amount,fee};
  }else{
    if(!f.coin)return fieldErr('f_search','Kies eerst een munt');
    const coin={coinId:f.coin.id,name:f.coin.name,symbol:f.coin.symbol,image:f.coin.image},qty=num(f.qty);
    if(!(qty>0))return fieldErr('f_qty','Vul een aantal in');
    if(f.type==='receive')tx={...base,...coin,qty,price:0,fee:0};
    else if(f.type==='transfer'){
      const feeQty=f.feeQty?num(f.feeQty):0,to=(f.to||'').trim();
      if(!(feeQty>=0)||feeQty>=qty)return fieldErr('f_feeq','Netwerkkosten zijn ongeldig');
      if(!acct||!to||acct===to)return fieldErr(!acct?'f_acct':'f_to','Vul twee verschillende brokers/wallets in');
      tx={...base,...coin,qty,feeQty,to,price:0,fee:0};
    }else{
      const price=num(f.price);if(!(price>0))return fieldErr('f_price','Vul een geldige koers in');
      tx={...base,...coin,qty,price,fee};
    }
  }
  if(f.plan&&!f.id)planMark(f.plan.id,f.plan.ym,tx.id);   // plan: deze maand is ingevoerd
  if(acct)settings.lastAcct=acct;
  const i=data.txs.findIndex(t=>t.id===tx.id);if(i>=0)data.txs[i]=tx;else data.txs.push(tx);
  saveData();closeSheet();
  if(tx.coinId){if(!prices[tx.coinId])refreshPrices();if(location.hash!=='#transacties')location.hash='#coin/'+encodeURIComponent(tx.coinId)}
  render();
  toast(f.id?'Transactie bijgewerkt':isCash(tx.type)?TYPE_L[tx.type]+' toegevoegd':'Transactie toegevoegd');
}
function deleteTx(){
  if(!confirm('Deze transactie verwijderen?'))return;
  data.txs=data.txs.filter(t=>t.id!==form.id);data.deleted.push(form.id);saveData();closeSheet();render();toast('Verwijderd');
}

function openSettings(){
  const g=settings.gh;
  const pks=lockCfg?.pks||[];
  openSheet(`<h2 class="h3">Instellingen</h2>
  <div class="section-t">Weergave</div>
  <fieldset class="seg"><legend class="sr-only">Thema</legend>${[['auto','Automatisch'],['dark','Donker'],['light','Licht']].map(([v,l])=>`<button type="button" data-theme="${v}" class="${(settings.theme||'auto')===v?'on all':'all'}">${l}</button>`).join('')}</fieldset>
  <p class="mt-8 hint">Bedragen tonen in:</p>
  <fieldset class="seg"><legend class="sr-only">Bedragen tonen in</legend>${[['EUR','Euro €'],['USD','Dollar $'],['BTC','Bitcoin ₿']].map(([v,l])=>`<button type="button" data-unit="${v}" class="${(settings.unit||'EUR')===v?'on all':'all'}">${l}</button>`).join('')}</fieldset>
  <p class="mt-0 hint">Geldt voor Overzicht, munten en Transacties. Dollar: omgerekend tegen de koers van nu. Bitcoin: aankopen, verkopen en stortingen tegen de bitcoinkoers van dat moment, dus je winst in bitcoin laat zien of je beter deed dan bitcoin aanhouden. Formulieren, rapporten en het jaaroverzicht blijven in euro.${settings.unit&&settings.unit!=='EUR'&&fx.ts?` Koers bijgewerkt ${fmtTs(fx.ts)}.`:''}</p>
  ${pfSettingsHTML()}
  <div class="section-t">Beveiliging</div>
  ${lockCfg?`
  ${pks.length?`<div class="pk-list">${pks.map(k=>`<div class="pk-row">${ICONS.key}<div><b>${esc(k.name)}</b><div class="note-sm label">toegevoegd ${new Date(k.created).toLocaleDateString('nl-NL',{day:'numeric',month:'short',year:'numeric'})}</div></div><button type="button" data-act="rmpk" data-id="${esc(k.id)}">Verwijder</button></div>`).join('')}</div>`:'<p class="mt-0 hint">Nog geen passkey op dit apparaat; ontgrendelen gaat nu alleen met je herstelwachtwoord.</p>'}
  ${pkSupported()?'<button type="button" class="btn sec" data-act="addpk">Passkey toevoegen</button>':'<p class="hint">Passkeys werken alleen als de app via https draait (GitHub Pages).</p>'}
  <div class="mt-12 field"><label for="s_auto">Automatisch vergrendelen na</label><select id="s_auto">${[[0,'Direct bij verlaten'],[1,'1 minuut'],[5,'5 minuten'],[15,'15 minuten'],[60,'1 uur'],[-1,'Nooit (alleen bij herstarten)']].map(([v,l])=>`<option value="${v}"${(lockCfg.autoLock??5)===v?' selected':''}>${l}</option>`).join('')}</select></div>
  <div class="two"><button type="button" class="btn sec" data-act="chpw">Wachtwoord wijzigen</button><button type="button" class="btn sec" data-act="lockoff">Uitschakelen</button></div>`
  :`<p class="mt-0 hint">Vergrendel de app met een passkey (Face ID, Touch ID of Windows Hello). Je gegevens op dit apparaat worden dan versleuteld opgeslagen.</p><button type="button" class="btn sec" data-act="lockon">App-vergrendeling instellen</button>`}
  <div class="section-t">Synchronisatie via GitHub</div>
  <p class="mt-0 hint">Je portfolio wordt versleuteld (AES-256) opgeslagen in een privé-repository, zodat je het op al je apparaten ziet. Zonder wachtwoord kan niemand het lezen, ook GitHub niet.</p>
  <form class="js-form" novalidate><div class="field"><label for="s_repo">Repository (gebruiker/naam)</label><input type="text" id="s_repo" value="${esc(g.repo)}" placeholder="geert/mijn-data" autocapitalize="off" autocorrect="off"></div>
  <div class="field"><label for="s_token">Personal access token</label><input id="s_token" name="github-token" type="password" value="${esc(g.token)}" placeholder="github_pat_…" autocomplete="current-password" spellcheck="false"></div>
  <div class="two"><div class="field"><label for="s_path">Bestand</label><input type="text" id="s_path" value="${esc(g.path)}"></div><div class="field"><label for="s_branch">Branch</label><input type="text" id="s_branch" value="${esc(g.branch)}"></div></div>
  <div class="field"><label for="s_pass">Versleutelwachtwoord</label><input id="s_pass" name="sync-password" type="password" value="${esc(g.pass)}" autocomplete="${g.pass?'current-password':'new-password'}" placeholder="Zelfde op elk apparaat"></div>
  <p class="hint">Laatste synchronisatie: <b>${settings.lastGh?fmtTs(settings.lastGh):'nog niet'}</b>${syncState.s==='err'?' (laatste poging mislukt)':''}<br>Token: fine-grained, alleen deze repo, recht <i>Contents: Read and write</i>. ${syncState.s==='err'?`<br><span class="danger">Laatste fout: ${esc(syncState.msg)}</span>`:''}</p>
  <button type="submit" class="btn" data-act="savesync">Opslaan en synchroniseren</button></form>
  ${settings.gh.token&&settings.gh.repo&&settings.gh.pass?'<button type="button" class="btn sec" data-act="pairout">Ander apparaat koppelen</button><button type="button" class="btn sec" data-act="versions">Eerdere versie terugzetten</button>':'<button type="button" class="btn sec" data-act="pairopen">Koppelcode invoeren</button>'}
  <div class="section-t">Koersdata</div>
  <p class="mt-0 hint">Koersen laatst bijgewerkt: <b>${lastCgTs()?fmtTs(lastCgTs()):'nog niet'}</b>${cgState.s==='err'?` (laatste poging mislukt: ${esc(cgState.msg)})`:''}</p>
  <p class="mt-0 hint">Zonder sleutel deel je de limiet van CoinGecko met iedereen die geen sleutel heeft. Met een gratis <i>Demo</i>-sleutel krijg je een eigen, hogere limiet. Wordt via GitHub-sync naar je andere apparaten gekopieerd. Aanvragen via <a href="https://www.coingecko.com/en/api/pricing" target="_blank" rel="noopener noreferrer">coingecko.com/en/api</a> → Demo (gratis account).</p>
  <p class="hint">Eigen koersarchief: ${(()=>{let n=0,mn=Infinity;for(const id in data.hist||{})for(const d in data.hist[id]){n++;mn=Math.min(mn,data.hist[id][d][0])}return n?`${n} dagkoersen, vanaf ${new Date(mn).toLocaleDateString('nl-NL',{day:'numeric',month:'short',year:'numeric'})}`:'wordt opgebouwd'})()}. Dagkoersen worden voorgoed bewaard, zodat 'Max' na verloop van tijd verder dan een jaar terug reikt.</p>
  <form class="js-form" novalidate><div class="field"><label for="s_cg">CoinGecko Demo API-sleutel (optioneel)</label><input id="s_cg" name="coingecko-key" type="password" value="${esc(data.cfg?.cgKey||'')}" placeholder="CG-…" autocomplete="current-password" spellcheck="false"></div>
  <button type="submit" class="btn sec" data-act="savecg">Sleutel opslaan en testen</button></form>
  <div class="section-t">Importeren</div>
  <p class="mt-0 hint">Download in Bitvavo je transactiegeschiedenis als CSV-bestand (menu rechtsboven → Transactiegeschiedenis → downloaden) en lees het hier in. Bestaande transacties worden herkend, dus je kunt hetzelfde bestand later opnieuw importeren.</p>
  <button type="button" class="btn sec" data-act="bvimport">Importeren uit Bitvavo (CSV)</button>
  <div class="section-t">Back-up</div>
  <div class="two"><button type="button" class="btn sec" data-act="export">Exporteren</button><button type="button" class="btn sec" data-act="import">Importeren</button></div>
  <input type="file" id="s_file" accept="application/json,.json" hidden>
  <button type="button" class="mt-10 btn sec" data-act="refresh">Koersen nu verversen</button>
  <div class="section-t">Gevarenzone</div>
  <button type="button" class="btn danger" data-act="wipe">Alle transacties wissen</button>
  <p class="app-foot hint">Koersdata: CoinGecko · ${data.txs.length} transacties · versie ${APP_VERSION}</p>`);
  $('#s_file').onchange=importFile;
  const sa=$('#s_auto');if(sa)sa.onchange=()=>{lockCfg.autoLock=+sa.value;saveLock()};
}
function exportData(){
  settings.lastExport=Date.now();saveSettings();
  const blob=new Blob([JSON.stringify({app:'crypto-portfolio',exported:new Date().toISOString(),...data},null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='crypto-portfolio-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);
}
async function importFile(e){
  const file=e.target.files[0];if(!file)return;
  try{const j=JSON.parse(await file.text());if(!Array.isArray(j.txs))throw 0;
    data=merge(data,{txs:j.txs,deleted:j.deleted||[],cfg:j.cfg,hist:j.hist,watch:j.watch,alerts:j.alerts,goals:j.goals,plans:j.plans,portfolios:j.portfolios,allocs:j.allocs});saveData();closeSheet();refreshPrices();render();toast(j.txs.length+' transacties geïmporteerd');
  }catch(err){toast('Ongeldig back-upbestand')}
}

/* ---------- versleuteling + GitHub-sync ---------- */
const enc=new TextEncoder(),dec=new TextDecoder();
const bufToB64=b=>{let s='';new Uint8Array(b).forEach(x=>s+=String.fromCharCode(x));return btoa(s)};
const b64ToBuf=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
/* ---------- koppelcode: een nieuw apparaat koppelen zonder alles over te typen ---------- */
// De code bevat repository, token, bestand, branch, versleutelwachtwoord en CoinGecko-sleutel, versleuteld met een
// willekeurige koppel-pincode die apart wordt getoond. Zonder die pincode is de code onbruikbaar.
const PAIR_PRE='CPK1.';
const PIN_CH='23456789ABCDEFGHJKMNPQRSTUVWXYZ';   // zonder 0/O en 1/I/L: makkelijk over te typen
function newPin(){const r=crypto.getRandomValues(new Uint8Array(8));const s=[...r].map(x=>PIN_CH[x%PIN_CH.length]).join('');return s.slice(0,4)+'-'+s.slice(4)}
const normPin=p=>String(p||'').toUpperCase().replace(/[^0-9A-Z]/g,'');
async function makePairCode(pin){const g=settings.gh;
  const o=await encryptObj({repo:g.repo,token:g.token,path:g.path,branch:g.branch,pass:g.pass,cgKey:data.cfg?.cgKey||'',made:Date.now()},normPin(pin));
  return PAIR_PRE+utf8ToB64(JSON.stringify(o)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
async function readPairCode(code,pin){
  let s=String(code||'').trim().replace(/\s+/g,'');if(!s.startsWith(PAIR_PRE))throw new Error('Dit is geen koppelcode van Crypto Portfolio');
  s=s.slice(PAIR_PRE.length).replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';
  let o;try{o=JSON.parse(dec.decode(b64ToBuf(s)))}catch(e){throw new Error('De koppelcode is niet compleet; kopieer hem opnieuw')}
  try{return await decryptObj(o,normPin(pin))}catch(e){throw new Error('De pincode klopt niet bij deze koppelcode')}}
async function openPairOut(){
  const pin=newPin();openSheet(`<h2 class="h3">Ander apparaat koppelen</h2><p class="mt-0 hint">Koppelcode maken…</p>`);
  const code=await makePairCode(pin);
  openSheet(`<h2 class="h3">Ander apparaat koppelen</h2>
  <ol class="pair-steps hint"><li>Zet de koppelcode op je andere apparaat, bijvoorbeeld met <i>Kopiëren</i> en dan plakken via AirDrop, Notities of een bericht aan jezelf.</li>
  <li>Open daar de app en kies <b>Instellingen › Synchronisatie › Koppelcode invoeren</b> (of de knop op het lege Overzicht).</li>
  <li>Plak de code en typ de pincode over. Die pincode zie je alleen hier: stuur hem niet mee met de code.</li></ol>
  <div class="field"><label for="pair_out">Koppelcode</label><textarea id="pair_out" rows="4" readonly spellcheck="false" class="pair-code">${esc(code)}</textarea></div>
  <button type="button" class="btn sec" data-act="paircopy">Kopiëren</button>
  <p class="pair-pin-l label">Pincode</p><p class="pair-pin m" aria-label="Pincode ${pin.split('').join(' ')}">${pin}</p>
  <p class="hint">De code bevat je GitHub-token en versleutelwachtwoord, versleuteld met deze pincode. Maak je een nieuwe koppelcode, dan blijven oude codes werken zolang je token en wachtwoord niet veranderen.</p>
  <button type="button" class="btn" data-act="settings">Klaar</button>`);
}
function openPairIn(){
  openSheet(`<h2 class="h3">Koppelcode invoeren</h2><p class="mt-0 hint">Op je andere apparaat vind je de code bij <b>Instellingen › Synchronisatie › Ander apparaat koppelen</b>.</p>
  <form class="js-form" novalidate><div class="field"><label for="pair_in">Koppelcode</label><textarea id="pair_in" rows="4" spellcheck="false" autocapitalize="off" autocorrect="off" class="pair-code" placeholder="CPK1.…"></textarea></div>
  <div class="field"><label for="pair_pin">Pincode</label><input type="text" id="pair_pin" autocapitalize="characters" autocomplete="one-time-code" spellcheck="false" placeholder="XXXX-XXXX" maxlength="12"></div>
  <button type="submit" class="btn" data-act="pairin">Koppelen en synchroniseren</button></form>`);
  $('#pair_in').focus();
}
async function doPairIn(btn){
  const code=$('#pair_in').value,pin=$('#pair_pin').value;
  if(!code.trim())return fieldErr('pair_in','Plak de koppelcode');if(normPin(pin).length!==8)return fieldErr('pair_pin','De pincode heeft 8 tekens, bijvoorbeeld AB3D-7KMP');
  btn.disabled=true;
  try{const c=await readPairCode(code,pin);
    settings.gh={...settings.gh,repo:c.repo,token:c.token,path:c.path||settings.gh.path,branch:c.branch||'main',pass:c.pass};saveSettings();
    if(c.cgKey){data.cfg={...(data.cfg||{}),cgKey:c.cgKey,mod:Date.now()};saveData()}
    closeSheet();render();toast('Gekoppeld, gegevens ophalen…');await syncNow(false);refreshPrices();
  }catch(e){btn.disabled=false;fieldErr(/pincode/i.test(e.message)?'pair_pin':'pair_in',e.message)}
}
async function deriveKey(pass,salt){const base=await crypto.subtle.importKey('raw',enc.encode(pass),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:250000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function encryptObj(obj,pass){const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));const key=await deriveKey(pass,salt);const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,enc.encode(JSON.stringify(obj)));return{v:1,alg:'AES-GCM/PBKDF2-SHA256',salt:bufToB64(salt),iv:bufToB64(iv),ct:bufToB64(ct)}}
async function decryptObj(o,pass){const key=await deriveKey(pass,b64ToBuf(o.salt));try{const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:b64ToBuf(o.iv)},key,b64ToBuf(o.ct));return JSON.parse(dec.decode(pt))}catch(e){throw new Error('Versleutelwachtwoord klopt niet')}}
const utf8ToB64=s=>bufToB64(enc.encode(s));
const b64ToUtf8=s=>dec.decode(b64ToBuf(s.replace(/\s/g,'')));
function merge(a,b){
  const deleted=[...new Set([...(a.deleted||[]),...(b.deleted||[])])],del=new Set(deleted),m=new Map();
  for(const t of [...(a.txs||[]),...(b.txs||[])]){if(del.has(t.id))continue;const e=m.get(t.id);if(!e||(t.mod||0)>(e.mod||0))m.set(t.id,t)}
  const ca=a.cfg||{mod:0},cb=b.cfg||{mod:0},cfg=(cb.mod||0)>(ca.mod||0)?cb:ca;   // nieuwste instelling wint
  const hist={};   // koersarchief: alle dagen van beide kanten samenvoegen
  for(const src of [a.hist,b.hist])if(src)for(const id in src){const h=hist[id]||(hist[id]={});
    for(const d in src[id]){const e=src[id][d],x=h[d];if(!x||e[0]-d*DAY<x[0]-d*DAY)h[d]=e}}
  return{txs:[...m.values()],deleted,updated:Math.max(a.updated||0,b.updated||0),...(cfg.mod?{cfg}:{}),hist,watch:mergeList(a.watch,b.watch),alerts:mergeList(a.alerts,b.alerts),goals:mergeList(a.goals,b.goals),plans:mergeList(a.plans,b.plans),portfolios:mergeList(a.portfolios,b.portfolios),allocs:mergeList(a.allocs,b.allocs)};
}
const sig=d=>JSON.stringify([[...d.txs].sort((x,y)=>x.id<y.id?-1:1).map(t=>[t.id,t.mod]),[...(d.deleted||[])].sort(),d.cfg?.mod||0,[...(d.watch||[]),...(d.alerts||[]),...(d.goals||[]),...(d.plans||[]),...(d.portfolios||[]),...(d.allocs||[])].map(x=>x.id+':'+x.mod).sort().join(),Object.values(d.hist||{}).reduce((n,h)=>n+Object.keys(h).length,0)]);
function scheduleSync(){clearTimeout(syncTimer);syncTimer=setTimeout(()=>syncNow(true),1500)}
function setSync(s,msg=''){syncState={s,msg};updBadges()}
let syncing=false,syncAgain=false;
/* ---------- eerdere versie terugzetten (GitHub-geschiedenis) ---------- */
// Elke synchronisatie maakt een commit. Die versies kun je bekijken en terugzetten.
function ghCtx(){const g=settings.gh;return {g,api:`https://api.github.com/repos/${g.repo.trim()}`,path:g.path.split('/').map(encodeURIComponent).join('/'),
  h:{Authorization:'Bearer '+g.token.trim(),Accept:'application/vnd.github.object'}}}
async function ghFileAt(ref){   // versleuteld bestand zoals het was in commit/branch 'ref'
  const {api,path,h}=ghCtx(),url=`${api}/contents/${path}?ref=${encodeURIComponent(ref)}`;
  const r=await fetchT(url,{headers:h,cache:'no-store'});if(!r.ok)throw new Error('GitHub gaf fout '+r.status);
  const j=await r.json();if(j.content&&j.encoding==='base64')return b64ToUtf8(j.content);
  const rr=await fetchT(url,{headers:{...h,Accept:'application/vnd.github.raw'},cache:'no-store'});if(!rr.ok)throw new Error('GitHub gaf fout '+rr.status);return rr.text()}
let verList=null,verPick=null;
async function openVersions(){
  const g=settings.gh;if(!g.token||!g.repo||!g.pass)return toast('Zet eerst GitHub-synchronisatie aan');
  verList=null;verPick=null;openSheet(`<h2 class="h3">Eerdere versie terugzetten</h2><p class="mt-0 hint" id="verMsg">Versies ophalen…</p><div id="verOut"></div>`);
  try{if(!navigator.onLine)throw new Error('Geen internetverbinding');
    await syncNow(true);   // eerst de huidige stand opslaan, zodat ook die een versie is (en je terug kunt)
    const {api,path,h}=ghCtx(),r=await fetchT(`${api}/commits?path=${path}&sha=${encodeURIComponent(g.branch)}&per_page=40`,{headers:{...h,Accept:'application/vnd.github+json'},cache:'no-store'});
    if(!r.ok)throw new Error(r.status===401?'Token ongeldig of verlopen':'GitHub gaf fout '+r.status);
    verList=(await r.json()).map(c=>({sha:c.sha,ts:Date.parse(c.commit?.committer?.date||c.commit?.author?.date)})).filter(v=>v.sha&&isFinite(v.ts));
    renderVersions()}
  catch(e){if($('#verMsg'))$('#verMsg').textContent=e.message||'Versies ophalen mislukt'}}
function renderVersions(){
  const out=$('#verOut');if(!out||!verList)return;
  $('#verMsg').innerHTML=verList.length?`Elke synchronisatie bewaart een versie op GitHub. Kies er een om te bekijken. De bovenste is de huidige stand. <span class="label">(laatste ${verList.length})</span>`:'Nog geen eerdere versies gevonden.';
  out.innerHTML=`<ul class="list ver-list">${verList.map((v,i)=>`<li class="row"><button type="button" class="rowlink grow" data-act="verpick" data-sha="${esc(v.sha)}">${tm(v.ts,new Date(v.ts).toLocaleString('nl-NL',{weekday:'short',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}),true)}${i===0?' <span class="label">· huidige stand</span>':''}</button><span class="label" aria-hidden="true">›</span></li>`).join('')}</ul>`}
const verSummary=d=>{const tx=(d.txs||[]).filter(t=>!(d.deleted||[]).includes(t.id)),last=tx.map(t=>t.date).sort().pop();return {n:tx.length,last}};
async function pickVersion(sha){
  const v=verList?.find(x=>x.sha===sha);if(!v)return;
  openSheet(`<h2 class="h3">Versie van ${new Date(v.ts).toLocaleString('nl-NL',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'})}</h2><p class="mt-0 hint" id="verMsg">Versie ophalen en ontsleutelen…</p><div id="verOut"></div>`);
  try{const snap=await decryptObj(JSON.parse(await ghFileAt(sha)),settings.gh.pass);verPick={sha,ts:v.ts,snap};
    const a=verSummary(snap),b=verSummary(data),ids=new Set(snap.txs.map(t=>t.id)),cur=new Set(data.txs.map(t=>t.id));
    const added=data.txs.filter(t=>!ids.has(t.id)).length,gone=snap.txs.filter(t=>!cur.has(t.id)).length;
    $('#verMsg').textContent='';
    $('#verOut').innerHTML=`<div class="kv card-alt card">
      <div><span class="label">Transacties in deze versie</span><b class="m">${a.n}</b></div>
      <div><span class="label">Nu</span><b class="m">${b.n}</b></div>
      <div><span class="label">Sindsdien toegevoegd</span><b class="m">${added}</b></div>
      <div><span class="label">Sindsdien verwijderd</span><b class="m">${gone}</b></div>
      <div><span class="label">Laatste transactie in deze versie</span><b>${a.last?tm(a.last,fmtDate(a.last),a.last.length>10):'–'}</b></div></div>
      <p class="hint">Terugzetten maakt je gegevens weer precies zoals in deze versie: transacties, volglijst, alerts, doelen en vaste-inlegplannen. Je instellingen en het koersarchief blijven zoals ze nu zijn. Je andere apparaten nemen de teruggezette stand over bij hun volgende synchronisatie.<br>Spijt? De huidige stand blijft ook als versie bewaard, dus je kunt hem later weer terugzetten.</p>
      <button type="button" class="btn danger" data-act="verrestore">Deze versie terugzetten</button><button type="button" class="btn sec" data-act="versions">Terug naar de lijst</button>`}
  catch(e){$('#verMsg').textContent=(e.message||'Ophalen mislukt')+(/wachtwoord/i.test(e.message||'')?' Deze versie is waarschijnlijk met een ander versleutelwachtwoord gemaakt.':'')}}
// Zet 'snap' terug. Verwijderen blijft definitief bij het samenvoegen, dus: wat er sindsdien bij kwam wordt verwijderd,
// en wat sindsdien verwijderd is komt terug onder een nieuwe id. Alles krijgt een nieuw tijdstempel, zodat het overal wint.
function restoreSnapshot(snap){
  const now=Date.now(),del=new Set(data.deleted||[]),snapDel=new Set(snap.deleted||[]),keep=snap.txs.filter(t=>!snapDel.has(t.id)),keepIds=new Set(keep.map(t=>t.id));
  for(const t of data.txs)if(!keepIds.has(t.id))del.add(t.id);
  const txs=keep.map((t,i)=>del.has(t.id)?{...t,id:t.id+'-r'+now.toString(36)+i,mod:now,created:t.created||now}:{...t,mod:now});
  const lists={};for(const k of ['watch','alerts','goals','plans','portfolios','allocs']){const sv=new Map((snap[k]||[]).map(x=>[x.id,x]));
    lists[k]=[...(snap[k]||[]).map(x=>({...x,mod:now})),...(data[k]||[]).filter(x=>!sv.has(x.id)).map(x=>({...x,del:true,mod:now}))]}
  data={...data,txs,deleted:[...del],...lists,updated:now};
}
async function syncNow(silent){
  const g=settings.gh;if(locked||!g.token||!g.repo||!g.pass)return;
  if(syncing){syncAgain=true;return}
  syncing=true;setSync('busy');
  try{
    const url=`https://api.github.com/repos/${g.repo.trim()}/contents/${g.path.split('/').map(encodeURIComponent).join('/')}`;
    const h={Authorization:'Bearer '+g.token.trim(),Accept:'application/vnd.github.object'};
    if(!navigator.onLine)throw new Error('Geen internetverbinding');
    const r=await fetchT(url+'?ref='+encodeURIComponent(g.branch)+'&_='+Date.now(),{headers:h,cache:'no-store'});
    let sha=null,remote=null;
    if(r.status===200){const j=await r.json();sha=j.sha;let txt;
      if(j.content&&j.encoding==='base64')txt=b64ToUtf8(j.content);
      else{   // bestand groter dan 1 MB: GitHub stuurt de inhoud dan niet mee, dus apart ophalen als 'raw' (kan tot 100 MB)
        const rr=await fetchT(url+'?ref='+encodeURIComponent(g.branch)+'&_='+Date.now(),{headers:{...h,Accept:'application/vnd.github.raw'},cache:'no-store'});
        if(!rr.ok)throw new Error('GitHub gaf fout '+rr.status+' bij ophalen');txt=await rr.text()}
      remote=await decryptObj(JSON.parse(txt),g.pass)}
    else if(r.status===401)throw new Error('Token ongeldig of verlopen');
    else if(r.status!==404)throw new Error('GitHub gaf fout '+r.status);
    const before=sig(data);
    const merged=remote?merge(data,remote):data;
    if(locked)return;
    data=merged;persist();
    if(!remote||sig(remote)!==sig(merged)){
      const body={message:'Portfolio bijgewerkt '+new Date().toISOString(),content:utf8ToB64(JSON.stringify(await encryptObj(merged,g.pass))),branch:g.branch};
      if(sha)body.sha=sha;
      const p=await fetchT(url,{method:'PUT',headers:{...h,'Content-Type':'application/json'},body:JSON.stringify(body)},30000);
      if(p.status===409||p.status===422){syncAgain=true}
      else if(p.status===404)throw new Error('Repository niet gevonden of geen schrijfrechten');
      else if(!p.ok)throw new Error('Opslaan op GitHub mislukt ('+p.status+')');
    }
    settings.lastGh=Date.now();saveSettings();setSync('ok');
    if(before!==sig(data)){refreshPrices();render()}
    if(!silent)toast('Gesynchroniseerd');
  }catch(e){setSync('err',e.message||'Geen verbinding');if(!silent)toast(e.message||'Sync mislukt')}
  finally{syncing=false;if(syncAgain){syncAgain=false;setTimeout(()=>syncNow(true),800)}}
}

/* ---------- app-vergrendeling (passkey + herstelwachtwoord) ---------- */
// Een willekeurige datasleutel (DEK) versleutelt de lokale gegevens. Die sleutel wordt zelf
// versleuteld bewaard: met je herstelwachtwoord, en per passkey met een geheim dat alleen
// de passkey kan maken (WebAuthn PRF-extensie). Zonder één van beide is de data onleesbaar.
const NO_PRF='Deze passkey of dit apparaat ondersteunt geen versleuteling (PRF). Gebruik een iPhone/iPad met iOS 18+, of Chrome/Safari met een passkey uit iCloud-sleutelhanger of Google Wachtwoordmanager.';
const pkSupported=()=>!!(window.PublicKeyCredential&&navigator.credentials&&window.isSecureContext);
const b64url=b=>bufToB64(b).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const fromB64url=s=>b64ToBuf(s.replace(/-/g,'+').replace(/_/g,'/')+'==='.slice((s.length+3)%4));
const rnd=n=>crypto.getRandomValues(new Uint8Array(n));
async function aesEnc(key,bytes){const iv=rnd(12);const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,bytes);return{iv:bufToB64(iv),ct:bufToB64(ct)}}
async function aesDec(key,o){return new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:b64ToBuf(o.iv)},key,b64ToBuf(o.ct)))}
const importAes=raw=>crypto.subtle.importKey('raw',raw,'AES-GCM',false,['encrypt','decrypt']);
async function prfKey(out){const base=await crypto.subtle.importKey('raw',out,'HKDF',false,['deriveKey']);return crypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt:new Uint8Array(32),info:enc.encode('cpt-passkey-wrap-v1')},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
function saveLock(){localStorage.setItem(LS_LOCK,JSON.stringify(lockCfg))}
function deviceName(){const u=navigator.userAgent;return /iPhone/.test(u)?'iPhone':/iPad/.test(u)||(/Macintosh/.test(u)&&navigator.maxTouchPoints>1)?'iPad':/Mac/.test(u)?'Mac':/Windows/.test(u)?'Windows-pc':/Android/.test(u)?'Android':'Passkey'}

async function openVault(raw){
  const key=await importAes(raw);
  const v=JSON.parse(localStorage.getItem(LS_VAULT)||'null');
  const obj=v?JSON.parse(dec.decode(await aesDec(key,v))):{};
  dekRaw=raw;DEK=key;
  data=Object.assign({txs:[],deleted:[],updated:0},obj.data);
  settings.gh=Object.assign({token:'',repo:'',path:'crypto-portfolio.enc.json',branch:'main',pass:''},obj.gh);
  prices=obj.prices||{};if(obj.visit)settings.visit=obj.visit;
  try{const vc=JSON.parse(localStorage.getItem(LS_VCHARTS)||'null');chartCache=vc?JSON.parse(dec.decode(await aesDec(key,vc))):{}}catch(e){chartCache={}}
  locked=false;start();
}
async function unlockPw(pw){
  const c=lockCfg.pw;let raw;
  try{raw=await aesDec(await deriveKey(pw,b64ToBuf(c.salt)),c)}catch(e){throw new Error('Wachtwoord klopt niet')}
  await openVault(raw);
}
async function unlockPasskey(){
  const pks=lockCfg.pks||[];if(!pks.length)throw new Error('Geen passkey ingesteld');
  const ev={};pks.forEach(p=>ev[p.id]={first:b64ToBuf(p.salt)});
  const cred=await navigator.credentials.get({publicKey:{challenge:rnd(32),allowCredentials:pks.map(p=>({type:'public-key',id:fromB64url(p.id)})),userVerification:'required',timeout:120000,extensions:{prf:{evalByCredential:ev}}}});
  const pk=pks.find(p=>p.id===b64url(cred.rawId));if(!pk)throw new Error('Onbekende passkey');
  const out=cred.getClientExtensionResults().prf?.results?.first;if(!out)throw new Error(NO_PRF);
  let raw;try{raw=await aesDec(await prfKey(out),pk)}catch(e){throw new Error('Ontgrendelen met deze passkey mislukt')}
  await openVault(raw);
}
async function addPasskey(){
  const salt=rnd(32);
  const cred=await navigator.credentials.create({publicKey:{rp:{name:'Crypto Portfolio'},user:{id:rnd(16),name:'Crypto Portfolio',displayName:'Crypto Portfolio'},challenge:rnd(32),
    pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],authenticatorSelection:{residentKey:'required',requireResidentKey:true,userVerification:'required'},timeout:120000,extensions:{prf:{eval:{first:salt}}}}});
  const ext=cred.getClientExtensionResults().prf||{};let out=ext.results?.first;
  if(!out){
    if(ext.enabled===false)throw new Error(NO_PRF+' Verwijder de zojuist gemaakte passkey uit je wachtwoordbeheer.');
    // sommige apparaten geven het PRF-geheim pas bij een tweede bevestiging
    const a=await navigator.credentials.get({publicKey:{challenge:rnd(32),allowCredentials:[{type:'public-key',id:cred.rawId}],userVerification:'required',timeout:120000,extensions:{prf:{eval:{first:salt}}}}});
    out=a.getClientExtensionResults().prf?.results?.first;if(!out)throw new Error(NO_PRF);
  }
  const w=await aesEnc(await prfKey(out),dekRaw);
  lockCfg.pks=(lockCfg.pks||[]).concat({id:b64url(cred.rawId),name:deviceName(),salt:bufToB64(salt),...w,created:Date.now()});saveLock();
}
async function wrapPw(pw){const salt=rnd(16);return{salt:bufToB64(salt),...await aesEnc(await deriveKey(pw,salt),dekRaw)}}
async function enableLock(pw){
  dekRaw=rnd(32);DEK=await importAes(dekRaw);
  lockCfg={pw:null,pks:[],autoLock:5};lockCfg.pw=await wrapPw(pw);saveLock();
  persist();await vaultQ;
  localStorage.removeItem(LS_DATA);localStorage.removeItem(LS_PRICES);localStorage.removeItem(LS_CHARTS);saveCharts();
}
function disableLock(){lockCfg=null;DEK=null;dekRaw=null;localStorage.removeItem(LS_LOCK);localStorage.removeItem(LS_VAULT);localStorage.removeItem(LS_VCHARTS);persist();saveCharts()}
function lockNow(){
  if(!lockCfg)return;closeZoom();
  DEK=null;dekRaw=null;locked=true;clearTimeout(syncTimer);
  data={txs:[],deleted:[],updated:0};prices={};chartCache={};settings.gh={...settings.gh,token:'',repo:'',pass:'',cgKey:''};
  closeSheet();if(location.hash)history.replaceState(null,'',location.pathname+location.search);renderLock();
}
function pkErr(e){return e?.name==='NotAllowedError'?'Geannuleerd of verlopen':e?.name==='InvalidStateError'?'Deze passkey bestaat al op dit apparaat':e?.message||'Mislukt'}
function renderLock(){
  document.body.classList.add('locked');document.body.classList.remove('private');
  $('#topbar').innerHTML='';$('#side').innerHTML='';
  const hasPk=(lockCfg.pks||[]).length>0&&pkSupported();
  $('#view').innerHTML=`<div class="lock"><div class="lock-ic">${ICONS.lock}</div><h2>Crypto Portfolio</h2><p class="label">Vergrendeld</p>
    ${hasPk?`<button type="button" class="btn" data-act="unlockpk">${ICONS.key} Ontgrendel met passkey</button><div class="or">of</div>`:''}
    <form id="pwForm"><input type="text" name="username" autocomplete="username" value="Crypto Portfolio" hidden><div class="field"><label class="sr-only" for="l_pw">Herstelwachtwoord</label><input id="l_pw" enterkeyhint="go" name="password" type="password" placeholder="Herstelwachtwoord" autocomplete="current-password"></div><button class="btn${hasPk?' sec':''}" type="submit">Ontgrendel met wachtwoord</button></form>
    <p class="err" id="l_err"></p></div>`;
  $('#pwForm').onsubmit=async e=>{e.preventDefault();const b=e.target.querySelector('button');b.disabled=true;$('#l_err').textContent='';
    try{await unlockPw($('#l_pw').value)}catch(err){$('#l_err').textContent=err.message;b.disabled=false}};
}
async function tryPasskey(auto){
  try{await unlockPasskey()}catch(e){if(!auto&&$('#l_err'))$('#l_err').textContent=pkErr(e)}
}
function pwSheet(title,intro,act){
  openSheet(`<h2 class="h3">${title}</h2><p class="mt-0 hint">${intro}</p><form class="js-form" novalidate>
  <input type="text" name="username" autocomplete="username" value="Crypto Portfolio" hidden><div class="field"><label for="p_1">Wachtwoord (minimaal 8 tekens)</label><input id="p_1" name="new-password" type="password" autocomplete="new-password"></div>
  <div class="field"><label for="p_2">Herhaal wachtwoord</label><input id="p_2" type="password" autocomplete="new-password"></div>
  <button type="submit" class="btn" data-act="${act}">Opslaan</button><button type="button" class="btn sec" data-act="settings">Annuleren</button></form>`);
  $('#p_1').focus();
}
function readPw(){const a=$('#p_1').value,b=$('#p_2').value;if(a.length<8){fieldErr('p_1','Kies minimaal 8 tekens');return null}if(a!==b){fieldErr('p_2','Wachtwoorden zijn niet gelijk');return null}return a}
async function securityAction(act,el){
  try{
    if(act==='lockon')return pwSheet('App-vergrendeling instellen','Kies eerst een <b>herstelwachtwoord</b>. Daarmee open je de app als de passkey niet beschikbaar is. Raak je dit kwijt én werkt de passkey niet meer, dan is de data op dit apparaat niet meer te openen (wel via GitHub-sync of een back-up).','lockon2');
    if(act==='lockon2'){const pw=readPw();if(!pw)return;el.disabled=true;await enableLock(pw);render();
      if(pkSupported()){try{await addPasskey();toast('Vergrendeling aan, passkey toegevoegd')}catch(e){toast('Vergrendeling aan. Passkey: '+pkErr(e))}}else toast('Vergrendeling aan');
      return openSettings()}
    if(act==='addpk'){el.disabled=true;try{await addPasskey();toast('Passkey toegevoegd')}catch(e){toast(pkErr(e))}return openSettings()}
    if(act==='rmpk'){if(!confirm('Deze passkey niet meer gebruiken voor deze app? Verwijder hem daarna ook uit je wachtwoordbeheer.'))return;lockCfg.pks=lockCfg.pks.filter(p=>p.id!==el.dataset.id);saveLock();return openSettings()}
    if(act==='chpw')return pwSheet('Herstelwachtwoord wijzigen','Je passkeys blijven gewoon werken.','chpw2');
    if(act==='chpw2'){const pw=readPw();if(!pw)return;lockCfg.pw=await wrapPw(pw);saveLock();toast('Wachtwoord gewijzigd');return openSettings()}
    if(act==='lockoff'){if(!confirm('Vergrendeling uitschakelen? Je gegevens worden dan weer onversleuteld op dit apparaat bewaard.'))return;disableLock();toast('Vergrendeling uit');render();return openSettings()}
  }catch(e){toast(e.message||'Mislukt');if(el)el.disabled=false}
}

/* ---------- events ---------- */
// Formulieren in bladen: Enter in een veld 'klikt' op de opslaan-knop (die via data-act wordt afgehandeld);
// het formulier zelf wordt nooit echt verzonden.
document.addEventListener('submit',e=>{if(e.target.matches('form.js-form'))e.preventDefault()},true);
// Foutmelding bij het veld zelf (in plaats van alleen een melding onderin), gekoppeld via aria-describedby
function fieldErr(id,msg){document.querySelectorAll('[type=submit]').forEach(b=>{b._busy=false});const el=$('#'+id);if(!el){toast(msg);return}
  const box=el.closest('.field')||el.parentNode;let p=$('#'+id+'_err');
  if(!p){p=document.createElement('p');p.className='field-err';p.id=id+'_err';p.setAttribute('role','alert');box.appendChild(p)}
  p.textContent=msg;el.setAttribute('aria-invalid','true');
  const d=new Set((el.getAttribute('aria-describedby')||'').split(' ').filter(Boolean));d.add(p.id);el.setAttribute('aria-describedby',[...d].join(' '));
  el.focus();el.addEventListener('input',()=>clearErr(el),{once:true})}
function clearErr(el){el.removeAttribute('aria-invalid');$('#'+el.id+'_err')?.remove();
  const d=(el.getAttribute('aria-describedby')||'').split(' ').filter(x=>x&&x!==el.id+'_err');if(d.length)el.setAttribute('aria-describedby',d.join(' '));else el.removeAttribute('aria-describedby')}
// Knoppen in een groep (periode, soort, thema …) gedragen zich als keuzeknoppen: de gekozen knop krijgt aria-pressed="true"
function syncPressed(){document.querySelectorAll('.seg button,.ranges button').forEach(b=>{const v=b.classList.contains('on')?'true':'false';if(b.getAttribute('aria-pressed')!==v)b.setAttribute('aria-pressed',v)})}
let pressT=0;new MutationObserver(()=>{if(!pressT)pressT=requestAnimationFrame(()=>{pressT=0;syncPressed()})}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
// Skip link: springt naar de hoofdinhoud zonder de #-route (die de app voor schermen gebruikt) te wijzigen
document.querySelector('.skip-link')?.addEventListener('click',e=>{e.preventDefault();const m=$('#view');m.focus();m.scrollIntoView({block:'start'})});
document.addEventListener('click',e=>{
  const a=e.target.closest('[data-act],[data-coin],[data-tx],[data-range],[data-prange],[data-sort],[data-tf],[data-type],[data-pick],[data-wpick],[data-adir],[data-rp],[data-goal],[data-theme],[data-cal],[data-unit]');if(!a)return;
  if(a.dataset.unit){setUnit(a.dataset.unit,a);return}
  if(a.dataset.cal){const now=Date.now();let m=+settings.calMonth||pStart('month',now);const d=new Date(m);d.setMonth(d.getMonth()+(+a.dataset.cal));settings.calMonth=d.getTime();saveSettings();keepFocus(renderReports);return}
  if(a.dataset.goal){openGoal(a.dataset.goal);return}
  if(a.dataset.theme){settings.theme=a.dataset.theme;saveSettings();applyTheme();document.querySelectorAll('[data-theme]').forEach(b=>b.classList.toggle('on',b===a));return}
  if(a.dataset.wpick){const c=JSON.parse(a.dataset.wpick);setWatch(c,true);closeSheet();location.hash='#coin/'+encodeURIComponent(c.id);render();toast(c.name+' staat op je volglijst');return}
  if(a.dataset.adir){setAlertDir(a.dataset.adir);return}
  if(a.dataset.rp){const [k,u]=a.dataset.rp.split(':');settings[k]=u;saveSettings();keepFocus(()=>{renderReports();if($('#zoom'))renderRetZoom()});return}
  if(a.dataset.tf){txf.type=a.dataset.tf;txLimit=100;keepFocus(fillTxs);return}
  if(a.dataset.sort){settings.sort=a.dataset.sort;saveSettings();render();return}
  if(a.dataset.prange){settings.pRange=a.dataset.prange;saveSettings();document.querySelectorAll('[data-prange]').forEach(b=>b.classList.toggle('on',b.dataset.prange===a.dataset.prange));drawPortfolioChart();if($('#pzchart'))drawPfZoom();return}
  if(a.dataset.coin){location.hash='#coin/'+encodeURIComponent(a.dataset.coin);return}
  if(a.dataset.tx){openTx({txId:a.dataset.tx});return}
  if(a.dataset.range){settings.range=a.dataset.range;saveSettings();document.querySelectorAll('.ranges button').forEach(b=>b.classList.toggle('on',b===a));const m=location.hash.match(/^#coin\/(.+)$/);if(m)drawChart(computeCoin(decodeURIComponent(m[1])));return}
  if(a.dataset.type){readForm();form.type=a.dataset.type;renderTxSheet();return}
  if(a.dataset.pick){readForm();const c=JSON.parse(a.dataset.pick);form.coin=c;const cached=prices[c.id]?.price;if(cached&&form.edits.length<2){form.price=plainNum(cached);if(!form.edits.includes('price'))form.edits.unshift('price')}renderTxSheet();
    fetchPrice(c.id).then(p=>{const el=$('#f_price');if(p&&form&&form.coin?.id===c.id&&el&&form.edits.length<2){form.price=el.value=plainNum(p);recalc('price')}});return}
  if(a.type==='submit'){if(a._busy)return;a._busy=true;setTimeout(()=>{a._busy=false},1000)}   // dubbel tikken telt niet dubbel
  switch(a.dataset.act){
    case 'lock':lockNow();break;
    case 'sinceclose':sinceDismissed=true;render();break;
    case 'issues':openIssues();break;
    case 'csvall':exportCSV(TX());break;
    case 'csvfiltered':{const ids=new Set([...document.querySelectorAll('#txOut .only-m [data-tx]')].map(e=>e.dataset.tx));exportCSV(data.txs.filter(t=>ids.has(t.id)));break}
    case 'printyear':printYear(+($('#py')?.value||new Date().getFullYear()));break;
    case 'reload':location.reload();break;
    case 'addgoal':openGoal();break;
    case 'savegoal':saveGoal(a.dataset.id);break;
    case 'versions':openVersions();break;
    case 'verpick':pickVersion(a.dataset.sha);break;
    case 'verrestore':if(verPick&&confirm('Je gegevens terugzetten naar de versie van '+new Date(verPick.ts).toLocaleString('nl-NL',{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'})+'?')){restoreSnapshot(verPick.snap);saveData();closeSheet();render();refreshPrices();toast('Versie teruggezet')}break;
    case 'simsell':if(simSell)openTx({coinId:simSell.coinId,type:'sell',total:simSell.total,price:simSell.price,fee:simSell.fee});break;
    case 'avgbuy':if(avgBuy)openTx({coinId:avgBuy.coinId,type:'buy',total:avgBuy.total,price:avgBuy.price,fee:avgBuy.fee});break;
    case 'addplan':openPlan();break;
    case 'editalloc':openAlloc();break;
    case 'savealloc':saveAlloc();break;
    case 'delalloc':{const x=allocOf(curPf());if(x&&confirm('Je doelverdeling verwijderen?')){x.del=true;x.mod=Date.now();saveData();closeSheet();render()}break}
    case 'rebtx':{const t=a.dataset.rtype,cid=a.dataset.coinId,c=computeCoin(cid);openTx({coinId:cid,type:t,total:+a.dataset.total,fee:Math.round(+a.dataset.total*coinFeePct(c))/100,acct:topAcct()});break}
    case 'editplan':openPlan(a.dataset.id);break;
    case 'saveplan':savePlan(a.dataset.id);break;
    case 'delplan':{const pl=(data.plans||[]).find(x=>x.id===a.dataset.id);if(pl&&confirm('Dit plan verwijderen? Ingevoerde transacties blijven bestaan.')){pl.del=true;pl.mod=Date.now();saveData();closeSheet();render()}break}
    case 'plando':planDo(a.dataset.id,a.dataset.ym);break;
    case 'planskip':planMark(a.dataset.id,a.dataset.ym,'skip');saveData();render();toast(ymLabel(a.dataset.ym)+' overgeslagen');break;
    case 'delgoal':{const g=(data.goals||[]).find(x=>x.id===a.dataset.id);if(g&&confirm('Dit doel verwijderen?')){g.del=true;g.mod=Date.now();saveData();closeSheet();render()}break}
    case 'zoomret':renderRetZoom();break;
    case 'zoomclose':closeZoom();break;
    case 'pzoom':renderPfZoom();break;
    case 'closesheet':closeSheet();break;
    case 'unitmenu':if(!hasPopover){const i=UNITS.findIndex(x=>x[0]===(settings.unit||'EUR'));setUnit(UNITS[(i+1)%3][0],a)}break;
    case 'pview':settings.pView=a.dataset.v;saveSettings();document.querySelectorAll('[data-act=pview]').forEach(b=>{const on=b.dataset.v===a.dataset.v;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)});drawPortfolioChart();if($('#pzchart'))drawPfZoom();break;
    case 'bvimport':$('#bvFile').value='';$('#bvFile').click();break;
    case 'doimport':doImport();break;
    case 'cancelimport':imp=null;closeSheet();break;
    case 'addwatch':openWatchAdd();break;
    case 'watch':{const id=decodeURIComponent((location.hash.match(/^#coin\/(.+)$/)||[])[1]||'');const c=computeCoin(id);const on=!isWatched(id);setWatch({id,name:c.meta.name,symbol:c.meta.symbol,image:c.meta.image},on);if(!on&&!c.txs.length)location.hash='';render();toast(on?'Toegevoegd aan volglijst':'Van volglijst verwijderd');break}
    case 'addbuy':{const id=decodeURIComponent((location.hash.match(/^#coin\/(.+)$/)||[])[1]||'');openTx({coinId:id});break}
    case 'addalert':{const id=decodeURIComponent((location.hash.match(/^#coin\/(.+)$/)||[])[1]||'');openAlert(computeCoin(id));break}
    case 'savealert':saveAlert();break;
    case 'delalert':{const x=(data.alerts||[]).find(z=>z.id===a.dataset.id);if(x){x.del=true;x.mod=Date.now();saveData();render()}break}
    case 'notifperm':Notification.requestPermission().then(()=>openAlert(alertForm.c));break;
    case 'addcash':openTx({type:'deposit'});break;
    case 'cashtx':txf.type='cash';txf.coin='all';if(location.hash==='#transacties'){lastView=null;render()}else location.hash='#transacties';break;
    case 'syncinfo':syncNow(false);refreshPrices(true);break;
    case 'savecg':(async()=>{const nk=$('#s_cg').value.trim();if(nk!==(data.cfg?.cgKey||'')){data.cfg={cgKey:nk,mod:Date.now()};saveData()}
      try{const r=await cg('/ping');toast(r.ok?(nk?'Sleutel werkt':'Sleutel verwijderd'):r.status===401||r.status===400?'Sleutel ongeldig':'CoinGecko gaf fout '+r.status)}catch(e){toast(e.message)}
      refreshPrices()})();break;
    case 'add':$('#btnAdd').click();break;
    case 'unlockpk':tryPasskey(false);break;
    case 'lockon':case 'lockon2':case 'addpk':case 'rmpk':case 'chpw':case 'chpw2':case 'lockoff':securityAction(a.dataset.act,a);break;
    case 'privacy':settings.privacy=!settings.privacy;saveSettings();render();break;
    case 'settings':openSettings();break;
    case 'pfpick':openPfPick();break;
    case 'pfset':closeSheet();setPf(a.dataset.id);break;
    case 'pfmanage':openSettings();setTimeout(()=>$('[data-act="pfedit"]')?.scrollIntoView({block:'center'}),50);break;
    case 'pfedit':openPfEdit(a.dataset.id);break;
    case 'pfsave':savePf(a.dataset.id);break;
    case 'pfdel':delPf(a.dataset.id);break;
    case 'home':if(location.hash)location.hash='';else window.scrollTo(0,0);break;
    case 'txs':location.hash='#transacties';break;
    case 'reps':location.hash='#rapporten';break;
    case 'plmode':settings.plMode=settings.plMode==='24h'?'total':'24h';saveSettings();render();break;
    case 'changecoin':readForm();form.coin=null;renderTxSheet();break;
    case 'savetx':saveTx();break;
    case 'txmore':txLimit+=100;fillTxs();break;
    case 'deltx':deleteTx();break;
    case 'export':exportData();break;
    case 'import':$('#s_file').click();break;
    case 'refresh':refreshPrices(true).then(()=>toast('Koersen bijgewerkt'));break;
    case 'pairout':openPairOut().catch(e=>toast(e.message));break;
    case 'pairopen':openPairIn();break;
    case 'pairin':doPairIn(a);break;
    case 'paircopy':{const t=$('#pair_out');t.select();(navigator.clipboard?.writeText(t.value)||Promise.reject()).then(()=>toast('Koppelcode gekopieerd'),()=>{document.execCommand?.('copy');toast('Koppelcode geselecteerd: kopieer hem')});break}
    case 'savesync':
      settings.gh={...settings.gh,repo:$('#s_repo').value.trim(),token:$('#s_token').value.trim(),path:$('#s_path').value.trim()||'crypto-portfolio.enc.json',branch:$('#s_branch').value.trim()||'main',pass:$('#s_pass').value};
      saveSettings();closeSheet();render();
      if(settings.gh.repo&&settings.gh.token&&settings.gh.pass)syncNow(false);else toast('Sync uitgeschakeld');break;
    case 'wipe':
      if(!confirm('Alle transacties wissen? Dit wordt ook naar je andere apparaten gesynchroniseerd.'))return;
      data.deleted=[...new Set([...data.deleted,...data.txs.map(t=>t.id)])];data.txs=[];saveData();closeSheet();location.hash='';render();toast('Alles gewist');break;
  }
});
$('#bvFile').onchange=e=>{const f=e.target.files[0];if(f){closeSheet();startImport(f)}};
document.addEventListener('change',e=>{if(e.target.id==='imp_pf'&&imp){imp.pf=e.target.value;renderImport();$('#imp_pf')?.focus();return}if(e.target.dataset.act==='bench'){settings.bench=e.target.value;saveSettings();renderReports();return}if(e.target.dataset.act==='sort'){settings.sort=e.target.value;saveSettings();render()}});
$('#btnAdd').onclick=()=>{const m=location.hash.match(/^#coin\/(.+)$/);openTx(m?{coinId:decodeURIComponent(m[1])}:{})};
window.addEventListener('hashchange',()=>{closeZoom();window.scrollTo(0,0);render()});
// Plusknop opzij bij omlaag scrollen (dekt dan geen knoppen of totalen af), terug bij omhoog scrollen of bovenaan
// en ook opzij zolang er een kleine knop (zoals 'Max') onder ligt.
function fabCovers(){const f=$('#btnAdd');if(!f||getComputedStyle(f).display==='none')return false;const q=f.getBoundingClientRect(),bt=innerHeight-parseFloat(getComputedStyle(f).bottom),r={left:q.left,right:q.right,top:bt-f.offsetHeight,bottom:bt,width:q.width,height:f.offsetHeight};   // rustpositie, los van de animatie
  const cx=r.left+r.width/2,cy=r.top+r.height/2,R=r.width/2-3,k=R*.7;   // punten binnen de ronde knop
  for(const [x,y] of [[cx,cy],[cx,cy-R],[cx-R,cy],[cx+R,cy],[cx,cy+R],[cx-k,cy-k],[cx+k,cy-k],[cx-k,cy+k],[cx+k,cy+k]]){
    const el=document.elementsFromPoint(x,y).find(e=>!f.contains(e));const c=el?.closest('button,a,input,select,[data-prange],[data-act]');
    if(c&&!c.closest('.sheet')){const b=c.getBoundingClientRect();   // zichtbare knop (niet het vergrote tikvlak)
      if(b.width<160&&b.height<70&&x>=b.left&&x<=b.right&&y>=b.top&&y<=b.bottom)return true}}
  return false}
let lastY=0,fabT;window.addEventListener('scroll',()=>{const y=window.scrollY,f=$('#btnAdd');if(!f)return;
  if(y>lastY+6&&y>60)f.classList.add('away');
  if(Math.abs(y-lastY)>6){const up=y<lastY;lastY=y;clearTimeout(fabT);fabT=setTimeout(()=>{if(fabCovers())f.classList.add('away');else if(up||y<60)f.classList.remove('away')},140)}
},{passive:true});
window.addEventListener('hashchange',()=>{lastY=0;$('#btnAdd')?.classList.remove('away')});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!e.defaultPrevented){if($('#sheet').open)return;if($('#zoom'))closeZoom();else closeSheet()}});   // dialogen sluiten zelf via 'cancel'
let hiddenAt=0;
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){hiddenAt=Date.now();saveVisit();return}
  if(hiddenAt&&Date.now()-hiddenAt>3600e3&&getVisit(curPf())){prevVisit={...getVisit(curPf())};sinceDismissed=false}
  const al=lockCfg?.autoLock??5;
  if(lockCfg&&!locked&&hiddenAt&&al>=0&&Date.now()-hiddenAt>=al*60000){lockNow();return}
  refreshPrices();syncNow(true);
});
setInterval(()=>{if(!document.hidden)refreshPrices()},60000);
setInterval(()=>{if(!document.hidden)syncNow(true)},5*60000);
setInterval(()=>{if(!document.hidden)collectHistory()},6*3600e3);

let histTimer=null;
function start(){document.body.classList.remove('locked');if(settings.unit&&settings.unit!=='EUR')refreshFx().then(ensureBtcHist).then(()=>render());prevVisit=getVisit(curPf())?{...getVisit(curPf())}:null;sinceDismissed=false;migrateAccounts();clearTimeout(histTimer);histTimer=setTimeout(collectHistory,8000);
  if(settings.gh.cgKey){if(!data.cfg?.cgKey){data.cfg={cgKey:settings.gh.cgKey,mod:Date.now()};saveData()}settings.gh.cgKey='';saveSettings()}
  render();refreshPrices();syncNow(true)}
if(lockCfg){renderLock();if((lockCfg.pks||[]).length&&pkSupported())tryPasskey(true)}
else start();
// Nieuwe versie online gezet? De service worker haalt hem op; dan verschijnt een melding om te vernieuwen.
if('serviceWorker' in navigator&&location.protocol==='https:'){
  let hadCtrl=!!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(hadCtrl)showUpdate();hadCtrl=true});
  navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(reg=>{
    const chk=()=>reg.update().catch(()=>{});setInterval(chk,30*60e3);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)chk()});
  }).catch(()=>{});
}
function showUpdate(){updReady=true;document.querySelectorAll('.app-ver').forEach(e=>e.outerHTML=appVerHTML());
  if([...document.querySelectorAll('.app-ver')].some(e=>e.getClientRects().length))return;   // laptop: de knop naast de naam is genoeg
  if($('#upd'))return;const d=document.createElement('div');d.id='upd';d.innerHTML='Nieuwe versie beschikbaar <button type="button" data-act="reload">Vernieuwen</button>';document.body.appendChild(d)}
