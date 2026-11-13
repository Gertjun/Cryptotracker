# Herstelbackups

Deze map bevat onveranderlijke kopieën van bestaande bestanden die vóór een migratiewijziging zijn veiliggesteld.

## Afspraken

- Een backup wordt gemaakt vóór de eerste wijziging aan het bijbehorende bestaande bestand.
- Het pad onder `backup/` volgt het oorspronkelijke repositorypad; achter de bestandsnaam staat `.backup`.
- Bestaande backups worden nooit overschreven. Bij volgende wijzigingen blijft de eerste kopie de oorspronkelijke nulmeting.
- Nieuwe bestanden hebben geen voorafgaande backup nodig.
- Deze map is alleen voor herstel in de bronrepository en wordt niet opgenomen in de PWA-release-zip.
- Dit zijn codebackups, geen back-ups van gebruikersgegevens. Gegevensbestanden in SyncData vallen onder een apart, expliciet databehoudplan.

## Huidige backups

- `docs/PWA-CORE-MIGRATIE-ONTWERP.md.backup`: ontwerp zoals dat op de eerdere migratiebranch stond, vóór toevoeging van het goedgekeurde backupbeleid.
- `tools/release.py.backup`: release-script zoals aanwezig op `main` vóór de uitsluiting van de map `backup/` uit release-zipbestanden.
