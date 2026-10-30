// Nep-CoinGecko: vaste, voorspelbare koersen per munt (geen internet nodig, geen limieten)
export const COINS={
  bitcoin:{sym:'BTC',name:'Bitcoin',base:62000,amp:0.22,trend:0.35,rank:1,max:21e6,circ:19.9e6},
  ethereum:{sym:'ETH',name:'Ethereum',base:2300,amp:0.28,trend:0.15,rank:2,max:null,circ:120.3e6},
  cardano:{sym:'ADA',name:'Cardano',base:0.45,amp:0.35,trend:-0.1,rank:10,max:45e9,circ:35.6e9},
  'fetch-ai':{sym:'FET',name:'Artificial Superintelligence Alliance',base:0.9,amp:0.45,trend:-0.6,rank:60,max:2.7e9,circ:2.4e9},
  iostoken:{sym:'IOST',name:'IOST',base:0.006,amp:0.4,trend:-0.5,rank:300,max:null,circ:21e9},
  solana:{sym:'SOL',name:'Solana',base:140,amp:0.3,trend:0.2,rank:5,max:null,circ:480e6},
  polkadot:{sym:'DOT',name:'Polkadot',base:6,amp:0.3,trend:-0.2,rank:15,max:null,circ:1.5e9},
  dogecoin:{sym:'DOGE',name:'Dogecoin',base:0.15,amp:0.4,trend:0.1,rank:8,max:null,circ:146e9},
};
const DAY=864e5;export const T0=Date.UTC(2025,0,1);
export function price(id,t){const c=COINS[id];const x=(t-T0)/DAY;return c.base*(1+c.trend*x/660)*(1+c.amp*Math.sin(x/38+c.rank)+0.04*Math.sin(x/3.1+c.rank*2)+0.015*Math.sin(x*1.7))}
export function chart(id,days,now=Date.now()){const d=Math.min(365,days==='max'?365:+days),step=d<=1?3e5:d<=90?36e5:DAY,pts=[];for(let t=now-d*DAY;t<=now;t+=step)pts.push([t,price(id,t)]);pts.push([now,price(id,now)]);return pts}
export async function routeCG(page,log,NOW){const nowF=()=>NOW??Date.now();
  await page.route('https://api.coingecko.com/**',r=>{const u=new URL(r.request().url()),P=u.pathname;log&&log.push(P);
    if(P.endsWith('/ping'))return r.fulfill({json:{gecko_says:'ok'}});
    if(P.endsWith('/search')){const q=u.searchParams.get('query').toLowerCase();const hits=Object.entries(COINS).filter(([id,c])=>c.sym.toLowerCase()===q||c.name.toLowerCase().includes(q)||id.includes(q)).map(([id,c])=>({id,name:c.name,symbol:c.sym,market_cap_rank:c.rank,thumb:'',large:''}));return r.fulfill({json:{coins:hits}})}
    if(P.endsWith('/simple/price')){const ids=u.searchParams.get('ids').split(','),n=nowF(),vs=u.searchParams.get('vs_currencies')||'eur';const o={};for(const id of ids)if(COINS[id]){const e=price(id,n);o[id]={eur:e,eur_24h_change:(e/price(id,n-DAY)-1)*100,...(vs.includes('usd')?{usd:e*1.08}:{})}}return r.fulfill({json:o})}
    if(P.endsWith('/coins/markets')){const ids=u.searchParams.get('ids').split(',');const now=nowF();
      return r.fulfill({json:ids.filter(id=>COINS[id]).map(id=>{const c=COINS[id],p=price(id,now),hist=chart(id,365,now);const ath=Math.max(...hist.map(x=>x[1]))*1.15;
        return{id,current_price:p,image:'',price_change_percentage_24h:(p/price(id,now-DAY)-1)*100,price_change_percentage_1h_in_currency:(p/price(id,now-DAY/24)-1)*100,price_change_percentage_7d_in_currency:(p/price(id,now-7*DAY)-1)*100,price_change_percentage_1y_in_currency:(p/price(id,now-365*DAY)-1)*100,price_change_percentage_30d_in_currency:(p/price(id,now-30*DAY)-1)*100,
          market_cap:p*c.circ,market_cap_rank:c.rank,total_volume:p*c.circ*0.03,high_24h:p*1.02,low_24h:p*0.97,ath,ath_change_percentage:(p/ath-1)*100,ath_date:'2024-12-17T00:00:00Z',atl:c.base*0.05,atl_date:'2019-03-01T00:00:00Z',circulating_supply:c.circ,max_supply:c.max}})})}
    if(P.includes('/market_chart')){const id=P.split('/coins/')[1].split('/')[0];if(!COINS[id])return r.fulfill({status:404,json:{}});return r.fulfill({json:{prices:chart(id,u.searchParams.get('days'),nowF())}})}
    return r.fulfill({json:{}})});
}
