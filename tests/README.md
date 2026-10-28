# Tests – Crypto Portfolio

Automatische tests die controleren of de app nog goed werkt na een wijziging. Ze draaien vanzelf op GitHub bij elke upload (tabblad **Actions**), en je kunt ze ook op je eigen computer draaien.

## Wat wordt getest

| Bestand | Wat |
|---|---|
| `specs/smoke.spec.mjs` | Alle schermen openen zonder JavaScript-fouten of blokkades door de beveiligingsregels (CSP), ook een lege app. |
| `specs/a11y.spec.mjs` | Toegankelijkheid (WCAG 2.2 AA) met axe-core, in het donkere en lichte thema, en de portfoliografiek met het toetsenbord. |
| `specs/calc.spec.mjs` | Berekeningen: cash, inleg en gerealiseerde winst uit de test-export; grafiek en tabel tonen hetzelfde percentage; bitcoinweergave; afronding in formulieren; de verkoopsimulator. |
| `specs/sync.spec.mjs` | Versleutelde GitHub-synchronisatie tussen twee apparaten, inclusief portefeuilles en verwijderen, en een nieuw apparaat koppelen met koppelcode en pincode (met een nep-GitHub). |
| `specs/columns.spec.mjs` | Kolommen van de tabel Bezittingen verplaatsen, verbergen, bewaren en standaard herstellen; de keuze komt mee bij het samenvoegen van twee apparaten; de Volglijst heeft dezelfde kolommen; op een brede laptop is er geen schuifbalk. |
| `specs/coingecko.spec.mjs` | Verzoeken aan CoinGecko blijven binnen de limiet (6 direct, daarna 15 per minuut; met sleutel 10 en 30). |
| `specs/update.spec.mjs` | Een nieuwe versie komt direct binnen, ook als de server de browser laat cachen (zoals GitHub Pages). |
| `npm run test:html` | De HTML voldoet aan de standaard (html-validate). |

Alles draait op twee schermformaten: **telefoon** (iPhone 13) en **laptop** (1440 × 900).

De tests gebruiken **nep-koersen** (`mock.mjs`) en een **vaste datum** (26 oktober 2026). Er gaat dus niets naar CoinGecko of GitHub, en de uitkomsten zijn elke keer gelijk. De test-export `fixtures/dummy-bitvavo-export.csv` bevat 85 verzonnen Bitvavo-regels.

## Zelf draaien

Je hebt [Node.js](https://nodejs.org) 22 of nieuwer nodig.

```bash
cd tests
npm ci
npx playwright install chromium
npm run test:all
```

Bij een fout maakt Playwright een rapport met schermafbeeldingen: `npx playwright show-report`.

## Op GitHub

- Bij elke upload start **Actions › Tests** vanzelf. Bij de commit verschijnt een groen vinkje of een rood kruisje.
- Bij een rood kruisje staat onder de mislukte run bij **Artifacts** het `testrapport` om te downloaden.
- Een run met de hand starten kan via **Actions › Tests › Run workflow**.

De tests hebben geen invloed op de app zelf; GitHub Pages blijft gewoon de bestanden in de hoofdmap publiceren.
