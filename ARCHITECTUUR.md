# ARCHITECTUUR – Crypto Portfolio

Vaste kennis over de app: opbouw, code-indeling, conventies en stijlkeuzes. Dit verandert zelden; werk het bij als de structuur verandert. De actuele stand (versie, open punten, sessielog) staat in `NOTES.md`, de besluiten in `DECISIONS.md`.

---

## 1. Wat is het

- Persoonlijke crypto-portfoliotracker als **PWA**, in de stijl van de Delta-app van eToro, met ongerealiseerde winst per munt en per transactie (FIFO).
- **Gehost op GitHub Pages**, te installeren op het beginscherm van iPhone, iPad en laptop.
- **Gegevens:** lokaal in de browser, en optioneel versleuteld (AES-256-GCM) gesynchroniseerd naar één bestand in een privé-GitHub-repository.
- **Koersen:** van de CoinGecko-API (gratis, optioneel met Demo-sleutel).
- **Geen eigen server.** Alles draait in de browser.
- **Eigenaar:** Geert, Nederlandstalig, geen IT-achtergrond. Hij uploadt de bestanden zelf naar GitHub.

## 2. Bestanden

| Bestand | Inhoud |
|---|---|
| `index.html` | Alle HTML-skelet en **alle CSS** (in één `<style>`), CSP-meta, laadt `app.js`. |
| `app.js` | **Alle JavaScript** (~2.600 regels, één bestand, geen build-stap of framework). |
| `sw.js` | Service worker: offline-cache, netwerk eerst met `cache: 'no-cache'`. Cache-naam = versienummer. |
| `manifest.json`, `icon*.png`, `icon.svg` | PWA-manifest en iconen. |
| `CHANGELOG.md` | Alle versies, nieuwste bovenaan, in het Nederlands. |
| `WISHLIST.md` | Nog niet ingebouwde wensen (W1, W2, …; nummers liggen vast). |
| `ARCHITECTUUR.md` / `NOTES.md` / `DECISIONS.md` / `CLAUDE.md` | Vaste kennis (dit bestand), actuele stand, besluitenlogboek, werkafspraken voor Claude. |
| `tests/` | Playwright-tests, nep-CoinGecko, test-export (zie `tests/README.md`). |
| `.github/workflows/tests.yml` | Draait de tests bij elke push. |
| `tools/release.py`, `tools/wish.py` | Versie uitbrengen; wens van de wishlist halen. |

## 3. Code-indeling van `app.js` (waar zit wat)

Zoek op de functienaam; de volgorde in het bestand is ongeveer zoals hieronder.

- **Opslag (localStorage):** `cpt.data` (gegevens), `cpt.settings` (per apparaat), `cpt.prices`, `cpt.charts`, `cpt.fx`, en versleuteld `cpt.lock`, `cpt.vault`, `cpt.vcharts` als de app-vergrendeling aan staat.
- **Gegevensmodel `data`:**
  - `txs` (transacties), `deleted` (grafstenen van verwijderde id's), `cfg` (o.a. `cgKey`), `hist` (eigen koersarchief: `hist[coinId][dagnummer]=[ts,prijs]`);
  - de lijsten `watch`, `alerts`, `goals`, `plans`, `portfolios`, `allocs`. Elk item heeft `id`, `mod` (tijdstip) en eventueel `del:true`.
  - Een transactie heeft o.a. `type` (`buy`, `sell`, `deposit`, `withdraw`, `receive`, `transfer`, `other`), `coinId`, `qty`, `price`, `fee`, `date`, `acct` en `pf` (portefeuille; leeg = hoofdportefeuille).
- **Synchronisatie:**
  - `syncNow()`, `merge()`, `mergeList()`: nieuwste `mod` wint, bij gelijke tijd wint verwijderen.
  - `encryptObj`/`decryptObj`: PBKDF2 250k + AES-GCM.
  - GitHub Contents-API, met een raw-download boven 1 MB.
  - `sig()` herkent wijzigingen.
- **Portefeuilles:** `TX()` geeft de transacties van de gekozen portefeuille (`curPf()`, `'__all'` = alles samen). Gebruik voor weergave en berekening altijd `TX()`, niet `data.txs`.
- **Berekeningen:**
  - `computeCoin(id)`: FIFO per munt, met `lotMap`, `sellInfo`, `unrealPct` enz.
  - `coinStates(id)`: verloop in de tijd.
  - `portfolio()`: totalen.
  - `cashEffect()`: effect op cash en netto gestort.
- **Weergave-eenheid (€/$/₿):**
  - `UNIT_ON`, `inUnit(fn)` en `inEUR(fn)`; `money()` rekent om.
  - `K(t)` is de bitcoinfactor op tijdstip t: aankopen tellen tegen de bitcoinkoers van dat moment.
  - Rapporten, formulieren en calculators zijn altijd in euro (`inEUR`).
- **Schermen:**
  - `render()` → `renderInner()` → `renderHome()` / `renderCoin()` / `renderTxs()` / `renderReports()`.
  - Hash-routes: `#coin/<id>`, `#transacties`, `#rapporten/<tab>` met de tabbladen rendement, analyse, plannen en administratie.
- **Portfoliografiek:**
  - `portfolioSeries(range,unit)` geeft punten `[t, waarde, geïnvesteerd|netto gestort, gerealiseerd, {v,cash,inv,real,coins,pxs,costs}]`.
  - Tekenen: `paintPf()` voor € Totaal en `paintAssets()` voor € per munt, % per munt en % Totaal.
  - Overige onderdelen: `txDots()` (aan-/verkoopstippen met venstertje), `pfHover()` (muis, vinger en toetsenbord), `renderPfZoom()`/`drawPfZoom()` (vergroot venster).
  - De periodes staan in `PRANGES`: 1U, 4U, 24U, 1W, 1M, 3M, 1J en Max.
- **Koersgrafiek op de munt-pagina:** `drawChart(c)`. Gebruikt dezelfde opbouw als de portfoliografiek (`.pc`, `.pc-plot`, `.pc-axis`) en dezelfde y-as-hulpjes `axisTicks()` en `tickLbl()`.
- **CoinGecko:**
  - `cg(path,low)`: wachtrij met een emmer van 6 verzoeken, daarna 15 per minuut (met sleutel 10 en 30 per minuut), globale pauze bij 429, en `low` voor achtergrondwerk.
  - `fetchChart()` gebruikt een cache (`chartTtl`) en voegt gelijktijdige gelijke verzoeken samen.
  - Tests zetten `globalThis.__cgFast=true`.
- **Overige functies:**
  - Doelen, vaste inleg (`planDo`), doelverdeling (`allocCard`), wat-als (`whatIfCard`), risico (`riskCard`), gemiddelde-prijs-calculator (`avgCalcCard`), verkoopsimulator (`sellSimCard`);
  - eerdere versie terugzetten (`openVersions`), koppelcode (`makePairCode`/`readPairCode`), app-vergrendeling met passkey (WebAuthn PRF) en herstelwachtwoord.
- **Updates:** `showUpdate()` toont "update beschikbaar" naast de appnaam (laptop) of een melding bovenin (telefoon).

## 4. Conventies

- **Taal:** alle tekst in de app en de documentatie is Nederlands. Bedragen schrijf je als `€ 1.234,56`.
- **HTML/CSS/a11y:** volg `html-best-practices.md` (in het claude.ai-project): WCAG 2.2 AA, native elementen eerst, geen inline event handlers en strikte CSP (`script-src 'self'`).
  - Dynamische `style=""` met posities is toegestaan; `style-src` staat `'unsafe-inline'` toe.
  - Formulieren staan in `form.js-form` met zichtbare labels; fouten toon je met `fieldErr(id, tekst)`.
  - Bladen zijn een `<dialog>` via `openSheet()` en hebben altijd een sluitknop.
- **Breakpoints:**
  - telefoon: < 700 px;
  - tablet: 700–999 px, de telefoonopbouw maar breder;
  - kleine laptop: 1000–1399 px, de grafiek over de volle breedte en de kaarten eronder;
  - laptop: ≥ 1400 px, met zijbalk en twee kolommen.
- **Versienummers:** `MAJOR.MINOR.PATCH`. MAJOR als de gebruiker iets moet doen, MINOR bij een nieuwe functie, PATCH bij een verbetering of fix.
- **Changelog-stijl:**
  - Kop `## X.Y.Z – datum`, één zin samenvatting.
  - Secties `### Toegevoegd / Gewijzigd / Verbeterd / Opgelost / Technisch / Let op`, met vetgedrukte labels.
  - Bij een wens schrijf je "(wens Wn)".
- **Wishlist:** een ingebouwde wens verdwijnt met `tools/wish.py Wn`. Een nieuwe wens krijgt het eerstvolgende vrije nummer; de hoogste is nu W38.

## 5. Stijl en vormgeving

- **Uitstraling:** rustig en donker, zoals de Delta-app. Er is ook een licht thema en "Automatisch" (volgt het systeem).
- **Kleuren:** CSS-variabelen op `:root`, met het lichte thema in `:root.light`. Gebruik altijd de variabelen, nooit losse kleuren.

  | Variabele | Donker | Licht | Gebruik |
  |---|---|---|---|
  | `--bg` | #0b0d12 | #f3f4f7 | achtergrond |
  | `--card` / `--card2` | #151922 / #1c212c | #ffffff / #eceef2 | kaarten / actieve knop, hover |
  | `--line` | #262c39 | #e2e5ea | lijnen, randen |
  | `--text` / `--muted` | #eef1f6 / #8b93a5 | #151821 / #5b6372 | tekst / bijtekst |
  | `--green` / `--red` | #1fd17a / #ff5a5f | #047857 / #c8333a | winst / verlies (`.up`, `.down`) |
  | `--accent` | #4f8cff | #2563eb | links, focus, knoppen |
  | `--yellow` | #f5b942 | #8a5a0f | waarschuwing (`.warn-mark`) |

  In het lichte thema haalt alle tekst minstens 4,5:1 contrast.
- **Kleuren in grafieken:** `PAL = #4f8cff, #1fd17a, #f5b942, #b56cff, #ff7a59, #34c6d3, #8b93a5` voor de munten op volgorde van waarde, overal hetzelfde (verdelingsbalk, lijnen, stippen). Cash is grijs en gestippeld.
- **Lettertype:** systeemlettertype (`-apple-system, Segoe UI, Roboto…`), 15 px. Cijfers gebruiken `tabular-nums`, zodat bedragen onder elkaar uitlijnen.
- **Bouwstenen:**
  - `.card` (blok met afgeronde hoeken) en `.panel` (grafiekblok);
  - `.kv` (label links, waarde rechts);
  - `.seg` (schakelaar met knoppen, met `aria-pressed`) en `.link` (tekstknop);
  - `.btn` / `.btn.sec` / `.btn.danger`, `.rt` (compacte tabel) en `.hint` (uitleg in klein grijs).
- **Bedragen:** altijd via `money()` / `signed()` / `pct()`. Bedragen die met het oogje verborgen moeten kunnen worden, krijgen de klasse `.m`.
- **Iconen:** inline SVG (`ICONS`), met `aria-hidden` en een `aria-label` op de knop.
- **Teksttoon:** kort, Nederlands, je-vorm, geen vakjargon. Uitleg staat in een `.hint` onder het onderdeel.
