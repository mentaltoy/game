# Salita — provino di due passi V12

Prova isolata richiesta da Nicola il 7 novembre 2026: due gradini centrali nel fondale originale, prima di estendere la salita al percorso completo. La discesa è stata giudicata accettabile nell’ultimo riscontro e rimane invariata, come camminata e corsa.

Il player presenta velocità normale, rallentatore e dettaglio. La figura usa immagini complete: nessun rig degli arti, morph o dissolvenza. La traiettoria della testa è continua, con una sola scala fisica di 266/500. Una registrazione cromatica limitata viene applicata una volta alle immagini complete; conserva alpha e pennellate e non modifica il PNG originale.

**Stato: provino da rivedere, non animazione approvata.** Alcuni appoggi e soprattutto il passaggio del piede libero nel secondo passo restano bruschi. Il superamento dei test del controller non equivale alla precisione dei disegni. Le misure di accettazione sono conservate insieme alla prova; non è stata sostituita la salita nel gioco.

## Materiali e riproduzione

- `index.html`: player locale, da servire dalla radice del repository.
- `atlas.png`, `frames.json`: immagini e punti realmente misurati, non soltanto coordinate desiderate.
- `source/`: candidati e prompt della generazione built-in image_gen, con trasparenza richiesta. Le tavole complete e la prima coppia sono state respinte; i loro prompt restano documentati.
- `colour-audit.json`: correzioni RGB statiche e misure prima/dopo.
- `ascent-cycle.mjs`: geometria isolata del provino, derivata dall’esperimento V11.
- Il player pubblicabile corrispondente è in `dist/stair-study/`; le immagini del gioco e i moduli del movimento approvato non vengono modificati.

La prova inizia già in appoggio su un gradino e termina al contatto dopo due passi. Ingresso dal pavimento, raccolta sul pianerottolo e inversione non sono simulati.

## Riferimenti

- [Flashback](https://www.youtube.com/watch?v=wNTnRM77XuE): riferimento vincolante di ritmo e carattere dei movimenti base.
- [Stair walking animation](https://www.youtube.com/watch?v=GLsbeOHi15U): riferimento supplementare di trasferimento del peso, visto da dietro. Non fornisce direttamente le silhouette laterali.

I filmati sono riferimenti di studio: nessun asset di Flashback o Yakuza è incluso nel gioco.
