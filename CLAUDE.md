# CLAUDE.md – werkafspraken voor Claude

## Aan het begin van een sessie
1. Lees het blok **Stand** in **`README.md`**, **`ROADMAP.md`** (open punten en wensen), **`ARCHITECTUUR.md`** (opbouw, code-indeling, conventies, stijl) en **`DECISIONS.md`** (eerdere besluiten). In het claude.ai-project staan kopieën onder `claude/`.
2. Lees daarna alleen de code die je voor de vraag nodig hebt. Zoek in `app.js` op functienaam (zie ARCHITECTUUR §3); lees niet het hele bestand.
3. Lees **niet** de volledige chatgeschiedenis of de hele `CHANGELOG.md`. De bovenste paar versies in de changelog zijn genoeg.
4. Bij HTML/CSS: volg `html-best-practices.md` uit het claude.ai-project.
5. Koppel de GitHub-repository `Gertjun/Cryptotracker` met schrijfrechten (`add_repo` met `access: push`; de Claude GitHub-app is geïnstalleerd). Haal vóór het pushen eerst `git fetch origin main` en zet je werk erbovenop.

## Tijdens het werk
- **Antwoord:** in het Nederlands, kort en zonder vakjargon, want Geert heeft geen IT-achtergrond.
- **Vraagt hij "hoe zou je …" of "implementeer het nog niet":** leg het uit en **wacht op akkoord**. Bouw pas als hij "bouw het in" of iets dergelijks zegt.
- **Elke wijziging is een eigen versie:**
  1. code aanpassen en tests draaien;
  2. wijzigingen op een eigen featurebranch vastleggen en als PR aanbieden;
  3. GitHub Actions op de actuele PR-head controleren;
  4. **niet mergen, releasen of deployen zonder afzonderlijk expliciet akkoord**;
  5. na akkoord de afgesproken versie-/releaseprocedure volgen (`tools/release.py`). Een gebouwd roadmappunt haal je weg met `python3 tools/wish.py W3` en noteer je in de changelog als "(wens W3)".
- **Een wijziging alleen aan de documenten** (README, ROADMAP, ARCHITECTUUR, DECISIONS, CLAUDE.md) krijgt geen nieuwe appversie.
- **Bij een nieuw bestand of een nieuwe map:** noem het in de samenvatting.
- **Screenshots:** controleer het versienummer in Instellingen, want een oude versie uit de cache was eerder de oorzaak van een "bug".
- **Vóór elke release** (zie ook `tests/README.md`):
  - `cd tests && npm ci && npx playwright test` (lokaal met `CHROMIUM_PATH=/opt/pw-browsers/chromium`);
  - `npx html-validate ../index.html`;
  - waar zinvol een screenshot op telefoon (390 px) en laptop (1440 px).
- Ga je in tegen een besluit uit `DECISIONS.md`? Zeg dat en vraag het eerst.

## Aan het eind van een sessie (altijd)
1. Het blok **Stand** in **`README.md`** overschrijven met de stand van nu (versie, wat is getest, wat nog niet). Geen sessielog: de geschiedenis staat in `CHANGELOG.md`.
2. **`ROADMAP.md`**: nieuwe open punten, praktijktests en wensen met het volgende vrije W-nummer; afgeronde punten eruit.
3. **`DECISIONS.md`**: een nieuw `D<n>`-besluit voor elke keuze die een volgende sessie moet kennen. Oude besluiten pas je niet aan; een nieuw besluit vervangt een oud ("vervangt D8").
4. **`ARCHITECTUUR.md`**: alleen als de structuur, conventies of stijl veranderden, bijvoorbeeld bij nieuwe functies, opslag, breakpoints of kleuren.
5. Neem de bijgewerkte documenten op in de featurebranch en PR. **Merge niet zonder afzonderlijk expliciet akkoord.** Werk daarna ook het claude.ai-project bij via Projects-tool, `project_write` met `local_path`, paden `claude/README.md`, `claude/ROADMAP.md`, `claude/DECISIONS.md` en `claude/ARCHITECTUUR.md`.
