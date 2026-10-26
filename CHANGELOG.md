# Changelog – Crypto Portfolio

Alle noemenswaardige wijzigingen aan de app. De nieuwste versie staat bovenaan.
Het versienummer staat in de app onder Instellingen en komt overeen met de cache-naam in `sw.js` (`crypto-portfolio-vNN`).
Nog niet ingebouwde functies staan in de [wishlist](WISHLIST.md). Komt een wens in een versie terecht, dan staat het wensnummer erbij, bijvoorbeeld "(wens W3)".

---

## v83 – 26 oktober 2026
Weergaveschakelaar en Vergroten staan nu rechtsboven in het grafiekblok.

### Gewijzigd
- **Nieuwe plek:** de schakelaar "Totaal · € per munt · % per munt" en de knop "Vergroten" stonden onder de grafiek. Ze staan nu bovenaan, rechts.
  - **Laptop:** rechtsboven in het grafiekblok, naast de totale waarde, als het blok daar breed genoeg voor is. Bij een smaller laptopscherm staan ze rechts direct boven de grafiek.
  - **Telefoon en tablet:** rechts direct boven de grafiek.
- **Onder de grafiek** staat nu alleen nog het rendement over de gekozen periode.
- **Direct zichtbaar:** de knoppen staan er meteen en niet pas nadat de grafiek geladen is.

### Technisch
- **Plaatsing:** een container query bepaalt of de knoppen rechtsboven passen, zodat ze nooit over de totale waarde heen vallen.

## v82 – 26 oktober 2026
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

## v81 – 26 oktober 2026
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

## v80 – 24 oktober 2026
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

## v79 – 23 oktober 2026
Vervaging bovenin de iPhone-app opgelost met een ondoorzichtige statusbalk. Gebouwd op v77; de aanpassing uit v78 is teruggedraaid.

### Opgelost
- **Vage bovenrand in de iPhone-app:** sinds iOS 26/27 tekent iOS bij apps op het beginscherm een "Liquid Glass"-vervaging over de bovenkant. Dat gebeurt alleen bij de statusbalk-instelling `black-translucent`.
  - De app gebruikt nu `default`. De statusbalk is daardoor een effen balk en de pagina begint eronder, dus iOS tekent geen vervaging meer.
  - De extra ruimte van v78 (14 punten) was te weinig, want de vervaging loopt zo'n 35–40 punten door. Die ruimte is weer weg.
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

## v78 – 23 oktober 2026
Bovenbalk op de iPhone niet meer vaag.

### Opgelost
- **Vage bovenste regel:** als de app vanaf het beginscherm van de iPhone draait, was de bovenste regel van de statusknop ("GitHub …") vaag. iOS tekent een vervaagde strook onder de statusbalk, en die liep tot over de bovenbalk van de app.
- **Oplossing:** in die situatie krijgt de bovenkant 14 punten extra ruimte, zodat de knoppen en statusregels net onder de strook staan. Het vergrote grafiekvenster en de melding over een nieuwe versie schuiven mee.
- **Elders niets veranderd:** in Safari, op de laptop en in andere browsers blijft alles hetzelfde.

### Technisch
- **Herkenning:** de app ziet aan `display-mode: standalone` of hij als app draait. Op oudere iOS-versies gebruikt hij daarvoor `navigator.standalone`.
- **Aanpassen:** de extra ruimte staat in de CSS-variabele `--top-extra`, zodat hij eenvoudig te verkleinen of vergroten is.

## v77 – 23 oktober 2026
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

## v76 – 23 oktober 2026
Portfoliografiek 24U toont kleine bewegingen beter.

### Gewijzigd
- **24U schaalt op de waarde zelf**, net als 1U en 4U sinds v74. Een beweging van een paar tientjes is nu goed te zien en loopt niet meer vlak weg naast de stippellijn (geïnvesteerd of netto gestort). Die stippellijn valt bij 24U daardoor meestal buiten beeld.
- **Vanaf 1W** blijft de stippellijn in beeld, zoals voorheen.
- **Uitleg in het vergrote venster** aangepast: daar staat nu "Bij 1U, 4U en 24U".

## v75 – 23 oktober 2026
Koersverandering over 24 uur, 7 dagen en 30 dagen nu ook in de lijst Bezittingen op de telefoon.

### Toegevoegd
- **Extra regel per munt** in de lijst Bezittingen op het Overzicht (telefoon): "24u · 7d · 30d" met de koersverandering over die periodes, in groen of rood. Dezelfde cijfers staan sinds v71 al in de tabel op de laptop.
  - De regel loopt over de hele breedte van de rij, zodat de naam, de waarde en je resultaat blijven staan waar ze stonden.
  - In bitcoin-weergave zijn de cijfers ten opzichte van bitcoin, net als in de tabel.
  - Een schermlezer leest "Koersverandering: 24 uur …, 7 dagen …, 30 dagen …".

## v74 – 23 oktober 2026
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

## v73 – 23 oktober 2026
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

## v72 – 23 oktober 2026
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

## v71 – 23 oktober 2026
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
- **Resultaat:** de tabel is smaller dan in v70, ondanks de twee extra kolommen. Op een scherm van 1440 pixels breed past hij nu helemaal; in v70 moest je daar bij een lange naam als "Artificial Superintelligence Alliance" nog opzij scrollen.

## v70 – 23 oktober 2026
Nieuwe functie: meerdere portefeuilles (wens W14).

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
- **Zonder extra portefeuilles:** de app ziet er precies hetzelfde uit als in v69, op de nieuwe sectie in Instellingen na. Dat is per pixel vergeleken.

## v69 – 23 oktober 2026
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

## v68 – 23 oktober 2026
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

## v67 – 23 oktober 2026
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

## v66 – 23 oktober 2026
Nieuwe functie: vaste maandelijkse inleg (DCA).

### Toegevoegd
- **Plannen (Rapporten › Vaste inleg › + Plan):** leg vast dat je elke maand een vast bedrag in een munt steekt, bijvoorbeeld "€ 100 in Bitcoin op de 5e, bij Bitvavo, vanaf augustus 2026". Je kunt meerdere plannen hebben. Ze synchroniseren versleuteld mee naar je andere apparaten en staan ook in de back-up.
- **Herinnering op het overzicht:** vanaf de plandag staat bovenaan "Vaste inleg: € 100,00 Bitcoin voor oktober 2026", met twee knoppen:
  - **Invoeren** opent het transactieformulier, al ingevuld met het bedrag, de broker en voor een eerdere maand ook de plandatum en de koers van die dag. Neem de exacte bedragen van je afschrift over en sla op. De maand staat dan op "ingevoerd".
  - **Overslaan** markeert de maand als overgeslagen.

  Zijn er meerdere maanden open, dan zie je ze één voor één, de oudste eerst.
- **Overzicht per plan:** hoeveel maanden ingevoerd zijn en hoeveel nog open staan.
- **Vergelijking (Rapporten › Vaste inleg vergeleken):** per munt wordt jouw gemiddelde aankoopprijs vergeleken met wat je had betaald als je hetzelfde totaalbedrag gelijk verdeeld had over elke maand sinds je eerste aankoop. Daarbij staat het verschil in huidige waarde, per munt en in totaal, met de conclusie "jouw timing leverde € X meer op" of "met een vaste inleg had je € X meer gehad". Verkopen tellen niet mee. Maanden zonder bewaarde koers worden geschat (≈).

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
