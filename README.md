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

Een nieuwe versie komt vanzelf binnen. Naast de appnaam (laptop) of bovenin (telefoon) staat dan "update beschikbaar". Het versienummer staat in de hoofdbalk.

## Je gegevens

- Alles staat **op je eigen apparaat**, in de browser.
- **Synchroniseren tussen apparaten** kan via één bestand in een **privé-repository op GitHub**. Dat bestand is versleuteld met een wachtwoord dat alleen jij kent; GitHub ziet alleen onleesbare tekst. Een nieuw apparaat koppel je met een koppelcode en een pincode.
- Elke synchronisatie wordt op GitHub bewaard, dus je kunt een **eerdere versie terugzetten**.
- De app praat alleen met deze website, met **CoinGecko** (koersen), met **alternative.me** (marktsentiment, uit te zetten in Instellingen) en met **GitHub** (synchronisatie). Andere verbindingen worden door de browser geblokkeerd.
- Optioneel kun je de app **vergrendelen** met Face ID / Touch ID (passkey) en een herstelwachtwoord.

> Ben je het wachtwoord kwijt, dan kan niemand de gesynchroniseerde gegevens nog openen. Bewaar het goed.

## Waar vind je wat

Elk onderwerp staat op één plek (D62).

| | Vraag | Bestand |
| --- | --- | --- |
| Heden | Waar staan we nu, wat doet de app? | dit bestand, `README.md` |
| Heden | Hoe zit de code in elkaar (opbouw, conventies, stijl)? | [`ARCHITECTUUR.md`](ARCHITECTUUR.md) |
| Toekomst | Wat moet of kan er nog gebeuren? | [`ROADMAP.md`](ROADMAP.md) |
| Verleden | Wat is er per versie veranderd? | [`CHANGELOG.md`](CHANGELOG.md) |
| Verleden | Waarom is iets zo gekozen? | [`DECISIONS.md`](DECISIONS.md) |

Werkafspraken voor Claude: [`CLAUDE.md`](CLAUDE.md). Testen: [`tests/README.md`](tests/README.md). Ontwerp en plan van de overstap naar PWA-Core (momentopnamen): map `docs/`.

## Stand

Bijgewerkt: 20 november 2026 · `main` **4.0.6** met PWA-Core v1.3.0 (cache `crypto-portfolio-4.0.6-core1.3.0`). Dit blok wordt aan het eind van elke sessie overschreven.

- Apparaatkoppeling via het gedeelde protocol PWA-CORE-PAIR-2 (PR #52): alleen owner, repo, branch, pad en token gaan over; het kluiswachtwoord vul je op het nieuwe apparaat apart in. Oude CPK1/CPK2-koppelcodes worden geweigerd.
- Strengere controle van back-uptransacties (PR #57) en behoud van de grafiekcache bij legacy-opruiming (PR #58, #59) zijn op 19 november gemerged. Na PR #59 slaagden de tests, de PWA-Core-controle en de publicatie op GitHub Pages.
- Praktijktest van 4.0.6 op 20 november door Geert geslaagd op echte apparaten: passkeys (iPhone met Face ID, Windows Hello), hergebruik, annuleren en wachtwoord als terugval, koppelen en synchroniseren in beide richtingen, offline wijzigen en herstel, installeren en offline werken, opruimen van de oude opslag en gegevens behouden na herstart. Op `c20cf094` slaagden ook de automatische tests, de PWA-Core-controle en de publicatie op GitHub Pages.
- 4.0.6 is op 20 november officieel uitgebracht (tag `v4.0.6`). Sindsdien zijn alleen de documenten en het versiescript bijgewerkt (W54); de app zelf is ongewijzigd.

**Goed om te weten**
- GitHub Pages cachet 10 minuten. De service worker vangt dat op sinds 3.3.2; een apparaat met een heel oude versie heeft het één keer.
- De bescherming met de gegevensversie (D32) werkt alleen op apparaten met 3.19.0 of nieuwer. Werk alle apparaten bij voordat `DATA_V` ooit omhoog gaat.
- De app draait bewust niet op het PWA-template, wel op PWA-Core (D36).
- Controleer bij een screenshot met een "bug" eerst het versienummer in Instellingen: een oude versie uit de cache was eerder de oorzaak.

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
| `ROADMAP.md` | Wat er nog moet gebeuren: open punten, praktijktests en wensen. |
| `tests/` | Automatische tests (zie [tests/README.md](tests/README.md)). |
| `tools/` | Hulpscripts om een nieuwe versie uit te brengen. |
| `ARCHITECTUUR.md`, `DECISIONS.md`, `CLAUDE.md` | Opbouw van de code, besluiten en werkafspraken voor verdere ontwikkeling. |

De app is gewoon HTML, CSS en JavaScript, zonder framework of bouwstap. GitHub Pages publiceert de bestanden in de hoofdmap.

## Versies en tests

- Versienummers hebben de vorm `MAJOR.MINOR.PATCH`. **MAJOR** betekent dat je iets moet doen (bijvoorbeeld alle apparaten bijwerken), **MINOR** een nieuwe functie, **PATCH** een verbetering of foutoplossing. Zie de [changelog](CHANGELOG.md).
- Bij elke wijziging draaien op GitHub automatisch tests op telefoon- en laptopformaat (tabblad **Actions**): schermen, berekeningen, synchronisatie, toegankelijkheid en updates.

## Let op

Dit is een persoonlijk hulpmiddel, geen financieel of belastingadvies. Controleer belangrijke bedragen altijd bij je broker of exchange.
