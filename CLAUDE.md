# CLAUDE.md – werkafspraken voor Claude

## Aan het begin van een sessie
1. Lees **`ARCHITECTUUR.md`** (opbouw, code-indeling, conventies, stijl), **`NOTES.md`** (actuele stand, werkwijze, open punten) en **`DECISIONS.md`** (eerdere besluiten). In het claude.ai-project staan ze als `claude/ARCHITECTUUR.md`, `claude/NOTES.md` en `claude/DECISIONS.md`.
2. Lees daarna alleen de code die je voor de vraag nodig hebt. Zoek in `app.js` op functienaam (zie ARCHITECTUUR §3); lees niet het hele bestand.
3. Lees **niet** de volledige chatgeschiedenis of de hele `CHANGELOG.md`. De bovenste paar versies in de changelog zijn genoeg.
4. Bij HTML/CSS: volg `html-best-practices.md` uit het claude.ai-project.
5. Koppel de GitHub-repository met schrijfrechten (zie NOTES §1).

## Tijdens het werk
- Volg de werkwijze in NOTES §1. Kort samengevat:
  - **Taal en uitleg:** Nederlands, en eenvoudige uitleg zonder vakjargon.
  - **"Hoe zou je…" of "nog niet bouwen":** eerst uitleggen en wachten.
  - **Elke wijziging is een eigen versie:** tests, `tools/release.py`, daarna rechtstreeks naar `main` pushen (D35).
- Ga je in tegen een besluit uit `DECISIONS.md`? Zeg dat en vraag het eerst.
- Draai vóór elke release de tests (`tests/README.md`).

## Aan het eind van een sessie (altijd)
1. **`NOTES.md`**
   - versie en datum bovenaan;
   - §3 open punten en bekende problemen (opgelost eruit, nieuw erin, en de wishlist-stand);
   - §4 sessielog: één of twee regels, bovenaan.
2. **`DECISIONS.md`**: een nieuw `D<n>`-besluit voor elke keuze die een volgende sessie moet kennen. Oude besluiten pas je niet aan; een nieuw besluit vervangt een oud ("vervangt D8").
3. **`ARCHITECTUUR.md`**: alleen als de structuur, conventies of stijl veranderden, bijvoorbeeld bij nieuwe functies, opslag, breakpoints of kleuren.
4. Push ze naar `main`, en zet ze ook in het claude.ai-project: Projects-tool, `project_write` met `local_path`, paden `claude/NOTES.md`, `claude/DECISIONS.md` en `claude/ARCHITECTUUR.md`. Bestaande bestanden worden dan vervangen.
