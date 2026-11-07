# Scale V11 — checkpoint sperimentale respinto

Questo esperimento **non è integrato nel gioco**. Conserva il prototipo di salita a corpo continuo e le misure sui 16 disegni effettivi. La V10 pubblicata e la camminata approvata rimangono separate.

Il candidato supera il limite di contatto di 3,5 px: fino a **14,07 px in orizzontale e 13,82 px in verticale** a H266. Mancano inoltre ingresso, raccolta sul pianerottolo, inversione e discesa completa. I test del controller non certificano la qualità dei disegni.

## Verifica

Dalla radice del repository, con Node.js 18 o successivo, senza installare pacchetti:

```sh
node --test experiments/stairs-ascent-v11/ascent-cycle.test.mjs
node experiments/stairs-ascent-v11/validate-candidate.mjs
```

I **6 unit test** devono passare. Il secondo comando deve terminare con **exit code 1** e `accepted: false`: è il risultato previsto del gate, non un errore di installazione. Il comando aggiorna solo `acceptance-report.json` in questa cartella.

## Materiali

- [Prova video](ascent-candidate-01.mp4), [tavola nel fondale](actual-poses-in-room.png) e [player locale](review.html).
- [Audit](audit.txt), [piano di correzione per ciascuna posa](repair-plan.json) e [misure effettive](measured-frames-candidate-01.json).
- [Guide geometriche](curved-sixteen-targets.json): obiettivi per il disegno, non misure dei PNG.
- Moduli isolati: `ascent-cycle.mjs`, `ascent-motion.mjs`, `ascent-renderer.mjs`. Il renderer usa Canvas nel browser e restituisce esplicitamente `false` per le transizioni mancanti.

Le immagini sorgenti e l'atlante candidato sono conservati in [art/stairs-v10](../../art/stairs-v10/), in particolare `stair-up-sixteen-candidate-01.png`. I riferimenti `atlas` e `source` nei metadata sono relativi a quella cartella. Le chiavi originali 0, 4, 8, 12 vanno preservate; le altre dodici pose restano da correggere.

Sono inclusi il video e la tavola già renderizzati; sono esclusi i 159 PNG intermedi e gli script locali che richiedono Sharp. L'esperimento importa soltanto la geometria condivisa [dist/room-layout.js](../../dist/room-layout.js), senza modificarla.
