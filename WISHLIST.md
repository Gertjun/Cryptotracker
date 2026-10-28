# Wishlist – Crypto Portfolio

Functies die zijn voorgesteld, maar nog niet zijn ingebouwd.

**Zo werkt deze lijst**
- Elke wens heeft een vast nummer (W1, W2, …). Dat nummer verandert nooit, ook niet als er wensen bij komen of af gaan.
- Wordt een wens ingebouwd, dan verdwijnt hij hier. In de [changelog](CHANGELOG.md) staat dan bij die versie "(wens W3)", zodat je kunt terugvinden wat er van de wens is geworden.
- Nieuwe wensen krijgen het eerstvolgende vrije nummer.

---

## Inzicht in je portfolio

### W5 – Kostenoverzicht
De betaalde kosten per broker en per jaar, en als percentage van je aankopen. Je ziet bijvoorbeeld of kleine aankopen je relatief veel kosten.

### W10 – Maandafsluiting
De eerste keer dat je de app in een nieuwe maand opent, zie je een korte samenvatting van de vorige maand: resultaat, inleg, beste en slechtste munt, betaalde kosten en hoe je ervoor staat ten opzichte van je doelen.

### W17 – Bijdrage per munt aan je rendement
Kies een periode (maand, kwartaal, jaar) en zie per munt hoeveel euro die bijdroeg aan je resultaat, van grootste winnaar tot grootste verliezer. Je ziet dan bijvoorbeeld dat je +€ 200 deze maand vooral uit ETH kwam, terwijl BTC je € 40 kostte. Past in Rapporten › Analyse.

### W20 – Vergelijken met sparen en inflatie
Je rendement naast wat een spaarrekening (rente zelf in te stellen) en de inflatie in dezelfde periode hadden opgeleverd. Zo zie je of crypto het risico waard was.

### W21 – Daling vanaf de top
Hoeveel procent je portfolio (en elke munt) onder het hoogste punt ooit staat, en sinds wanneer. Bijvoorbeeld "18% onder de top van 12 maart".

### W22 – Houdtijd
Hoe lang je je munten gemiddeld al hebt, per munt en voor alles samen, en welk deel je langer dan een jaar hebt.

### W23 – Portefeuilles naast elkaar
Een overzicht van al je portefeuilles onder elkaar, met inleg, waarde, resultaat en rendement, zodat je ze makkelijk vergelijkt.

## Kopen en verkopen voorbereiden

### W8 – Winst- en verliesgrens per positie
Een alert op basis van je eigen positie in plaats van een vaste koers, bijvoorbeeld "waarschuw bij +50% op mijn ETH" of "bij −20% ten opzichte van mijn gemiddelde aankoopprijs". Zo kun je winst nemen of verlies beperken volgens een plan dat je vooraf hebt gemaakt.

### W16 – Alert op je hele portfolio
Naast prijsalerts per munt een melding voor je totale waarde, bijvoorbeeld "waarschuw als mijn portfolio meer dan 5% in 24 uur daalt" of "als de totale waarde boven € 5.000 komt". Net als de prijsalerts wordt dit gecontroleerd zodra je de app opent.

### W28 – Bewegingsalert per munt
Een seintje als een munt meer dan een gekozen percentage in 24 uur stijgt of daalt (bijvoorbeeld 10%), zonder dat je een vaste koers hoeft te kiezen. Wordt gecontroleerd zodra je de app opent.

### W29 – Koopladder
Plan vooraf hoe je instapt, bijvoorbeeld "€ 200 bij −5%, € 300 bij −10%, € 500 bij −20%". De app laat zien welke stap bereikt is, waarschuwt bij het openen en vinkt een stap af als je de aankoop invoert.

### W30 – Verkoopladder
Hetzelfde voor winst nemen, bijvoorbeeld "verkoop 10% bij elke verdubbeling" of "een kwart bij +50%". Sluit aan bij W8.

### W31 – Slimme vaste inleg
Een variant op vaste inleg: meer inleggen als de koers laag staat en minder als hij hoog staat (bijvoorbeeld ten opzichte van het gemiddelde van de afgelopen 200 dagen). De app rekent ook terug wat dat in het verleden had opgeleverd.

## Administratie

### W4 – Staking-overzicht
Je ontvangen beloningen per munt en per jaar, in aantal en in euro's op het moment van ontvangst, met een geschat jaarrendement in procenten.

### W7 – Labels per transactie
Geef transacties een label, zoals "lange termijn", "trade" of "pensioen". Je kunt dan filteren op label en per label je rendement en inleg zien.

### W11 – Saldocontrole met je broker
Typ per munt het saldo over dat Bitvavo (of een wallet) toont. De app vergelijkt het met zijn eigen stand en markeert verschillen, zoals "0,42 ADA meer bij Bitvavo". Zo vind je snel een vergeten staking-beloning of een ontbrekende transactie. Bij cash werkt het net zo.

### W15 – Import uit andere brokers
Naast Bitvavo ook CSV-exports van bijvoorbeeld Coinbase, Kraken en Binance inlezen, met dezelfde controle op dubbele transacties en het koppelen van munten. Handig als je (ook) bij een andere broker zit of overstapt.

### W18 – Beleggingsdagboek
Leg bij een aankoop of verkoop vast waaróm je het deed ("dip gekocht na nieuws", "winst genomen"). Na 3, 6 en 12 maanden laat de app zien hoe die beslissing uitpakte, zodat je kunt terugkijken welke redenen goed werkten.

### W19 – Box 3-schatting
Op basis van je waarde op 1 januari (uit het jaaroverzicht) een schatting van de box 3-belasting. Het tarief, het vrije bedrag en een eventuele fiscale partner stel je zelf in, omdat de regels vaak veranderen. Duidelijk gemarkeerd als schatting.

### W32 – Aankopen in dollar of stablecoin
Een aankoop of verkoop in dollar, USDT of USDC invoeren. De app rekent die om naar euro tegen de koers van die dag. Handig samen met W15.

### W35 – Importherinnering
Een melding op het overzicht als je laatste Bitvavo-import (of transactie) lang geleden is, bijvoorbeeld "Je laatste import is 3 weken oud". Het aantal weken stel je zelf in.

## Grafieken

### W6 – Fijnere grafiek voor jonge munten
Bij munten die pas kort bestaan (zoals Axis Robotics) heeft de grafiek bij "1J" of "Max" maar een paar punten. CoinGecko geeft bij periodes van meer dan 90 dagen namelijk maar één koers per dag.

**Oplossing:** is de geschiedenis veel korter dan de gekozen periode, dan haalt de app de koersen opnieuw op voor precies die korte periode. Dat levert koersen per uur op. Rechtsonder in de grafiek staat dan "Koersen bekend vanaf …".

### W27 – Munten vergelijken in één grafiek
Twee of drie munten in één grafiek in procenten, ook munten die je niet hebt. Zo zie je welke het beste liep in dezelfde periode.

## Markt

### W24 – Marktsentiment
De bekende "angst- en hebzuchtmeter" (0–100) van alternative.me op het overzicht, met de stand van gisteren en vorige week. **Let op:** daarvoor moet er een extra dienst in de beveiligingsregels (CSP).

### W25 – Totale cryptomarkt en aandeel van bitcoin
De totale waarde van de cryptomarkt en het aandeel van bitcoin daarin, met de verandering in 24 uur. Komt van CoinGecko, dus er is geen extra dienst nodig.

### W26 – Volglijst met resultaat sinds toevoegen
Bij elke munt op de volglijst hoeveel hij gestegen of gedaald is sinds je hem ging volgen, bijvoorbeeld "+12% sinds 3 okt".

## Gemak

### W33 – Transactie herhalen
Eén tik op een bestaande transactie geeft een nieuw formulier met dezelfde munt, broker en hetzelfde bedrag, met de datum van nu.

### W34 – Overzicht zelf indelen
Blokken op het overzicht aan- of uitzetten en in een andere volgorde zetten. Je keuze geldt per apparaat.

### W36 – Notities per munt
Op de munt-pagina een eigen notitie: waarom je de munt hebt, handige links en je plan. Synchroniseert met je andere gegevens.

### W37 – Uitlegknopjes
Een klein ⓘ bij begrippen zoals "ongerealiseerd", "FIFO" of "netto gestort", met een uitleg in één of twee zinnen.

### W38 – Deelbare afbeelding
Een plaatje van je verdeling en je rendement in procenten, zonder bedragen, om te delen of te bewaren.

---

## Bewust niet op de lijst

- **Melding bij een prijsalert terwijl de app dicht is:** daarvoor is een eigen server nodig, en die heeft GitHub Pages niet.
- **Automatisch transacties ophalen bij Bitvavo:** daarvoor moet een geheime API-sleutel in de webapp staan, en Bitvavo staat verzoeken vanuit de browser waarschijnlijk niet toe. De CSV-import blijft de manier.
