# Crypto Portfolio

Een persoonlijke app om je crypto-investeringen bij te houden: wat je hebt gekocht en verkocht, wat het nu waard is en hoeveel winst of verlies je per munt en per aankoop hebt. De opzet lijkt op de Delta-app van eToro.

**Openen:** <https://gertjun.github.io/Cryptotracker/>

De app werkt in de browser en is te installeren op het beginscherm van je iPhone, iPad of laptop. Er is geen account en geen eigen server nodig.

---

## Wat kun je ermee

- **Overzicht:** totale waarde, inleg, cash en (on)gerealiseerde winst, met een grafiek over 1 uur tot alles (Max).
- **Per munt:** koersgrafiek, je aankopen en verkopen, gemiddelde aankoopprijs, resultaat per aankoop, marktinformatie en prijsalerts.
- **Transacties:** aankopen, verkopen, stortingen, opnames, ontvangsten en overboekingen. Importeren uit een Bitvavo-export (CSV) en exporteren naar CSV.
- **Weergave in €, $ of ₿:** in bitcoin zie je of je beter had gedaan door alleen bitcoin te houden. De administratie blijft altijd in euro.
- **Meerdere portefeuilles**, los te bekijken of samen.
- **Analyse** in vier tabbladen: Rendement, Vergelijken, Plannen en Administratie.
- **Hulpmiddelen:** doelen, vaste inleg, doelverdeling, wat-als, risico, gemiddelde-prijs-calculator en verkoopsimulator.
- **Licht en donker thema**, of automatisch volgens je apparaat.

Winst en kostprijs worden berekend volgens **FIFO**: bij een verkoop tellen de oudste aankopen eerst. Kosten tellen mee in de aankoopprijs.

## Installeren op je beginscherm

- **iPhone/iPad (Safari):** open de link, tik op het deelicoon en kies **Zet op beginscherm**.
- **Laptop (Chrome of Edge):** open de link en klik in de adresbalk op het installeericoon.

Een nieuwe versie komt vanzelf binnen. Naast de appnaam (laptop) of bovenin (telefoon) staat dan "update beschikbaar". Het versienummer zie je onder **Instellingen**.

## Je gegevens

- Alles staat **op je eigen apparaat**, in de browser.
- **Synchroniseren tussen apparaten** kan via één bestand in een **privé-repository op GitHub**. Dat bestand is versleuteld met een wachtwoord dat alleen jij kent; GitHub ziet alleen onleesbare tekst. Een nieuw apparaat koppel je met een koppelcode en een pincode.
- Elke synchronisatie wordt op GitHub bewaard, dus je kunt een **eerdere versie terugzetten**.
- De app praat alleen met deze website, met **CoinGecko** (koersen) en met **GitHub** (synchronisatie). Andere verbindingen worden door de browser geblokkeerd.
- Optioneel kun je de app **vergrendelen** met Face ID / Touch ID (passkey) en een herstelwachtwoord.

> Ben je het wachtwoord kwijt, dan kan niemand de gesynchroniseerde gegevens nog openen. Bewaar het goed.

## Koersen

De koersen komen van [CoinGecko](https://www.coingecko.com). Zonder sleutel duurt de eerste keer laden met veel munten 10 tot 15 seconden. Met een gratis **Demo-sleutel** van CoinGecko (in te vullen onder Instellingen) gaat het sneller.

## Wat staat er in deze repository

| Bestand of map | Inhoud |
|---|---|
| `index.html` | De pagina en alle opmaak. |
| `app.js` | Alle werking van de app. |
| `sw.js` | Zorgt dat de app offline werkt en updates direct binnenkomen. |
| `manifest.json`, `icon*` | Naam en iconen voor het beginscherm. |
| `CHANGELOG.md` | Alle versies en wat er veranderde. |
| `WISHLIST.md` | Ideeën die nog niet gebouwd zijn. |
| `tests/` | Automatische tests (zie [tests/README.md](tests/README.md)). |
| `tools/` | Hulpscripts om een nieuwe versie uit te brengen. |
| `ARCHITECTUUR.md`, `NOTES.md`, `DECISIONS.md`, `CLAUDE.md` | Achtergrond en werkafspraken voor verdere ontwikkeling. |

De app is gewoon HTML, CSS en JavaScript, zonder framework of bouwstap. GitHub Pages publiceert de bestanden in de hoofdmap.

## Versies en tests

- Versienummers hebben de vorm `MAJOR.MINOR.PATCH`. **MAJOR** betekent dat je iets moet doen (bijvoorbeeld alle apparaten bijwerken), **MINOR** een nieuwe functie, **PATCH** een verbetering of foutoplossing. Zie de [changelog](CHANGELOG.md).
- Bij elke wijziging draaien op GitHub automatisch tests op telefoon- en laptopformaat (tabblad **Actions**): schermen, berekeningen, synchronisatie, toegankelijkheid en updates.

## Let op

Dit is een persoonlijk hulpmiddel, geen financieel of belastingadvies. Controleer belangrijke bedragen altijd bij je broker of exchange.
