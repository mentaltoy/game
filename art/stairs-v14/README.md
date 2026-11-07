# Salita V14 — integrazione e raccordi

Dopo la prova degli appoggi V13, Nicola ha autorizzato le rifiniture e l’integrazione nel gioco completo. V14 collega quel ciclo alla stanza con ingresso, arresto su un gradino, ripresa e raccolta sul pianerottolo. La versione è [pubblicata nel gioco completo](https://isola-prototipo.vercel.app/?v=14); il [registro del rilascio](../../releases/ascent-v14.json) conserva verifiche e limiti.

Il movimento in piano, la corsa V10, la discesa V9 e i comandi touch a due metà invisibili sono conservati. Il provino V13 rimane disponibile separatamente per il confronto. Flashback resta il riferimento di movimento del progetto; questi asset sono disegni originali generati, non fotogrammi estratti dalla reference.

## File

| File | Contenuto |
| --- | --- |
| `transitions-source.png` | Tavola originale generata: sei pose intere, 1024×1536, due colonne e tre righe |
| `transitions-prompt.txt` | Prompt e indicazioni usati per la tavola |
| `transitions-measured.json` | Misure delle pose, calibrazione, regioni campionate e ruoli dei piedi |
| `transition-report.txt` | Audit tecnico del packing e dei limiti |
| `../../dist/assets/stair-transitions-v14.png` | Atlante pronto per il renderer: celle 500×620, due colonne e tre righe |
| `../../dist/assets/stair-transitions-v14.json` | Metadati usati dal renderer per i raccordi |
| `../../dist/assets/stair-up-v14.png` e `.json` | Ciclo e registrazione V13 conservati per la salita nel gioco |
| `../../dist/ascent-renderer-v14.js` | Selezione e collocazione delle figure complete |
| `../../dist/stair-motion.js` e `../../dist/room-motion.js` | Collegamento con il percorso, arresto, ripresa e raccolta |

L’originale ha SHA-256 `75fa62224496784d9974cc849ab69deb4a2ed5c0271307c11643e37c31fd90e8`.

## Geometria e comportamento

Lo standard condiviso è pedata 30 / alzata 21 a H266, con cadenza a regime di 0,45 s per gradino. Questi valori sono unità di scena: personaggio e scala vanno dimensionati insieme. Il primo raccordo del fondale è distinto dai gradini ripetuti; il ciclo non viene stirato per adattarlo a una pedata arbitraria. La raccolta dura 0,32 s.

Rilasciando il comando durante una salita, il personaggio completa il passo fino all’appoggio e mantiene la posa di contatto sul gradino interno (`contact-hold`). Lo stesso comando riprende la salita da quel punto. Un’inversione raccoglie prima i piedi; sul pianerottolo la raccolta precede il ritorno al movimento in piano. Il renderer usa figure intere, senza rig, deformazioni degli arti o dissolvenze temporali.

## Scala fisica e appoggi

Le sei nuove pose usano una sola scala: **73/71,5 = 1,020979020979021**. La misura di riferimento è la larghezza del cranio sul contorno con alpha almeno 192 nelle prime 70 righe della testa: 71, 72, 70, 71, 72 e 73 pixel nelle sei celle originali. Non viene normalizzata l’altezza di ogni sagoma piegata. Il packing trasla la figura intera alla corona nominale (250,83) della propria cella.

L’originale è conservato. Il ritaglio include tutti i pixel con alpha almeno 2 e un margine di due pixel; fuori rimane soltanto rumore con alpha al massimo 1/255. La trasformazione uniforme ricampiona normalmente anche l’alpha: non è corretto affermare che i valori restino numericamente identici dopo il ridimensionamento. Nessuna maschera, ricolorazione o deformazione locale è applicata dal packing.

| Celle | Funzione | Sostegno effettivo |
| --- | --- | --- |
| 0–1 | Ingresso | Sinistro, L |
| 2–3 | Raccolta dal contatto R | Destro, R |
| 4 | Prima raccolta dal contatto L | Sinistro, L |
| 5 | Seconda raccolta del gruppo L | Destro, R: trasferimento di peso |

La cella 5 conserva `groupSupport: L`, ma il punto più basso appartiene alla scarpa destra; `support: R` e `weightTransfer: true` descrivono questa differenza. Ancorarla al piede sinistro farebbe affondare la scarpa destra.

Per i nuovi raccordi, il punto portante è misurato 20 pixel dell’atlante dietro il bordo anteriore della punta. La quota segue la mediana del contorno inferiore locale su nove colonne, con alpha almeno 192. I punti del piede libero sono campioni visibili della suola, talvolta parzialmente occultata: non condividono tutti la stessa corrispondenza anatomica e non certificano un doppio appoggio esatto.

Nell’idle approvato il piede sinistro lontano è nascosto da quello destro. La sua registrazione iniziale è quindi inferita nel punto locale (180,518), interno alla suola visibile; non è una misura della punta sinistra. Il fondo della suola in quella regione è misurato, ma il ruolo anatomico del punto rimane un’assunzione esplicita nei metadati.

## Limiti misurati e verifica

A H266 il primo raccordo produce un abbassamento della testa di circa **20 unità** rispetto all’idle. L’ultima figura generata ha circa **251 unità** fra appoggio e corona, contro circa 266 dell’idle: rimane un raccordo verticale di circa **15 unità**. Non sono stati corretti cambiando le proporzioni delle pose. Altezza e continuità vanno giudicate nella stanza insieme ai tempi del cambio di disegno.

Il vincolo stabile riguarda **il punto sotto l’avampiede**, non ogni pixel della scarpa. Nei disegni V13 i contorni dei talloni variano ancora; il piede libero e i cambi di sagoma possono risultare visibili anche con un’ancora numericamente immobile. Un test delle coordinate non certifica da solo la fluidità percepita.

Le regressioni dedicate sono `tests/ascent-controller-v14.test.mjs`, `tests/ascent-renderer-v14.test.mjs` e `tests/ascent-integration-v14.test.mjs`, dalla radice del repository. Eseguire `npm test` e verificare nel browser ingresso, salita continua, arresto e ripresa, inversione, uscita sul pianerottolo e ritorno in discesa, anche nei formati mobile. Gli esiti finali e il deployment appartengono al registro di rilascio, da aggiornare dopo la verifica effettiva.
