# DECISIONS – Crypto Portfolio

Logboek van belangrijke keuzes: wat er besloten is, waarom, en wat er niet gekozen is. **Lees dit voordat je iets verandert dat hieronder staat.** Wil je een besluit terugdraaien, voeg dan een nieuw besluit toe dat het vorige vervangt; pas oude besluiten niet stilletjes aan.

Vorm: `D<n> – titel (datum, versie)` · **Besluit** · **Waarom** · **Niet gekozen**.

---

### D1 – Eén statische web-app op GitHub Pages, zonder server of build-stap (okt 2026, v1)
- **Besluit:** HTML, CSS en JS als losse bestanden, zonder framework of bundler. GitHub Pages host de app.
- **Waarom:** gratis, Geert kan zelf uploaden, en er is niets te onderhouden.
- **Niet gekozen:** Vercel. In een andere sessie overwogen om de app openbaar te maken, maar Geert blijft voorlopig bij GitHub Pages. Gevolg: functies die een server nodig hebben, staan onder "Bewust niet op de lijst" in de wishlist: meldingen als de app dicht is, en automatisch ophalen bij Bitvavo.

### D2 – Versleutelde synchronisatie via één bestand in een privé-GitHub-repository (okt 2026, v1)
- **Besluit:** alle gegevens in één JSON-bestand, versleuteld met AES-256-GCM. De sleutel komt via PBKDF2 (250.000 rondes) uit een wachtwoord dat alleen de gebruiker kent. Samenvoegen gebeurt per item: de nieuwste `mod` wint, en verwijderingen worden als grafsteen bewaard.
- **Waarom:** geen eigen server nodig; GitHub ziet alleen versleutelde data; de geschiedenis (commits) geeft gratis "eerdere versie terugzetten".
- **Aanvulling (3.7.4):** bij precies hetzelfde tijdstip wint verwijderen, anders kan iets verwijderds terugkomen.

### D3 – FIFO voor kostprijs en resultaat (okt 2026, v1)
- **Besluit:** verkopen boeken de oudste aankopen eerst af. Kosten tellen mee in de aankoopprijs.
- **Waarom:** sluit aan bij hoe brokers en de Belastingdienst meestal rekenen, en geeft resultaat per transactie.

### D4 – JavaScript in een apart `app.js` met strikte CSP (22 okt 2026, 1.0.11)
- **Besluit:** `script-src 'self'`, geen inline scripts of event handlers. Verbindingen alleen met de eigen site, CoinGecko en api.github.com.
- **Waarom:** het GitHub-token en het wachtwoord kunnen dan niet naar een andere server lekken, ook niet bij kwaadaardige code.
- **Gevolg:** nieuwe externe diensten moeten in de CSP-meta in `index.html` worden toegevoegd.

### D5 – Weergave in €, $ of ₿ alleen als weergave (23 okt 2026, 1.4.0)
- **Besluit:** gegevens blijven in euro. Bitcoin-weergave rekent elke transactie om tegen de bitcoinkoers van dat moment (`K(t)`). Rapporten, formulieren en calculators blijven in euro.
- **Waarom:** de administratie en belasting gaan in euro; de ₿-weergave laat zien of je beter deed dan bitcoin aanhouden.

### D6 – Meerdere portefeuilles als label in één dataset (23 okt 2026, 2.0.0)
- **Besluit:** een transactie, doel, plan of doelverdeling krijgt `pf`; geen `pf` betekent de hoofdportefeuille. Volglijst, prijsalerts en koersarchief zijn gedeeld. "Alles samen" is een weergave.
- **Waarom:** sync, back-up en geschiedenis blijven ongewijzigd, en oude gegevens hoeven niet omgezet te worden.
- **MAJOR:** alle apparaten moesten eerst bijgewerkt worden.

### D7 – Rapporten in tabbladen (23 okt 2026, 2.2.0 en 2.3.0)
- **Besluit:** Rendement (terugkijken), Analyse (vergelijken en scenario's), Plannen (vooruitkijken) en Administratie (controleren en bewaren). Hash-route `#rapporten/<tab>`; het laatste tabblad wordt onthouden.
- **Niet gekozen:** een extra knop in de onderbalk, want die is voor wat je dagelijks gebruikt.

### D8 – iOS-statusbalk: effen statusbalk plus 40 punten ruimte (23 okt–27 okt 2026, 3.0.0 en 3.8.2)
- **Besluit:** `apple-mobile-web-app-status-bar-style: default` (3.0.0), plus in de app op het beginscherm 40 punten extra ruimte bovenin (3.8.2, alleen bij `navigator.standalone`, niet in liggende stand op de iPhone).
- **Waarom:** iOS 26/27 vervaagt een strook onder de statusbalk die geen CSS kan weghalen. 14 punten (v78) was te weinig. De effen balk alleen hielp volgens Reddit, maar niet bij Geert.
- **Status:** nog niet bevestigd door Geert. Moet de waarde anders, pas dan alleen `--top-extra` aan.

### D9 – Versienummering `MAJOR.MINOR.PATCH`, met terugwerkende kracht (26 okt 2026, 3.5.2)
- **Besluit:** dezelfde regels als Geerts andere web-apps. v1–v89 zijn omgezet: v89 = 3.5.1, v70 = 2.0.0, v79 = 3.0.0. In de changelog staat "voorheen vNN".
- **Waarom:** het versienummer zegt dan of je iets moet doen.

### D10 – Updates direct binnen: netwerk eerst met `cache: 'no-cache'` (26 okt 2026, 3.3.2)
- **Besluit:** de service worker vraagt bij elk bestand de server of het veranderd is, en haalt bij installatie alles vers op (`cache: 'reload'`). Registratie gebeurt met `updateViaCache: 'none'`; controle elke 30 minuten en bij terugkeer.
- **Waarom:** GitHub Pages laat browsers 10 minuten cachen, waardoor de laptop op een oude versie bleef. Nagebootst in `tests/specs/update.spec.mjs`.

### D11 – Percentages in de grafiek = percentages in de tabel (26 okt 2026, 3.5.1 en 3.5.5)
- **Besluit:**
  - **% per munt** = (waarde − kostprijs van wat je nog hebt) / kostprijs, op elk moment, zoals de tabel Bezittingen. Bijkopen en verkopen tellen dus mee.
  - **% Totaal** = (waarde crypto − geïnvesteerd) / geïnvesteerd, zoals "Totaal ongerealiseerd".
  - Een munt telt pas vanaf het eerste bezit.
- **Waarom:** Geert wilde dat het laatste punt van de lijn klopt met het getal in de tabel.
- **Niet gekozen:** koersverandering sinds het begin van de periode (3.3.0) en tijdgewogen rendement (3.5.0). Beide verwarden.
- **Schaal:** 1U, 4U en 24U schalen op de lijn zelf, niet vanaf 0.

### D12 – CoinGecko-tempo met emmer en globale pauze (27 okt 2026, 3.8.1)
- **Besluit:** zonder sleutel 6 direct en daarna 15 per minuut, met Demo-sleutel 10 en daarna 30. Bij 429 pauzeert de hele wachtrij (standaard 15 s, want CoinGecko stelt `Retry-After` niet beschikbaar voor de browser). Achtergrondwerk heeft lage prioriteit. Grafieken worden langer gecachet.
- **Waarom:** de publieke limiet is ongeveer 5–15 per minuut; voorheen liep je met veel munten snel tegen "even druk" aan.
- **Afweging:** de eerste keer laden duurt langer (10–15 s zonder sleutel). Tests gebruiken `__cgFast`.

### D13 – Koppelcode zonder QR (27 okt 2026, 3.8.0)
- **Besluit:** de instellingen worden versleuteld met een willekeurige pincode van 8 tekens (zonder 0/O/1/I/L). De code wordt gekopieerd en geplakt; de pincode wordt overgetypt.
- **Waarom:** op iOS opent een gescande QR-code Safari en niet de app op het beginscherm, die zijn eigen opslag heeft.

### D14 – Tests in de repository met nep-CoinGecko en vaste klok (27 okt 2026, 3.7.4)
- **Besluit:** Playwright en axe-core in `tests/`, GitHub Actions bij elke push, telefoon en laptop. De datum staat vast op 26 okt 2026.
- **Waarom:** de tests zijn herhaalbaar, onafhankelijk van echte koersen en limieten, en werken voor elke volgende sessie of persoon.
- **Let op:** wachttijden in de app gebruiken `performance.now()` (monotoon), omdat de vaste testklok `Date.now()` bevriest.

### D15 – Indeling per schermbreedte (24–27 okt 2026, 3.1.0, 3.7.5 en 3.9.2)
- **Besluit:**
  - **< 700 px (telefoon):** één kolom.
  - **700–999 px (tablet):** telefoonopbouw, maar breder met kaarten in twee kolommen.
  - **1000–1399 px (kleine laptop):** zijbalk, de grafiek over de volle breedte en de kaarten eronder.
  - **≥ 1400 px (laptop):** twee kolommen. Op de munt-pagina links de grafiek met calculator en verkoopsimulator, rechts resultaat, marktinformatie en alerts.
- **Waarom:** steeds naar aanleiding van screenshots van Geert met te veel lege ruimte of te krappe blokken.
- **Aanvulling (3.10.3):** blokken naast elkaar op de munt-pagina zijn even hoog. Op de laptop eindigen beide kolommen gelijk: links rekken de hulpmiddelen mee, rechts het onderste blok (Prijsalerts).

### D16 – Documentatie voor volgende sessies (27 okt 2026)
- **Besluit:** `NOTES.md` (stand van zaken), `DECISIONS.md` (dit bestand) en `CLAUDE.md` (werkafspraken). Claude leest aan het begin van een sessie alleen deze bestanden en de relevante code, en werkt ze aan het eind bij.
- **Waarom:** de chatgeschiedenis is te lang om steeds te lezen.

### D17 – Code uit de GitHub-repository in plaats van een zip (27 okt 2026, 3.10.3)
- **Besluit:** Claude koppelt aan het begin van een sessie de openbare repository `Gertjun/Cryptotracker` en leest daaruit de code.
- **Waarom:** Geert hoeft niet elke sessie een zip te sturen, en de code is altijd de versie die hij heeft geüpload.
- **Niet gekozen:** de code in de projectkennis zetten; die loopt achter en kost bij elke chat ruimte.
- **Let op:** Claude kan alleen lezen, niet pushen. Geert uploadt de zip nog steeds zelf.

### D18 – Claude zet wijzigingen als voorstel op GitHub (28 okt 2026, vult D17 aan)
- **Besluit:** Claude heeft schrijfrechten op `Gertjun/Cryptotracker`. Wijzigingen gaan op een eigen branch (`claude/...`) met een pull request. Geert kijkt en drukt op "Merge"; pas dan staat het live.
- **Waarom:** geen zip downloaden en uploaden meer, en geen bestanden (zoals `.github`) die onderweg wegvallen. De tests draaien vanzelf bij elk voorstel.
- **Niet gekozen:** rechtstreeks op `main` pushen; dan staat een fout meteen in de app.

### D20 – Kolommen van Bezittingen instelbaar met ↑↓-knoppen, gesynchroniseerd (28 okt 2026, 3.11.0)
- **Besluit:** knop "Kolommen aanpassen" boven de tabel Bezittingen (alleen vanaf 1000 px; op telefoon en tablet is het een lijst). Een blad met per kolom een vinkje (tonen) en ↑↓-knoppen, plus "Standaard herstellen". Munt staat vast vooraan. Opgeslagen in `data.cfg.hcols`, dus gelijk op alle apparaten.
- **Waarom:** Geert wilde de volgorde zelf kunnen kiezen, en op alle apparaten hetzelfde.
- **Niet gekozen:** kolomkoppen versleepbaar maken. Slepen werkt slecht op een touchscreen en is niet met het toetsenbord te bedienen (WCAG 2.5.7). Ook niet in `settings`, want dat is per apparaat.
- **Let op:** `data.cfg` voegt als geheel samen; overschrijf het nooit zonder de bestaande velden mee te nemen (bij het opslaan van de CoinGecko-sleutel ging dat mis, opgelost in 3.11.0).
