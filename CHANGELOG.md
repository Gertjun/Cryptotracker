# Changelog – Crypto Portfolio

Alle noemenswaardige wijzigingen aan de app. De nieuwste versie staat bovenaan.
Het versienummer staat in de app onder Instellingen en komt overeen met de cache-naam in `sw.js` (`crypto-portfolio-vNN`).

---

## v65 – 22 oktober 2026
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
  - De uitleg bij de statusknop als je offline bent (sinds v39).
  - Het bedrag per dag in de rendementskalender (sinds v43).

  Door een dubbel aanhalingsteken (`title=""…`) verschenen ze niet. Ze werken weer.
- **Controle:** de HTML-validator meldt geen fouten meer, behalve de 19 bewust inline gehouden stijlen uit gegevens (zie v52).

## v64 – 22 oktober 2026
Snelheid punt 26: de app maakt vroeg verbinding met de servers die hij nodig heeft.

### Verbeterd
- **CoinGecko-koersen:** `preconnect` naar `api.coingecko.com`. De verbinding (DNS, TCP en TLS) wordt al opgezet terwijl de app nog laadt, zodat de eerste koersen sneller binnen zijn.
- **Muntlogo's:** `preconnect` naar `coin-images.coingecko.com`, de server van de logo's.
- **GitHub:** `dns-prefetch` naar `api.github.com`. Dat is lichter, omdat synchronisatie niet altijd aan staat.

## v63 – 22 oktober 2026
Privacy punt 25: geen verwijzer meer naar andere sites.

### Verbeterd
- **Externe link:** de link naar CoinGecko (prijzen van de API-sleutel) heeft `rel="noopener noreferrer"`. De geopende site ziet niet vanaf welke pagina je kwam en kan je app-venster niet aansturen.
- **Hele app:** `<meta name="referrer" content="no-referrer">`. Ook bij het ophalen van koersen (CoinGecko) en het synchroniseren (GitHub) wordt het adres van je app niet meer meegestuurd. Zo is niet te zien op welke GitHub Pages-site je de app draait.
- **Getest:** synchronisatie, koersen en afbeeldingen werken zoals voorheen.

## v62 – 22 oktober 2026
Weergave punt 24: `color-scheme` ingesteld.

### Verbeterd
- **Browser weet welke thema's er zijn:** `<meta name="color-scheme" content="dark light">` vertelt dat de app een donker en een licht thema heeft.
- **Eigen onderdelen van de browser volgen je keuze:** via CSS `color-scheme` volgen ze het thema dat je in de app kiest (Automatisch, Donker of Licht), ook als dat afwijkt van je telefoon. Het gaat om:
  - het kalendericoontje en de datum-/tijdkiezer
  - keuzelijsten
  - scrollbalken
  - automatisch ingevulde velden

  In het donkere thema is het kalendericoontje bij "Datum en tijd" nu licht en dus goed zichtbaar.

## v61 – 22 oktober 2026
Gemak punt 23: de Enter-toets op het iPhone-toetsenbord zegt wat hij doet.

### Verbeterd
- **Formulieren:** in alle formuliervelden heet de Enter-toets "Gereed" (`enterkeyhint="done"`), want Enter slaat op (zie punt 21).
- **Zoekvelden:** bij "Zoek op munt of notitie" en bij het zoeken naar een munt heet de toets "Zoek".
- **Vergrendelscherm:** in het wachtwoordveld heet de toets "Ga".
- **Munt zoeken in het transactieformulier:** Enter kiest het eerste zoekresultaat. Het formulier wordt dan niet al opgeslagen en je krijgt geen foutmelding.

## v60 – 22 oktober 2026
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

## v59 – 22 oktober 2026
Formulieren punt 21: echte formulieren, fouten bij het veld en geen dubbele invoer.

### Verbeterd
- **Formulieren:** de invoerbladen staan in een `<form>`. Het gaat om transactie, doel, prijsalert en herstelwachtwoord, en in Instellingen apart om het GitHub-deel en het CoinGecko-deel.
- **Enter slaat op:** Enter in een veld werkt als op de opslaan-knop tikken. In Instellingen slaat Enter alleen het deel op waarin je typt: Enter in het CoinGecko-veld test de sleutel en start geen GitHub-synchronisatie.
- **Foutmelding bij het veld:**
  - Een fout zoals "Vul een aantal in", "Vul een geldige koers in" of "Wachtwoorden zijn niet gelijk" staat in rood direct onder het veld. Het veld krijgt een rode rand en de focus gaat ernaartoe.
  - Voor schermlezers is de melding gekoppeld met `aria-invalid` en `aria-describedby`, en hij wordt direct voorgelezen.
  - Zodra je in het veld typt, verdwijnt de melding.
- **Geen dubbele invoer:** dubbel tikken op "Toevoegen" of "Opslaan" voegt de transactie maar één keer toe.

## v58 – 22 oktober 2026
Toegankelijkheid punt 20: iconen worden niet meer apart voorgelezen.

### Verbeterd
- **Iconen in knoppen en navigatie:** alle 15 SVG-iconen hebben `aria-hidden="true"` en `focusable="false"`. Het gaat om de plusknop, de tabbalk, het oog, het tandwiel, het slot, terug en sluiten. Een schermlezer leest alleen de naam van de knop, zoals "Sluiten" of "Instellingen", zonder een losse "afbeelding" erbij.
- **Lijnen in grafieken:** de cumulatieve lijn en de vergelijkingsgrafiek zijn ook verborgen voor schermlezers. Hun inhoud staat al in de samenvatting (punt 9) of in de tekst eronder.
- **Uiterlijk:** pixel voor pixel gelijk.

## v57 – 22 oktober 2026
Toegankelijkheid punt 19: tabellen met bijschrift en kop-koppeling.

### Verbeterd
- **Bijschrift:** alle 11 tabellen hebben een `<caption>`, bijvoorbeeld "Transacties", "Bezittingen", "Rendement per maand" of "Waarde per broker of wallet". Die is alleen voor schermlezers, want boven elke tabel staat al een zichtbare kop. Ook de tabellen in het jaaroverzicht (PDF) hebben er een.
- **Kolomkoppen:** alle 51 kolomkoppen hebben `scope="col"`.
- **Rijkoppen:** in de rendements- en brokertabellen is de eerste cel van elke rij een rijkop (`<th scope="row">`), zoals "oktober 2026" of "Bitvavo". Een schermlezer leest bij elk bedrag voor bij welke maand en kolom het hoort.
- **Uiterlijk:** pixel voor pixel gelijk.

## v56 – 22 oktober 2026
Toegankelijkheid punt 18: navigatie met een eigen label.

### Verbeterd
- **Zijbalk (laptop):** Overzicht, Transacties en Rapporten staan in een `<nav aria-label="Hoofdnavigatie">`.
- **Tabbalk (mobiel):** heeft het label "Tabbalk". De drie tabs zijn links (`<a href>`) in plaats van knoppen, omdat ze naar een ander scherm gaan. De actieve tab heeft `aria-current="page"`, zodat een schermlezer zegt welk scherm open is.
- **Uiterlijk en werking:** ongewijzigd en pixel voor pixel gelijk.

## v55 – 22 oktober 2026
Toegankelijkheid punt 17: skip link "Naar hoofdinhoud".

### Toegevoegd
- **Skip link:** de eerste Tab op een pagina toont linksboven de knop "Naar hoofdinhoud". Met Enter spring je direct naar de inhoud, langs de zijbalk en de knoppen bovenaan.
- **Onzichtbaar voor anderen:** wie de muis of het touchscreen gebruikt, ziet de knop niet.
- **Huidige scherm blijft staan:** de skip link verandert het adres (de `#`) niet, dus je blijft op het scherm waar je was.

## v54 – 22 oktober 2026
Prestaties punt 16: afbeeldingen hebben vaste afmetingen.

### Verbeterd
- **Afmetingen vooraf bekend:** muntlogo's, het app-logo in de zijbalk en de logo's in de zoekresultaten hebben `width` en `height`. De browser houdt daardoor vooraf ruimte vrij en de pagina verspringt niet als de logo's binnenkomen (geen layout shift).
- **Logo's van CoinGecko:** worden lui geladen (`loading="lazy"`) en asynchroon gedecodeerd (`decoding="async"`). Het app-logo laadt direct.
- **Uiterlijk:** pixel voor pixel gelijk aan de vorige versie.

## v53 – 22 oktober 2026
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

## v52 – 22 oktober 2026
Codekwaliteit punt 14: vaste opmaak staat in CSS in plaats van in inline `style=""`.

### Verbeterd
- **Vaste stijlen naar CSS:** 127 vaste inline stijlen (66 verschillende) zijn vervangen door CSS-klassen. Waar het kon, beschrijft de naam het doel, zoals `.empty-card`, `.coin-head`, `.tx-actions` en `.oversold`. Voor losse marges zijn er hulpklassen zoals `.mt-10`.
- **Gemengde stijlen gesplitst:** bij de aankoopstippen en het gemiddelde-label in de grafiek, de dagbereikbalk en de prijsalerts staat het vaste deel nu in CSS. Alleen de positie blijft inline.
- **Inline over:** 19 stijlen die uit je gegevens volgen, zoals posities, hoogtes en breedtes in grafieken en de kleuren van de verdeling.
- **Uiterlijk:** gecontroleerd met 32 schermafbeeldingen (iPhone en laptop, donker en licht). Ze zijn pixel voor pixel gelijk aan versie 51.

### Opmerking
- **CSP:** de 19 stijlen uit gegevens zijn de reden dat de beveiligingsregels inline stijlen nog toestaan (`style-src 'unsafe-inline'`). Inline scripts blijven geblokkeerd. Het risico van inline stijlen is veel kleiner dan dat van scripts.

## v51 – 22 oktober 2026
Codekwaliteit punt 13: elke knop heeft een expliciet `type`.

### Verbeterd
- **`type="button"`:** alle 62 knopsjablonen hebben het nu (op het scherm zijn dat er honderden). Alleen de knop "Ontgrendel met wachtwoord" heeft `type="submit"`.
- **Waarom:** een knop zonder `type` gedraagt zich in een formulier als verzendknop. Dat kan bij de formulieren uit punt 21 onbedoeld een formulier versturen. Voor jou verandert er niets.

## v50 – 22 oktober 2026
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

## v49 – 22 oktober 2026
Toegankelijkheid punt 11: vakken die opzij scrollen zijn met het toetsenbord te bedienen.

### Verbeterd
- **Grafiek in het vergrote rendementsscherm:** is met Tab te bereiken en met de pijltjestoetsen opzij te scrollen. Een schermlezer noemt hem "Grafiek rendement per maand, scroll opzij met de pijltjestoetsen".
- **Brede tabellen op smalle schermen:** dit geldt bijvoorbeeld voor "Per broker / wallet" op een scherm van 320 px. Ze krijgen hetzelfde, maar alleen als ze echt opzij scrollen en er zelf geen knoppen of links in staan.

## v48 – 22 oktober 2026
Toegankelijkheid punt 10: de app houdt rekening met "Beweging verminderen".

### Verbeterd
- **Geen animaties meer:** heb je "Beweging verminderen" aangezet, dan staan alle animaties uit:
  - het inschuiven van bladen
  - het infaden van de achtergrond
  - het wegschuiven van de plusknop
  - het knipperende statusbolletje tijdens synchroniseren
- **Waar staat de instelling:** op de iPhone onder Instellingen › Toegankelijkheid › Beweging, op de Mac onder Systeeminstellingen › Toegankelijkheid › Weergave.
- **Werking:** alles blijft hetzelfde; er beweegt alleen niets meer.

## v47 – 22 oktober 2026
Toegankelijkheid punt 9: grafieken hebben een tekstalternatief.

### Verbeterd
- **Portfoliografiek:** een schermlezer leest een samenvatting voor, bijvoorbeeld "Grafiek portfoliowaarde, afgelopen maand: van € 1.458,92 naar € 1.806,30 (+23,81%). Geïnvesteerd aan het eind: € 1.600,00."
- **Koersgrafiek per munt:** de samenvatting noemt begin- en eindkoers, de verandering, de hoogste en laagste koers en je gemiddelde aankoopprijs.
- **Staafdiagrammen Rendement en Inleg (ook in het vergrote scherm):** de samenvatting noemt de periode, het totaal en de hoogste en laagste periode, en verwijst naar de tabel met alle bedragen.
- **Losse grafiekonderdelen:** asgetallen, maandletters en de gekleurde verdelingsbalk worden niet meer los voorgelezen. De legenda met percentages blijft wel leesbaar.
- **Bijgewerkte samenvatting:** bij elke andere periode (24U, 1W, 1M …) wordt de samenvatting opnieuw gemaakt.

## v46 – 22 oktober 2026
Toegankelijkheid punt 8: logische kopstructuur (h1 → h2), zonder niveaus over te slaan.

### Verbeterd
- **Overzicht op mobiel:** heeft nu een `<h1>` "Overzicht". Die is onzichtbaar en alleen voor schermlezers, omdat bovenaan de statusregel staat.
- **Rapporten:** de blokken (Rendement, Inleg, Rendementskalender enzovoort) hebben een `<h2>` in plaats van `<h3>`. Er wordt dus geen niveau meer overgeslagen.
- **Bladen:** formulieren en Instellingen beginnen met een `<h2>`.
- **Knop "Vergroten":** staat niet meer in de kop zelf. Een schermlezer leest de kop nu als "Rendement per maand".
- **Uiterlijk:** ongewijzigd.

## v45 – 22 oktober 2026
Toegankelijkheid punt 7: meldingen worden voorgelezen.

### Verbeterd
- **Schermlezers lezen meldingen voor:** de korte meldingen onderin, zoals "Gesynchroniseerd", "Weer online" en "Kies eerst een munt", hebben `role="status"` en `aria-live="polite"`. Een schermlezer leest ze voor zonder je af te breken.
- **Herhaalde melding:** komt dezelfde melding twee keer achter elkaar, dan wordt hij ook de tweede keer voorgelezen.

## v44 – 22 oktober 2026
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

## v43 – 22 oktober 2026
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

## v42 – 22 oktober 2026
Toegankelijkheid punt 4: elk invoerveld en elke keuzelijst heeft een gekoppeld label.

### Verbeterd
- **Formulieren:** alle 26 zichtbare labels zijn met `for`/`id` aan hun veld gekoppeld, in het transactieformulier, Instellingen, prijsalerts, doelen, munt volgen en het wachtwoordscherm. Tik je op een label, dan kom je in het veld, en schermlezers lezen de naam voor.
- **Velden zonder zichtbaar label:** deze hebben nu een label dat alleen schermlezers voorlezen:
  - het zoekveld en de filters Munt, Jaar en Broker/wallet bij Transacties
  - de sortering van bezittingen (mobiel)
  - de jaarkeuze voor het jaaroverzicht
  - de muntkoppeling bij de Bitvavo-import
- **Placeholder:** wordt nergens meer als enige label gebruikt.

## v41 – 22 oktober 2026
Toegankelijkheid punt 3: schuifbladen en het vergrote rendementsscherm zijn echte dialoogvensters (`<dialog>` met `showModal()`).

### Verbeterd
- **Achtergrond afgeschermd:** zolang een blad open is, kun je met Tab niet meer naar de achtergrond. Dat geldt voor het transactieformulier, Instellingen, de datacontrole en de andere bladen.
- **Sluiten:** Esc sluit het venster. Een tik of klik op de donkere achtergrond werkt ook nog.
- **Focus terug:** na sluiten gaat de focus terug naar de knop of rij waarmee je het venster opende. Na het opslaan van een transactie staat de focus weer op die transactie.
- **Schermlezers:** die horen nu dat er een venster open is en lezen de titel voor, zoals "Instellingen".
- **Meldingen:** blijven zichtbaar boven een open venster (bijvoorbeeld "Kies eerst een munt").

## v40 – 22 oktober 2026
Toegankelijkheid punt 2: je ziet altijd waar de toetsenbordfocus staat.

### Verbeterd
- **Focusrand:** elke knop, link, keuzelijst en elk invoerveld krijgt een duidelijke blauwe rand als je er met Tab op komt. Met de muis klikken of met je vinger tikken laat geen rand zien.
- **Invoervelden:** `outline:none` is weggehaald bij de zoek- en formuliervelden. Ze tonen nu een focusrand.
- **Rijen:** staat de focus op een munt- of transactierij, dan wordt de hele rij omrand en licht hij op.
- **Mobiel:** een gefocust element schuift niet meer achter de tabbalk onderaan (`scroll-padding-bottom`).

## v39 – 22 oktober 2026
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

## v38 – 22 oktober 2026
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

## v37 – 22 oktober 2026
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

## v36 – 22 oktober 2026
### Opgelost
- **Rapporten bij ontbrekende koersgeschiedenis:**
  - CoinGecko levert gratis maar 365 dagen geschiedenis. Voor oudere perioden werden munten daardoor als € 0 gerekend (bijvoorbeeld september 2025: −€ 95).
  - De koers wordt nu geschat uit de dichtstbijzijnde bekende koersen: eigen aankoop- en verkoopkoersen, het koersarchief en bewaarde grafieken. Is er helemaal niets bekend, dan telt de munt mee tegen de aankoopwaarde.
  - Geschatte bedragen krijgen een ≈ met uitleg. Dat geldt voor de rendementstabellen, Waarde op 1 januari en het jaaroverzicht (PDF).
- **GitHub-sync bij bestanden groter dan 1 MB:**
  - Boven 1 MB stuurt GitHub de inhoud niet meer mee in het gewone antwoord.
  - De app haalt het bestand dan apart op als *raw*-download. Dat werkt tot 100 MB.

## v35 – 22 oktober 2026
### Verbeterd
- **Koersen in overzichten:**
  - Berekende koersen worden afgerond: € 1 of meer op 2 decimalen, onder € 1 op 4 significante cijfers. Voorbeeld: € 0,508902834668094 wordt ≈ € 0,5089.
  - Zelf ingetypte koersen worden volledig getoond, tot 6 significante cijfers.
  - De exacte waarde zie je door met de muis over de koers te gaan of in het bewerkscherm.
  - De CSV-export bevat altijd alle decimalen.
  - Berekeningen gebruiken altijd de exacte waarde.

## v34 – 22 oktober 2026
### Opgelost
- **Rapporten op iPhone:**
  - Het scherm was breder dan het beeld (blokken van 478 px op een scherm van 390 px). Daardoor schoof de pagina opzij en viel het tandwiel buiten beeld.
  - De kolommen worden nu nooit breder dan het scherm. Op kleine schermen zijn tabellen compacter, lange kolomkoppen lopen door op de volgende regel, en een tabel die echt niet past scrolt binnen zijn eigen blok.
  - Gecontroleerd van 320 tot 1440 px breed, inclusief het vergrote rendementsscherm en Instellingen geopend vanuit Rapporten.

### Toegevoegd
- **Testbestand:** een dummy Bitvavo-export (85 regels) waarmee alle functies op laptop en iPhone zijn doorgelopen. De uitkomst was een testrapport met 20 fouten en verbeteringen, die in v34–v38 zijn afgewerkt.

---

## Eerdere versies (v1 – v33) – oktober 2026
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
