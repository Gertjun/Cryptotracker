# PWA-Core-migratieontwerp – Crypto Portfolio

Status: ontwerp voor de featurebranch `feat/pwa-core-v1.0.0-migration`  
Basis: Cryptotracker `main` op `d1d380408cda9cec6e3dc777c89610d16f681b47`  
Core-pin: PWA-Core `v1.0.0`, commit `1a9c31f489290853fdc3aa4e62f199b21a338030`

## Doel

De bestaande Crypto Portfolio-functionaliteit en het bestaande gegevensmodel behouden, terwijl de generieke kluis, versleuteling, synchronisatie, passkey-beveiliging en verwijderadministratie door PWA-Core worden beheerd.

## Gegevensbestanden

- Bestaand bestand: `Gertjun/SyncData/crypto-portfolio.enc.json`.
- Dit bestand blijft tijdens en na de migratie ongewijzigd en wordt uitsluitend gelezen voor de eenmalige import.
- Nieuw Core-bestand: `Gertjun/SyncData/crypto-portfolio.pwa-core-v1.json`.
- PWA-Core synchroniseert uitsluitend met het nieuwe pad. De oude synchronisatiecode mag vanuit de gemigreerde app geen GitHub-schrijfacties meer uitvoeren.
- De nieuwe Core-envelop gebruikt het Core-formaat. De oude envelop wordt alleen met de bestaande Crypto Portfolio-ontsleuteling gelezen.

## Lokale gegevens en opslag

- Oude sleutels zoals `cpt.data`, `cpt.settings`, `cpt.lock` en `cpt.vault` blijven bestaan.
- Core gebruikt de prefix `cpt` met de Core-scheidingstekens (`cpt:...`). De oude sleutels met punten (`cpt....`) zijn andere opslagnamen. Dit wordt expliciet getest.
- Als de oude lokale kluis vergrendeld is, moet de gebruiker deze op het apparaat eenmalig met de bestaande herstelmethode ontgrendelen voordat de lokale gegevens naar de Core-kluis kunnen.
- De migratie verwijdert geen oude lokale kluis- of back-upbestanden. Na bevestigde import leest de nieuwe app de Core-kluis als bron.

## Compatibiliteit van het gegevensmodel

- Behoud alle onbekende top-level velden en bestaande transactievelden.
- Behoud de bestaande merge-regels voor transacties, instellingen, koershistorie en collecties.
- Zet oude verwijdermarkeringen (`deleted[]` en `del:true`) om naar de blijvende Core-verwijderadministratie (`__pwaSync`).
- Verwijder geen tombstones op basis van leeftijd. De Core-ledger blijft leidend om terugkeer uit oude back-ups of lang offline apparaten te voorkomen.
- Houd het bestaande app-gegevensversienummer (`v`) gescheiden van Core's `schema`.

## Interface en overgang

De uitgebreide bestaande interface blijft tijdens deze pilot behouden als een compatibiliteitslaag. De PWA-Core-schil beheert de kluis en sync; de bestaande app-interface werkt met een gecontroleerde brug naar de Core-data. De oude GitHub-sync wordt in de ingebedde interface geblokkeerd. De interface mag alleen de oude syncfile lezen via de Core-client en na expliciete invoer van het oude sync-wachtwoord.

Deze overgang voorkomt een gelijktijdige herschrijving van de vele portfolio-, FIFO-, analyse-, koers- en importfuncties. Een latere volledige herbouw kan afzonderlijk worden overwogen, maar valt niet stilzwijgend binnen deze migratie.

## Passkeys

De bestaande Crypto Portfolio-passkeys gebruiken een andere PRF-invoer dan PWA-Core. De bestaande credential kan mogelijk opnieuw worden ingeschreven via de Core-functie voor een bestaande passkey; de afgeleide sleutel is dan nieuw. Dit wordt niet als bewezen beschouwd voordat het op een echte iPhone/Safari en een tweede apparaat is getest. De oude lokale kluis blijft tijdens de migratie intact.

## Acceptatie vóór PR

- Alle bestaande Playwright-regressietests blijven slagen.
- Unit-tests controleren merge, onbekende velden, lokale import en verwijderledger.
- Core-contracttests controleren kluis, synchronisatie, passkey-flow en tombstones.
- Browseracceptatie: bestaande lokale data, vergrendelde lokale kluis, read-only import van het oude GitHub-bestand, schrijven naar uitsluitend het nieuwe Core-bestand, offline herstart en synchronisatie tussen twee apparaten.
- CI-groen is geen vervanging voor de echte iPhone-/twee-apparatentest.

## Veiligheidsgrenzen

- Geen wijziging of verwijdering van `crypto-portfolio.enc.json`.
- Geen wijziging aan repository-instellingen, branch rules of Pages-instellingen.
- Geen push naar `main` en geen merge door de migratie-assistent.
- Alle wijzigingen uitsluitend op deze featurebranch; PR blijft ter beoordeling.
