# Interno 01 — prototipo di movimento V10 touch

Prototipo browser statico di un'avventura laterale per iPhone, con personaggio e scenario dipinti. «Interno 01» e il nome tecnico `painted-walk-study` sono provvisori: non sono il titolo definitivo del gioco. Il codice usa Canvas e moduli JavaScript, senza dipendenze di esecuzione esterne.

## Stato e pubblicazione

Sono approvati lo stile dipinto, il personaggio e la camminata in piano. Dopo la prova sul telefono, Nicola ha respinto corsa e scale V9: ginocchia troppo alte, un braccio quasi fermo e scatti evidenti sui gradini. La V10 sostituisce la corsa con una nuova sequenza; la camminata rimane invariata. Nell’ultimo riscontro Nicola considera accettabile la discesa; la salita resta da rifinire. Il gioco usa ancora le scale V9.

La revisione V13 del [provino di due passi](https://isola-prototipo.vercel.app/stair-study/?v=13-support) applica il riscontro successivo di Nicola: conservare il carattere del movimento V12 e bloccare la scarpa che sostiene il peso. La geometria comune delle scale è pedata 30 / alzata 21 a H266, con 0,45 s per gradino. I disegni V12 rimangono invariati e le figure intere sono registrate su un punto coerente della suola, con tempi fissi. Sorgenti e limiti in [experiments/stairs-support-v13](experiments/stairs-support-v13/README.md). Il gioco completo e la discesa non vengono sostituiti da questo provino.

V13 pubblicata nel deployment `dpl_ETAFCbcGWRjkRhV56CLQGJST5eQt`, READY. Verificati riproduzione sul link pubblico, revisione `13-support` e assenza di errori console; 59 test superati sia localmente sia nel build Vercel. [Registro del rilascio](releases/stair-support-v13.json).

Il [provino V12 di due passi in salita](https://isola-prototipo.vercel.app/stair-study/) è pubblico, con riproduzione, rallentatore e dettaglio. Non sostituisce il movimento nel gioco: conserva il fondale e le quattro pose chiave, correggendo sei intermedi con figure dipinte intere. Il busto segue una traiettoria continua, ma alcuni cambi del piede restano bruschi e la soglia degli appoggi non è superata. [Sorgenti, prompt e misure](experiments/stairs-two-steps-v12/README.md) documentano anche i tentativi scartati. Il deployment V12 è `dpl_FFUKPjajAjC9AQ89yXq5YdaJNeKm`, READY: aggiunge soltanto il provino e mantiene identici tutti i 61 file del rilascio precedente. Build: 55 test superati; player pubblico caricato e riprodotto senza errori console; layout verificato a 393×852 e 852×393 nel browser, non su iPhone fisico. Dettagli in [releases/stair-study-v12.json](releases/stair-study-v12.json).

La **V10 touch è pubblicata su Vercel**: https://isola-prototipo.vercel.app/ — link pubblico, senza login. Le due metà invisibili coprono tutta la schermata del telefono. Deployment `dpl_HERM8qCqvAamJheiVh2dknDrKeXQ`, stato READY, progetto `isola-prototipo` nello spazio Mentaltoy. Sorgenti e materiali del progetto: [mentaltoy/game](https://github.com/mentaltoy/game). La demo Vercel è pubblicata tramite upload diretto; il repository non attiva ancora pubblicazioni automatiche. La precedente pubblicazione Sites resta V7 privata e non è il link attuale.

La build V10 touch su Vercel supera tutti i 55 test. Il layout touch e i comandi sono stati verificati localmente in Chrome con emulazione iPhone 16 a 393×852 e 852×393. Dopo la pubblicazione, i due HTML e il CSS restituiscono HTTP 200 e coincidono byte per byte con quelli verificati; il controllo interattivo sul sito pubblico non è stato completato per timeout del browser. I dettagli sono in [releases/v10-touch.json](releases/v10-touch.json). La correzione touch cambia soltanto CSS e riferimenti di cache nei due HTML: nasconde i pulsanti direzionali e usa tutta l’altezza dinamica dello schermo. La verifica del movimento V10 comprende 55 test superati, incluse cadenza della nuova corsa e transizioni alle scale da diverse distanze. La versione pubblicata è stata aperta e controllata a 844×390 senza errori console; comandi e layout restano quelli verificati anche a 390×844 in V9. I test delle scale descrivono il comportamento del controller e non certificano la fluidità dei disegni. La prova fisica sul telefono e il giudizio sulla nuova corsa spettano a Nicola.

Non sono stati creati un progetto Xcode o una build TestFlight. DONE resta il riferimento per la successiva distribuzione nativa iOS. Il gioco non include telemetria, salvataggio remoto o audio.

## Avvio locale e comandi

Dalla cartella del progetto:

```sh
python3 -m http.server 8765 --bind 127.0.0.1 --directory dist
```

Aprire `http://127.0.0.1:8765` sullo stesso computer. Questo indirizzo non è raggiungibile da un altro computer o iPhone. `/studio.html` mostra il personaggio ingrandito su fondo neutro, con corsa e camminata in piano, per controllare i disegni e le transizioni.

- Tenere premuta la metà sinistra o destra della superficie di gioco per correre. Spostare il dito oltre il centro cambia direzione; con più dita prevale l'ultima appoggiata.
- Attivare il pulsante **Cammina** per usare il passo lento approvato; premendolo di nuovo si torna alla corsa. Da tastiera, **Maiusc** attiva temporaneamente la camminata.
- Da tastiera restano disponibili frecce sinistra/destra e A/D. Sul telefono le due metà dello schermo sono aree invisibili: nessun pulsante direzionale viene disegnato. I comandi direzionali restano accessibili ai lettori di schermo; Cammina e schermo intero restano visibili.
- Il rilascio avvia l'arresto. Sulle scale il passo in corso raggiunge un appoggio prima della raccolta o dell'inversione.
- Il pulsante schermo intero usa la Fullscreen API quando disponibile; altrimenti passa a un layout più essenziale. Il formato orizzontale offre più spazio alla scena.

I controlli della pagina sono esclusi dai gesti sulle metà dello schermo. Rilascio fuori dall'area, annullamento del gesto, perdita di focus e cambio di visibilità azzerano l'input gestuale.

## Scenario e percorso V8

Il fondale `dist/assets/interior.png` resta invariato. Il percorso si estende lungo il pavimento davanti al laboratorio, sale i gradini e prosegue sul pianerottolo fino al margine destro; è percorribile anche in senso inverso. La porta rimane parte del dipinto, senza apertura o cambio di stanza.

Piante e ringhiere in primo piano coprono il personaggio usando ritagli del **dipinto originale**. Le maschere definiscono soltanto quali pixel originali ridisegnare sopra il personaggio: non sostituiscono foglie o metallo con nuove illustrazioni. Ombre e riflesso riutilizzano le pose del personaggio; il riflesso è limitato al pavimento inferiore.

## Disegni e continuità del personaggio

La tavola approvata è `dist/assets/walk-approved-v4.png`, copia esatta della tavola scelta da Nicola, originariamente `work/walk-v3.png` nel workspace. SHA-256:

```text
7eaeb5963a0056f596c106dbd6a51d0bf52876b07df83d9bf4dde0ce280897ba
```

La camminata in piano impiega quindici disegni completi: sei celle di questa tavola, sette pose intermedie e due supplementari. Sono conservate le tre correzioni delle braccia V5: cella 6 di `walk-bridges-v5-arms.png`, cella 0 di `walk-start-v5-arms.png` e cella 1 di `walk-completion-v5-arms.png`. Le altre celle intermedie provengono da `walk-bridges-v4.png`; la raccolta dei piedi usa la cella 3 di `walk-completion-v4.png`. Il giro usa sette pose di `turn-painted-v4.png`.

Il ciclo in piano segue la distanza percorsa, con partenza, arresto e inversione già approvati. Si selezionano immagini complete, senza articolare ritagli o dissolvere gli arti. La rotazione può ripercorrere la propria sequenza quando cambia il comando.

Le calibrazioni statiche vengono eseguite una volta al caricamento, lasciando immutati i PNG originali:

- `costume-grade.js`: riferimento cromatico costante per camicia e pantaloni, con protezioni per pelle, scarponi e dispositivo.
- `head-calibration.js`: conserva la correzione V6 delle quattro teste fuori scala, raccordata sopra il collo.
- `device-occlusion.js`: prepara la cintura senza dispositivo nelle viste verso sinistra, a partire da `device-hidden-v6.png`.
- `hair-grade.js` e `face-grade.js`: bilanciano capelli e pelle prima della calibrazione geometrica della testa. V8 riduce anche il residuo più chiaro nella parte posteriore dei capelli; il giro conserva la propria luce frontale più scura.

Queste correzioni preservano texture e lineamenti. Alcune pose, soprattutto bridge-6, hanno pennellate più morbide già nella sorgente: il grading non le rende identiche attraverso sfocature, sharpening o sostituzione del disegno.

## Corsa V10

La nuova sequenza alterna entrambi i bracci e riduce l'altezza del ginocchio nella raccolta. Il confronto diretto con il filmato ha portato anche a correggere l'ordine dei disegni: la posa 11 carica il peso dopo l'atterraggio 0; la 5 atterra prima della 6. Soltanto 4 e 10 sono voli. Il renderer usa sempre figure intere, con grading statico e una calibrazione del cranio per la sola posa 3 riparata.

Il periodo a velocità piena è 0,8 s, misurato sul ciclo Flashback a 5:30.32–5:31.12. La falcata rimane 1,1H, più corta delle circa 1,9H osservate nella reference: il movimento orizzontale segue la distanza effettivamente coperta dai piedi dipinti. Nel mondo H ≈ 266 la velocità è circa 366 px/s. Non si allunga la falcata deformando arti o introducendo scivolamento.

`dist/run-renderer-v10.js` e i due nuovi atlanti sostituiscono la corsa V9; i due raccordi iniziali V9 sono conservati. I PNG, i prompt ImageGen integrato, i metadati e i limiti sono in `art/run-v10/`. Il feedback di Nicola sulla V10 è ancora atteso. Le immagini e i moduli approvati della camminata, il fondale e le scale V9 rimangono byte-identici alla pubblicazione precedente.

## Corsa V9 — archivio

La corsa usa dodici nuove figure dipinte e due pose di raccordo con la camminata. Il controller mantiene la fase legata alla distanza, cambia andatura su un appoggio e frena prima dell'inversione approvata. Avvicinandosi alla scala, il personaggio rallenta negli ultimi 160 pixel della scena circa; sui gradini conserva un passo dedicato.

La testa conserva la dimensione fisica della base approvata, senza ridimensionare ogni sagoma piegata. Il grading statico separa camicia, pantaloni, capelli e viso. Due piccoli atlanti restaurano la cintura per nascondere il dispositivo sul fianco lontano; anche il riflesso usa la variante corretta. Nelle quattro pose di volo non viene disegnata un'ombra di contatto sotto una scarpa sollevata.

Gli originali, i prompt ImageGen integrato, i dati di packing e i limiti misurati sono in `art/run-v9/`. I due raccordi riducono il salto verticale iniziale della testa da 26 a massimo 11 pixel a H266; rimane un piccolo cambio orizzontale della scarpa tra i disegni di avvio. Il ciclo usa figure intere discrete, senza deformazioni o dissolvenze.

## Scale V9

`stair-refined-v9.png` affianca gli atlanti V8 preservati. Il renderer seleziona le nuove pose usando gli appoggi e il busto realmente dipinti. Il punto di sostegno di ogni figura rimane fermo sulla pedata per tutta la durata della posa, eliminando lo scorrimento presente nella V8. La raccolta conserva inizialmente l'ultima figura della scala prima di raccordarsi alla posa ferma.

Sulle cinque pedate, a H266, il salto verticale massimo tra disegni passa da 7,03 a 6,66 pixel in salita e da 11,95 a 8,66 pixel in discesa. Non si rilevano arretramenti della testa nella sequenza scelta. Le calibrazioni V8 restano byte-identiche e l'alpha dei nuovi disegni è preservata. Originali, prompt e dati delle pose sono conservati in `art/stairs-v9/`.

La scala resta da rifinire: l'alternanza anatomica delle gambe non è ancora convincente in tutti i passaggi, e un raccordo delle braccia in salita rimane visibile. Appoggi più stabili e continuità misurata non equivalgono a una rotoscopia continua; la verifica visiva e il feedback sul telefono restano essenziali.

## Scale successive — prove separate dal gioco

`art/stairs-v10/` e `art/stairs-down-v10/` conservano i nuovi disegni, le guide e i prompt in lavorazione. Il numero delle cartelle indica quando sono state preparate, non una versione online: la V10 pubblicata usa ancora le scale V9. La tavola di salita a sedici pose non è approvata; gli intermedi hanno scarti visibili negli appoggi e richiedono correzioni prima dell’integrazione. Questi file non sono caricati dalla demo. Il [checkpoint portabile](experiments/stairs-ascent-v11/README.md) conserva codice sperimentale, misure e prova video; il relativo controllo di accettazione fallisce intenzionalmente finché non vengono corretti gli appoggi e completati i raccordi.

## Organizzazione del codice

| Modulo | Responsabilità |
| --- | --- |
| `dist/game.js` | Caricamento, input, composizione della scena, ombre e riflesso |
| `dist/screen-input.js` | Comando mantenuto sulle due metà della superficie di gioco |
| `dist/sprite-motion.js` / `sprite-renderer.js` | Camminata in piano, giro e immagini complete |
| `dist/room-layout.js` | Percorso, gradini misurati e maschere delle piante/ringhiere originali |
| `dist/room-motion.js` | Collegamento fra pavimento, scala e pianerottolo |
| `dist/run-motion.js` / `run-renderer-v10.js` | Corsa dedicata, raccordi con il cammino e frenata |
| `dist/stair-motion.js` / `stair-renderer.js` | Movimento e pose dedicate alla scala |
| `dist/*-grade.js` | Correzioni cromatiche statiche delle immagini |

`motion.js`, `gait.js`, `painted-rig.js` e `shirt-grade.js` sono materiale storico e non fanno parte del percorso di esecuzione attuale. `vercel.json` configura il sito statico con `dist` come directory pubblicata e `npm test` prima del rilascio.

## Verifica e riferimenti

```sh
npm test
```

I test coprono distanza/fase del passo, arresto, inversione, comandi contraddittori, limiti, passaggi fra superfici, rilascio dei puntatori e comportamento a 30/60/120 Hz. I test del renderer verificano scala e ancoraggio della suola selezionata, non la fluidità percepita dell'intera sequenza.

Gli audit cromatici V8 comprendono 23 pose a terra, 16 pose dei due atlanti delle scale e le tre nuove pose di raccordo. Il confronto verifica alpha, aree protette e conservazione dei dettagli; i PNG sorgente non vengono riscritti. Il controllo nel browser deve includere la stanza, lo studio ingrandito, entrambe le direzioni, arresti sui gradini e il formato mobile. La risposta touch e le prestazioni su iPhone fisico richiedono ancora una prova sul dispositivo.

L'animazione usa fotogrammi dipinti, non rotoscoping ricavato da riprese reali. Per esplicita indicazione di Nicola, il [gameplay di Flashback](https://www.youtube.com/watch?v=wNTnRM77XuE) è il riferimento vincolante per tutti i movimenti base. Ogni nuovo ciclo va confrontato con postura, ritmo, appoggi e alternanza degli arti osservati nel filmato, conservando il nostro personaggio e lo stile dipinto. I segmenti già studiati comprendono il passo a 4:56–4:58, l'inversione a 5:13–5:14 e, per la revisione della corsa V10, il ciclo completo a 5:30.32–5:31.12. Le catture di studio restano nel materiale di lavoro privato; nessun fotogramma o asset di Flashback è incluso nel gioco.

Gli asset sono generati con ImageGen integrato. Prompt e riferimenti sono conservati in `art-prompts.txt`, `art-prompts-v8.txt` e nelle cartelle `art/stair-bridges-v8/`, `art/run-v9/`, `art/stairs-v9/`.
