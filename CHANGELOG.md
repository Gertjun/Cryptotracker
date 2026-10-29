# Changelog – Crypto Portfolio

Alle noemenswaardige wijzigingen aan de app. De nieuwste versie staat bovenaan.

**Versienummers** hebben de vorm `MAJOR.MINOR.PATCH`:
- **MAJOR** omhoog bij een wijziging waarbij je iets moet doen, zoals opnieuw koppelen of alle apparaten tegelijk bijwerken.
- **MINOR** omhoog bij een nieuwe functie.
- **PATCH** omhoog bij een kleine verbetering of foutoplossing.

Het versienummer staat in de app onder Instellingen en komt overeen met de cache-naam in `sw.js` (`crypto-portfolio-3.15.0`) en de naam van het zip-bestand (`crypto-tracker-3.15.0.zip`).
Tot en met v89 waren de versies gewoon doorgenummerd. Die zijn met terugwerkende kracht omgezet; het oude nummer staat er nog bij ("voorheen v89"), zodat je oude zip-bestanden terugvindt.

Nog niet ingebouwde functies staan in de [wishlist](WISHLIST.md). Komt een wens in een versie terecht, dan staat het wensnummer erbij, bijvoorbeeld "(wens W3)".

---

## 3.15.0 – 29 oktober 2026
Kies je eigen thema in Instellingen: naast Donker en Licht nu ook Zwart, Nachtblauw, Zacht en Hoog contrast.

### Toegevoegd
- **Vier nieuwe thema's** onder Instellingen › Weergave, elk met een klein kleurvoorbeeld op de knop:
  - **Zwart:** echt zwarte achtergrond; rustig 's avonds en zuinig voor de batterij van een iPhone.
  - **Nachtblauw:** donker, met een diepblauwe ondertoon.
  - **Zacht:** licht, met een warme crèmekleurige achtergrond, minder fel dan Licht.
  - **Hoog contrast:** zwarte tekst op wit, met duidelijke randen; handig buiten in de zon.
- **Automatisch met eigen keuze:** kies je Automatisch, dan kies je eronder welk thema hij gebruikt als je apparaat donker staat (Donker, Zwart of Nachtblauw) en als het licht staat (Licht, Zacht of Hoog contrast).

### Let op
- **Het thema geldt per apparaat**, net als voorheen. Zo kun je op de iPhone Zwart gebruiken en op de laptop Licht.

### Technisch
- **Tests:** de toegankelijkheidstest (contrast en meer) draait nu voor alle zes thema's, plus een test voor het kiezen van een thema.

## 3.14.0 – 29 oktober 2026
Rustigere indeling op telefoon, iPad en laptop, en Rapporten heet nu Analyse.

### Gewijzigd
- **Rapporten heet nu Analyse.** Het tabblad dat eerst Analyse heette (Wat als, Vergelijking, Risico, Vaste inleg vergeleken) heet nu **Vergelijken**. Oude links en bladwijzers naar Rapporten werken gewoon.

### Verbeterd
- **Transacties op de telefoon:** de filters (soort, munt, jaar, broker) en de zes totalen staan achter de knop **Filter**, naast het zoekveld. Zo zie je meteen je transacties. Eén regel toont het aantal en de gerealiseerde winst; op de knop staat hoeveel filters aan staan.
- **Munt-pagina op telefoon en tablet:** de transacties van de munt staan nu vóór de rekenhulpen (gemiddelde prijs, verkoop simuleren).
- **Tabbladen van Analyse op een smalle telefoon:** in twee rijen, zodat "Administratie" niet meer van het scherm valt.
- **Overzicht op de iPad:** naast Cash staat nu ook het blok met Waarde crypto, Geïnvesteerd, Ongerealiseerd, Laatste 24 uur, Gerealiseerd en Open posities, in plaats van een leeg vlak.
- **Overzicht op iPad en laptop:** de grijze regel onder de totale waarde (Crypto, Cash, Geïnvesteerd, Gerealiseerd) herhaalde de blokken ernaast. Hij verschijnt nu alleen als je de grafiek aanwijst, en toont dan de stand op dat moment. Het blok naast de grafiek heeft er de regel **Waarde crypto** bij.
- **Zijbalk op de laptop:** op het Overzicht staat de lijst met munten niet meer in de zijbalk, want de tabel Bezittingen staat ernaast. Op de andere schermen blijft de lijst staan.
- **Lange tabellen op de laptop:** de kolomkoppen blijven bovenin staan als je naar beneden scrolt (Transacties, Bezittingen, transacties op de munt-pagina).

### Technisch
- Hash-routes `#analyse/<tab>` met de tabbladen rendement, vergelijken, plannen en administratie; `fixOldHash()` zet `#rapporten/…` (en `analyse` → `vergelijken`) om.
- Nieuwe test `tests/specs/indeling.spec.mjs`.

## 3.13.2 – 29 oktober 2026
Tabellen en grafieken passen op het scherm, zonder schuifbalk opzij.

### Verbeterd
- **Ticker in plaats van naam:** de tabel Transacties toont de munt als ticker (BTC, ETH, …), net als Bezittingen. Ook in "Vaste inleg vergeleken" en bij Per broker / wallet. De volledige naam zie je als je de muis erop houdt.
- **Compactere tabellen:** iets minder ruimte tussen de kolommen. In de kolom Aantal (en bij de netwerkkosten van een overboeking) staat het muntsymbool niet meer achter het getal, want de munt staat al in de rij of bovenaan de pagina. Een lange notitie wordt afgekapt; de hele tekst zie je met de muis erop.
- **Past het nog niet, dan verdwijnen kolommen:** op een smaller laptopscherm verbergt de app eerst de minst belangrijke kolommen (bij Transacties: Broker · notitie, Kosten, Koers, …; bij Bezittingen bijv. 1 jaar, 4 uur, 30 dagen). Onder de tabel staat welke kolommen verborgen zijn. Datum, munt, totaal, waarde en winst/verlies blijven altijd staan. Op een laptop van 1440 px past alles.
- **Rapporten:** de tabellen Risico, Wat als, Vaste inleg en Per broker / wallet passen nu ook in de smalle kolommen op tablet en kleine laptop. Kolomkoppen mogen daarvoor over twee regels.
- **Vergroot venster Rendement:** de grafiek per dag, week en maand past op een laptop helemaal in beeld. Alleen op een telefoon schuif je bij veel dagen of weken nog opzij. In de tabel eronder staan de maanden op een telefoon verkort (okt 2026).

### Opgelost
- **Lange muntnaam bovenaan de munt-pagina** (bijv. Artificial Superintelligence Alliance) duwde op een kleine laptop de knoppen van het scherm; die naam wordt nu afgekapt.

### Technisch
- **`fitTables()`** vervangt `alignHoldTables()`: meet elke tabel en verbergt kolommen met `data-p` (hoogste eerst) tot hij past. Nieuwe test `tests/specs/fit.spec.mjs` controleert alle schermen op 768, 1024, 1280 en 1440 px en op de telefoon.

## 3.13.1 – 29 oktober 2026
Het ingevulde totaalbedrag blijft precies zoals je het invult.

### Opgelost
- **Totaal opnieuw berekend:** vulde je bij een aan- of verkoop het totaalbedrag, het aantal en de kosten in, dan rekende de app de koers uit en rondde die af. Daardoor werd het bewaarde totaal net iets anders (bijv. 29,989999… i.p.v. 29,99), met een melding bij Controle en een cash die een paar cent negatief kon staan. Nu bewaart de app de koers onafgerond, zodat het totaal op de cent gelijk is aan je afschrift.

### Let op
- **Al ingevoerde transacties** met deze melding herstel je door ze te openen, het totaalbedrag opnieuw in te typen en op te slaan.

## 3.13.0 – 28 oktober 2026
Nieuwe kolommen voor de koersverandering over 1 uur, 4 uur en 1 jaar.

### Toegevoegd
- **Kolom 1 uur** bij Bezittingen en Volglijst, standaard zichtbaar, naast 24 uur.
- **Kolommen 4 uur en 1 jaar:** standaard verborgen. Zet ze aan via **Kolommen aanpassen**. Je keuze geldt op al je apparaten.

### Verbeterd
- **Iets minder ruimte tussen de kolommen,** zodat ook met de extra kolommen alles zonder schuifbalk past.

### Let op
- **4 uur** geeft CoinGecko niet rechtstreeks; de app rekent hem uit de koersgrafiek van 24 uur. Staat de kolom aan, dan haalt de app die grafieken op de achtergrond op. Zonder Demo-sleutel kan het bij veel munten even duren voordat alle waarden er staan.

## 3.12.1 – 28 oktober 2026
Geen onnodige schuifbalk meer onder de tabel Bezittingen.

### Opgelost
- **Schuifbalk onder Bezittingen en Volglijst:** sinds 3.12.0 werd de tabel soms breder dan het scherm, terwijl er ruimte genoeg was. De kolommen passen nu weer in de beschikbare breedte en staan nog steeds precies onder elkaar. Alleen als het echt niet past (smal venster) kun je opzij schuiven.

## 3.12.0 – 28 oktober 2026
De Volglijst heeft op de laptop dezelfde kolommen als Bezittingen.

### Gewijzigd
- **Volglijst als tabel:** op de laptop staat de Volglijst nu in dezelfde tabel als Bezittingen, met dezelfde kolommen in dezelfde volgorde. Aantal, Waarde, Geïnvesteerd, Winst/verlies en % staan op 0, want je hebt de munt (nog) niet. Gem. prijs is leeg (–). Openstaande prijsalerts staan klein onder de munt.
- **Kolommen aanpassen** geldt voor beide tabellen, en de kolommen staan precies onder elkaar.
- Op de telefoon blijft de Volglijst een lijst.

## 3.11.0 – 28 oktober 2026
Je kiest zelf welke kolommen de tabel Bezittingen toont, en in welke volgorde.

### Toegevoegd
- **Kolommen aanpassen:** boven de tabel Bezittingen (laptop) staat de knop **Kolommen aanpassen**. Zet een kolom aan of uit met het vinkje en verplaats hem met ↑ en ↓ (bovenaan in de lijst = links in de tabel). Munt staat altijd vooraan. Met **Standaard herstellen** krijg je de oude indeling terug.
- **Op al je apparaten:** je keuze wordt bewaard bij je gegevens en synchroniseert mee.

### Opgelost
- **CoinGecko-sleutel opslaan** wiste geen andere gedeelde instellingen meer.

### Technisch
- Nieuwe test `tests/specs/columns.spec.mjs`.

## 3.10.7 – 28 oktober 2026
Alle lijngrafieken hebben nu een x-as.

### Verbeterd
- **x-as onder de grafieken:** de portfoliografiek (alle weergaven), de koersgrafiek van een munt en de grafiek bij Vergelijking (Rapporten › Analyse) tonen onderaan vijf tijdstippen. Bij 24 uur zijn dat tijden (13:00, 19:00, …), bij een week tot een paar maanden dagen (26 sep, 4 okt, …) en bij langere periodes maanden (dec 25, mrt 26, …).

## 3.10.6 – 28 oktober 2026
Er is een README voor de GitHub-pagina van de repository. De app zelf verandert niet.

### Toegevoegd
- **README.md:** voorpagina van de repository op GitHub, met wat de app doet, de link naar de app, installeren op het beginscherm, hoe je gegevens bewaard en versleuteld worden, koersen van CoinGecko en wat er in de repository staat.

## 3.10.5 – 28 oktober 2026
De koersgrafiek van een munt heeft nu een y-as.

### Verbeterd
- **Koersgrafiek op de munt-pagina:** rechts staan nu ronde koersen (bijvoorbeeld € 2.400, € 2.600, …) met dunne hulplijnen door de grafiek, net als bij de portfoliografiek. Werkt in €, $ en ₿.
- **Kleine koersen:** bij munten van minder dan een cent krijgen de getallen op de as genoeg decimalen (bijvoorbeeld € 0,0001 in plaats van € 0,00).

## 3.10.4 – 28 oktober 2026
20 nieuwe ideeën op de wishlist. De app zelf verandert niet.

### Toegevoegd
- **Wishlist W19–W38:** box 3-schatting, vergelijken met sparen en inflatie, daling vanaf de top, houdtijd, portefeuilles naast elkaar, marktsentiment, totale cryptomarkt, volglijst met resultaat sinds toevoegen, munten vergelijken, bewegingsalert, koop- en verkoopladder, slimme vaste inleg, aankopen in dollar of stablecoin, transactie herhalen, overzicht zelf indelen, importherinnering, notities per munt, uitlegknopjes en een deelbare afbeelding.
- **Nieuwe groepen in de wishlist:** Markt en Gemak.

## 3.10.3 – 27 oktober 2026
Blokken op de munt-pagina eindigen onderaan op dezelfde hoogte.

### Verbeterd
- **Munt-pagina op de laptop:** de calculator, de verkoopsimulator en de rechterkolom eindigen onderaan gelijk. Is de rechterkolom hoger, dan rekken de calculator en de simulator mee; is links hoger, dan rekt het blok Prijsalerts mee.
- **Munt-pagina op een kleine laptop:** blokken die naast elkaar staan (Marktinformatie en Prijsalerts, de calculator en de simulator) zijn even hoog.

## 3.10.2 – 27 oktober 2026
Kennis over de app gesplitst in vaste en actuele documentatie.

### Toegevoegd
- **`ARCHITECTUUR.md`:** de vaste kennis over de app, die zelden verandert: wat de app is, de bestanden, waar wat zit in `app.js`, de conventies, en nieuw een overzicht van de stijl. Daarin staan de kleuren voor donker en licht, de grafiekkleuren, het lettertype, de bouwstenen en de teksttoon.

### Gewijzigd
- **`NOTES.md`** bevat nu alleen de actuele stand: werkwijze, testen, open punten en sessielog.
- **`CLAUDE.md`:** Claude leest aan het begin ARCHITECTUUR, NOTES en DECISIONS, en werkt ARCHITECTUUR alleen bij als de opbouw verandert.

### Let op
- **Upload ook het nieuwe bestand `ARCHITECTUUR.md`.** De app zelf verandert niet.

## 3.10.1 – 27 oktober 2026
Documentatie voor wie verder werkt aan de app.

### Toegevoegd
- **`NOTES.md`:** de stand van zaken in één bestand:
  - wat de app is, welke bestanden er zijn en waar wat zit in `app.js`;
  - de afspraken (taal, toegankelijkheid, schermbreedtes, versienummers, changelog);
  - de werkwijze, hoe je test, de bekende problemen en open punten, en een kort sessielog.
- **`DECISIONS.md`:** een logboek van 16 belangrijke keuzes tot nu toe, telkens met wat er besloten is, waarom, en wat er niet gekozen is. Voorbeelden: synchroniseren via één versleuteld bestand, FIFO, hoe de percentages in de grafiek berekend worden, de oplossing voor de iOS-statusbalk en het tempo van CoinGecko.
- **`CLAUDE.md`:** werkafspraken voor Claude.
  - Aan het begin van een sessie alleen `NOTES.md`, `DECISIONS.md` en de relevante code lezen, niet de hele geschiedenis.
  - Aan het eind van elke sessie beide bestanden bijwerken, ook in het claude.ai-project.
- **Map `tools/`:**
  - `release.py` brengt een nieuwe versie uit: versienummer, cache-naam, changelog en zip.
  - `wish.py` haalt een ingebouwde wens van de wishlist.
  - Die stonden eerst alleen in de tijdelijke werkomgeving.

### Let op
- **Upload ook de nieuwe bestanden** `NOTES.md`, `DECISIONS.md` en `CLAUDE.md`, en de nieuwe map `tools/`.
- **De app zelf verandert niet.**

## 3.10.0 – 27 oktober 2026
Nieuwe functie: verkoopsimulator op de pagina van een munt (wens W2).

### Toegevoegd
- **Kaart "Verkoop simuleren"** op de pagina van een munt die je hebt, naast de gemiddelde-prijs-calculator. Er wordt niets opgeslagen.
- **Hoeveel je verkoopt** geef je op als percentage van je positie, als aantal of als bedrag dat je wilt ontvangen (na kosten).
  - Met de knoppen 25%, 50% en Alles gaat het snel.
  - Wissel je tussen percentage, aantal en bedrag, dan rekent de app dezelfde verkoop om.
- **Je ziet direct:**
  - hoeveel je verkoopt, de opbrengst, de kosten en wat je ontvangt;
  - je gerealiseerde resultaat, in euro en procent;
  - wat je daarna nog hebt, en je nieuwe gemiddelde aankoopprijs;
  - je cash daarna, als je cash bijhoudt;
  - onder "Afgeboekte aankopen" welke aankopen via FIFO worden afgeboekt (oudste eerst), met het resultaat per aankoop.
- **Koers en kosten:** de koers staat standaard op de huidige koers en is aan te passen. De kosten staan op je gemiddelde kostenpercentage bij aankopen.
- **"Als verkoop invoeren"** opent het verkoopformulier, al ingevuld.
- **Te veel ingevuld:** dan zegt de app hoeveel je maximaal hebt en wat dat oplevert.

### Gewijzigd
- **Brede schermen:** de prijsalerts staan nu rechts onder de marktinformatie, zodat links onder de grafiek de calculator en de verkoopsimulator naast elkaar staan en beide kolommen ongeveer even lang zijn.

### Opgelost
- **Laptops van 1000 tot 1400 pixels breed:** in 3.9.2 lag de koersgrafiek op de munt-pagina over de kaarten eronder, waardoor je daar niet kon klikken. Nu staat alles weer netjes onder elkaar.

### Technisch
- **Nieuwe test:** de testset controleert de verkoopsimulator.

## 3.9.2 – 27 oktober 2026
Munt-pagina op brede schermen zonder groot leeg vlak.

### Gewijzigd
- **Indeling van de munt-pagina (vanaf 1400 pixels breed):**
  - **Links onder de grafiek** staan nu de hulpmiddelen: de gemiddelde-prijs-calculator en de prijsalerts, naast elkaar.
  - **Rechts** staat wat je bekijkt: je resultaat, de cijfers en de marktinformatie.
  - Voorheen stond alles rechts onder elkaar en bleef links onder de grafiek een groot vlak leeg.
- **Telefoon, tablet en laptops tot 1400 pixels:** alles staat zoals eerder onder elkaar. De marktinformatie staat nu vóór de calculator, zodat eerst komt wat je bekijkt en daarna de hulpmiddelen.

## 3.9.1 – 27 oktober 2026
Portfoliografiek met het toetsenbord te bedienen.

### Toegevoegd
- **Met Tab naar de grafiek:** de grafiek op het Overzicht en in het vergrote venster is nu met Tab te bereiken, met een duidelijke focusrand.
  - **← / →** (of ↓ / ↑): één punt terug of verder in de tijd.
  - **Shift + pijltje** of **PageUp / PageDown**: een tiende van de periode verder.
  - **Home / End**: begin of eind van de periode.
  - **Esc**: terug naar nu. In het vergrote venster sluit een tweede Esc het venster.
- **Net als met de muis** zie je bovenaan de waarde en het resultaat op dat moment, bij de weergaven per munt ook in de legenda. Kom je op een aan- of verkoopmoment, dan verschijnt het venstertje met de gegevens.
- **Schermlezers:** de grafiek werkt als schuifregelaar. Bij elke stap wordt datum, tijd, totale waarde en de waarde per munt voorgelezen, en of er op dat moment een aan- of verkoop was.

### Technisch
- **Nieuwe test:** de testset controleert de toetsenbordbediening (`tests/specs/a11y.spec.mjs`).

## 3.9.0 – 27 oktober 2026
Verkopen in de portfoliografiek.

### Toegevoegd
- **Verkoopstippen:** naast de aankopen staan nu ook verkopen als stip op de lijn, in alle vier de weergaven.
  - Een **open stip** is een aankoop, een **dichte stip** een verkoop.
  - Bij de weergaven per munt hebben ze de kleur van die munt; bij het totaal zijn ze blauw.
- **Venstertje bij een verkoop:** ga je over de stip of tik je erop, dan zie je het aantal, de koers, wat je ontving, de kosten en de broker. Ook je **gerealiseerde resultaat** op die verkoop staat erbij, in euro en procent, berekend met FIFO zoals in de transactielijst.
- **Volledig verkochte munt:** de stip staat op het laatste punt van de lijn van die munt.
- **Uitleg** over open en dichte stippen staat in het vergrote venster.

## 3.8.2 – 27 oktober 2026
iPhone- en iPad-app: de bovenbalk staat onder de vervaagde strook.

### Opgelost
- **Vage bovenkant in de app op het beginscherm** (sinds 3.0.0 bekend). iOS 26/27 vervaagt bij apps op het beginscherm een strook van zo'n 35–40 punten onder de statusbalk, en daar kan de app zelf niets aan doen. Daarom begint de app daar nu 40 punten lager, zodat de knoppen en de statusregels er net onder staan.
  - **Geldt alleen** voor de app op het beginscherm van een iPhone of iPad. In Safari, op de laptop en op Android verandert er niets.
  - **iPhone in liggende stand:** geen extra ruimte, want dan is er geen statusbalk.
  - **Schuift mee:** het vergrote grafiekvenster en de melding over een nieuwe versie.
- **Opmerking:** 2.5.1 (v78) gaf 14 punten extra en dat was te weinig. 40 punten is de diepte die andere ontwikkelaars voor deze vervaging hebben gemeten. De effen statusbalk uit 3.0.0 blijft.

## 3.8.1 – 27 oktober 2026
Zuiniger met CoinGecko: minder kans op "CoinGecko is even druk".

### Verbeterd
- **Tempo van de verzoeken:** alle verzoeken aan CoinGecko houden zich nu aan het tempo dat CoinGecko toestaat.
  - Zonder eigen sleutel gaan er 6 direct en daarna 15 per minuut.
  - Met een gratis Demo-sleutel gaan er 10 direct en daarna 30 per minuut.
  - Voorheen gingen ze zo snel mogelijk na elkaar, waardoor je met veel munten sneller tegen de limiet aanliep.
- **Bij "te veel verzoeken":** wacht de hele app even en gaat daarna verder. Voorheen probeerde elk verzoek het los opnieuw, wat de drukte alleen maar vergrootte.
- **Voorrang voor wat je ziet:** de koersen en de grafiek op het scherm gaan voor. Het aanvullen van het koersarchief en de jaarkoersen voor het risico-overzicht wachten tot er niets anders openstaat.
- **Geen dubbel werk:** is dezelfde grafiek op twee plekken tegelijk nodig, bijvoorbeeld op het Overzicht en in Analyse, dan wordt hij maar één keer opgehaald.
- **Grafieken blijven langer bewaard** voordat ze opnieuw worden opgehaald:

  | Periode | Was | Nu |
  |---|---|---|
  | 1 week | 15 minuten | 30 minuten |
  | 1 maand | 1 uur | 3 uur |
  | 3 maanden en langer | 6 uur | 12 uur |

  De 24-uursgrafiek (ook 1U en 4U) blijft elke 5 minuten vernieuwd.

### Technisch
- **Wachttijden:** die worden gemeten met een monotone klok, zodat ze kloppen als de systeemtijd verspringt.
- **Nieuwe test:** de testset controleert het tempo (`tests/specs/coingecko.spec.mjs`). Tijdens de tests geldt geen wachttijd, omdat de nep-CoinGecko geen limiet heeft.

## 3.8.0 – 27 oktober 2026
Nieuwe functie: een ander apparaat koppelen met een koppelcode.

### Toegevoegd
- **Ander apparaat koppelen** (Instellingen › Synchronisatie via GitHub): de app maakt een koppelcode met daarin je repository, token, bestand, branch, versleutelwachtwoord en CoinGecko-sleutel. Met **Kopiëren** zet je hem op het klembord, zodat je hem via AirDrop, Notities of een bericht naar je andere apparaat stuurt.
- **Pincode:** de code is versleuteld met een willekeurige pincode van 8 tekens, bijvoorbeeld "VJHR-MSQV". Die zie je alleen op dat scherm en typ je op het andere apparaat over.
  - Zonder pincode is de code onbruikbaar.
  - Verwarrende tekens zoals 0/O en 1/I/L komen er niet in voor, en hoofd- of kleine letters maken niet uit.
- **Koppelcode invoeren:** op het nieuwe apparaat staat dit onder Instellingen › Synchronisatie, en op een leeg Overzicht als knop "Al in gebruik op een ander apparaat?". Plak de code en typ de pincode; de app vult alles in en haalt direct je gegevens op.
  - Bij een verkeerde pincode of een half gekopieerde code krijg je een duidelijke melding bij het veld.
- **Handig na herinstallatie:** je hoeft je token en wachtwoord niet meer over te typen, bijvoorbeeld na het opnieuw installeren van de app op je iPhone of op een nieuwe telefoon.

### Technisch
- **Versleuteling:** AES-256-GCM met PBKDF2 (250.000 rondes), dezelfde als voor je gegevens op GitHub.
- **Geen QR-code:** op de iPhone opent een gescande QR-code altijd Safari, en niet de app op het beginscherm, die zijn gegevens apart bewaart. Kopiëren en plakken werkt wel overal.
- **Test:** de automatische synchronisatietest koppelt nu ook een nieuw apparaat met code en pincode.

## 3.7.5 – 27 oktober 2026
Betere indeling op kleinere laptopschermen.

### Gewijzigd
- **Laptops van 1000 tot 1400 pixels breed:**
  - **Overzicht:** de grafiek gebruikt nu de volle breedte. De kaarten die rechts stonden (verdeling, cash, doelen, overzicht) staan eronder in twee kolommen. Voorheen was het grafiekblok daar maar zo'n 580 pixels breed, en kwamen het bedrag en de knoppen op elkaar te staan.
  - **Munt-pagina:** dezelfde indeling. Grafiek en resultaat over de volle breedte, de calculator, marktinformatie en prijsalerts in twee kolommen eronder.
  - **Knoppen:** de knoppen "€ Totaal · % Totaal · …" en "Vergroten" staan daardoor ook op die schermen weer rechtsboven naast het bedrag.
- **Niets veranderd:** vanaf 1400 pixels, en op telefoon en tablet.

## 3.7.4 – 27 oktober 2026
Automatische tests in de repository.

### Toegevoegd
- **Map `tests/`** met automatische tests. Bij elke versie heb ik al deze controles gedaan; nu staan ze vast in de repository. Ze controleren:
  - **Schermen:** alle schermen openen zonder fouten of CSP-blokkades.
  - **Toegankelijkheid:** WCAG 2.2 AA, in licht en donker.
  - **Berekeningen:** cash, inleg en gerealiseerde winst, en dat grafiek en tabel hetzelfde percentage tonen.
  - **Synchronisatie:** versleutelde synchronisatie tussen twee apparaten.
  - **Updates:** een nieuwe versie komt direct binnen.
  - **HTML:** de HTML voldoet aan de standaard.
- **Twee schermformaten:** alles draait op telefoon en laptop, met nep-koersen en een vaste datum, zodat de uitkomst elke keer gelijk is.
- **GitHub Actions (`.github/workflows/tests.yml`):** bij elke upload naar GitHub draaien de tests vanzelf. Je ziet een groen vinkje of een rood kruisje bij de commit, en bij een fout een downloadbaar rapport.
- **Uitleg:** in `tests/README.md` staat wat er getest wordt en hoe je de tests zelf draait.

### Opgelost
- **Synchronisatie:** werd iets op twee apparaten op precies hetzelfde moment gewijzigd en verwijderd, dan kon het verwijderde terugkomen. Bij een gelijk tijdstip wint verwijderen nu. De nieuwe synchronisatietest vond dit.

### Let op
- **Upload ook de nieuwe map `tests/` en de map `.github/`.** Die laatste is een verborgen map: kies bij het uploaden op GitHub de hele inhoud van de zip, of sleep de map `.github` er apart in.
- **De app zelf verandert niet** door de tests.

## 3.7.3 – 27 oktober 2026
Netjes afgeronde getallen in een al ingevuld transactieformulier.

### Opgelost
- **Aantal:** als de app het aantal voor je uitrekent, staat het nu op hoogstens 8 decimalen, zoals brokers aantallen tonen. Voorheen kon er bijvoorbeeld 0,00145013481440358 staan.
  - Dat gebeurt als je op "Koop" of "Verkoop" tikt bij de doelverdeling of de gemiddelde-prijs-calculator, bij vaste inleg, of als je zelf bedrag en koers invult.
- **Bedrag:** een voor je ingevuld bedrag staat altijd met twee decimalen, bijvoorbeeld "112,10" in plaats van "112,1".
- **Berekende koers:** die staat op 8 significante cijfers.

## 3.7.2 – 26 oktober 2026
Vergroot grafiekvenster gebruikt het hele scherm.

### Opgelost
- **Ongebruikte ruimte:** het vergrote venster van de portfoliografiek ("Vergroten") was maximaal 1200 pixels breed en de grafiek maximaal 520 pixels hoog. Op een groot laptopscherm bleef daardoor veel ruimte leeg.
- **Nieuwe afmetingen:**
  - De breedte loopt nu tot aan de randen van het scherm.
  - De grafiek is zo hoog als er ruimte overblijft onder de knoppen en boven de uitleg, zonder dat je hoeft te scrollen.
  - Op 1864 × 944 pixels: grafiek 1764 pixels breed in plaats van 1200, en 544 pixels hoog in plaats van 520. Op een telefoon en een iPad past alles ook zonder te scrollen.
- **Aankoopstippen in het vergrote venster:** die stonden net onder de lijn, omdat de tijdas onder de grafiek werd meegerekend. Ze staan nu precies op de lijn.

## 3.7.1 – 26 oktober 2026
Elk blad heeft een sluitknop.

### Opgelost
- **Instellingen niet te sluiten op de iPhone:** een blad sloot alleen als je erbuiten tikte. Bij een lang blad zoals Instellingen bleef daar op de iPhone bijna geen ruimte over, waardoor je het niet meer dicht kreeg.
- **Sluitknop (✕) rechtsboven:** alle bladen hebben die nu, ook Instellingen, het transactieformulier en de import. De knop blijft in beeld als je naar beneden scrolt.
- **Andere manieren om te sluiten:** buiten het blad tikken en Esc op de laptop werken nog steeds.
- **Focus na sluiten:** die gaat terug naar de knop waarmee je het blad opende.

## 3.7.0 – 26 oktober 2026
Versienummer naast de appnaam, met een knop als er een update klaarstaat.

### Toegevoegd
- **Versienummer in de zijbalk:** op de laptop staat het versienummer nu in het grijs onder de naam "Crypto Portfolio", bijvoorbeeld "v3.7.0".
- **Knop bij een nieuwe versie:** staat er een nieuwe versie klaar, dan verandert het versienummer in de blauwe knop **"update beschikbaar"**. Klik erop en de app laadt de nieuwe versie.
  - De app kijkt elke 30 minuten, en telkens als je naar de app terugkeert, of er een nieuwe versie is.
- **Telefoon en tablet:** daar is geen zijbalk, dus daar blijft de melding "Nieuwe versie beschikbaar · Vernieuwen" bovenin verschijnen. Op de laptop komt die melding niet meer, want de knop naast de naam is genoeg.

## 3.6.0 – 26 oktober 2026
Aankoopmomenten in de portfoliografiek.

### Toegevoegd
- **Stip per aankoop:** in alle vier de weergaven van de portfoliografiek (€ Totaal, % Totaal, € per munt, % per munt) staat bij elke aankoop een kleine stip op de lijn.
  - **€ Totaal en % Totaal:** de stip staat op de totaallijn.
  - **Per munt:** de stip staat op de lijn van die munt, in dezelfde kleur. Kleinere munten die onder "Overig" vallen, krijgen bij "€ per munt" een stip op de Overig-lijn.
  - De stip staat precies op het moment van aankoop, en de lijn loopt er gewoon doorheen.
- **Venstertje met de aankoop:** ga je met de muis over een stip, of tik je erop, dan zie je datum en tijd, het aantal, de koers, het bedrag, de kosten en de broker. Aankopen op hetzelfde moment staan samen in één venster.
  - Het venster blijft altijd binnen het grafiekblok. Op een smal scherm loopt de tekst door op een volgende regel.
- **Ook in het vergrote venster.**

### Technisch
- **Precies op de lijn:** de tijdstippen van je transacties zijn nu ook punten in de grafiek. Daardoor staat een stip precies op de lijn en zie je een sprong door een aankoop op het juiste moment.

## 3.5.5 – 26 oktober 2026
"% per munt" volgt nu hetzelfde percentage als de tabel Bezittingen.

### Gewijzigd
- **Wat de lijn laat zien:** bij "% per munt" toont elke lijn nu op elk moment je resultaat op die munt: de waarde ten opzichte van wat je voor je huidige bezit betaalde (FIFO, met kosten). Voorheen was het de koersverandering sinds het begin van de periode of sinds je aankoop.
  - **Bijkopen en verkopen tellen mee.** Koop je bij, dan verschuift je gemiddelde aankoopprijs en dus ook het percentage. Dat zie je nu in de lijn.
  - **Het laatste punt is gelijk aan het percentage in de tabel Bezittingen**, ook in de legenda. Gecontroleerd voor 1U, 1W en Max.
  - **Zolang je een munt niet had, staat er geen lijn.**
  - **Lijnen beginnen niet meer op 0%:** ze staan op je resultaat van dat moment. Een munt die je al lang hebt, begint bij 1W dus bijvoorbeeld op +20%.
- **Uitleg** in het vergrote venster en de tekst voor schermlezers zijn aangepast.

## 3.5.4 – 26 oktober 2026
"% per munt" telt een munt pas vanaf het moment dat je hem kocht.

### Gewijzigd
- **Start van de lijn:** bij "% per munt" begint de lijn van een munt die je binnen de gekozen periode kocht nu op 0% op het moment van je aankoop. Voorheen begon hij aan het begin van de periode, en telde een stijging of daling van vóór je aankoop dus mee.
  - Voorbeeld: kocht je een munt halverwege de week, dan zie je bij 1W alleen hoe hij het sindsdien deed. Een koerspiek en daling van daarvoor tellen niet meer mee.
  - Had je de munt al aan het begin van de periode, dan verandert er niets.
  - Zolang je een munt niet had, bijvoorbeeld na een volledige verkoop, staat er geen lijn.
- **Startpunt van 0%:** dat is de marktkoers op het moment van aankoop, net als voor de rest van de lijn.
- **Uitleg in het vergrote venster** aangepast.

## 3.5.3 – 26 oktober 2026
"% Totaal": de lijn kleurt mee met plus en min.

### Gewijzigd
- **Kleur van de lijn:** bij "% Totaal" is de lijn nu groen waar hij boven 0% ligt en rood waar hij eronder ligt. Voorheen had de hele lijn één kleur, naar je huidige stand.
- **Kantelpunt:** de kleur wisselt precies op de 0%-lijn, zodat je ziet wanneer je portfolio in de plus of in de min stond.
- **Waar het geldt:** op het Overzicht en in het vergrote venster.

## 3.5.2 – 26 oktober 2026
Nieuwe versienummering: `MAJOR.MINOR.PATCH`.

### Gewijzigd
- **Versienummer:** onder Instellingen staat het nu als bijvoorbeeld "versie 3.5.2". De cache-naam in `sw.js` en de naam van het zip-bestand volgen hetzelfde nummer.
  - **MAJOR:** je moet iets doen, zoals opnieuw koppelen of alle apparaten tegelijk bijwerken.
  - **MINOR:** een nieuwe functie.
  - **PATCH:** een kleine verbetering of foutoplossing.
- **Met terugwerkende kracht omgezet:**
  - v1–v33 samen zijn 1.0.0.
  - De testronde en de HTML-controle (v34–v65) zijn 1.0.1 t/m 1.0.32.
  - De eerste nieuwe functie, vaste inleg (v66), is 1.1.0.
  - **2.0.0 (v70):** meerdere portefeuilles. Alle apparaten moesten eerst worden bijgewerkt.
  - **3.0.0 (v79):** de app moest opnieuw op het beginscherm worden gezet.
- **Verwijzingen in de changelog:** alle verwijzingen naar oude versies zijn omgezet. Bij elke versie staat het oude nummer erbij, bijvoorbeeld "voorheen v89".

## 3.5.1 – 26 oktober 2026 · voorheen v89
"% Totaal" toont nu je resultaat ten opzichte van wat je op dat moment had geïnvesteerd.

### Gewijzigd
- **Nieuwe rekenwijze voor % Totaal:** de grafiek begon in 3.5.0 steeds op 0%, omdat hij het rendement sinds het begin van de periode toonde. Nu laat de lijn op elk moment zien hoeveel je crypto waard was ten opzichte van wat je er op dat moment in had geïnvesteerd: (waarde crypto − geïnvesteerd) / geïnvesteerd.
  - Het laatste punt is gelijk aan het percentage bij "Totaal ongerealiseerd" bovenaan.
  - Boven 0% sta je in de plus, eronder in de min. De lijn is groen of rood naar je huidige stand.
- **Korte periodes:** bij 1U, 4U en 24U loopt de schaal alleen over de lijn zelf, met percentages in twee decimalen, zodat je kleine bewegingen ziet. Vanaf 1W staat 0% altijd in beeld.
- **Rendement onder de grafiek:** daar staat weer alleen het eurobedrag over de periode. Het percentage zou daar verwarrend zijn, omdat de lijn nu iets anders laat zien.

## 3.5.0 – 26 oktober 2026 · voorheen v88
Portfoliografiek: vierde weergave "% Totaal".

### Toegevoegd
- **Vier standen:** de schakelaar heeft nu **€ Totaal · % Totaal · € per munt · % per munt**.
- **% Totaal:** één lijn met het rendement van je hele portfolio sinds het begin van de gekozen periode, in procenten.
  - **Rekenwijze (tijdgewogen rendement):** stortingen, opnames, aankopen en verkopen tellen niet als winst of verlies, alleen hoe je bezit in waarde veranderde. Een storting van € 100 geeft dus geen sprong in de lijn.
  - De lijn is groen als de periode in de plus eindigt en rood als hij in de min eindigt. De 0%-lijn is iets duidelijker getekend.
  - Onder de grafiek staat het rendement in euro én in procent, bijvoorbeeld "Rendement deze maand: +€ 177,59 (+11,3%)".
  - Met muis of vinger zie je het percentage op elk moment.

### Gewijzigd
- **Naam van de stand:** "Totaal" heet nu "€ Totaal".
- **Kleine schermen:** op telefoons zijn de knoppen van de schakelaar iets compacter, zodat ze alle vier passen, ook op een scherm van 320 pixels breed. "Vergroten" staat daar zo nodig op de regel eronder.

## 3.4.2 – 26 oktober 2026 · voorheen v87
Valutaknop: pijltje in plaats van stippellijn.

### Gewijzigd
- **Herkenning van de valutaknop** bij de totale waarde: de stippellijn onder het €-, $- of ₿-teken is weg. Ernaast staat nu een klein grijs pijltje: "€ ▾ 1.812,12".
  - Dat is hetzelfde teken als bij de knop "Portefeuille … ▾", dus je herkent het als iets dat een keuze opent.
  - Op de laptop krijgt de knop een lichte achtergrond als je er met de muis overheen gaat.
- **Schermlezer:** het pijltje wordt niet voorgelezen; de knop heet nog steeds "Valuta: Euro. Wijzigen".

## 3.4.1 – 26 oktober 2026 · voorheen v86
Valutamenu opent weer bij het valutateken.

### Opgelost
- **Menu linksboven in het scherm:** soms opende het valutamenu linksboven in het scherm in plaats van onder het €-teken. Dat gebeurde nadat je met de muis of vinger over de grafiek was gegaan.
- **Oorzaak:** tijdens het bewegen over de grafiek tekent de app de totale waarde, inclusief de valutaknop, opnieuw. Het menu onthield nog de oude knop, die niet meer op het scherm stond, en kon daardoor zijn plek niet bepalen.
- **Oplossing:** het menu zoekt de knop nu pas op op het moment dat het opent. Getest door eerst over de grafiek te bewegen: met 3.4.0 opende het menu linksboven, met 3.4.1 direct onder het €-teken.

## 3.4.0 – 26 oktober 2026 · voorheen v85
Valuta wisselen vanaf het Overzicht.

### Toegevoegd
- **Valutateken is een knop:** het teken bij de totale waarde op het Overzicht (€, $ of ₿) is nu een knop, herkenbaar aan de stippellijn eronder.
  - Tik of klik erop en er opent een klein menu met Euro €, Dollar $ en Bitcoin ₿. De huidige keuze staat aangevinkt.
  - Kies je een andere valuta, dan werkt de app direct bij, net als bij de keuze onder Instellingen › Weergave. Beide plekken blijven gelijk.
- **Bediening:**
  - Het menu sluit met Esc, met een tik ernaast of na je keuze.
  - Met het toetsenbord gaat de focus naar de huidige keuze en daarna terug naar het valutateken.
  - Een schermlezer leest "Valuta: Euro. Wijzigen".
- **Bedragen verbergen:** met het oogje wordt het bedrag vervaagd, maar het valutateken blijft zichtbaar en bruikbaar.

### Technisch
- **Menu:** het menu gebruikt de ingebouwde Popover API van de browser.
- **Oudere browsers:** browsers zonder die API (bijvoorbeeld iOS ouder dan 17) wisselen bij elke tik naar de volgende valuta.

## 3.3.2 – 26 oktober 2026 · voorheen v84
Updates komen nu direct binnen, ook op een laptop die al eerder de app had geladen.

### Opgelost
- **Laptop bleef op een oude versie hangen**, ook na verversen of de browser opnieuw starten. De oorzaak: GitHub Pages laat browsers bestanden 10 minuten bewaren. Daardoor kon de app op twee plekken een oude app.js krijgen:
  - bij het ophalen van de pagina, want de app vraagt eerst het netwerk, maar de browser antwoordde uit zijn eigen cache;
  - bij het installeren van een nieuwe versie, want de nieuwe versie sloeg dan het oude app.js op.
- **Oplossing:**
  - De app vraagt bij het laden nu altijd aan GitHub of een bestand veranderd is. Is er niets veranderd, dan is dat een heel klein verzoek zonder de inhoud opnieuw te downloaden.
  - Een nieuwe versie haalt bij het installeren alle bestanden vers op.
- **Nagebootst en getest:** een server die net als GitHub Pages 10 minuten cache meegeeft. Met 3.3.1 bleef de oude app.js staan, met 3.3.2 komt de nieuwe direct binnen.

### Technisch
- **Bestaande controle:** de app keek al elke 30 minuten, en telkens als hij weer op de voorgrond komt, of er een nieuwe versie is. Daarvoor negeert de browser nu ook zijn cache voor `sw.js` (`updateViaCache: 'none'`).
- **Laatste keer met vertraging:** een apparaat dat nog op 3.3.1 of ouder staat, krijgt 3.3.2 nog met die vertraging van maximaal ongeveer 10 minuten. Vanaf 3.3.2 gaat het direct.

## 3.3.1 – 26 oktober 2026 · voorheen v83
Weergaveschakelaar en Vergroten staan nu rechtsboven in het grafiekblok.

### Gewijzigd
- **Nieuwe plek:** de schakelaar "Totaal · € per munt · % per munt" en de knop "Vergroten" stonden onder de grafiek. Ze staan nu bovenaan, rechts.
  - **Laptop:** rechtsboven in het grafiekblok, naast de totale waarde, als het blok daar breed genoeg voor is. Bij een smaller laptopscherm staan ze rechts direct boven de grafiek.
  - **Telefoon en tablet:** rechts direct boven de grafiek.
- **Onder de grafiek** staat nu alleen nog het rendement over de gekozen periode.
- **Direct zichtbaar:** de knoppen staan er meteen en niet pas nadat de grafiek geladen is.

### Technisch
- **Plaatsing:** een container query bepaalt of de knoppen rechtsboven passen, zodat ze nooit over de totale waarde heen vallen.

## 3.3.0 – 26 oktober 2026 · voorheen v82
Portfoliografiek: extra weergave "% per munt".

### Toegevoegd
- **Derde stand in de schakelaar:** de schakelaar heet nu **Totaal · € per munt · % per munt**.
- **% per munt:** per munt een lijn met hoeveel de koers sinds het begin van de gekozen periode is gestegen of gedaald.
  - Alle lijnen beginnen op 0%, dus je ziet direct welke munt het in die periode het best en het slechtst deed. Dat werkt ook bij korte periodes als 1U en 24U, waar "€ per munt" vlak blijft.
  - Het gaat om de koers zelf, los van wat je kocht of verkocht. Een munt die je halverwege de periode kocht, staat er dus vanaf het begin van de periode in.
  - De 0%-lijn is iets duidelijker getekend en de y-as toont percentages.
  - De legenda toont het percentage per munt in groen of rood, nu of op het moment waar je muis of vinger staat.
  - Je zes grootste munten krijgen een lijn. Cash en "Overig" staan niet in deze weergave.
- **In bitcoin-weergave:** de percentages zijn ten opzichte van bitcoin.

### Gewijzigd
- **Naam van de stand:** "Per munt" heet nu "€ per munt".

## 3.2.0 – 26 oktober 2026 · voorheen v81
Portfoliografiek: nieuwe weergave "Per munt", met een lijn voor elke munt.

### Toegevoegd
- **Schakelaar "Totaal | Per munt"** onder de grafiek op het Overzicht, naast Vergroten. Ook in het vergrote venster.
  - **Totaal:** de grafiek zoals je hem kende, met de totale waarde en de stippellijn voor geïnvesteerd of netto gestort.
  - **Per munt:** een gekleurde lijn per munt met de waarde van wat je op dat moment had. Aankopen en verkopen zie je als sprong. Cash staat erbij als grijze stippellijn.
    - De zes grootste munten krijgen een eigen lijn, in dezelfde kleuren als de verdelingsbalk. Kleinere munten staan samen onder "Overig".
- **Legenda onder de grafiek:** de waarde per munt nu. Beweeg je met de muis of vinger over de grafiek, dan toont de legenda de waarden op dat moment, en bovenaan staat het totaal.
- **Werkt overal:** voor alle periodes (1U tot Max), in euro, dollar en bitcoin.
- **Onthoudt je keuze:** de app opent de volgende keer in de weergave die je het laatst koos.

### Technisch
- **Geen extra koersverzoeken:** de waarde per munt komt uit dezelfde berekening als de totale waarde.
- **Toegankelijkheid:**
  - De schakelaar geeft met `aria-pressed` aan welke weergave aan staat, en de focus blijft na het wisselen op de knop.
  - Een schermlezer leest per munt de waarde aan het begin en eind van de periode voor.

## 3.1.0 – 24 oktober 2026 · voorheen v80
Weergave voor tablets in portretstand (bijvoorbeeld een iPad rechtop).

### Gewijzigd
- **Schermen van 700 tot 1000 pixels breed** krijgen een eigen tabletweergave. Voorheen kreeg zo'n scherm de telefoonweergave: een smalle kolom van maximaal 560 pixels in het midden, met veel lege ruimte links en rechts.
  - De inhoud gebruikt nu de volle breedte, tot 900 pixels.
  - De tabbalk onderin blijft, zodat er genoeg ruimte is voor de inhoud.
  - **Overzicht:** onder de grafiek staat de verdeling over de volle breedte, en daaronder staan Cash en Doelen naast elkaar. De grafiek is hoger. "Sinds je vorige bezoek" toont vier cijfers naast elkaar.
  - **Rapporten:** twee kolommen, zoals op de laptop.
  - **Transacties:** de zes totalen staan in drie kolommen.
  - **Munt-pagina:** de koersgrafiek is hoger.
  - **Bezittingen:** dit blijft een lijst. De laptoptabel is te breed voor een tablet in portret.
- **Niets veranderd:** de telefoonweergave en de laptopweergave (vanaf 1000 pixels, dus ook een iPad in landschap).
- **Getest** op de gangbare iPad-breedtes in portret: 744, 820 en 834 pixels. Nergens hoeft de pagina opzij te scrollen.

## 3.0.0 – 23 oktober 2026 · voorheen v79
Vervaging bovenin de iPhone-app opgelost met een ondoorzichtige statusbalk. Gebouwd op 2.5.0; de aanpassing uit 2.5.1 is teruggedraaid.

### Opgelost
- **Vage bovenrand in de iPhone-app:** sinds iOS 26/27 tekent iOS bij apps op het beginscherm een "Liquid Glass"-vervaging over de bovenkant. Dat gebeurt alleen bij de statusbalk-instelling `black-translucent`.
  - De app gebruikt nu `default`. De statusbalk is daardoor een effen balk en de pagina begint eronder, dus iOS tekent geen vervaging meer.
  - De extra ruimte van 2.5.1 (14 punten) was te weinig, want de vervaging loopt zo'n 35–40 punten door. Die ruimte is weer weg.
- **Kleur van de statusbalk:** helemaal bovenin staat een onzichtbaar element van 1 pixel in de achtergrondkleur van de app. iOS neemt die kleur over voor de statusbalk.
  - Wissel je in de app tussen licht en donker, dan wisselt die kleur direct mee.
  - Bij het thema "Automatisch" houdt iOS licht of donker vast zolang de app open is. Statusbalk en app blijven dan gelijk; het wisselt pas na herstarten van de app.

### Let op: eenmalig opnieuw installeren
iOS leest de statusbalk-instelling alleen als je de app aan het beginscherm toevoegt. Doe na het updaten daarom één keer het volgende:
1. Open de app en controleer dat GitHub-synchronisatie bijgewerkt is. Maak voor de zekerheid ook een back-up (Instellingen › Back-up).
2. Zorg dat je je GitHub-gegevens bij de hand hebt: token, repository en sync-wachtwoord.
3. Verwijder de app van het beginscherm. Let op: iOS wist daarbij de gegevens die op het toestel in die app stonden, ook je instellingen en vergrendeling.
4. Open de site in Safari en kies Deel › Zet op beginscherm.
5. Open de app, vul onder Instellingen › Synchronisatie via GitHub je gegevens opnieuw in en synchroniseer: al je transacties komen terug.
6. Zet daarna zo nodig de app-vergrendeling en je passkey opnieuw aan.

### Technisch
- **Element:** het element `#sbTint` is alleen zichtbaar als de app als app draait (`display-mode: standalone`, of `navigator.standalone` op oudere iOS-versies).
- **Overige weergave:** in Safari en op de laptop verandert er niets.
- **Bron van de oplossing:** een bevestigde oplossing uit de PWA-community (r/PWA, "iOS 27 beta blurs the top edge of installed PWAs").

## 2.5.1 – 23 oktober 2026 · voorheen v78
Bovenbalk op de iPhone niet meer vaag.

### Opgelost
- **Vage bovenste regel:** als de app vanaf het beginscherm van de iPhone draait, was de bovenste regel van de statusknop ("GitHub …") vaag. iOS tekent een vervaagde strook onder de statusbalk, en die liep tot over de bovenbalk van de app.
- **Oplossing:** in die situatie krijgt de bovenkant 14 punten extra ruimte, zodat de knoppen en statusregels net onder de strook staan. Het vergrote grafiekvenster en de melding over een nieuwe versie schuiven mee.
- **Elders niets veranderd:** in Safari, op de laptop en in andere browsers blijft alles hetzelfde.

### Technisch
- **Herkenning:** de app ziet aan `display-mode: standalone` of hij als app draait. Op oudere iOS-versies gebruikt hij daarvoor `navigator.standalone`.
- **Aanpassen:** de extra ruimte staat in de CSS-variabele `--top-extra`, zodat hij eenvoudig te verkleinen of vergroten is.

## 2.5.0 – 23 oktober 2026 · voorheen v77
Nieuwe functie: doelverdeling en herbalanceren (wens W3).

### Toegevoegd
- **Kaart "Doelverdeling"** op Rapporten › Plannen.
  - Met **+ Instellen** leg je per munt (en cash, als je die bijhoudt) vast welk percentage je wilt aanhouden, bijvoorbeeld 50% BTC, 30% ETH en 20% cash.
  - De knoppen "Huidige verdeling" en "Gelijk verdelen" vullen alles in één keer in.
  - Het totaal moet op 100% uitkomen; je ziet het meetellen terwijl je typt.
  - Een munt op 0% betekent dat je hem wilt afbouwen.
- **Tabel per munt:** het aandeel nu (met de waarde), je doel en de afwijking in procentpunten. Bovenaan staat de grootste afwijking.
- **Twee manieren om te herbalanceren:**
  - **Kopen en verkopen:** hoeveel euro je per munt moet kopen of verkopen om precies op je doel uit te komen, met het totaal.
  - **Alleen bijkopen:** vul het bedrag in dat je wilt inleggen. De app verdeelt het over de munten die het verst onder hun doel zitten, zonder iets te verkopen.
- **Knoppen "Koop € …" en "Verkoop € …"** openen het transactieformulier, al ingevuld met munt, bedrag en geschatte kosten. Er wordt pas iets opgeslagen als je op Opslaan tikt.
- **Per portefeuille:** elke portefeuille heeft zijn eigen doelverdeling. Bij "Alles samen" vraagt de kaart om eerst een portefeuille te kiezen.

### Technisch
- **Opslag:** de doelverdeling staat in je versleutelde gegevens (`allocs`) en synchroniseert, wordt geback-upt en teruggezet zoals doelen en plannen.
- **Portefeuille verwijderen:** dan wordt ook de doelverdeling ervan verwijderd.

## 2.4.2 – 23 oktober 2026 · voorheen v76
Portfoliografiek 24U toont kleine bewegingen beter.

### Gewijzigd
- **24U schaalt op de waarde zelf**, net als 1U en 4U sinds 2.4.0. Een beweging van een paar tientjes is nu goed te zien en loopt niet meer vlak weg naast de stippellijn (geïnvesteerd of netto gestort). Die stippellijn valt bij 24U daardoor meestal buiten beeld.
- **Vanaf 1W** blijft de stippellijn in beeld, zoals voorheen.
- **Uitleg in het vergrote venster** aangepast: daar staat nu "Bij 1U, 4U en 24U".

## 2.4.1 – 23 oktober 2026 · voorheen v75
Koersverandering over 24 uur, 7 dagen en 30 dagen nu ook in de lijst Bezittingen op de telefoon.

### Toegevoegd
- **Extra regel per munt** in de lijst Bezittingen op het Overzicht (telefoon): "24u · 7d · 30d" met de koersverandering over die periodes, in groen of rood. Dezelfde cijfers staan sinds 2.1.0 al in de tabel op de laptop.
  - De regel loopt over de hele breedte van de rij, zodat de naam, de waarde en je resultaat blijven staan waar ze stonden.
  - In bitcoin-weergave zijn de cijfers ten opzichte van bitcoin, net als in de tabel.
  - Een schermlezer leest "Koersverandering: 24 uur …, 7 dagen …, 30 dagen …".

## 2.4.0 – 23 oktober 2026 · voorheen v74
Portfoliografiek: periodes van een uur en vier uur, een y-as en een vergroot venster.

### Toegevoegd
- **Periodes 1U en 4U** naast 24U, 1W, 1M, 3M, 1J en Max. Ze tonen het afgelopen uur en de afgelopen 4 uur, met een punt per 5 minuten (de fijnste stap die CoinGecko geeft). Er gaan geen extra verzoeken naar CoinGecko: de koersen komen uit dezelfde aanvraag als de 24-uursgrafiek.
  - Bij 1U en 4U loopt de schaal alleen over de waarde zelf, zodat je kleine bewegingen ziet. De stippellijn (geïnvesteerd of netto gestort) valt dan meestal buiten beeld.
  - Onder de grafiek staat "Rendement afgelopen uur" of "Rendement afgelopen 4 uur".
- **Y-as:** rechts van de grafiek staan ronde bedragen met hulplijnen, in de eenheid die je gekozen hebt (euro, dollar of bitcoin).
- **Vergroten ⤢** (rechts naast het rendement onder de grafiek): opent de grafiek groot op het hele scherm.
  - Je kunt er alle periodes kiezen; de keuze geldt ook voor het Overzicht.
  - Een tijd- of datumas staat onder de grafiek.
  - Met de muis of je vinger zie je bovenaan de waarde en het resultaat op elk moment.
  - Sluiten met het kruisje of Esc; de focus gaat terug naar de knop Vergroten.

### Technisch
- Het tekenen van de portfoliografiek is één functie geworden die zowel het Overzicht als het vergrote venster gebruikt.

## 2.3.0 – 23 oktober 2026 · voorheen v73
Nieuw tabblad Analyse in Rapporten, met een wat-als-calculator (wens W1) en risico-inzicht (wens W9).

### Toegevoegd
- **Tabblad Analyse** tussen Rendement en Plannen. Rendement laat zien wat er gebeurd is; Analyse vergelijkt en rekent scenario's door. "Vergelijking" en "Vaste inleg vergeleken" zijn daarom van Rendement naar Analyse verhuisd.
- **Wat als…** (wens W1)
  - Kies één munt of "Alle munten tegelijk" en verschuif de koers met de schuifregelaar (−90% tot +300%). Je kunt ook een percentage typen, of bij één munt direct een koers.
  - Je ziet de portfoliowaarde nu en dan, met het verschil.
  - Per munt zie je de koers en waarde dan, het resultaat ten opzichte van wat je betaalde, en de **break-even-koers inclusief verkoopkosten**, met hoeveel de koers daarvoor moet stijgen of dalen.
  - Bij één munt zie je onder "Per aankoop die je nog hebt" het resultaat per aankoop die volgens FIFO nog in je bezit is. Ontvangen munten, zoals staking, staan samen op één regel.
  - Er wordt niets opgeslagen.
- **Risico** (wens W9)
  - **Spreiding:** bijvoorbeeld "57% van je crypto zit in Bitcoin". Daarnaast het aandeel van je grootste drie munten en het aandeel cash. Het "effectief aantal munten" geeft aan over hoeveel munten in gelijke delen je verdeling neerkomt.
  - **Per munt en voor je crypto samen, over het afgelopen jaar:**
    - Beweeglijkheid: dagelijkse schommeling, omgerekend naar een jaar.
    - Grootste daling: van een top naar een later dal.
    - Hoe ver de koers nu onder de jaartop staat.
  - **"Je crypto samen"** rekent met je huidige verdeling, alsof je die het hele jaar had gehad. Zo tellen stortingen en aankopen niet als koersbeweging.

### Gewijzigd
- **Rendement** bevat nu: rendement per periode, inleg, rendementskalender en beste en slechtste munt.
- **Tabbladen:** de vier tabbladen passen op een iPhone. Op heel smalle schermen (320 pixels) wordt de tekst iets kleiner.

### Technisch
- **Koersen ophalen:** ontbreken voor het risico-overzicht dagkoersen van het afgelopen jaar, dan haalt de app ze één keer per sessie op, munt voor munt. Daarna komen ze uit het koersarchief.
- **Brede tabellen:** past een tabel op een smal scherm niet, dan scrolt alleen dat blok opzij. Het blok is dan ook met het toetsenbord te bedienen.

## 2.2.0 – 23 oktober 2026 · voorheen v72
Rapporten opgesplitst in drie tabbladen.

### Gewijzigd
- **Tabbladen bovenaan Rapporten:** **Rendement · Plannen · Administratie**. De twaalf kaarten stonden eerst allemaal onder elkaar en zijn nu verdeeld naar wanneer je ze gebruikt.
  - **Rendement** (terugkijken): rendement per periode, rendementskalender, beste en slechtste munt, inleg, vergelijking met één munt en "Vaste inleg vergeleken".
  - **Plannen** (vooruitkijken): doelen (volledig) en vaste-inlegplannen.
    - Het Overzicht toont de doelen nog steeds compact.
    - Plannen werkt ook als je nog geen transacties hebt, zodat je vooraf al een doel of plan kunt maken.
  - **Administratie** (controleren en bewaren): per broker/wallet, controle, waarde op 1 januari en exporteren.
    - De export staat hier en niet in Instellingen, omdat je hem samen met het jaaroverzicht gebruikt.
- **Eigen adres per tabblad:** bijvoorbeeld `#rapporten/plannen`. De terugknop werkt daardoor, en je kunt er direct naartoe linken.
- **Onthoudt het laatste tabblad:** tik je in de onderbalk op Rapporten, dan opent het tabblad dat je het laatst bekeek.
- **Laptop:** elk tabblad gebruikt twee kolommen.
- **Telefoon:** alles staat onder elkaar. De tabbladen passen ook op een scherm van 320 pixels breed.

### Technisch
- **Minder rekenwerk:** het jaaroverzicht per 1 januari en het overzicht per broker worden alleen berekend als je Administratie opent. Daardoor laadt Rendement iets sneller.
- **Toegankelijkheid:** de tabbladen zijn gewone links in een `<nav>` met `aria-current="page"`. Ze werken met toetsenbord en schermlezer, en de focus blijft na het wisselen op het gekozen tabblad.

## 2.1.0 – 23 oktober 2026 · voorheen v71
Meer marktinformatie in de tabel Bezittingen op het Overzicht (laptop/desktop).

### Toegevoegd
- **Kolommen "7 dagen" en "30 dagen"** naast "24 uur": de koersverandering van elke munt over die periode.
  - De cijfers komen uit dezelfde koersaanvraag als nu, dus er gaan geen extra verzoeken naar CoinGecko.
  - In bitcoin-weergave zijn ze, net als "24 uur", ten opzichte van bitcoin over dezelfde periode.

### Gewijzigd
- **Munt-kolom:** toont nu de ticker (BTC, ETH, ADA …) in plaats van de volledige naam.
  - De volledige naam zie je als je met de muis over de munt gaat, en een schermlezer leest hem voor.
  - Sorteren op "Munt" gaat nog steeds op naam.
- **Kopje "Gem. aankoopprijs"** heet nu "Gem. prijs", met de volledige tekst als uitleg bij de muis.
- **Iets minder ruimte tussen de kolommen.**
- **Resultaat:** de tabel is smaller dan in 2.0.0, ondanks de twee extra kolommen. Op een scherm van 1440 pixels breed past hij nu helemaal; in 2.0.0 moest je daar bij een lange naam als "Artificial Superintelligence Alliance" nog opzij scrollen.

## 2.0.0 – 23 oktober 2026 · voorheen v70
Nieuwe functie: meerdere portefeuilles (wens W14).

### Let op
- **Werk eerst al je apparaten bij** naar deze versie voordat je een tweede portefeuille aanmaakt. Een oudere versie kent geen portefeuilles en toont alle transacties door elkaar.

### Toegevoegd
- **Instellingen › Portefeuilles:** maak extra portefeuilles aan, bijvoorbeeld voor je partner, een kind of een zakelijke rekening. Je kunt ze hernoemen en verwijderen. Ook je eigen portefeuille ("Mijn portefeuille") kun je een andere naam geven.
- **Wisselen:** zodra er meer dan één portefeuille is, staat bovenaan Overzicht, Transacties en Rapporten een knop "Portefeuille …". Die opent een lijst met per portefeuille het aantal transacties en de huidige waarde.
- **Alles samen:** een extra keuze in die lijst, met al je portefeuilles bij elkaar opgeteld.
  - Heeft een portefeuille geen cash-transacties, dan tellen de aankopen daarin als inleg. Ze verlagen dus niet de cash van een andere portefeuille.
- **Per portefeuille apart:** transacties, cash, brokers/wallets, rapporten, doelen, vaste-inlegplannen en "Sinds je vorige bezoek".
- **Gedeeld door alle portefeuilles:** volglijst, prijsalerts en koersarchief.
- **Transactieformulier:** krijgt een keuzeveld "Portefeuille". Standaard is dat de portefeuille die je bekijkt; bij "Alles samen" is het je eigen portefeuille.
- **Bitvavo-import:** krijgt een keuzeveld "Importeren in portefeuille". Dubbele transacties worden binnen die portefeuille herkend.
- **Portefeuille verwijderen:** de transacties, doelen en plannen erin worden ook verwijderd, op al je apparaten. Je krijgt eerst een bevestiging. Via "Eerdere versie terugzetten" kun je het weer ongedaan maken.

### Technisch
- **Eén bestand:** alles blijft in één versleuteld bestand op GitHub. Een transactie, doel of plan uit een extra portefeuille krijgt een portefeuillelabel; zonder label hoort hij bij je eigen portefeuille.
- **Oude gegevens en apparaten:** bestaande gegevens hoeven niet omgezet te worden.
- **Synchronisatie:** portefeuilles (namen, toevoegen, verwijderen) worden op dezelfde manier samengevoegd als doelen en plannen. Ook de back-up (JSON) en het terugzetten van een eerdere versie nemen ze mee.
- **Zonder extra portefeuilles:** de app ziet er precies hetzelfde uit als in 1.4.0, op de nieuwe sectie in Instellingen na. Dat is per pixel vergeleken.

## 1.4.0 – 23 oktober 2026 · voorheen v69
Nieuwe functie: bedragen tonen in euro, dollar of bitcoin (wens W13).

### Toegevoegd
- **Instellingen › Weergave › Bedragen tonen in:** kies Euro €, Dollar $ of Bitcoin ₿. Je gegevens blijven gewoon in euro opgeslagen; alleen de weergave verandert.
- **Waar het geldt:** Overzicht (inclusief grafiek en "Sinds je vorige bezoek"), de munt-pagina's, Transacties en de zijbalk.
- **Dollar:** alles omgerekend tegen de koers van nu.
- **Bitcoin:** rekent zo dat je ziet of je beter deed dan gewoon bitcoin aanhouden.
  - Huidige waarden staan tegen de bitcoinkoers van nu.
  - Elke aankoop, verkoop, storting en elk bedrag in de transactielijst telt tegen de bitcoinkoers van dat moment.
  - Daardoor geven winst/verlies, gemiddelde aankoopprijs, "Geïnvesteerd" en "Rendement" het resultaat in bitcoin.
  - Voorbeeld uit de testdata: Ethereum staat in euro op +24,4% en tegenover bitcoin op +18,0%. Bitcoin zelf staat in bitcoin op −0,25%, wat precies je betaalde kosten zijn.
  - De koersgrafiek van een munt toont de koers in bitcoin, en de 24-uursverandering is ten opzichte van bitcoin.
- **Blijft altijd in euro:** formulieren, de gemiddelde-prijs-calculator, prijsalerts, doelen, vaste inleg, Marktinformatie, Rapporten (met een melding bovenaan) en het jaaroverzicht. Dat is bewust, voor je administratie en belastingaangifte.

### Technisch
- **Wisselkoers:** de bitcoinkoers in euro en dollar wordt bij elke koersupdate opgehaald (één extra aanvraag), maar alleen als je niet in euro kijkt.
- **Oude bitcoinkoersen:** die komen uit het koersarchief. Ontbreken ze, dan haalt de app één keer het afgelopen jaar op. Voor transacties die ouder zijn dan het archief, wordt de bitcoinkoers geschat uit de dichtstbijzijnde bekende koers.
- **Resultaat bij "Sinds je vorige bezoek":** wordt nu berekend als waardeverandering min wat je er sindsdien in stopte. In euro geeft dat exact hetzelfde als voorheen; ik heb dat nagerekend.

## 1.3.0 – 23 oktober 2026 · voorheen v68
Nieuwe functie: gemiddelde-prijs-calculator (wens W12).

### Toegevoegd
- **Waar:** op de pagina van een munt die je bezit staat het blok "Gemiddelde aankoopprijs berekenen". Het rekent met je huidige positie: aantal en gemiddelde aankoopprijs, volgens FIFO en inclusief kosten.
- **Twee manieren van rekenen:**
  - **Bijkopen voor bedrag:** "wat wordt mijn gemiddelde als ik voor € 200 bijkoop?" Je ziet hoeveel munten dat zijn, de kosten, het nieuwe gemiddelde (met de verandering in procenten) en hoeveel je daarna bezit.
  - **Naar doelgemiddelde:** "hoeveel moet ik bijkopen om op € 73.000 gemiddeld uit te komen?" Je ziet het benodigde bedrag en aantal munten.
- **Koers en kosten aanpasbaar:** de koers staat op de huidige koers en de kosten op je eigen gemiddelde kostenpercentage voor deze munt. Je kunt beide aanpassen, bijvoorbeeld om te zien wat er nodig is als de koers eerst daalt.
- **Uitleg als het niet kan:** is een doel onhaalbaar, dan zegt de calculator waarom. Bijvoorbeeld: je gemiddelde verlagen kan niet als de koers boven je gemiddelde ligt.
- **Als aankoop invoeren:** opent het transactieformulier, al ingevuld met bedrag, koers en kosten.
- **Invoer blijft staan:** wat je invult, blijft bewaard als de koersen tussendoor worden bijgewerkt.

## 1.2.0 – 23 oktober 2026 · voorheen v67
Nieuwe functie: een eerdere versie terugzetten vanuit de GitHub-geschiedenis.

### Toegevoegd
- **Instellingen › Eerdere versie terugzetten:** deze knop verschijnt als GitHub-synchronisatie aan staat. Elke synchronisatie bewaart een versie van je versleutelde gegevens op GitHub. Je ziet de laatste 40 versies met datum en tijd. De bovenste is de huidige stand, want die wordt eerst nog gesynchroniseerd.
- **Bekijken voor je terugzet:** per versie zie je het aantal transacties toen en nu, hoeveel er sindsdien zijn toegevoegd en verwijderd, en de laatste transactie in die versie.
- **Terugzetten:**
  - Je transacties, volglijst, prijsalerts, doelen en vaste-inlegplannen worden weer precies zoals in die versie. Je instellingen (zoals de CoinGecko-sleutel) en het koersarchief blijven zoals ze nu zijn.
  - Transacties die sindsdien zijn verwijderd, komen terug. Wat erna is toegevoegd, wordt verwijderd.
  - De teruggezette stand gaat bij de volgende synchronisatie naar al je apparaten en wint daar van oudere gegevens.
- **Ongedaan maken:** de stand van vóór het terugzetten blijft zelf ook een versie, dus je kunt altijd weer terug.

### Opmerkingen
- **Ander versleutelwachtwoord:** een versie die met een ander versleutelwachtwoord is gemaakt, kan niet worden geopend. Je krijgt dan een melding.
- **Teruggezette transacties:** krijgen intern een nieuwe code. Importeer je daarna hetzelfde Bitvavo-bestand opnieuw, dan worden ze niet dubbel toegevoegd.

## 1.1.0 – 23 oktober 2026 · voorheen v66
Nieuwe functie: vaste maandelijkse inleg (DCA).

### Toegevoegd
- **Plannen (Rapporten › Vaste inleg › + Plan):** leg vast dat je elke maand een vast bedrag in een munt steekt, bijvoorbeeld "€ 100 in Bitcoin op de 5e, bij Bitvavo, vanaf augustus 2026". Je kunt meerdere plannen hebben. Ze synchroniseren versleuteld mee naar je andere apparaten en staan ook in de back-up.
- **Herinnering op het overzicht:** vanaf de plandag staat bovenaan "Vaste inleg: € 100,00 Bitcoin voor oktober 2026", met twee knoppen:
  - **Invoeren** opent het transactieformulier, al ingevuld met het bedrag, de broker en voor een eerdere maand ook de plandatum en de koers van die dag. Neem de exacte bedragen van je afschrift over en sla op. De maand staat dan op "ingevoerd".
  - **Overslaan** markeert de maand als overgeslagen.

  Zijn er meerdere maanden open, dan zie je ze één voor één, de oudste eerst.
- **Overzicht per plan:** hoeveel maanden ingevoerd zijn en hoeveel nog open staan.
- **Vergelijking (Rapporten › Vaste inleg vergeleken):** per munt wordt jouw gemiddelde aankoopprijs vergeleken met wat je had betaald als je hetzelfde totaalbedrag gelijk verdeeld had over elke maand sinds je eerste aankoop. Daarbij staat het verschil in huidige waarde, per munt en in totaal, met de conclusie "jouw timing leverde € X meer op" of "met een vaste inleg had je € X meer gehad". Verkopen tellen niet mee. Maanden zonder bewaarde koers worden geschat (≈).

## 1.0.32 – 22 oktober 2026 · voorheen v65
Codekwaliteit punt 27: datums zijn machineleesbaar en de HTML is netjes ingesprongen.

### Verbeterd
- **Datums in `<time datetime="…">`:** de zichtbare tekst blijft Nederlands ("21 okt 2026"), maar de computer leest een eenduidige datum (`2026-10-21`). Het gaat om:
  - transactiedatums in de lijsten en tabellen, met tijd waar die bekend is
  - maanden, weken en jaren in de rendementstabellen (`2026-10`, `2026-W43`, `2026`)
  - de tijd van de laatste synchronisatie en koersupdate
- **`index.html`:** de HTML buiten de stijlregels is consequent ingesprongen met 2 spaties, met één element per regel.
- **Invoervelden:** alle 18 velden zonder `type` hebben nu expliciet `type="text"`.

### Opgelost
- **Twee tooltips uit eerdere versies van deze reeks:**
  - De uitleg bij de statusknop als je offline bent (sinds 1.0.6).
  - Het bedrag per dag in de rendementskalender (sinds 1.0.10).

  Door een dubbel aanhalingsteken (`title=""…`) verschenen ze niet. Ze werken weer.
- **Controle:** de HTML-validator meldt geen fouten meer, behalve de 19 bewust inline gehouden stijlen uit gegevens (zie 1.0.19).

## 1.0.31 – 22 oktober 2026 · voorheen v64
Snelheid punt 26: de app maakt vroeg verbinding met de servers die hij nodig heeft.

### Verbeterd
- **CoinGecko-koersen:** `preconnect` naar `api.coingecko.com`. De verbinding (DNS, TCP en TLS) wordt al opgezet terwijl de app nog laadt, zodat de eerste koersen sneller binnen zijn.
- **Muntlogo's:** `preconnect` naar `coin-images.coingecko.com`, de server van de logo's.
- **GitHub:** `dns-prefetch` naar `api.github.com`. Dat is lichter, omdat synchronisatie niet altijd aan staat.

## 1.0.30 – 22 oktober 2026 · voorheen v63
Privacy punt 25: geen verwijzer meer naar andere sites.

### Verbeterd
- **Externe link:** de link naar CoinGecko (prijzen van de API-sleutel) heeft `rel="noopener noreferrer"`. De geopende site ziet niet vanaf welke pagina je kwam en kan je app-venster niet aansturen.
- **Hele app:** `<meta name="referrer" content="no-referrer">`. Ook bij het ophalen van koersen (CoinGecko) en het synchroniseren (GitHub) wordt het adres van je app niet meer meegestuurd. Zo is niet te zien op welke GitHub Pages-site je de app draait.
- **Getest:** synchronisatie, koersen en afbeeldingen werken zoals voorheen.

## 1.0.29 – 22 oktober 2026 · voorheen v62
Weergave punt 24: `color-scheme` ingesteld.

### Verbeterd
- **Browser weet welke thema's er zijn:** `<meta name="color-scheme" content="dark light">` vertelt dat de app een donker en een licht thema heeft.
- **Eigen onderdelen van de browser volgen je keuze:** via CSS `color-scheme` volgen ze het thema dat je in de app kiest (Automatisch, Donker of Licht), ook als dat afwijkt van je telefoon. Het gaat om:
  - het kalendericoontje en de datum-/tijdkiezer
  - keuzelijsten
  - scrollbalken
  - automatisch ingevulde velden

  In het donkere thema is het kalendericoontje bij "Datum en tijd" nu licht en dus goed zichtbaar.

## 1.0.28 – 22 oktober 2026 · voorheen v61
Gemak punt 23: de Enter-toets op het iPhone-toetsenbord zegt wat hij doet.

### Verbeterd
- **Formulieren:** in alle formuliervelden heet de Enter-toets "Gereed" (`enterkeyhint="done"`), want Enter slaat op (zie punt 21).
- **Zoekvelden:** bij "Zoek op munt of notitie" en bij het zoeken naar een munt heet de toets "Zoek".
- **Vergrendelscherm:** in het wachtwoordveld heet de toets "Ga".
- **Munt zoeken in het transactieformulier:** Enter kiest het eerste zoekresultaat. Het formulier wordt dan niet al opgeslagen en je krijgt geen foutmelding.

## 1.0.27 – 22 oktober 2026 · voorheen v60
Toegankelijkheid punt 22: knopgroepen hebben een groepsnaam en laten zien welke keuze aan staat.

### Verbeterd
- **Groepen:** de zeven knopgroepen staan in een `<fieldset>` met `<legend>` (die alleen schermlezers horen):
  - "Soort transactie" bij Koop/Verkoop/… in het formulier en bij Alle/Koop/… op Transacties
  - "Periode van de grafiek" bij 24U … Max
  - "Periode rendement" en "Periode inleg" bij Dag/Week/Maand/Jaar
  - "Richting van de alert"
  - "Thema"
- **Gekozen knop:** krijgt `aria-pressed="true"`. Een schermlezer zegt bijvoorbeeld "Maand, ingedrukt", zodat je weet welke periode actief is.

### Opgelost
- **Blok Inleg (Rapporten):** onder de periodeknoppen stond een dun lijntje dat er per ongeluk was. Dat is weg. Verder is alles pixel voor pixel gelijk.

## 1.0.26 – 22 oktober 2026 · voorheen v59
Formulieren punt 21: echte formulieren, fouten bij het veld en geen dubbele invoer.

### Verbeterd
- **Formulieren:** de invoerbladen staan in een `<form>`. Het gaat om transactie, doel, prijsalert en herstelwachtwoord, en in Instellingen apart om het GitHub-deel en het CoinGecko-deel.
- **Enter slaat op:** Enter in een veld werkt als op de opslaan-knop tikken. In Instellingen slaat Enter alleen het deel op waarin je typt: Enter in het CoinGecko-veld test de sleutel en start geen GitHub-synchronisatie.
- **Foutmelding bij het veld:**
  - Een fout zoals "Vul een aantal in", "Vul een geldige koers in" of "Wachtwoorden zijn niet gelijk" staat in rood direct onder het veld. Het veld krijgt een rode rand en de focus gaat ernaartoe.
  - Voor schermlezers is de melding gekoppeld met `aria-invalid` en `aria-describedby`, en hij wordt direct voorgelezen.
  - Zodra je in het veld typt, verdwijnt de melding.
- **Geen dubbele invoer:** dubbel tikken op "Toevoegen" of "Opslaan" voegt de transactie maar één keer toe.

## 1.0.25 – 22 oktober 2026 · voorheen v58
Toegankelijkheid punt 20: iconen worden niet meer apart voorgelezen.

### Verbeterd
- **Iconen in knoppen en navigatie:** alle 15 SVG-iconen hebben `aria-hidden="true"` en `focusable="false"`. Het gaat om de plusknop, de tabbalk, het oog, het tandwiel, het slot, terug en sluiten. Een schermlezer leest alleen de naam van de knop, zoals "Sluiten" of "Instellingen", zonder een losse "afbeelding" erbij.
- **Lijnen in grafieken:** de cumulatieve lijn en de vergelijkingsgrafiek zijn ook verborgen voor schermlezers. Hun inhoud staat al in de samenvatting (punt 9) of in de tekst eronder.
- **Uiterlijk:** pixel voor pixel gelijk.

## 1.0.24 – 22 oktober 2026 · voorheen v57
Toegankelijkheid punt 19: tabellen met bijschrift en kop-koppeling.

### Verbeterd
- **Bijschrift:** alle 11 tabellen hebben een `<caption>`, bijvoorbeeld "Transacties", "Bezittingen", "Rendement per maand" of "Waarde per broker of wallet". Die is alleen voor schermlezers, want boven elke tabel staat al een zichtbare kop. Ook de tabellen in het jaaroverzicht (PDF) hebben er een.
- **Kolomkoppen:** alle 51 kolomkoppen hebben `scope="col"`.
- **Rijkoppen:** in de rendements- en brokertabellen is de eerste cel van elke rij een rijkop (`<th scope="row">`), zoals "oktober 2026" of "Bitvavo". Een schermlezer leest bij elk bedrag voor bij welke maand en kolom het hoort.
- **Uiterlijk:** pixel voor pixel gelijk.

## 1.0.23 – 22 oktober 2026 · voorheen v56
Toegankelijkheid punt 18: navigatie met een eigen label.

### Verbeterd
- **Zijbalk (laptop):** Overzicht, Transacties en Rapporten staan in een `<nav aria-label="Hoofdnavigatie">`.
- **Tabbalk (mobiel):** heeft het label "Tabbalk". De drie tabs zijn links (`<a href>`) in plaats van knoppen, omdat ze naar een ander scherm gaan. De actieve tab heeft `aria-current="page"`, zodat een schermlezer zegt welk scherm open is.
- **Uiterlijk en werking:** ongewijzigd en pixel voor pixel gelijk.

## 1.0.22 – 22 oktober 2026 · voorheen v55
Toegankelijkheid punt 17: skip link "Naar hoofdinhoud".

### Toegevoegd
- **Skip link:** de eerste Tab op een pagina toont linksboven de knop "Naar hoofdinhoud". Met Enter spring je direct naar de inhoud, langs de zijbalk en de knoppen bovenaan.
- **Onzichtbaar voor anderen:** wie de muis of het touchscreen gebruikt, ziet de knop niet.
- **Huidige scherm blijft staan:** de skip link verandert het adres (de `#`) niet, dus je blijft op het scherm waar je was.

## 1.0.21 – 22 oktober 2026 · voorheen v54
Prestaties punt 16: afbeeldingen hebben vaste afmetingen.

### Verbeterd
- **Afmetingen vooraf bekend:** muntlogo's, het app-logo in de zijbalk en de logo's in de zoekresultaten hebben `width` en `height`. De browser houdt daardoor vooraf ruimte vrij en de pagina verspringt niet als de logo's binnenkomen (geen layout shift).
- **Logo's van CoinGecko:** worden lui geladen (`loading="lazy"`) en asynchroon gedecodeerd (`decoding="async"`). Het app-logo laadt direct.
- **Uiterlijk:** pixel voor pixel gelijk aan de vorige versie.

## 1.0.20 – 22 oktober 2026 · voorheen v53
Codekwaliteit punt 15: de `<head>` volgt de afgesproken volgorde en inhoud.

### Verbeterd
- **Doctype:** `<!DOCTYPE html>` in hoofdletters.
- **Volgorde:** eerst `charset`, dan `viewport`, dan de beveiligingsregels (CSP) en de titel.
- **Nieuwe metatags:**
  - `description` met een korte omschrijving van de app.
  - `robots: noindex, nofollow`. Het is een privé-app, dus zoekmachines horen hem niet op te nemen.
- **Icoon voor het beginscherm van iPhone/iPad:** nieuw bestand `icon-180.png` in het formaat dat Apple vraagt (180 × 180 px). Dit was `icon-192.png`. De service worker neemt het mee in de offline-cache.

### Let op
- **Upload ook het nieuwe bestand `icon-180.png`.**

## 1.0.19 – 22 oktober 2026 · voorheen v52
Codekwaliteit punt 14: vaste opmaak staat in CSS in plaats van in inline `style=""`.

### Verbeterd
- **Vaste stijlen naar CSS:** 127 vaste inline stijlen (66 verschillende) zijn vervangen door CSS-klassen. Waar het kon, beschrijft de naam het doel, zoals `.empty-card`, `.coin-head`, `.tx-actions` en `.oversold`. Voor losse marges zijn er hulpklassen zoals `.mt-10`.
- **Gemengde stijlen gesplitst:** bij de aankoopstippen en het gemiddelde-label in de grafiek, de dagbereikbalk en de prijsalerts staat het vaste deel nu in CSS. Alleen de positie blijft inline.
- **Inline over:** 19 stijlen die uit je gegevens volgen, zoals posities, hoogtes en breedtes in grafieken en de kleuren van de verdeling.
- **Uiterlijk:** gecontroleerd met 32 schermafbeeldingen (iPhone en laptop, donker en licht). Ze zijn pixel voor pixel gelijk aan versie 51.

### Opmerking
- **CSP:** de 19 stijlen uit gegevens zijn de reden dat de beveiligingsregels inline stijlen nog toestaan (`style-src 'unsafe-inline'`). Inline scripts blijven geblokkeerd. Het risico van inline stijlen is veel kleiner dan dat van scripts.

## 1.0.18 – 22 oktober 2026 · voorheen v51
Codekwaliteit punt 13: elke knop heeft een expliciet `type`.

### Verbeterd
- **`type="button"`:** alle 62 knopsjablonen hebben het nu (op het scherm zijn dat er honderden). Alleen de knop "Ontgrendel met wachtwoord" heeft `type="submit"`.
- **Waarom:** een knop zonder `type` gedraagt zich in een formulier als verzendknop. Dat kan bij de formulieren uit punt 21 onbedoeld een formulier versturen. Voor jou verandert er niets.

## 1.0.17 – 22 oktober 2026 · voorheen v50
Toegankelijkheid en gemak punt 12: wachtwoordmanagers werken mee.

### Verbeterd
- **GitHub-token en CoinGecko-sleutel:** hebben geen `autocomplete="off"` meer. Je wachtwoordmanager (iCloud-sleutelhanger, 1Password, Google) mag ze nu bewaren en invullen. Spellingscontrole staat uit, zodat de sleutel nergens heen wordt gestuurd.
- **Versleutelwachtwoord (synchronisatie):**
  - Eerste keer instellen: `new-password`, zodat de manager een sterk wachtwoord voorstelt.
  - Al ingesteld (bijvoorbeeld op een tweede apparaat): `current-password`, zodat hij het bewaarde wachtwoord invult.
- **Vergrendelscherm en herstelwachtwoord instellen:**
  - Er is een verborgen gebruikersnaam "Crypto Portfolio", zodat de wachtwoordmanager het wachtwoord onder een herkenbare naam bewaart.
  - Het wachtwoordveld op het vergrendelscherm heeft een label voor schermlezers.

### Opgelost
- **Ongeldig attribuut:** `autocapitalize` stond op een wachtwoordveld, waar het niet hoort. Het is weggehaald.

## 1.0.16 – 22 oktober 2026 · voorheen v49
Toegankelijkheid punt 11: vakken die opzij scrollen zijn met het toetsenbord te bedienen.

### Verbeterd
- **Grafiek in het vergrote rendementsscherm:** is met Tab te bereiken en met de pijltjestoetsen opzij te scrollen. Een schermlezer noemt hem "Grafiek rendement per maand, scroll opzij met de pijltjestoetsen".
- **Brede tabellen op smalle schermen:** dit geldt bijvoorbeeld voor "Per broker / wallet" op een scherm van 320 px. Ze krijgen hetzelfde, maar alleen als ze echt opzij scrollen en er zelf geen knoppen of links in staan.

## 1.0.15 – 22 oktober 2026 · voorheen v48
Toegankelijkheid punt 10: de app houdt rekening met "Beweging verminderen".

### Verbeterd
- **Geen animaties meer:** heb je "Beweging verminderen" aangezet, dan staan alle animaties uit:
  - het inschuiven van bladen
  - het infaden van de achtergrond
  - het wegschuiven van de plusknop
  - het knipperende statusbolletje tijdens synchroniseren
- **Waar staat de instelling:** op de iPhone onder Instellingen › Toegankelijkheid › Beweging, op de Mac onder Systeeminstellingen › Toegankelijkheid › Weergave.
- **Werking:** alles blijft hetzelfde; er beweegt alleen niets meer.

## 1.0.14 – 22 oktober 2026 · voorheen v47
Toegankelijkheid punt 9: grafieken hebben een tekstalternatief.

### Verbeterd
- **Portfoliografiek:** een schermlezer leest een samenvatting voor, bijvoorbeeld "Grafiek portfoliowaarde, afgelopen maand: van € 1.458,92 naar € 1.806,30 (+23,81%). Geïnvesteerd aan het eind: € 1.600,00."
- **Koersgrafiek per munt:** de samenvatting noemt begin- en eindkoers, de verandering, de hoogste en laagste koers en je gemiddelde aankoopprijs.
- **Staafdiagrammen Rendement en Inleg (ook in het vergrote scherm):** de samenvatting noemt de periode, het totaal en de hoogste en laagste periode, en verwijst naar de tabel met alle bedragen.
- **Losse grafiekonderdelen:** asgetallen, maandletters en de gekleurde verdelingsbalk worden niet meer los voorgelezen. De legenda met percentages blijft wel leesbaar.
- **Bijgewerkte samenvatting:** bij elke andere periode (24U, 1W, 1M …) wordt de samenvatting opnieuw gemaakt.

## 1.0.13 – 22 oktober 2026 · voorheen v46
Toegankelijkheid punt 8: logische kopstructuur (h1 → h2), zonder niveaus over te slaan.

### Verbeterd
- **Overzicht op mobiel:** heeft nu een `<h1>` "Overzicht". Die is onzichtbaar en alleen voor schermlezers, omdat bovenaan de statusregel staat.
- **Rapporten:** de blokken (Rendement, Inleg, Rendementskalender enzovoort) hebben een `<h2>` in plaats van `<h3>`. Er wordt dus geen niveau meer overgeslagen.
- **Bladen:** formulieren en Instellingen beginnen met een `<h2>`.
- **Knop "Vergroten":** staat niet meer in de kop zelf. Een schermlezer leest de kop nu als "Rendement per maand".
- **Uiterlijk:** ongewijzigd.

## 1.0.12 – 22 oktober 2026 · voorheen v45
Toegankelijkheid punt 7: meldingen worden voorgelezen.

### Verbeterd
- **Schermlezers lezen meldingen voor:** de korte meldingen onderin, zoals "Gesynchroniseerd", "Weer online" en "Kies eerst een munt", hebben `role="status"` en `aria-live="polite"`. Een schermlezer leest ze voor zonder je af te breken.
- **Herhaalde melding:** komt dezelfde melding twee keer achter elkaar, dan wordt hij ook de tweede keer voorgelezen.

## 1.0.11 – 22 oktober 2026 · voorheen v44
Beveiliging punt 6: Content Security Policy (CSP) toegevoegd.

### Toegevoegd
- **Nieuw bestand `app.js`:** de JavaScript staat niet meer in `index.html`. **Upload dit bestand ook naar GitHub.**
- **CSP via `<meta http-equiv="Content-Security-Policy">`:**
  - Scripts mogen alleen van de eigen site komen (`script-src 'self'`). Ingevoegde of ingesloten scripts worden geweigerd.
  - De app mag alleen verbinding maken met de eigen site, `api.coingecko.com` en `api.github.com`. Gegevens (zoals je GitHub-token) kunnen daardoor niet naar een andere server worden gestuurd, ook niet als er ooit kwaadaardige code binnenkomt.
  - Afbeeldingen mogen alleen van de eigen site en de beeldservers van CoinGecko komen.
  - Plug-ins (`object-src`) zijn uitgeschakeld en `<base>` is vastgezet.
- **Service worker:** neemt `app.js` mee in de offline-cache.

### Opmerkingen
- **Inline stijlen:** die zijn voorlopig nog toegestaan (`style-src 'unsafe-inline'`). Bij punt 14 wordt bekeken of dat strenger kan.
- **`frame-ancestors`:** werkt alleen als HTTP-header, en die kan GitHub Pages niet instellen. Dit onderdeel ontbreekt dus.
- **Getest onder de CSP:** GitHub-synchronisatie (ook boven 1 MB), CoinGecko-koersen en -afbeeldingen, CSV-export, het jaaroverzicht (PDF) en de Bitvavo-import.

## 1.0.10 – 22 oktober 2026 · voorheen v43
Toegankelijkheid punt 5: alle tekst haalt de vereiste contrast (minstens 4,5:1), in het donkere en het lichte thema.

### Verbeterd
- **Kleuren lichte thema:**

  | Kleur | Was | Wordt |
  |---|---|---|
  | Groen | `#0fa968` (3,0) | `#047857` (5,5) |
  | Rood | `#e5484d` (3,9) | `#c8333a` (5,3) |
  | Geel | `#b7791f` (3,6) | `#8a5a0f` (5,9) |
  | Grijs | `#6b7280` (4,2) | `#5b6372` (5,5) |

- **Labels:** de typelabels Koop, Ontvangen en Storting hebben in beide thema's een donkerdere of lichtere tekstkleur gekregen.
- **Knop "Verkoop" (actief, donker thema):** heeft donkere tekst op rood in plaats van wit.
- **Rendementskalender:** de app kiest per dag zelf witte of zwarte tekst, afhankelijk van hoe fel het vakje is. Toekomstige dagen zijn niet meer half doorzichtig, maar leesbaar grijs.
- **Portfoliografiek:** de lijnen volgen de themakleuren en zijn daardoor in het lichte thema beter zichtbaar.

## 1.0.9 – 22 oktober 2026 · voorheen v42
Toegankelijkheid punt 4: elk invoerveld en elke keuzelijst heeft een gekoppeld label.

### Verbeterd
- **Formulieren:** alle 26 zichtbare labels zijn met `for`/`id` aan hun veld gekoppeld, in het transactieformulier, Instellingen, prijsalerts, doelen, munt volgen en het wachtwoordscherm. Tik je op een label, dan kom je in het veld, en schermlezers lezen de naam voor.
- **Velden zonder zichtbaar label:** deze hebben nu een label dat alleen schermlezers voorlezen:
  - het zoekveld en de filters Munt, Jaar en Broker/wallet bij Transacties
  - de sortering van bezittingen (mobiel)
  - de jaarkeuze voor het jaaroverzicht
  - de muntkoppeling bij de Bitvavo-import
- **Placeholder:** wordt nergens meer als enige label gebruikt.

## 1.0.8 – 22 oktober 2026 · voorheen v41
Toegankelijkheid punt 3: schuifbladen en het vergrote rendementsscherm zijn echte dialoogvensters (`<dialog>` met `showModal()`).

### Verbeterd
- **Achtergrond afgeschermd:** zolang een blad open is, kun je met Tab niet meer naar de achtergrond. Dat geldt voor het transactieformulier, Instellingen, de datacontrole en de andere bladen.
- **Sluiten:** Esc sluit het venster. Een tik of klik op de donkere achtergrond werkt ook nog.
- **Focus terug:** na sluiten gaat de focus terug naar de knop of rij waarmee je het venster opende. Na het opslaan van een transactie staat de focus weer op die transactie.
- **Schermlezers:** die horen nu dat er een venster open is en lezen de titel voor, zoals "Instellingen".
- **Meldingen:** blijven zichtbaar boven een open venster (bijvoorbeeld "Kies eerst een munt").

## 1.0.7 – 22 oktober 2026 · voorheen v40
Toegankelijkheid punt 2: je ziet altijd waar de toetsenbordfocus staat.

### Verbeterd
- **Focusrand:** elke knop, link, keuzelijst en elk invoerveld krijgt een duidelijke blauwe rand als je er met Tab op komt. Met de muis klikken of met je vinger tikken laat geen rand zien.
- **Invoervelden:** `outline:none` is weggehaald bij de zoek- en formuliervelden. Ze tonen nu een focusrand.
- **Rijen:** staat de focus op een munt- of transactierij, dan wordt de hele rij omrand en licht hij op.
- **Mobiel:** een gefocust element schuift niet meer achter de tabbalk onderaan (`scroll-padding-bottom`).

## 1.0.6 – 22 oktober 2026 · voorheen v39
Toegankelijkheid punt 1: alles wat je kunt aanklikken, werkt nu ook met het toetsenbord (Tab en Enter).

### Verbeterd
- **Zijbalk (laptop):** Overzicht, Transacties en Rapporten zijn echte links. De huidige pagina is gemarkeerd met `aria-current`.
- **Munten in de zijbalk:** de munten en "Beschikbaar" (cash) zijn ook links.
- **Rijen met munten en transacties:** de naam of datum is een link of knop. Met de muis of je vinger kun je nog steeds overal op de rij tikken. Voor schermlezers staat er "– transactie bewerken" bij.
- **Sorteren:** de sorteerbare kolomkoppen zijn knoppen, met `aria-sort`.
- **Overige onderdelen:**
  - "Vergroten" bij Rendement, de doelen, de meldingen van de datacontrole, de zoekresultaten bij het kiezen van een munt en de statusregel (synchroniseren) zijn knoppen.
  - Bij waarschuwingen in de datacontrole leest een schermlezer "Waarschuwing:" voor.
- **Focus na verversen:** de toetsenbordfocus blijft op dezelfde plek staan als het scherm opnieuw wordt opgebouwd, bijvoorbeeld na het wisselen van periode of na synchroniseren.

## 1.0.5 – 22 oktober 2026 · voorheen v38
Verbeteringen uit de testronde (punten 11–18 en 20).

### Verbeterd
- **Tikvlakken:** op touchscreens is elke knop minstens 44 × 44 px aan te tikken. Dat geldt ook voor kleine links zoals "+ Alert" en "+ Doel", de periodeknoppen en de statusregel. Het uiterlijk is gelijk gebleven.
- **Transactiefilters:**
  - iPhone: Munt en Jaar staan naast elkaar en Broker staat eronder over de volle breedte. Er wordt niets meer afgekapt.
  - Laptop: alle filters passen op één regel.
- **Lange muntnamen:** de naam wordt ingekort ("Artificial Sup…"); het label KOOP/VERKOOP blijft altijd zichtbaar.
- **Volglijst:** munten die je al bezit staan alleen nog bij Bezittingen, niet dubbel in de volglijst.
- **Datumveld:** toont alleen uren en minuten. Bewerk je een geïmporteerde transactie zonder de tijd te wijzigen, dan blijven de originele seconden bewaard.
- **Overboeken:** het veld "Van" wordt automatisch ingevuld met je laatst gebruikte broker/wallet.
- **Offline:**
  - Zonder internet staat er direct "Offline" bovenaan, met de tijd van de laatst bekende koersen.
  - Zodra je weer online bent, haalt de app automatisch nieuwe koersen op en synchroniseert hij.
  - Verzoeken naar CoinGecko en GitHub hebben een tijdslimiet. Bij een trage verbinding krijg je dus binnen enkele seconden een melding.
- **Transactiescherm:** toont 100 transacties tegelijk, met een knop "Toon meer". De totalen bovenaan tellen altijd alle transacties mee.
- **Sinds je vorige bezoek:** bij de grootste stijger en daler staat nu ook het bedrag in euro's.

## 1.0.4 – 22 oktober 2026 · voorheen v37
Kleinere fouten uit de testronde (punten 4–10).

### Opgelost
- **Broker bij handmatige invoer:** een nieuwe transactie krijgt de laatst gebruikte broker. Direct na een import is dat de broker die je het meest gebruikt.
- **Datacontrole:**
  - Een negatieve cashstand wordt ook gemeld als er geen broker/wallet is ingevuld.
  - Er komt een melding als transacties geen broker/wallet hebben terwijl je wel brokers gebruikt.
- **Grootste stijger en daler:** "Grootste daler" toont alleen een munt die echt gedaald is, en "Grootste stijger" alleen een munt die echt gestegen is.
- **"Nieuwe transacties":** de melding telt alleen transacties die op een ander apparaat zijn toegevoegd, niet je eigen invoer of import.
- **Ontvangen-rijen:** het overbodige "–" en het losse scheidingspuntje zijn weg. In de tabel op de laptop staat bij Ontvangen "gratis".
- **Plusknop:**
  - Schuift weg als je omlaag scrollt en komt terug als je omhoog scrollt.
  - Blijft ook weg zolang hij een kleine knop zou bedekken, zoals "Max" of "+ Storting / opname".
- **Statusbolletje:** is weer rond en wordt niet meer uitgerekt.

## 1.0.3 – 22 oktober 2026 · voorheen v36
### Opgelost
- **Rapporten bij ontbrekende koersgeschiedenis:**
  - CoinGecko levert gratis maar 365 dagen geschiedenis. Voor oudere perioden werden munten daardoor als € 0 gerekend (bijvoorbeeld september 2025: −€ 95).
  - De koers wordt nu geschat uit de dichtstbijzijnde bekende koersen: eigen aankoop- en verkoopkoersen, het koersarchief en bewaarde grafieken. Is er helemaal niets bekend, dan telt de munt mee tegen de aankoopwaarde.
  - Geschatte bedragen krijgen een ≈ met uitleg. Dat geldt voor de rendementstabellen, Waarde op 1 januari en het jaaroverzicht (PDF).
- **GitHub-sync bij bestanden groter dan 1 MB:**
  - Boven 1 MB stuurt GitHub de inhoud niet meer mee in het gewone antwoord.
  - De app haalt het bestand dan apart op als *raw*-download. Dat werkt tot 100 MB.

## 1.0.2 – 22 oktober 2026 · voorheen v35
### Verbeterd
- **Koersen in overzichten:**
  - Berekende koersen worden afgerond: € 1 of meer op 2 decimalen, onder € 1 op 4 significante cijfers. Voorbeeld: € 0,508902834668094 wordt ≈ € 0,5089.
  - Zelf ingetypte koersen worden volledig getoond, tot 6 significante cijfers.
  - De exacte waarde zie je door met de muis over de koers te gaan of in het bewerkscherm.
  - De CSV-export bevat altijd alle decimalen.
  - Berekeningen gebruiken altijd de exacte waarde.

## 1.0.1 – 22 oktober 2026 · voorheen v34
### Opgelost
- **Rapporten op iPhone:**
  - Het scherm was breder dan het beeld (blokken van 478 px op een scherm van 390 px). Daardoor schoof de pagina opzij en viel het tandwiel buiten beeld.
  - De kolommen worden nu nooit breder dan het scherm. Op kleine schermen zijn tabellen compacter, lange kolomkoppen lopen door op de volgende regel, en een tabel die echt niet past scrolt binnen zijn eigen blok.
  - Gecontroleerd van 320 tot 1440 px breed, inclusief het vergrote rendementsscherm en Instellingen geopend vanuit Rapporten.

### Toegevoegd
- **Testbestand:** een dummy Bitvavo-export (85 regels) waarmee alle functies op laptop en iPhone zijn doorgelopen. De uitkomst was een testrapport met 20 fouten en verbeteringen, die in 1.0.1–1.0.5 zijn afgewerkt.

---

## 1.0.0 – oktober 2026 · voorheen v1 – v33
De eerste versie.
De eerste versies zijn in één doorlopende reeks gebouwd. Hieronder staan de functies per onderwerp, in de volgorde waarin ze zijn toegevoegd.

### Basis
- **App:** web-app (PWA) in de stijl van de Delta-app van eToro, gehost op GitHub Pages en te installeren op het beginscherm.
- **Ongerealiseerde winst:** zowel gemiddeld (per munt) als per transactie, berekend met FIFO. Transactiekosten tellen mee in de aankoopprijs.
- **Koersen:** actuele koersen via CoinGecko.
- **Synchronisatie:**
  - Versleuteld (AES-GCM) naar een eigen private GitHub-repository, met samenvoegen van wijzigingen van meerdere apparaten.
  - Een aparte private repository wordt ondersteund. De repositorynaam staat in de instellingen, niet in het token.
- **Updates:** service worker voor offline gebruik, plus een melding als er een nieuwe versie is.

### Beveiliging
- **Vergrendeling met passkey:** Face ID / Touch ID via WebAuthn PRF, met een herstelwachtwoord als terugval. De lokale gegevens zijn versleuteld.

### Grafieken en weergave
- **Portfoliowaarde:**
  - Grafiek met per stuk groen (winst) of rood (verlies) ten opzichte van de stippellijn voor het geïnvesteerde bedrag.
  - De dubbele legenda "– – geïnvesteerd" is verwijderd.
  - Crypto, Cash, Geïnvesteerd en Gerealiseerd bewegen mee als je over de grafiek beweegt.
- **Grafiek per munt:**
  - De stippellijn toont je gewogen gemiddelde aankoopprijs.
  - Aankoopstippen staan op de prijs inclusief kosten.
- **Mobiel en laptop:** een aparte mobiele weergave en een brede laptopweergave met zijbalk (vanaf 1000 px).
- **Thema:** licht, donker of automatisch.

### Koersen en CoinGecko
- **Limieten:**
  - Oplossing voor de limieten van CoinGecko met één wachtrij voor alle verzoeken, automatisch opnieuw proberen en een bewaarde grafiekcache.
  - Een CoinGecko Demo-sleutel is optioneel. Je vult hem één keer in en hij synchroniseert naar al je apparaten.
- **Eigen koersarchief:** dagkoersen worden permanent bewaard (en versleuteld gesynchroniseerd). Zo reikt de geschiedenis na verloop van tijd verder dan de 365 dagen van CoinGecko.
- **Laatst bijgewerkt:** datum en tijd van de laatste synchronisatie, voor zowel GitHub als CoinGecko.
- **Marktinformatie per munt:** dagbereik, all-time high/low, marktwaarde, volume en aantal in omloop.

### Transacties
- **Transactiescherm:**
  - Apart scherm met alle transacties en een eigen knop in de navigatie.
  - Zoeken en filters op type, munt, jaar en broker/wallet, met totalen.
- **Typen:** koop, verkoop, storting, opname, ontvangen (staking/airdrops) en overboeking tussen eigen brokers/wallets.
- **Cash bijhouden:** stortingen, opnames en het beschikbare saldo per broker.
- **Meerdere brokers en wallets:** met de stand per plek.
- **Invoer:**
  - Onbeperkt aantal decimalen voor aantallen en koersen.
  - Totaal = aantal × koers + kosten (bij verkoop: − kosten).
  - Invullen vanaf je afschrift: vul 2 van de 3 velden in (totaal, koers, aantal) en het derde wordt berekend.
  - Een ≈-markering bij totalen die niet op hele centen uitkomen.
- **Bitvavo-import:** CSV-import met herkenning van dubbele regels.
- **Exporteren:** transacties als CSV.

### Rapporten
- **Rendement en inleg per periode:**
  - Kies dag, week, maand of jaar.
  - Bedragen staan in de staven, met euroteken en 2 decimalen (hele bedragen zonder).
  - Een cumulatieve lijn op dezelfde y-as als de staven.
- **Vergrote weergave:** tik op het rendementsblok voor een uitgebreide tabel.
- **Overige blokken:** Waarde op 1 januari, beste en slechtste munt, stand per broker/wallet, vergelijking met een benchmark (bijv. Bitcoin) en doelen.
- **Rendementskalender:** het resultaat per dag in een maandoverzicht.
- **Indeling:** Rendement naast Inleg; daaronder Per broker/wallet, Waarde op 1 januari en Beste en slechtste munt.
- **Jaaroverzicht:** als PDF, bijvoorbeeld voor de belastingaangifte.
- **Datacontrole:** meldingen bij een negatieve cashstand, te veel verkocht, totalen die niet op hele centen uitkomen, datums in de toekomst en mogelijk dubbele invoer.

### Overig
- **Volglijst:** munten volgen die je (nog) niet hebt.
- **Prijsalerts:** een melding bij een koers boven of onder een grens.
- **Sinds je vorige bezoek:** samenvatting van de waardeverandering, het resultaat, de grootste stijger en daler, en nieuwe transacties.
- **Privacystand:** bedragen verbergen met het oog-icoon.
