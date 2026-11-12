# NOTES – Crypto Portfolio

De **actuele stand**: versie, werkwijze, testen, open punten en sessielog. Werk dit bij aan het eind van elke sessie (zie `CLAUDE.md`). De vaste kennis over de app staat in `ARCHITECTUUR.md`, de besluiten in `DECISIONS.md`.

Laatst bijgewerkt: 12 november 2026 · versie **4.0.2** (fase 2 technisch gevalideerd; samenvoeging gereed)

---

## 1. Werkwijze met Geert (belangrijk)

- **Antwoord:** in het Nederlands, kort en zonder vakjargon, want hij heeft geen IT-achtergrond.
- **Vraagt hij "hoe zou je …" of "implementeer het nog niet":** leg het uit en **wacht op akkoord**. Bouw pas als hij "bouw het in" of iets dergelijks zegt.
- **Elke wijziging is een eigen versie:**
  1. code aanpassen;
  2. tests draaien;
  3. `python3 tools/release.py <major|minor|patch> tekst.md`;
  4. committen en **rechtstreeks naar `main` pushen** (D35); geen zip en geen voorstel meer nodig;
  5. kort samenvatten.
  Pas als de tests lokaal groen zijn, push je. Na de push draaien de tests nog eens op GitHub; zijn die rood, los het dan direct op met een nieuwe versie.
- **Code lezen en schrijven:** koppel aan het begin van een sessie de repository `Gertjun/Cryptotracker` met schrijfrechten (`add_repo` met `access: push`; de Claude GitHub-app is geïnstalleerd). Haal vóór het pushen eerst `git fetch origin main` en zet je werk erbovenop.
- **Bij een nieuw bestand of een nieuwe map:** noem het in de samenvatting.
- **Screenshots:** hij stuurt er vaak een. Controleer het versienummer in Instellingen, want een oude versie uit de cache was eerder de oorzaak van een "bug".
- **Vóór elke release:**
  - `cd tests && npm ci && npx playwright test` (lokaal met `CHROMIUM_PATH=/opt/pw-browsers/chromium`);
  - `npx html-validate ../index.html`;
  - waar zinvol een screenshot op telefoon (390 px) en laptop (1440 px).

## 2. Testen

- Zie `tests/README.md`. Er zijn 58 tests op twee schermformaten: rooktest, toegankelijkheid (axe in alle zes thema's, themakeuze, toetsenbord), berekeningen, synchronisatie met koppelcode, beveiliging en robuustheid (`beveiliging.spec.mjs`: wachtwoordregels, synchroniseren bij verlaten, twee tabbladen, gegevensversie, back-up en app-wisselaar), passen op het scherm (`fit.spec.mjs`), zijbalk met gewone schuifbalken (`zijbalk.spec.mjs`), rendementskalender (`kalender.spec.mjs`), CoinGecko-tempo, updates, de kolommen van Bezittingen, marktsentiment (`markt.spec.mjs`) de inzichtblokken van 3.25.0 (`inzicht.spec.mjs`) en passkeys hergebruiken met een virtuele passkey (`passkey.spec.mjs`).
- **Vaste klok:** de tests gebruiken de vaste datum 26 okt 2026 12:00 UTC. Bedragen uit de test-export liggen vast: 84 transacties, cash € 439,87, netto gestort € 1.600, gerealiseerd € 47,79.

## 3. Bekende problemen en open punten

- **iOS 26/27-vervaging bovenin** bij de app op het beginscherm. Sinds 3.20.3 op telefoon en tablet geen 40 punten extra meer, maar 14 px ruimte in de vaste bovenbalk (D39). **Nog niet door Geert bevestigd op de iPhone.** De effen statusbalk (`apple-mobile-web-app-status-bar-style: default`) blijft.
- **CoinGecko zonder sleutel:** de eerste keer laden met veel munten duurt 10–15 s door het tempo. Advies: een gratis Demo-sleutel. Sinds 3.23.3 gaat de koersupdate wel altijd voor (D45). Nog te traag? Optie: een GitHub-taak die elk uur koersen ophaalt (zie D45, nog niet gekozen).
- **GitHub Pages cachet 10 minuten.** Opgelost in de service worker sinds 3.3.2, maar een apparaat met een heel oude versie heeft één keer die vertraging.
- **Wishlist open (33):** W4–W8, W10, W11, W15, W16, W18–W23, W25, W26, W28–W33, W35–W43, W46. W17, W27, W34, W44 en W45 ingebouwd in 3.25.0. Advies aan Geert: daarna W39 (jaarrendement) en W40 (hoe gingen je verkopen). W6 (fijnere grafiek voor jonge munten) heeft al een uitgewerkte oplossing in de wishlist.
- **Nog niet op een echte iPhone bevestigd (3.19.1):** back-up via het deelmenu en de lege app-wisselaar met vergrendeling aan. iOS maakt het plaatje voor de app-wisselaar soms al vóór de app het scherm kan verbergen.
- **Synchronisatie en beveiliging (fase 2):** wijzigingen voor 4.0.2 staan in PR #39. De volledige GitHub Actions-testset is op de actuele commit geslaagd (12 nov 2026). Na samenvoeging is fase 2 onderdeel van `main`; de app is daarmee nog niet automatisch op een echte iPhone gecontroleerd.
- **Passkey hergebruiken (3.26.0, D55)** nog niet op een echte iPhone bevestigd: vergrendeling uit en weer aan, dan "Bestaande passkey gebruiken". `inzicht.spec.mjs` › meebewegen met bitcoin faalde één keer bij de volle testrun op de telefoon (los steeds groen); in de gaten houden.
- **Gegevensversie (D32):** de bescherming werkt alleen op apparaten met 3.19.0 of nieuwer. Werk alle apparaten bij voordat `DATA_V` ooit omhoog gaat.
- **Bestaand versleutelwachtwoord korter dan 12 tekens** blijft werken. Het versleutelwachtwoord wijzigen kan in de app (nog) niet; dat zou een nieuwe functie zijn (bestand opnieuw versleutelen en alle apparaten opnieuw koppelen).
- **PWA-template:** de app draait bewust niet op Geerts PWA-template (D36). Ombouwen kan later, maar alleen met een goedgekeurd plan.
- **Native iPhone-app in SwiftUI:** genoemd door Geert (in een andere sessie); geen code in deze repository. Hij heeft geen Mac.

## 4. Sessielog (kort, nieuwste bovenaan)

- **12 nov 2026:** fase 2 (4.0.2) technisch gevalideerd. De volledige GitHub Actions-run op commit `26d6e655` is geslaagd, inclusief Playwright-installatie en `npm run test:all`; ook de eerdere mislukte check op dezelfde commit is bij een nieuwe uitvoering geslaagd. Documentatie bijgewerkt vóór samenvoeging van PR #39.
- **11 nov 2026:** fase 2 gebouwd (4.0.2): synchronisatiehandtekening uitgebreid naar volledige koersarchiefwaarden; PBKDF2-instellingen begrensd tot bekende oude/nieuwe waarden; conflicten worden niet als geslaagde sync getoond; uitleg lokale opslagbeveiliging toegevoegd. Regressietests toegevoegd.
- **10 nov 2026:**
  - 4.0.0: apps uniform gemaakt. PBKDF2 naar 600.000 rondes zoals de andere apps, met `it` in het versleutelde object (D56). De passkey-aanpak met vaste PRF (D55) is nu de standaard voor al Geerts apps.
  - 3.26.0: na opnieuw installeren een bestaande passkey uit het wachtwoordbeheer hergebruiken, in plaats van steeds een nieuwe (D55). Nieuwe test `passkey.spec.mjs`. Nog niet op een echte iPhone bevestigd.
  - 3.25.0: vijf wensen in één versie (Geert vroeg ze samen): break-even (W45), bijdrage per munt (W17), meebewegen met bitcoin (W44), munten vergelijken (W27), Overzicht indelen (W34); D50–D54. Nieuwe test `inzicht.spec.mjs`. Nog niet door Geert bekeken.
  - 3.24.3: lijn Geïnvesteerd valt bij 1U/4U/24U niet meer buiten de grafiek (D49). Nieuwe test in `calc.spec.mjs`.
- **9 nov 2026:**
  - 3.24.2: versienummer in de zijbalk verspringt niet meer op Transacties/Analyse; alleen de muntenlijst schuift (D48). Nieuwe test `zijbalk.spec.mjs`.
  - 3.24.1: synchronisatie, oogje en slotje terug rechtsboven; zijbalk alleen + Transactie en vier knoppen (D47). a11y-test wacht nu tot een melding weg is (de eerdere toevallige fout bij Nachtblauw/Hoog contrast kwam door een uitfadende melding). Nog niet door Geert bekeken.
  - 3.24.0: laptop zoals Vaste Lasten: synchronisatie, + Transactie, oogje en slotje in de zijbalk; Instellingen als vierde knop (ook vierde tabblad op de iPad rechtop) met links een lijst van onderdelen en rechts de blokken (D46, vervangt D37 voor laptop/iPad). Telefoon ongewijzigd. Nog niet door Geert bekeken.
  - 3.23.3: koersen sneller binnen. Achtergrondwerk schuift niet meer vóór de koersupdate; geen grafieken meer voor munten die je in de periode niet had; koersarchief alleen aanvullen als er een dag ontbreekt (D45). Nog niet door Geert bekeken.
  - Geert vroeg om koersen elk uur op de achtergrond op te halen, ook als de app dicht is. Kan niet in de app (iOS staat dat niet toe voor web-apps); alleen via een GitHub-taak in de data-repository, met de muntenlijst onversleuteld. Afgesproken: eerst 3.23.3 afwachten.
- **5 nov 2026:**
  - 3.23.2: iPad zonder lege band bovenin; zijbalk liggend tot de bovenrand, 40 punten extra weg (D44, vervangt D8). Nog niet door Geert bevestigd.
  - 3.23.1: iPad rechtop toch zonder zijbalk; tabbladen bovenaan in een rij zoals Vaste Lasten (D43, vervangt D42). Nog niet door Geert op de iPad bekeken. iPad liggend houdt de zijbalk; Instellingen blijft via het tandwiel (Geert: "hou het zo voor nu").
  - 3.23.0: iPad rechtop (700–999 px breed, ≥ 700 px hoog) krijgt de zijbalk zoals de laptop (D42); laptop en iPhone ongewijzigd. Nog niet door Geert op de iPad bekeken.
  - 3.22.0: marktsentiment (angst- en hebzuchtmeter van alternative.me) op het Overzicht, uit te zetten in Instellingen (W24, D41). Nog niet door Geert bekeken.
  - 3.21.1: W46 "Waar zet ik mijn geld in?" op de wishlist. Geert vroeg om koopadvies; afgesproken: geen voorspelling welke munt stijgt, alleen een bedrag verdelen volgens zijn eigen doelverdeling. Nog niet bouwen.
- **4 nov 2026:**
  - 3.21.0: zijbalk op de laptop inklapbaar tot een strook met iconen, per apparaat onthouden (D40). Nog niet door Geert bekeken.
  - 3.20.3: bovenbalk hoger, 14 px ruimte zoals Vaste Lasten in plaats van 40 punten extra (D39, vervangt D8 op telefoon/tablet).
- **3 nov 2026:**
  - 3.20.2: op de telefoon onder elke munt bij Bezittingen nu 1u, 24u, 7d en 30d op één regel (D38). 4u bewust niet. Nog niet door Geert op de telefoon bekeken.
  - Tests op GitHub faalden: `ubuntu-latest` werd 26.04, dat Playwright 1.56 nog niet ondersteunt. `tests.yml` staat nu vast op `ubuntu-24.04`; terugzetten zodra Playwright 26.04 ondersteunt.
- **30 okt 2026:**
  - 3.20.1: bovenbalk (oogje, synchronisatie, slotje, tandwiel) blijft staan bij scrollen op telefoon en tablet, zoals in Vaste Lasten. Nog niet op een echte iPhone bevestigd.
  - 3.20.0: Instellingen is een eigen scherm (`#instellingen`) in blokken, op de laptop in twee kolommen; het tandwiel opent het, geen extra tabblad (D37). Nog niet door Geert op de telefoon bekeken.
  - 3.19.2: zeven ideeën voor meer inzicht in rendement als W39–W45 op de wishlist (nog niet bouwen).
  - Projectinstructies in claude.ai aangepast aan deze app in plaats van de PWA-template (D36); de app zelf is niet veranderd.
  - Werkwijze: Claude pusht voortaan rechtstreeks naar `main`, zonder voorstel (D35, vervangt D18).
  - Review van robuustheid en beveiliging (lijst van Geert) nagelopen; deels al aanwezig (versie terugzetten, wachtrij bij opslaan, komma-invoer), de rest ingebouwd (D29–D34):
  - 3.17.1: nieuw wachtwoord minimaal 12 tekens met indicator en oogje; synchroniseren 20 s na een wijziging en direct bij verlaten; opslag laten beschermen.
  - 3.18.0: tabbladen voegen elkaars wijzigingen samen.
  - 3.19.0: gegevensversie (`DATA_V`); een oudere app stopt met synchroniseren en vraagt om te vernieuwen.
  - 3.19.1: back-up/CSV via het deelmenu op telefoon en tablet; inhoud verborgen in de app-wisselaar (met vergrendeling); Face ID aanbieden na het koppelen.
  - 3.17.0: Volglijst sorteren via de kolomkoppen; eerste klik hoog → laag, tweede klik laag → hoog (D28). Nep-CoinGecko kreeg Polkadot en Dogecoin.
- **29 okt 2026:**
  - 3.16.1: meer ruimte tussen de appnaam en het versienummer.
  - 3.16.0: rendementskalender per Dag, Week, Maand of Jaar (D27).
  - 3.15.0: thema's kiezen in Instellingen: Donker, Zwart, Nachtblauw, Licht, Zacht en Hoog contrast; bij Automatisch kies je per stand (donker/licht) welk thema (D26). Per apparaat.
  - 3.14.0: indeling nagelopen op iPhone, iPad en laptop (D25). Rapporten heet Analyse, het tabblad Analyse heet Vergelijken. Telefoon: filters en totalen achter knop Filter, munt-pagina transacties vóór rekenhulpen, tabbladen in twee rijen. iPad: blok met cijfers naast Cash. Laptop: geen dubbele muntenlijst in de zijbalk op Overzicht, regel onder totale waarde alleen bij aanwijzen, kolomkoppen blijven staan. Geen nieuwe hoofdtabbladen (Plannen of Markt pas later, als die meer gebruikt worden).
  - 3.13.2: tabellen en grafieken passen op het scherm: tickers, compactere kolommen, en op smallere schermen verdwijnen eerst de minst belangrijke kolommen met een melding (D24). Vergroot venster Rendement past op de laptop.
  - 3.13.1: ingevuld totaalbedrag werd na afronding van de koers net anders bewaard (melding "geen heel bedrag in centen"); de koers wordt nu onafgerond bewaard (D23). Oude transacties met de melding: openen, totaal opnieuw typen, opslaan.
- **28 okt 2026:**
  - Schrijfrechten op GitHub werken; `.github/workflows/tests.yml` teruggezet via voorstel #21 (tests groen).
  - 3.10.4: 20 nieuwe ideeën als W19–W38 op de wishlist (op verzoek van Geert, nog niet bouwen).
  - 3.10.5: koersgrafiek op de munt-pagina heeft een y-as met hulplijnen (zoals de portfoliografiek).
  - 3.10.6: `README.md` toegevoegd; die staat als voorpagina op de GitHub-repository.
  - 3.10.7: x-as (5 tijdstippen) onder alle lijngrafieken: portfolio, munt en Vergelijking.
  - 3.11.0: kolommen van de tabel Bezittingen zelf verplaatsen en verbergen, gesynchroniseerd (D20).
  - 3.12.0: Volglijst op de laptop als tabel met dezelfde kolommen als Bezittingen (D21).
  - 3.12.1: onnodige schuifbalk onder Bezittingen/Volglijst opgelost (kolommen werden op uitgerekte breedte gemeten).
  - 3.13.0: kolommen 1 uur (standaard aan), 4 uur en 1 jaar (standaard uit) bij Bezittingen en Volglijst (D22).
- **27 okt 2026:**
  - 3.7.3–3.9.1: acht verbeterpunten (afronding, tests in de repository, kleine laptops, koppelcode, CoinGecko-tempo, iOS-bovenbalk, verkoopstippen, grafiek met het toetsenbord).
  - 3.9.2–3.10.0: munt-pagina opnieuw ingedeeld en de verkoopsimulator (W2).
  - 3.10.1: NOTES/DECISIONS/CLAUDE.md en `tools/` toegevoegd.
  - 3.10.2: kennis gesplitst in ARCHITECTUUR.md (vast) en NOTES.md (actueel); tekst voor de projectinstructies gemaakt.
  - 3.10.3: blokken op de munt-pagina even hoog; de code komt voortaan rechtstreeks uit de GitHub-repository.
- **26 okt 2026:** grafiekweergaven (€/% totaal en per munt), valutaknop, aankoopstippen, versienummering naar SemVer (v89 → 3.5.1), "update beschikbaar" naast de appnaam, sluitknop in bladen, vergroot venster over het hele scherm.
- **21–25 okt 2026:** basis gebouwd (v1–v33), testronde en HTML/a11y-controle (v34–v65 = 1.0.x), daarna functies tot en met v80 (zie de changelog).
