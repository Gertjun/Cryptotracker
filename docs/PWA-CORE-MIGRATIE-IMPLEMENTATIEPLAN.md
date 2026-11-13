# Cryptotracker – volledig PWA-Core-migratieplan

Status: voorbereid plan; nog geen runtime- of gebruikersdatamigratie uitgevoerd  
Doelbranch: `feat/pwa-core-migration-with-backups`  
Basisapp: `main` op `d1d380408cda9cec6e3dc777c89610d16f681b47` (appversie 4.0.2)  
Core-pin: PWA-Core `v1.0.0`, releasecommit `1a9c31f489290853fdc3aa4e62f199b21a338030`

## 1. Doel en ontwerpbesluit

De bestaande Crypto Portfolio-interface en alle portfoliofunctionaliteit blijven behouden. PWA-Core wordt de enige nieuwe eigenaar van:

- de versleutelde lokale kluis en sleutelafhandeling;
- wachtwoordgebaseerde kluisbeveiliging;
- WebAuthn/PRF-passkey-ontgrendeling;
- GitHub Contents API-synchronisatie;
- de blijvende verwijderadministratie en apparaatregistratie.

De bestaande app blijft verantwoordelijk voor de domeinlogica: transacties, FIFO, cash, portefeuilles, koershistorie, analyses, doelen, plannen, allocaties, watchlists en alerts.

**Geen volledige herbouw van de gebruikersinterface.** De huidige app is een grote, bestaande applicatie (root-`app.js`, circa 337 KB). De voorkeursroute is een gecontroleerde adapter tussen de bestaande app en de PWA-Core-modules. De Core-shell wordt niet zonder noodzaak als complete nieuwe interface over de huidige app heen gezet; dat zou een veel grotere UI-migratie veroorzaken. De bestaande vergrendel-, instellingen- en synchronisatieschermen blijven waar mogelijk herkenbaar, maar roepen voortaan Core-functies aan.

De adapter moet wel alle Core-veiligheidsvoorwaarden respecteren. Een tijdelijke tussenlaag mag nooit een tweede, parallelle bron van waarheid of een tweede synchronisatiepad creëren.

## 2. Harde gegevens- en veiligheidsgrenzen

1. Het bestaande bestand `Gertjun/SyncData/crypto-portfolio.enc.json` blijft exact behouden. De nieuwe app mag het uitsluitend lezen voor de eenmalige import; er komt geen PUT naar dit pad.
2. De nieuwe Core-kluis krijgt een afzonderlijk pad: `crypto-portfolio.pwa-core-v1.json` in `Gertjun/SyncData`.
3. Oude lokale opslag blijft staan: `cpt.data`, `cpt.settings`, `cpt.prices`, `cpt.lock`, `cpt.vault`, `cpt.charts` en `cpt.vcharts`. Er wordt tijdens deze migratie niets verwijderd of overschreven.
4. Core gebruikt dezelfde logische prefix `cpt`, maar eigen sleutels met dubbele punt, zoals `cpt:vault`, `cpt:device`, `cpt:sync` en `cpt:biometric`. De oude sleutels met punten blijven daardoor afzonderlijk bestaan.
5. Tokens, wachtwoorden, ontsleutelde gegevens en echte portfolio-inhoud komen niet in GitHub-code, tests, logs, fixtures of PR-beschrijvingen.
6. De migratie-assistent haalt het versleutelde gebruikersbestand niet op in de ontwikkelomgeving en ontsleutelt het niet buiten de browser/app.
7. Geen wijzigingen aan `main`, geen merge en geen wijzigingen aan SyncData zonder een afzonderlijke expliciete goedkeuring voor de betreffende datastap.

## 3. Backupbeleid voor ieder bestaand bestand

Voor de eerste wijziging aan elk bestaand bestand:

1. Haal de exacte inhoud op van de actuele basiscommit van de featurebranch.
2. Maak eerst een byte-voor-byte kopie onder `backup/<oorspronkelijk-pad>.backup`.
3. Controleer de kopie tegen het origineel.
4. Leg de backup vast voordat het oorspronkelijke bestand wordt gewijzigd.
5. Overschrijf een bestaande backup nooit. Een latere migratiefase maakt geen nieuwe kopie over de oorspronkelijke nulmeting heen.

Nieuwe bestanden hoeven niet vooraf te worden geback-upt. Backups zijn alleen voor herstel in de bronrepository en worden uitgesloten van GitHub Pages en release-ZIP-bestanden. De backups zijn geen vervanging voor gegevensbackups.

Bestanden die naar verwachting geraakt worden:
- `app.js` – integratie van Core, opslagadapter, synchronisatie en vergrendeling;
- `index.html` – module/bootstrap-invoer en eventuele UI-aansluitingen;
- `sw.js` – precache van alle Core-modules en module-afhankelijkheden;
- bestaande tests of testconfiguratie die daadwerkelijk worden aangepast;
- eventueel `README.md` en `tests/README.md` in de documentatieronde.

`tools/release.py` heeft in de huidige voorbereidende PR al een exacte backup. Ook het eerdere migratieontwerp is veiliggesteld.

## 4. Integratie van PWA-Core v1.0.0

Kopieer uitsluitend de 13 bestanden uit de allowlist van de gepubliceerde Core-release, samen met het exacte `core-manifest.json`. Gebruik geen `main`-versie van PWA-Core en laad Core nooit tijdens runtime vanaf een externe repository.

Voeg de appconfiguratie toe op de locatie die de Core-modules verwachten (`js/config.js`). De configuratie moet minimaal de door v1.0.0 gebruikte waarden bevatten: appnaam, appversie, `storagePrefix: 'cpt'`, KDF-iteraties, minimale wachtwoordlengte, standaardbranch, standaarddatapad, standaardgedrag voor biometrie, automatische vergrendeltijd en synchronisatievertraging. Waarden worden afgestemd op het bestaande gedrag en niet willekeurig gewijzigd.

Voeg een `pwa-core.lock.json` toe met de exacte releaseversie, commit-SHA en manifest-SHA256. Valideer dit met de Core-pinvalidator. Valideer ook de volledige precache met de Core-precachevalidator.

De huidige `index.html` laadt `app.js` als een klassiek script. De gekozen adapter moet daarom expliciet vastleggen hoe de ES-module-imports van Core worden geladen. Voorkeursroute: een gecontroleerde module-bootstrap met behoud van de bestaande DOM- en eventstructuur. Alle bestaande globale/inline afhankelijkheden en Playwright-aansluitingen worden vooraf geïnventariseerd; de scriptomzetting mag geen impliciete globale functies verliezen.

De service worker krijgt een statische `PRECACHE`-lijst met alle Core-bestanden, configuratie, manifest en benodigde appbestanden. De CSP blijft minimaal: alleen de al benodigde eigen origin, GitHub API, CoinGecko en alternative.me; geen nieuwe externe scriptbron.

## 5. Opslagadapter en schrijfgedrag

De adapter maakt PWA-Core-kluisdata de enige bron van waarheid nadat de migratie is afgerond.

- Bij openen en ontgrendelen wordt de appdata uit `vault.getData()` geladen.
- Elke wijziging die nu via `persist()`, `saveData()`, `saveSettings()` of `savePrices()` wordt opgeslagen, wordt expliciet aan de juiste Core-opslagroute gekoppeld.
- Portfolio-data wordt via `vault.setData()` in de Core-kluis bewaard.
- Apparaatgebonden instellingen, GitHub-token en lokale koers-/grafiekcache worden waar passend in de versleutelde Core-apparaatinstellingen opgeslagen; ze worden niet onbedoeld onderdeel van de gedeelde portfolio-payload.
- De bestaande legacy GitHub-wachtwoordwaarde wordt na succesvolle migratie niet meer gebruikt voor Core-sync en wordt niet naar de Core-payload gekopieerd.
- De Core-opslagwachtrij wordt altijd geflusht vóór synchronisatie, vergrendeling, afsluiten en herstelacties.
- Opslagfouten mogen niet worden genegeerd. De huidige legacy-persistcode heeft een foutpad dat opslagfouten stil kan wegvangen; dat gedrag wordt niet overgenomen. Bij een mislukte Core-write wordt synchronisatie geblokkeerd en krijgt de gebruiker een duidelijke foutmelding.
- Geen destructieve opschoning van oude sleutels. Ook na de migratie blijven de oude opslaggegevens staan totdat een afzonderlijk, expliciet goedgekeurd opruimplan bestaat.

## 6. Datamodel en merge-adapter

De huidige appdata bevat onder meer `v`, `updated`, `txs`, `deleted`, `cfg`, `hist`, `watch`, `alerts`, `goals`, `plans`, `portfolios` en `allocs`. Onbekende top-level- en recordvelden moeten eveneens behouden blijven.

De bestaande merge-semantiek blijft de basis:
- transacties: per `id` de nieuwste `mod`, behalve IDs in de verwijderlijst;
- `deleted[]`: union van verwijderde transactie-IDs;
- `cfg`: de nieuwste `mod`;
- `hist`: dagen uit beide archieven samenvoegen volgens de bestaande koershistorie-regel;
- collecties: `watch`, `alerts`, `goals`, `plans`, `portfolios` en `allocs` per ID samenvoegen; bij gelijke `mod` wint verwijderen (`del: true)).

PWA-Core gebruikt `__pwaSync` en `deleted: true`/ `updatedAt` voor zijn generieke verwijderledger. De adapter vertaalt daarom:
- iedere bestaande transactie-ID uit `deleted[]` naar een blijvende ledgervermelding met pad `txs:<id>`;
- iedere oude collectieverwijdering `del: true` naar een Core-herkenbare tombstone met `deleted: true` en een `updatedAt` afgeleid van `mod`, waarbij de legacy-markering behouden blijft zolang dat nodig is voor compatibiliteit;
- bestaande Core-ledgergegevens nooit terug naar een lege ledger.

Het app-versienummer `v` blijft bestaan. Daarnaast wordt Core's eigen `schema` toegevoegd en afzonderlijk beheerd. De sync-adapter gebruikt de expliciete `schemaVersion` en weigert onbekende nieuwere gegevens. De legacy mergefunctie mag `__pwaSync` niet overschrijven; Core's `reconcileData`/merge-contract beheert die systeemstaat.

Er komen tests voor verwijderde transacties, verwijderde collectie-items, gelijke timestamps, onbekende velden, koershistorie, conflicten, herstel van backups en het voorkomen van terugkeer van verwijderde records vanaf een oud/offline apparaat.

## 7. Eenmalige legacy-import

De import gebeurt in de browser, nadat de gebruiker de bestaande lokale kluis heeft ontgrendeld.

1. Controleer dat de lokale legacy-appdata beschikbaar en leesbaar is.
2. Lees het bestaande SyncData-bestand uitsluitend met GET, via de bestaande GitHub-instellingen en het bestaande legacy-syncwachtwoord. Ondersteun ook de GitHub-respons voor bestanden groter dan 1 MB.
3. Ontsleutel de legacy-envelop alleen in het geheugen van de browser.
4. Combineer lokale en remote legacy-data met de bestaande mergefunctie. De import stopt bij een onduidelijke, ongeldige of nieuwere gegevensversie; er wordt dan niets geschreven.
5. Toon een controleoverzicht met aantallen transacties, collecties, koershistorie en verwijdermarkeringen. Toon geen gevoelige recordinhoud.
6. Maak de Core-kluis aan met een door de gebruiker gekozen Core-kluiswachtwoord. De gebruiker kan bewust hetzelfde wachtwoord kiezen als voorheen, maar de nieuwe Core-envelop en sleutelafleiding blijven nieuw.
7. Schrijf de gemigreerde data eerst naar de nieuwe lokale Core-opslag en lees die na flush terug voor een structurele vergelijking.
8. Pas na geslaagde lokale verificatie mag de app de nieuwe Core-envelop naar het nieuwe SyncData-pad schrijven. Deze externe datastap vereist vooraf expliciete goedkeuring.
9. Laat alle legacy-opslag en het oude remote bestand ongemoeid.

De import is idempotent: opnieuw starten mag geen transacties dupliceren, verwijderingen terugdraaien of de oude remote file wijzigen.

## 8. Passkeys en vergrendeling

De bestaande Crypto Portfolio-passkey gebruikt PRF-invoer `cpt-passkey-prf-v2`. PWA-Core v1.0.0 gebruikt een andere, van de app-prefix afgeleide PRF-invoer. De oude passkey-wrapper kan dus niet simpelweg naar Core worden gekopieerd.

Na het ontgrendelen van de oude kluis kan dezelfde WebAuthn-credential mogelijk opnieuw worden ingeschreven via Core's `biometric.enrollExisting(dataKey)`. Daarmee wordt een nieuw PRF-resultaat gebruikt om de nieuwe Core-datasleutel in te pakken. De credential zelf blijft dezelfde, maar de sleutelafleiding/wrapper is nieuw. Dit is een mogelijkheid, geen bewezen compatibiliteitsgarantie.

Per apparaat:
- eerst ontgrendelen met de bestaande methode of Core-wachtwoord;
- Core-passkey opnieuw inschrijven en daarna opnieuw ontgrendelen testen;
- wachtwoordfallback altijd beschikbaar houden;
- bij ontbrekende PRF-ondersteuning nooit de gebruiker buitensluiten.

Test minimaal iPhone/Safari met iCloud-sleutelhanger en Windows/Chrome of Edge met Windows Hello. Een passkey op het ene apparaat betekent niet automatisch dat een lokale wrapper op een ander apparaat bestaat; inschrijving en controle zijn per apparaat nodig.

De actieve ontgrendelde sessie wordt exclusief vergrendeld met Web Locks. Als de exclusieve lock niet kan worden verkregen, faalt de app gesloten: geen tweede actieve schrijfsessie en geen synchronisatie vanuit een tweede tab. Vergrendelen wist de Core-sleutel uit het geheugen. De bestaande privacy-cover, app-wisselaarbescherming en automatische vergrendeling blijven behouden en worden gekoppeld aan Core.

## 9. Synchronisatie en apparaatvolgorde

Core synchroniseert uitsluitend met `crypto-portfolio.pwa-core-v1.json`. De bestaande legacy-client is na de import read-only en mag nooit meer PUT uitvoeren naar `crypto-portfolio.enc.json`.

De GitHub-configuratie wordt vertaald van het oude `owner/repo`-veld naar Core's afzonderlijke `owner`, `repo`, `branch`, `path` en `token`. Het token wordt apparaatgebonden en versleuteld bewaard. De Core-kluis gebruikt zijn eigen wachtwoord- en datasleutelstructuur; het oude syncwachtwoord wordt niet als Core-encryptiesleutel hergebruikt zonder expliciete gebruikerskeuze.

Uitrolvolgorde:
1. Vooraf synchroniseren alle bestaande apparaten met de legacy-app en bevestigen ze dat ze up-to-date zijn.
2. Vanaf het cutovermoment worden geen nieuwe wijzigingen meer in de oude app gemaakt.
3. Het eerste apparaat voert de gecontroleerde import uit en maakt de nieuwe Core-file aan.
4. Elk volgend apparaat krijgt de nieuwe appversie, importeert/ontgrendelt dezelfde Core-kluis en voegt eventuele nog niet gesynchroniseerde lokale wijzigingen samen via de gecontroleerde merge-adapter.
5. Per apparaat wordt gecontroleerd dat Core-sync up-to-date is voordat het apparaat weer normaal wordt gebruikt.
6. De oude file blijft bestaan als onveranderde historische/rollbackbron. Oude appversies mogen na cutover niet meer worden gebruikt om wijzigingen te maken.

De testmock controleert expliciet dat GET naar het oude pad alleen tijdens import voorkomt en dat geen enkele PUT naar het oude pad plaatsvindt.

## 10. Test- en acceptatieplan

De bestaande Playwright-regressiesuite blijft volledig behouden: smoke, toegankelijkheid, berekeningen, synchronisatie, kolommen, responsive fit, indeling, zijbalk, CoinGecko-limieten, beveiliging, marktsentiment, inzichten, passkeys en updates.

Nieuwe automatische tests:
- Core-configuratie, lockfile, manifest-checksums en precache;
- module-bootstrap en CSP;
- adapterwrites, schrijfvolgorde, flush, foutafhandeling en vergrendelen tijdens een open write;
- roundtrip van alle bestaande appdata en onbekende velden;
- legacy-envelop met synthetische data, inclusief bestandsgrootte boven 1 MB;
- uitsluitend read-only legacy-import;
- Core-envelope op het nieuwe pad;
- merge- en tombstonecompatibiliteit;
- twee apparaten, gelijktijdige wijzigingen, GitHub-conflict, offline herstart en herstel;
- twee tabbladen en Web Locks fail-closed;
- passkey-PRF en wachtwoordfallback via browserfixture.

Tests gebruiken uitsluitend synthetische gegevens en een mock-GitHub. Geen echt token, echte SyncData-file of echte portefeuilledata in CI.

**Fysieke gate:** de eerder vastgelegde B07-test van de Storage Acceptance Harness (geïnstalleerde iPhone/iPad-PWA versus Safari-lockscope) staat nog op NOT RUN. Deze blijft een harde go/no-go-gate waar de migratie van deze opslag-/sessiearchitectuur van afhankelijk is. De reeds gemergde harness wordt niet verder uitgebreid met een nieuwe app-specifieke testomgeving; alleen de noodzakelijke fysieke acceptatie wordt uitgevoerd.

Handmatige acceptatie vóór definitieve overstap:
- iPhone geïnstalleerde PWA: oude lokale data, ontgrendelen, import, Core-passkey, vergrendelen en heropenen;
- Safari-tab versus geïnstalleerde PWA: geen gedeelde actieve schrijfsessie;
- Windows 11/Chrome of Edge: wachtwoord en Windows Hello;
- tweede apparaat: dezelfde Core-kluis openen en tweerichtingssynchronisatie;
- offline openen, wijzigingen opslaan, online hervatten en conflictcontrole;
- aantallen en representatieve berekeningen (FIFO, cash, rendement, historische grafiek) vergelijken vóór en na migratie.

## 11. Rollback en herstel

Vóór cutover zijn de oude lokale sleutels en het oude SyncData-bestand de ongewijzigde terugvalbasis.

Na cutover:
- de oude app kan alleen veilig terug als er sinds de cutover geen nieuwe Core-wijzigingen zijn gemaakt;
- als er wel Core-wijzigingen zijn gemaakt, moet eerst een gecontroleerde export/conversie naar het legacy-formaat worden ontwikkeld en getest;
- die rollback-export schrijft naar een apart rollback-pad, nooit over `crypto-portfolio.enc.json`;
- terugschakelen naar oude code of het schrijven van een rollback-bestand gebeurt pas na expliciete goedkeuring;
- oude lokale opslag wordt pas verwijderd na een afzonderlijk besluit en een bewezen hersteltest.

Een codebackup is geen gebruikersdatabackup. De migratiewizard moet daarom vóór de eerste Core-write ook een bruikbare, versleutelde export/herstelmogelijkheid aanbieden of aantoonbaar kunnen terugvallen op de onaangeroerde legacy-bronnen.

## 12. Uitvoering in kleine, controleerbare PR-stappen

1. **PR A – Voorbereiding en backupbeleid:** huidige draft PR #40; documentatie, backups en uitsluiting van Pages/release. Geen runtimewijzigingen.
2. **PR B – Core-pin en bootstrap:** Core v1.0.0-bestanden, config, lockfile, module-bootstrap, service-worker/precache en validators. Nog geen gebruikersdatamigratie.
3. **PR C – Opslagadapter:** Core vault achter de bestaande UI, foutafhandeling, Web Locks en lokale synthetische tests. Legacy opslag blijft intact; legacy sync nog niet uitgezet.
4. **PR D – Datamodel en sync-adapter:** mergefunctie, tombstonevertaling, Core GitHub-client, nieuw remote pad en tests die oude PUT blokkeren.
5. **PR E – Legacy-importwizard:** read-only oude file, lokale/remote merge, preview, lokale Core-import en pas daarna gecontroleerde nieuwe Core-write.
6. **PR F – Passkey en apparaatacceptatie:** bestaande credential opnieuw inschrijven, wachtwoordfallback, B07 en fysieke iPhone/Windows/twee-apparatentests.
7. **PR G – Documentatie en afronding:** actuele README, migratiehandleiding, rollbackprocedure, testresultaten en release-/versie-update.

Elke PR krijgt een gerichte review en CI. Geen PR wordt automatisch samengevoegd. Een PR die gebruikersdata schrijft of de cutover uitvoert, wacht op afzonderlijke expliciete toestemming.

## 13. Go/no-go-criteria

De migratie gaat pas naar productie wanneer:
- de Core-pin en alle checksums exact gevalideerd zijn;
- de bestaande regressiesuite en alle nieuwe automatische tests groen zijn;
- geen write naar het oude SyncData-pad mogelijk is;
- lokale data roundtrip en remote Core-envelope aantoonbaar compleet zijn;
- tombstones en verwijderde transacties niet terugkomen;
- opslagfouten niet stil worden genegeerd;
- Web Locks en B07 fysieke acceptatie slagen;
- iPhone/Safari, Windows/Hello en minimaal twee apparaten handmatig zijn getest;
- de rollbackprocedure aantoonbaar geen oude data overschrijft.

Als één van deze voorwaarden niet is aangetoond, blijft de migratie in de featurebranch en blijft de oude app/data de actieve basis.

## 14. Huidige stand

- Cryptotracker `main` is tijdens de planvoorbereiding opnieuw gecontroleerd op commit `d1d3804`.
- Draft PR #40 bevat de voorbereidende backupmaatregelen.
- De twee bestaande backupbestanden zijn exact vergeleken met hun bronbestanden.
- GitHub Actions Tests-run #123 op PR #40 is afgerond met conclusie `success`; de stap `npm run test:all` is geslaagd.
- Er zijn nog geen runtimebestanden van Cryptotracker gewijzigd, geen Core-bestanden in de app geïntegreerd en geen gebruikersgegevens gemigreerd.
- De originele SyncData-file is niet opgehaald, ontsleuteld of gewijzigd.
