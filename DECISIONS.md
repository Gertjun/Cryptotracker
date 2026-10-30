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

### D21 – Volglijst als tabel met dezelfde kolommen als Bezittingen (28 okt 2026, 3.12.0)
- **Besluit:** op de laptop toont de Volglijst dezelfde tabel als Bezittingen, met dezelfde kolomkeuze (D20). Aantal, Waarde, Geïnvesteerd, Winst/verlies en % staan op 0; Gem. prijs is "–" (er is geen aankoop). Openstaande prijsalerts staan klein onder de munt. De kolommen staan precies onder die van Bezittingen. Op de telefoon blijft de lijst.
- **Waarom:** Geert wilde dezelfde kolommen, zodat de twee tabellen als één overzicht lezen.
- **Niet gekozen:** sorteren via de kolomkoppen van de Volglijst (die sorteren Bezittingen, dat zou verwarren).

### D22 – Kolommen 1 uur, 4 uur en 1 jaar (28 okt 2026, 3.13.0)
- **Besluit:** 1 uur staat standaard aan; 4 uur en 1 jaar staan standaard uit en zet je aan via Kolommen aanpassen. 1 uur en 1 jaar komen gratis mee in de bestaande koersaanvraag. 4 uur wordt berekend uit de 24-uursgrafiek per munt (koers nu t.o.v. het punt het dichtst bij 4 uur geleden).
- **Waarom:** Geert wilde de korte en lange termijn zien, zonder dat de tabel standaard te vol wordt.
- **Afweging:** 4 uur kost één extra verzoek per munt per 5 minuten (lage prioriteit, CoinGecko-emmer uit D12), daarom alleen als de kolom aan staat. Lukt het ophalen niet, dan staat er "–" en wordt het pas na 5 minuten opnieuw geprobeerd.
- **Ook:** de ruimte tussen de kolommen van Bezittingen is iets kleiner (7 px), zodat alles op een laptop van 1440 px past.

### D23 – Ingevuld totaalbedrag is leidend bij opslaan (29 okt 2026, 3.13.1)
- **Besluit:** is het totaalbedrag één van de twee laatst ingevulde velden (van totaal/aantal/koers), dan bewaart `saveTx()` de koers onafgerond als (totaal ∓ kosten) / aantal. Het koersveld toont nog steeds een afgeronde koers.
- **Waarom:** de afgeronde koers (8 cijfers) gaf een bewaard totaal als 29,98999…, met een melding bij Controle en cash een paar cent negatief. Het bedrag van het afschrift moet op de cent kloppen.
- **Niet gekozen:** een apart totaalveld in de transactie bewaren; dan zou het gegevensmodel en de synchronisatie veranderen.

### D24 – Tabellen en grafieken passen op het scherm (29 okt 2026, 3.13.2, vervangt de schuifbalk uit D20/D21)
- **Besluit:** geen schuifbalk opzij. In tabellen staat de munt als ticker (BTC) met de naam als tooltip; de kolommen zijn iets compacter. Past een tabel daarna nog niet, dan verbergt `fitTables()` eerst de minst belangrijke kolommen (`data-p`, hoogste eerst) en zegt onder de tabel welke. Transacties: Broker · notitie, Kosten, Koers, Waarde nu, Aantal, %. Bezittingen: 1 jaar, 4 uur, 30 dagen, 1 uur, Gem. prijs, 7 dagen, Geïnvesteerd, Aantal, Koers, 24 uur, %. Datum, munt, type, totaal, waarde en winst/verlies blijven altijd. Op 1440 px past alles.
- **Waarom:** Geert wilde alles op het scherm zien zonder opzij te schuiven.
- **Niet gekozen:** een kleiner lettertype overal (minder leesbaar), of de zijbalk smaller maken op een kleine laptop (verandert de indeling uit D15). Het vergrote venster Rendement per dag of week schuift op een telefoon nog wel opzij: 90 dagen naast elkaar zijn daar niet leesbaar.

### D25 – Indeling: Analyse in plaats van Rapporten, en rustiger per schermformaat (29 okt 2026, 3.14.0, vult D7 en D15 aan)
- **Besluit:**
  - Het hoofdtabblad Rapporten heet **Analyse** (`#analyse/<tab>`). Het tabblad dat Analyse heette heet **Vergelijken**, zodat er geen "Analyse › Analyse" staat. Oude adressen (`#rapporten/…`) worden omgezet.
  - Drie hoofdtabbladen blijven: Overzicht, Transacties, Analyse. Plannen (als je doelen en vaste inleg vaak gebruikt) of Markt (volglijst, alerts) worden pas een eigen tabblad als ze groter worden.
  - Telefoon: filters en totalen bij Transacties achter de knop Filter; op de munt-pagina (ook tablet) de transacties vóór de rekenhulpen; tabbladen van Analyse onder 400 px in twee rijen.
  - Tablet: het blok met cijfers naast Cash staat ook daar (niet alleen op de laptop).
  - Vanaf 700 px: de regel onder de totale waarde is onzichtbaar en verschijnt bij het aanwijzen van de grafiek (de ruimte blijft gereserveerd, zodat de grafiek niet verspringt). Het blok naast de grafiek kreeg "Waarde crypto".
  - Laptop: op het Overzicht geen muntenlijst in de zijbalk; kolomkoppen van tabellen blijven bovenin staan.
- **Waarom:** Geert vroeg om de indeling na te lopen op laptop, iPad en iPhone; dubbele informatie weg en sneller bij de transacties.
- **Niet gekozen:** de regel onder de totale waarde helemaal weghalen (dan verdwijnt de uitsplitsing per moment bij het aanwijzen van de grafiek); de tabbladnamen inkorten ("Admin.").

### D26 – Zes thema's, per apparaat (29 okt 2026, 3.15.0)
- **Besluit:** Instellingen › Weergave heeft Automatisch plus zes thema's: drie donkere (Donker, Zwart, Nachtblauw) en drie lichte (Licht, Zacht, Hoog contrast). Bij Automatisch kies je per stand van het apparaat welk thema (`settings.themeD`, `settings.themeL`). Een thema is een set kleurvariabelen op `:root.th-<naam>`; lichte thema's krijgen ook `.light`, zodat alle bestaande regels voor licht blijven gelden.
- **Waarom:** Geert vroeg om meer thema's. Door alleen variabelen te wisselen blijft elke nieuwe kleur in de app vanzelf goed in alle thema's.
- **Per apparaat** (in `settings`, niet in `data.cfg`): Geert gaf geen voorkeur; zo kun je op de telefoon een ander thema hebben dan op de laptop, zoals voorheen.
- **Contrast:** elk thema haalt minstens 4,5:1 voor tekst; de axe-test draait voor alle thema's.
- **Niet gekozen:** een vrij kiesbare accentkleur (dan is het contrast niet te garanderen). De grafiekkleuren (`PAL`) zijn in alle thema's gelijk.

### D27 – Rendementskalender per dag, week, maand of jaar (29 okt 2026, 3.16.0)
- **Besluit:** dezelfde knoppen Dag/Week/Maand/Jaar als bij Rendement (`settings.calU`, per apparaat). Dag: een maand per keer (`settings.calMonth`). Week en Maand: een jaar per keer (`settings.calYear`); weken volgens de agenda (ISO, week 1 kan eind december beginnen), 7 per rij. Maand en Jaar: 4 per rij (`.cal-4`). Jaar: alle jaren, zonder bladeren. Per week/maand/jaar hele euro's vanaf € 10, zodat het in een vakje past.
- **Waarom:** Geert wilde dezelfde keuze als bij het blok Rendement.
- **Niet gekozen:** weken per maand tonen (dan maar 4–5 vakjes per keer).

### D28 – Volglijst sorteren via de kolomkoppen (30 okt 2026, 3.17.0, vervangt "Niet gekozen" in D21)
- **Besluit:** de Volglijst heeft een eigen sortering (`settings.wsort = {k, d}`, per apparaat), los van Bezittingen (`settings.sort`). Klik op een kolomkop: eerste klik hoog → laag, nog een klik laag → hoog (pijl ↓/↑, `aria-sort`). Munt sorteert eerst A → Z. Alleen kolommen met `ws:1` in `HCOLS` (Koers en de procentkolommen) zijn klikbaar; munten zonder waarde staan altijd onderaan. De lijst op de telefoon volgt dezelfde volgorde (`watchSorted()`).
- **Waarom:** Geert vroeg erom. Het bezwaar uit D21 (klikken op de Volglijst zou Bezittingen sorteren) geldt niet meer, omdat de sortering los staat.
- **Niet gekozen:** sorteren op Aantal, Waarde, Geïnvesteerd en resultaat (altijd 0 bij de Volglijst); het tweerichtingssorteren ook bij Bezittingen (niet gevraagd).

### D29 – Nieuwe wachtwoorden minimaal 12 tekens (30 okt 2026, 3.17.1)
- **Besluit:** een nieuw versleutelwachtwoord (GitHub) en een nieuw herstelwachtwoord (vergrendeling) hebben minimaal `PW_MIN` = 12 tekens, met een sterkte-indicator (`pwStrength`) en een oogje (`pwField`, `pwEye`). Een kort versleutelwachtwoord mag alleen als er op GitHub al een bestand staat (`saveSyncForm` controleert dat), want dan is het het bestaande wachtwoord.
- **Waarom:** het versleutelde bestand staat op GitHub; wie het heeft, kan onbeperkt wachtwoorden proberen. Voorheen was er voor het versleutelwachtwoord geen minimum.
- **Niet gekozen:** zwakke wachtwoorden weigeren boven de 12 tekens (de indicator is advies); bestaande korte wachtwoorden blokkeren (dan kun je een apparaat niet meer koppelen).

### D30 – Synchroniseren 20 seconden na een wijziging en direct bij verlaten (30 okt 2026, 3.17.1, vult D2 aan)
- **Besluit:** `scheduleSync()` wacht 20 s (was 1,5 s). `flushSync()` synchroniseert direct bij `visibilitychange` (verborgen) en `pagehide`. Daarnaast `navigator.storage.persist()` bij het starten.
- **Waarom:** elke synchronisatie is een commit met het hele bestand; tien wijzigingen gaven tien commits. Nu worden ze één.
- **Afweging:** een ander apparaat ziet een wijziging hooguit 20 s later, tenzij je de app verlaat.

### D31 – Tabbladen voegen elkaars wijzigingen samen (30 okt 2026, 3.18.0)
- **Besluit:** `otherTab()` luistert naar het `storage`-event. Slaat een ander tabblad gegevens op (`cpt.data`, of met vergrendeling `cpt.vault`, ontsleuteld met de eigen `DEK`), dan voegt dit tabblad ze samen met `merge()` en tekent opnieuw. Had dit tabblad iets extra, dan slaat het de samengevoegde stand op. Verandert `cpt.lock`, dan laadt het tabblad opnieuw.
- **Waarom:** elk tabblad hield een eigen kopie; het laatst opgeslagen tabblad won.
- **Niet gekozen:** het andere tabblad vergrendelen of alleen-lezen maken (onhandig op de laptop).

### D32 – Gegevensversie `DATA_V` (30 okt 2026, 3.19.0)
- **Besluit:** `data.v` = `DATA_V` (nu 1). Ziet de app gegevens met een hogere `v` (GitHub, ander tabblad of back-up), dan synchroniseert hij niet meer en toont hij bovenin "Vernieuw de app" (`showTooNew`, `tooNew`). `merge()` bewaart ook onbekende onderdelen van de gegevens.
- **Waarom:** een oudere app-versie liet bij het samenvoegen onderdelen weg die hij niet kende, en schreef dat terug naar GitHub.
- **Regel:** verhoog `DATA_V` als een nieuwe versie gegevens bewaart die een oudere versie niet goed kan samenvoegen (nieuwe lijst, andere betekenis van een veld). Een nieuw veld binnen een transactie of lijst-item hoeft dat niet: hele items blijven bewaard.

### D33 – Back-up via deelmenu, inhoud verbergen, Face ID na koppelen (30 okt 2026, 3.19.1)
- **Besluit:** `download()` gebruikt op een aanraakscherm het deelmenu (`navigator.share` met een bestand), anders een gewone download. Met vergrendeling aan krijgt `body` de klasse `.shield` zodra de app verborgen wordt (lege achtergrond voor de app-wisselaar). Na het koppelen met een koppelcode biedt de app de vergrendeling aan als passkeys werken.
- **Waarom:** downloads lopen vast in de app op het beginscherm van iOS; de app-wisselaar toonde bedragen.

### D34 – Bewust niet gedaan uit de review van 30 okt 2026
- **Verwijderd-markeringen opruimen:** niet doen. Het zijn korte id's (± 15 kB per 1.000), en opruimen kan verwijderde transacties terugbrengen via een apparaat dat lang offline was.
- **"1.250" lezen als duizend tweehonderdvijftig:** niet doen. `num()` leest "12,50" en "1.250,00" al goed; "1.250" zonder komma blijft 1,25, omdat je bij aantallen munten ook "0.125" typt.
- **Wachtrij voor opslaan:** al aanwezig (`vaultQ`); zonder vergrendeling is opslaan direct.
- **Knop "vorige versie herstellen":** al aanwezig sinds de functie Eerdere versie terugzetten (`openVersions`).

### D35 – Claude pusht rechtstreeks naar `main` (30 okt 2026, vervangt D18)
- **Besluit:** Claude zet een nieuwe versie direct op `main`, zonder branch en pull request. Eerst de tests lokaal (Playwright en html-validate); alleen als die groen zijn, wordt er gepusht. Geen zip meer.
- **Waarom:** Geert moest elke keer een voorstel mergen; dat is een extra stap zonder dat hij de code zelf beoordeelt.
- **Afweging:** een fout staat meteen live, omdat er geen controle meer vóór `main` is. Daarom de tests lokaal vóór elke push; de tests op GitHub draaien daarna nog eens. Misgegaan? Zet de vorige versie terug met een nieuwe versie (`git revert`).
- **Niet gekozen:** automatisch mergen zodra de tests op GitHub groen zijn (meer instellingen voor weinig winst).

### D36 – Deze app draait niet op de PWA-template (30 okt 2026, 3.19.1)
- **Besluit:** Crypto Portfolio blijft gebouwd zoals hij is: `app.js` en `index.html`, gegevens met `id`/`mod`, bedragen als gewone getallen in euro, eigen synchronisatie, tabbladen, gegevensversie en privacyscherm (D29–D33). De projectinstructies in claude.ai zijn hierop aangepast en zeggen dat expliciet; regels die alleen voor de template gelden (`js/core/`, `js/config.js`, `ctx.update`, centen, `createdAt`/`updatedAt`, `saveFile()`) gelden hier niet.
- **Waarom:** Geert had de projectinstructies vervangen door die van zijn PWA-template (zoals bij Vaste Lasten). Die beschrijven een andere opbouw; letterlijk volgen zou bestanden zoeken die niet bestaan, of de gegevens raken.
- **Niet gekozen:** de app ombouwen naar de template. Dan moeten alle gegevens worden omgezet (euro's naar centen, `mod` naar `updatedAt`) en alle apparaten tegelijk bijgewerkt (MAJOR, 4.0.0), met risico voor transacties en synchronisatie. Kan later alsnog, alleen in stappen en met een plan dat Geert eerst goedkeurt.

### D37 – Instellingen als eigen scherm, via het tandwiel (30 okt 2026, 3.20.0, vult D25 aan)
- **Besluit:** Instellingen is geen blad meer maar een scherm met route `#instellingen`, in kaarten: links Weergave, Portefeuilles, Beveiliging en Koersdata; rechts Synchronisatie, Importeren en back-up en Gevarenzone (twee kolommen vanaf 1000 px, daaronder één kolom). Het tandwiel bovenin opent het; er komt **geen** vierde tabblad in de onderbalk of zijbalk (D25 blijft: drie hoofdtabbladen). De terugknop gaat naar het scherm waar je vandaan kwam (`setFrom`). Vervolgstappen (koppelcode, wachtwoord, portefeuille) blijven bladen die terugkeren naar het scherm. De +knop is op dit scherm verborgen.
- **Waarom:** Geert vond het aparte scherm in Vaste Lasten overzichtelijker; het lange blad was veel scrollen en op de laptop te smal.
- **Let op:** het scherm wordt alleen opnieuw opgebouwd via `openSettings()` (of `lastView=null`); een gewone `render()` (bijv. na een koersupdate) laat het staan, anders verdwijnt wat je half hebt ingevuld.
- **Niet gekozen:** een vierde tabblad Instellingen (optie 1); Geert koos het tandwiel.
