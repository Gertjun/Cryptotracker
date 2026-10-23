# Wishlist – Crypto Portfolio

Functies die zijn voorgesteld, maar nog niet zijn ingebouwd.

**Zo werkt deze lijst**
- Elke wens heeft een vast nummer (W1, W2, …). Dat nummer verandert nooit, ook niet als er wensen bij komen of af gaan.
- Wordt een wens ingebouwd, dan verdwijnt hij hier. In de [changelog](CHANGELOG.md) staat dan bij die versie "(wens W3)", zodat je kunt terugvinden wat er van de wens is geworden.
- Nieuwe wensen krijgen het eerstvolgende vrije nummer.

---

## Inzicht in je portfolio

### W1 – Wat-als-calculator
Kies een munt en verschuif de koers, bijvoorbeeld "Bitcoin naar € 100.000". Je ziet meteen wat je portfolio dan waard is en wat je winst per munt en per transactie wordt. Daarbij staat de break-even-koers per munt, inclusief de kosten van verkopen.

### W5 – Kostenoverzicht
De betaalde kosten per broker en per jaar, en als percentage van je aankopen. Je ziet bijvoorbeeld of kleine aankopen je relatief veel kosten.

### W9 – Risico-inzicht
Per munt en voor je hele portfolio:
- de grootste daling vanaf de top (drawdown)
- hoe beweeglijk de koers is (volatiliteit)
- hoe geconcentreerd je bent, zoals "62% van je crypto zit in één munt"

### W10 – Maandafsluiting
De eerste keer dat je de app in een nieuwe maand opent, zie je een korte samenvatting van de vorige maand: resultaat, inleg, beste en slechtste munt, betaalde kosten en hoe je ervoor staat ten opzichte van je doelen.

## Kopen en verkopen voorbereiden

### W2 – Verkoopsimulator
Vul in hoeveel je wilt verkopen. Je ziet welke aankopen volgens FIFO worden afgeboekt, wat je gerealiseerde winst na kosten wordt en hoeveel cash je daarna hebt. Er wordt niets opgeslagen.

### W3 – Doelverdeling en herbalanceren
Leg een gewenste verdeling vast, bijvoorbeeld 50% BTC, 30% ETH en 20% cash. Je ziet hoeveel je ervan afwijkt en hoeveel euro je per munt zou moeten bij- of verkopen om weer in balans te komen.

### W8 – Winst- en verliesgrens per positie
Een alert op basis van je eigen positie in plaats van een vaste koers, bijvoorbeeld "waarschuw bij +50% op mijn ETH" of "bij −20% ten opzichte van mijn gemiddelde aankoopprijs". Zo kun je winst nemen of verlies beperken volgens een plan dat je vooraf hebt gemaakt.

## Administratie

### W4 – Staking-overzicht
Je ontvangen beloningen per munt en per jaar, in aantal en in euro's op het moment van ontvangst, met een geschat jaarrendement in procenten.

### W7 – Labels per transactie
Geef transacties een label, zoals "lange termijn", "trade" of "pensioen". Je kunt dan filteren op label en per label je rendement en inleg zien.

### W11 – Saldocontrole met je broker
Typ per munt het saldo over dat Bitvavo (of een wallet) toont. De app vergelijkt het met zijn eigen stand en markeert verschillen, zoals "0,42 ADA meer bij Bitvavo". Zo vind je snel een vergeten staking-beloning of een ontbrekende transactie. Bij cash werkt het net zo.

## Grafieken

### W6 – Fijnere grafiek voor jonge munten
Bij munten die pas kort bestaan (zoals Axis Robotics) heeft de grafiek bij "1J" of "Max" maar een paar punten. CoinGecko geeft bij periodes van meer dan 90 dagen namelijk maar één koers per dag.

**Oplossing:** is de geschiedenis veel korter dan de gekozen periode, dan haalt de app de koersen opnieuw op voor precies die korte periode. Dat levert koersen per uur op. Rechtsonder in de grafiek staat dan "Koersen bekend vanaf …".

---

## Bewust niet op de lijst

- **Melding bij een prijsalert terwijl de app dicht is:** daarvoor is een eigen server nodig, en die heeft GitHub Pages niet.
- **Automatisch transacties ophalen bij Bitvavo:** daarvoor moet een geheime API-sleutel in de webapp staan, en Bitvavo staat verzoeken vanuit de browser waarschijnlijk niet toe. De CSV-import blijft de manier.
