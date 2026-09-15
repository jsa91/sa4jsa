# SA4JSA — Grunder i fysik & radioteknik

**[Öppna utbildningen](https://jsa91.github.io/01-jupyter/)**

[Läs originalet som Markdown](utbildningen/html/index.md).

## Föreläsningen som webbplats

Webbplatsen har en introduktion, fem kapitelsidor och interaktiva demonstrationer
av sinusvågen samt tids- och frekvensdomänen. Språket är svenska. Reglagen kör
beräkningar i webbläsaren; besökaren behöver varken Python eller Codespaces.

### Under föreläsningen

Öppna <https://jsa91.github.io/01-jupyter/> och välj kapitel i menyn. Kapitel 1
och 2 innehåller interaktiva reglage. Kapitel 2 börjar med en signal; välj fler
under **Antal signaler**. **Återställ** återgår till grundvärdena. Ändringar med
reglagen gäller bara i din webbläsare och sparas inte till webbplatsen.

Studenterna kan använda samma länk utan att logga in på GitHub.

### Ändra text direkt på GitHub

1. Öppna [lecturefilen på GitHub](https://github.com/jsa91/01-jupyter/blob/main/utbildningen/html/index.md)
   och klicka på pennan (**Edit this file**).
2. Ändra texten. Behåll kapitelomslagen (`<details>`, `<summary>`) och rubrikernas
   `chapter-…`-id så att bygget och kapitellänkarna fungerar.
3. Klicka **Commit changes**, skriv en kort beskrivning och spara till `main`.
   Om du använder en separat gren behöver den först slås ihop med `main`.
4. Följ [publiceringen under Actions](https://github.com/jsa91/01-jupyter/actions/workflows/pages.yml).
   När **Publish lecture to GitHub Pages** är grön är den nya versionen publicerad.
   Ladda om föreläsningssidan för att se ändringarna.

Varje push till `main` bygger och publicerar webbplatsen automatiskt. Du behöver
inte bygga lokalt eller ladda upp `dist/` själv när du använder GitHub Pages.

### Arbeta i Codespaces eller på din dator

Kör kommandona i repots rot. I den här Codespace-miljön är det
`/workspaces/codespaces-jupyter/notebooks`.

```sh
# Hämta ändringar innan du börjar redigera
git pull --ff-only

# Första gången, eller när package-lock.json har ändrats
npm ci
```

Redigera `utbildningen/html/index.md`. Bilder ligger i samma katalog; ersätt en
befintlig bild med samma filnamn eller lägg till en bild och länka till den i
Markdown. Förhandsgranska med kommandona nedan och publicera sedan:

```sh
git add utbildningen/html/
git commit -m "Uppdatera föreläsningen"
git push origin main
```

Om du ändrar webbplatsens utseende eller reglage, lägg även till de berörda
filerna i `website/` med `git add` innan du gör en commit.

### Om publiceringen misslyckas

Öppna den röda körningen under **Actions** och läs felet i steget som misslyckats.
Rätta filen och gör en ny commit till `main`. Om ett nytt bygge misslyckas ligger
den tidigare publicerade versionen kvar. Du kan även starta en ny publicering
med **Run workflow** på workflow-sidan och välja `main`.

För att ångra en publicerad textändring: återställ texten och gör en ny commit.
I en lokal klon kan du använda `git revert <commit-id>` och sedan `git push`.

Publiceringen konfigureras under
[Settings → Pages](https://github.com/jsa91/01-jupyter/settings/pages), med
**GitHub Actions** som källa. Endast det genererade innehållet i `dist/` publiceras.

### Bygg och förhandsgranska

Kör följande från den här katalogen (`notebooks/`). Node.js 20 eller senare behövs
på datorn som bygger webbplatsen.

```sh
npm ci
npm run build
npm run preview
```

Öppna <http://localhost:4173>. I Codespaces kan du öppna port 4173 via fliken
**Ports**. Avsluta förhandsgranskningen med Ctrl+C.

### Uppdatera materialet

Redigera [utbildningen/html/index.md](utbildningen/html/index.md) som vanligt och
kör `npm run build` igen. Kapitelindelningen hämtas från de fem befintliga
`<details>`-sektionerna och deras rubriker med `chapter-…`-id. Behåll dessa id:n
så att länkarna fortsätter fungera. Bilderna kopieras från samma katalog.
Bygget visar kapiteltexten utan de hopfällbara omslagen och länkar mellan sidorna.

Originalbilderna och [kodnotebooken](utbildningen/code_generator.ipynb) finns kvar.
De två demonstrationerna är JavaScript-versioner av notebookens beräkningar,
inte en Python-miljö. Om beräkningarna ändras i notebooken behöver motsvarande
ändring göras i `website/signals.mjs` och verifieras med testerna.

### Publicera på en webbserver

Ladda upp **innehållet i `dist/`**, inklusive `assets/` och bilderna, till önskad
katalog på webbservern. Startsidan är `index.html`. Webbplatsen fungerar även i
en underkatalog, exempelvis `https://example.org/utbildningen/`.

Servern behöver bara leverera statiska filer över HTTP eller HTTPS och skicka
`.mjs` som JavaScript (`text/javascript` eller `application/javascript`). Den
behöver inte Node.js, Python eller en databas. Använd HTTP-förhandsgranskningen
i stället för att dubbelklicka på HTML-filerna, eftersom JavaScript-moduler kräver
att filerna serveras. `npm run preview` är för lokal förhandsgranskning.

Alla resurser för text, formler och demonstrationer följer med i `dist/`;
webbplatsen laddar inga externa bibliotek eller typsnitt. En server på ett lokalt
nätverk kan därför användas utan internet. Externa lästips kräver internet.
Reglagen återgår till grundvärdena när sidan laddas om.

### Kontrollera ändringar

```sh
# Beräkningar mot NumPy (kräver python3 med numpy)
npm test

# Installera testwebbläsarna en gång
npx playwright install chromium firefox

# Chromium och Firefox, både serverrot och underkatalog
npm run test:browser
```

Webbläsartesterna startar egna servrar på port 4173 och 4174. Stoppa en eventuell
förhandsgranskning innan du kör dem. På en Linux-dator kan Playwright även behöva
systembibliotek: `npx playwright install-deps chromium firefox`.
