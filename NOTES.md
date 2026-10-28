# NOTES – Crypto Portfolio

De **actuele stand**: versie, werkwijze, testen, open punten en sessielog. Werk dit bij aan het eind van elke sessie (zie `CLAUDE.md`). De vaste kennis over de app staat in `ARCHITECTUUR.md`, de besluiten in `DECISIONS.md`.

Laatst bijgewerkt: 28 oktober 2026 · versie **3.10.5**

---

## 1. Werkwijze met Geert (belangrijk)

- **Antwoord:** in het Nederlands, kort en zonder vakjargon, want hij heeft geen IT-achtergrond.
- **Vraagt hij "hoe zou je …" of "implementeer het nog niet":** leg het uit en **wacht op akkoord**. Bouw pas als hij "bouw het in" of iets dergelijks zegt.
- **Elke wijziging is een eigen versie:**
  1. code aanpassen;
  2. tests draaien;
  3. `python3 tools/release.py <major|minor|patch> tekst.md`;
  4. zip sturen;
  5. kort samenvatten.
  Geert uploadt de inhoud van de zip naar GitHub; de verborgen map `.github` moet daarbij mee.
- **Code lezen en schrijven:** koppel aan het begin van een sessie de repository `Gertjun/Cryptotracker` met schrijfrechten (de Claude GitHub-app is geïnstalleerd). Claude kan een branch pushen en een voorstel (pull request) maken via `gh api` (REST; GraphQL en `gh pr create` werken niet). Geert keurt goed met "Merge".
- **Bij een nieuw bestand of een nieuwe map:** zeg het expliciet, zodat hij het meeneemt bij het uploaden.
- **Screenshots:** hij stuurt er vaak een. Controleer het versienummer in Instellingen, want een oude versie uit de cache was eerder de oorzaak van een "bug".
- **Vóór elke release:**
  - `cd tests && npm ci && npx playwright test` (lokaal met `CHROMIUM_PATH=/opt/pw-browsers/chromium`);
  - `npx html-validate ../index.html`;
  - waar zinvol een screenshot op telefoon (390 px) en laptop (1440 px).

## 2. Testen

- Zie `tests/README.md`. Er zijn 26 tests op twee schermformaten: rooktest, toegankelijkheid (axe, licht en donker, toetsenbord), berekeningen, synchronisatie met koppelcode, CoinGecko-tempo en updates.
- **Vaste klok:** de tests gebruiken de vaste datum 26 okt 2026 12:00 UTC. Bedragen uit de test-export liggen vast: 84 transacties, cash € 439,87, netto gestort € 1.600, gerealiseerd € 47,79.

## 3. Bekende problemen en open punten

- **iOS 26/27-vervaging bovenin** bij de app op het beginscherm. Sinds 3.8.2 begint de app 40 punten lager (`--top-extra`, klasse `ios-standalone`). **Nog niet bevestigd door Geert of dit genoeg is.** De effen statusbalk (`apple-mobile-web-app-status-bar-style: default`) sinds 3.0.0 hielp niet tegen de vervaging, maar bleef.
- **CoinGecko zonder sleutel:** de eerste keer laden met veel munten duurt 10–15 s door het tempo. Advies: een gratis Demo-sleutel.
- **GitHub Pages cachet 10 minuten.** Opgelost in de service worker sinds 3.3.2, maar een apparaat met een heel oude versie heeft één keer die vertraging.
- **Wishlist open (31):** W4–W8, W10, W11, W15–W38. W19–W38 zijn op 28 okt toegevoegd (20 nieuwe ideeën, nog niets van gebouwd). W6 (fijnere grafiek voor jonge munten) heeft al een uitgewerkte oplossing in de wishlist.
- **Native iPhone-app in SwiftUI:** genoemd door Geert (in een andere sessie); geen code in deze repository. Hij heeft geen Mac.

## 4. Sessielog (kort, nieuwste bovenaan)

- **28 okt 2026:**
  - Schrijfrechten op GitHub werken; `.github/workflows/tests.yml` teruggezet via voorstel #21 (tests groen).
  - 3.10.4: 20 nieuwe ideeën als W19–W38 op de wishlist (op verzoek van Geert, nog niet bouwen).
  - 3.10.5: koersgrafiek op de munt-pagina heeft een y-as met hulplijnen (zoals de portfoliografiek).
- **27 okt 2026:**
  - 3.7.3–3.9.1: acht verbeterpunten (afronding, tests in de repository, kleine laptops, koppelcode, CoinGecko-tempo, iOS-bovenbalk, verkoopstippen, grafiek met het toetsenbord).
  - 3.9.2–3.10.0: munt-pagina opnieuw ingedeeld en de verkoopsimulator (W2).
  - 3.10.1: NOTES/DECISIONS/CLAUDE.md en `tools/` toegevoegd.
  - 3.10.2: kennis gesplitst in ARCHITECTUUR.md (vast) en NOTES.md (actueel); tekst voor de projectinstructies gemaakt.
  - 3.10.3: blokken op de munt-pagina even hoog; de code komt voortaan rechtstreeks uit de GitHub-repository.
- **26 okt 2026:** grafiekweergaven (€/% totaal en per munt), valutaknop, aankoopstippen, versienummering naar SemVer (v89 → 3.5.1), "update beschikbaar" naast de appnaam, sluitknop in bladen, vergroot venster over het hele scherm.
- **21–25 okt 2026:** basis gebouwd (v1–v33), testronde en HTML/a11y-controle (v34–v65 = 1.0.x), daarna functies tot en met v80 (zie de changelog).
