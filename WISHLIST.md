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

## Kopen en verkopen voorbereiden

### W8 – Winst- en verliesgrens per positie
Een alert op basis van je eigen positie in plaats van een vaste koers, bijvoorbeeld "waarschuw bij +50% op mijn ETH" of "bij −20% ten opzichte van mijn gemiddelde aankoopprijs". Zo kun je winst nemen of verlies beperken volgens een plan dat je vooraf hebt gemaakt.

### W16 – Alert op je hele portfolio
Naast prijsalerts per munt een melding voor je totale waarde, bijvoorbeeld "waarschuw als mijn portfolio meer dan 5% in 24 uur daalt" of "als de totale waarde boven € 5.000 komt". Net als de prijsalerts wordt dit gecontroleerd zodra je de app opent.

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

## Grafieken

### W6 – Fijnere grafiek voor jonge munten
Bij munten die pas kort bestaan (zoals Axis Robotics) heeft de grafiek bij "1J" of "Max" maar een paar punten. CoinGecko geeft bij periodes van meer dan 90 dagen namelijk maar één koers per dag.

**Oplossing:** is de geschiedenis veel korter dan de gekozen periode, dan haalt de app de koersen opnieuw op voor precies die korte periode. Dat levert koersen per uur op. Rechtsonder in de grafiek staat dan "Koersen bekend vanaf …".

---

## Bewust niet op de lijst

- **Melding bij een prijsalert terwijl de app dicht is:** daarvoor is een eigen server nodig, en die heeft GitHub Pages niet.
- **Automatisch transacties ophalen bij Bitvavo:** daarvoor moet een geheime API-sleutel in de webapp staan, en Bitvavo staat verzoeken vanuit de browser waarschijnlijk niet toe. De CSV-import blijft de manier.
