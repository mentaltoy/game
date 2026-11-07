# Direzione approvata da Nicola — integrazione salita V14, 7 novembre 2026

## Ambito V14 autorizzato — prevale sulle prove separate precedenti

- Dopo la prova V13, Nicola ha chiesto: «procediamo con le rifiniture e metti tutto online insieme al resto del gioco». Sono autorizzate l’integrazione della salita nella stanza, la sua verifica e la pubblicazione nello stesso progetto Vercel. Le indicazioni precedenti che limitavano la salita al solo provino descrivono lo storico e non bloccano questo lavoro.
- Conservare il ciclo e i disegni V13, il fondale, la camminata, la corsa V10, la discesa V9 e le due metà invisibili dello schermo per i comandi touch. Intervenire sui raccordi e sulla gestione della salita senza modificare le altre movenze.
- Standard delle scale: pedata 30 / alzata 21 a H266, cadenza di 0,45 s per gradino. La raccolta V14 dura 0,32 s. Il primo raccordo del fondale è distinto dai gradini ripetuti; non deformare il ciclo per adattarlo a geometrie arbitrarie.
- Se il comando viene rilasciato durante la salita, completare il passo fino al contatto e mantenere la posa sul gradino interno (`contact-hold`). Riprendere nello stesso verso da quel contatto; raccogliere i piedi prima di un’inversione e all’uscita sul pianerottolo.
- I sei nuovi raccordi sono figure complete, con una sola scala fisica per tutta la tavola. Non normalizzare separatamente l’altezza delle pose piegate, non articolare ritagli e non nascondere i cambi con morph o dissolvenze. Le misure e i ruoli anatomici sono in `art/stairs-v14/` e `dist/assets/stair-transitions-v14.json`.
- Dichiarare i limiti misurati: circa 20 unità di abbassamento iniziale della testa e circa 15 nel raccordo finale, a H266. Il vincolo esatto riguarda il punto sotto l’avampiede, non tutta la sagoma della scarpa. La registrazione del piede sinistro nell’idle è inferita perché occultato; la cella 5 dei raccordi appartiene al gruppo L ma trasferisce il sostegno effettivo a R.
- V14 pubblicata; gli esiti verificati sono nella sezione finale e nel registro del rilascio. Non dichiarare una prova su iPhone fisico o assenza di scatti senza riscontro. Aggiornare README e registro soltanto con gli esiti effettivi.

## Progetto e stile

- Avventura per iPhone con inquadratura laterale e ispirazione cinematic platformer anni Novanta. «Interno 01» e `painted-walk-study` sono nomi di lavoro; titolo del gioco, nome del protagonista e storia definitiva restano da definire.
- La resa illustrata/dipinta dell'interno e del personaggio è approvata come possibile resa finale. Preservare texture, palette, luce, proporzioni e composizione. Non sostituire con pixel art, grafica vettoriale semplificata o 3D lucido.
- Mondo assolutamente terrestre: isola del Pacifico, architettura brutalista e alta tecnologia. Il riferimento a Jurassic Park riguarda soltanto gli edifici. Nessun dinosauro.
- Il protagonista è uno scienziato con intraprendenza da esploratore e ingegno tecnico. Si ritrova in un mondo sconosciuto, vuole capire dove si trova e tornare a casa; il motivo dell'arrivo è ancora aperto.
- Questa è una prova browser per validare personaggio, ambiente, comandi e movimento. Xcode e TestFlight sono una fase successiva; DONE è il riferimento per quel flusso.

## Base approvata da preservare

- Usare realmente `dist/assets/walk-approved-v4.png`, copia esatta della tavola scelta da Nicola. SHA-256: `7eaeb5963a0056f596c106dbd6a51d0bf52876b07df83d9bf4dde0ce280897ba`. Non sostituirla silenziosamente con un altro personaggio o con il vecchio rig.
- Nicola ha approvato movimento in piano e resa complessiva V4, poi le braccia V5 e le rifiniture V6. Preservare controller, appoggi, velocità, tempi del ciclo, proporzioni e fondale già approvati nelle modifiche successive.
- Camminata, posa ferma e inversione devono condividere il trattamento delle immagini complete. Sono stati rifiutati i salti fra arti ritagliati e pose intere, i frammenti durante la deformazione e la sensazione di scarponi pesanti. Non reintrodurre rig o dissolvenze degli arti per mascherare un raccordo.
- Conservare il dispositivo sul fianco anatomico destro e la sua occlusione nelle viste opposte; il riflesso deve usare la stessa variante del personaggio.
- La V7 ha corretto l'esposizione dei capelli. La richiesta V8 estende la rifinitura al residuo lampeggio di capelli e viso: intervenire sul colore preservando lineamenti, pennellate e calibrazione geometrica della testa. Non interpretarla come autorizzazione a ridisegnare l'intero personaggio.

## Ambito V8

- Su mobile tenere premuta la metà sinistra/destra della superficie di gioco comanda il movimento. Conservare tastiera e pulsanti accessibili; i controlli della pagina non devono attivare il gesto di movimento. Rilascio e annullamento non devono lasciare il personaggio in marcia.
- Il percorso ora comprende il pavimento davanti al laboratorio, la scala e il pianerottolo, in entrambe le direzioni. La porta non è ancora interattiva.
- Piante e ringhiere devono provenire dai pixel del fondale originale, tramite maschere di occlusione. Non ridisegnarle né cambiare la composizione dell'interno per adattarle al personaggio.
- La scala è una **prima versione da rifinire**, non una nuova animazione già approvata integralmente. I nuovi atlas e il controller dedicato non autorizzano modifiche al movimento in piano.
- Sulle scale mantenere una scala comune delle immagini e appoggi reali sui gradini. Non normalizzare ogni posa sull'altezza della sua sagoma piegata. Verificare anche il piede libero, i raccordi di altezza, ingresso/uscita, arresto e inversione: un test corretto del controller o della suola selezionata non elimina i salti fra disegni.
- Le correzioni dei tessuti, capelli e viso avvengono una volta al caricamento. Preservare i PNG originali, alpha, dettagli dipinti e aree protette. Le differenze residue di pennellata vanno dichiarate, senza nasconderle con filtri indiscriminati.

## Lavoro condiviso, verifica e pubblicazione

- Prima di modificare controllare stato locale, remoto e lavoro degli altri agenti; preservare gli aggiornamenti condivisi. Intervenire sul dettaglio richiesto senza rifare le parti approvate.
- Verificare prima su fondo neutro e poi nella stanza, anche in formato mobile. I test matematici e gli audit cromatici non sostituiscono l'ispezione visiva di continuità, uniformità e appoggi. Non dichiarare verificato un iPhone fisico senza averlo provato.
- La pubblicazione Sites esistente è privata e corrisponde alla V7. Lo stato verificato di Vercel e del trasferimento GitHub è indicato nella sezione seguente. Non presentare un indirizzo locale come accessibile da altri dispositivi e non inventare URL di pubblicazione.
- Conservare nel README l'attribuzione del riferimento di movimento Flashback e la distinzione fra ispirazione e asset inclusi. Le autorizzazioni di pubblicazione restano circoscritte a questo progetto e al loro ambito esplicito.

## Ambito V9

- Dopo la prova sul telefono, Nicola ha approvato nuovamente la camminata in piano e chiesto di rifinire anzitutto le scale, aggiungendo poi la corsa e nuove movenze del personaggio.
- La corsa diventa l'andatura principale in piano; la camminata approvata rimane disponibile tramite un comando per andare piano. Il comando mobile scelto è «Cammina», con Maiusc come modificatore temporaneo da tastiera.
- Corsa e scale devono avere pose dipinte dedicate, coerenti con il personaggio. Preservare le immagini e il controller della camminata approvata. Non simulare la corsa accelerando semplicemente la camminata.
- Rifinire la continuità visibile di busto e appoggi sulle scale, inclusi arresti, inversioni e raccordi con il pavimento. Una verifica matematica non sostituisce l'ispezione delle pose nella stanza.
- Continuare la demo online su Vercel. GitHub era stato rimandato a quando Nicola torna a casa. Il 7 novembre Nicola ha esplicitamente riaperto il trasferimento: creare/verificare il repository `mentaltoy/game` e salvarvi i sorgenti è ora autorizzato.

## Pubblicazioni V10 — storico e lavoro rimandato

- V10 touch online su Vercel: https://isola-prototipo.vercel.app/; progetto `prj_sL6enHn7Dtc1LOvua2OlDV3RRk21`, team `team_Qz7eQFBIblAjAZwmQP67tlJV`, deployment `dpl_HERM8qCqvAamJheiVh2dknDrKeXQ` READY. Pubblicazione tramite upload diretto; sorgenti salvati nel repository pubblico `mentaltoy/game`. La V10 sostituisce soltanto il ciclo di corsa e ne imposta il periodo a 0,8 s. Camminata e scale V9 sono preservate. Nell’ultimo riscontro Nicola considera accettabile la discesa; la salita resta da rifinire in una prova separata. Verificati link pubblico, revisione 10, comandi a metà schermo e Cammina a 844×390, senza errori console; 55 test superati. Il feedback di Nicola sulla nuova corsa è ancora atteso.
- Il 7 novembre Nicola è tornato a casa e ha esplicitamente ripreso GitHub. Repository pubblico: https://github.com/mentaltoy/game . Il caricamento iniziale conserva i sorgenti V10 e i materiali sperimentali separati; verificare sempre il commit remoto prima di dichiarare concluso un aggiornamento. I file sono salvati localmente e negli ZIP V8, V9 e V10. Il precedente link Sites rimane V7 privato.
- Prima di pubblicare nuove modifiche, verificare il deployment Vercel effettivamente corrente e gli aggiornamenti locali e remoti; non sostituirli con il vecchio stato Sites V7.

## Riscontro dopo la prova V9

- Nicola conferma che il link funziona, ma **non approva corsa e scale V9**. Nella corsa le ginocchia salgono troppo e un braccio appare quasi fermo; sulle scale la figura sfarfalla e il movimento è giudicato inaccettabile.
- La camminata in piano e lo stile dipinto restano approvati e vanno preservati.
- Nicola ha offerto una reference di corsa; è stata richiesta prima di rifare il ciclo. L'analisi delle pose correnti può procedere nel frattempo.
- Nicola ha confermato il video già condiviso di Flashback come **riferimento vincolante («bibbia») per tutti i movimenti base**: https://www.youtube.com/watch?v=wNTnRM77XuE . Studiare direttamente nel filmato ritmo, posture, appoggi e alternanza degli arti prima di creare o cambiare un ciclo. Conservare il nostro personaggio e lo stile dipinto; non includere asset originali di Flashback nel gioco. Questa è una regola di questo progetto, non una preferenza globale per altri lavori.
- La prossima revisione deve verificare oscillazione completa e opposta delle braccia, altezza delle ginocchia, alternanza anatomica delle gambe e continuità dell'intera figura. Gli appoggi numericamente corretti e i test superati della V9 non certificano questi aspetti.

## Corsa V10 e scale in lavorazione

- La corsa V10 usa dodici pose nuove, con braccia alternate e ginocchio della posa 3 corretto. La 11 è una posa di carico dopo la 0; la 5 è un atterraggio prima della 6. Soltanto 4/10 sono voli. Non ripristinare il vecchio ordine che faceva avanzare due volte il piede.
- Il periodo è 0,8 s come il ciclo di riferimento studiato a 5:30.32–5:31.12. La falcata resta 1,1 volte l'altezza fisica perché queste immagini non sostengono ancora le circa 1,9 della reference senza scivolare. Non dichiarare una riproduzione esatta della velocità di Flashback.
- Gli originali e i prompt sono in `art/run-v10/`; il renderer è `dist/run-renderer-v10.js`. La correzione della sola testa 3 è statica, applicata una volta prima del rendering delle figure intere, come la calibrazione V6. Nessun arto è animato separatamente.
- I nuovi disegni delle scale sono prove finché non viene verificato il percorso completo, inclusi ingresso, arresto, raccolta, inversione e uscita. Le quattro chiavi di salita hanno alternanza plausibile e richiedono una traiettoria del bacino curva: lo scarto dalla guida lineare iniziale non equivale da solo a un difetto anatomico. Non presentarli come un ciclo già fluido o pubblicato.

## Trasferimento GitHub — 7 novembre 2026

Nicola ha creato e indicato `https://github.com/mentaltoy/game`. L’ispezione ha trovato un repository vuoto e pubblico. Nicola ha poi autorizzato esplicitamente: «Va bene pubblico, carica tutto». Il salvataggio pubblico di codice, immagini, prompt, test e prove di questo progetto è quindi autorizzato. Conservare separati i file di configurazione locale e le catture private di studio della reference. Il nome `isola-prototipo` resta quello del progetto Vercel, non del repository GitHub.

## Correzione mobile V10 touch — 7 novembre 2026

Nicola ha chiarito che i comandi sinistra/destra sul telefono devono essere due metà invisibili dell’intera schermata, senza pulsanti direzionali visibili. Preservare i gesti su tutta `#experience`, inclusi margini e zone fuori dal canvas; usare l’altezza dinamica della viewport. Cammina e schermo intero conservano la loro funzione. Il CSS nasconde visivamente le frecce sui dispositivi touch, mantenendole accessibili. Movimento e immagini restano quelli V10.

La V10 touch è READY e il build supera 55 test. Verifica mobile locale Chrome a 393×852 e 852×393; file pubblici HTML/CSS identici e HTTP 200. Il controllo interattivo successivo alla pubblicazione non è stato completato per timeout del browser: non dichiarare una nuova prova su iPhone fisico. Dettagli in `releases/v10-touch.json`.

## Provino di due passi in salita — 7 novembre 2026

- Nicola ha fornito https://www.youtube.com/watch?v=GLsbeOHi15U come riferimento supplementare per la meccanica della salita, chiedendo un passo più leggero. Il filmato mostra il personaggio da dietro; non equivale a una reference laterale completa. Flashback rimane il riferimento vincolante per il carattere dei movimenti base.
- Nicola ha approvato «Vai, proviamo»: preparare due passi consecutivi sui gradini centrali, conservando stile e discesa attuale. Il provino V12 è isolato in `experiments/stairs-two-steps-v12` e reso disponibile in `dist/stair-study`; non sostituisce la salita nel gioco.
- Il provino conserva le quattro chiavi intere, corregge alcuni intermedi e registra i colori una volta al caricamento. Nessun rig, deformazione degli arti o dissolvenza temporale. Le immagini generate e i prompt restano tracciabili.
- La continuità del corpo non certifica la precisione dei piedi. Il risultato è ancora da rifinire e non va descritto come salita pronta: consultare il report delle misure nel provino. Ingresso, pianerottolo e inversione non fanno parte di questa prova di due gradini.
- Provino pubblico: https://isola-prototipo.vercel.app/stair-study/ . Deployment corrente `dpl_FFUKPjajAjC9AQ89yXq5YdaJNeKm`, READY; aggiunge otto file e preserva byte per byte i 61 file V10 touch. Il player pubblico è stato caricato e riprodotto senza errori console; il controllo geometrico degli appoggi resta fallito. Dettagli in `releases/stair-study-v12.json`.

## Appoggio e geometria standard — riscontro V12

- Nicola giudica molto bello il movimento del provino V12; la correzione richiesta è il piede portante che scivola. Conservare disegni e carattere del movimento.
- Per tutte le scale del gioco usare la stessa alzata e la stessa pedata, dimensionate insieme al personaggio. Standard iniziale: pedata 30, alzata 21 a H266, 0,45 s per gradino. Costruire le scale sulla geometria del ciclo; non riadattare il passo a gradini arbitrari.
- La revisione V13 del provino ancora ogni figura intera alla suola portante, con tempi fissi e cambio del piede portante sul contatto. L’immobilità dell’ancora non certifica da sola la continuità visiva delle scarpe né autorizza rig o deformazioni.
- La discesa e il gioco completo restano quelli pubblicati V10 touch; la correzione viene valutata prima nei due gradini di `/stair-study/`.

- Provino V13 online nello stesso percorso: deployment `dpl_ETAFCbcGWRjkRhV56CLQGJST5eQt`, READY, 59 test superati. Registrazione statica dello stesso punto sotto l’avampiede, venti pixel sorgente dietro il bordo della punta; immagini V12 intatte. La punta è stabile, ma sagoma dei talloni e cambi di disegno restano da giudicare visivamente. Dettagli in `releases/stair-support-v13.json`.

## Esito rilascio V14 — 7 novembre 2026

Salita integrata pubblicata su https://isola-prototipo.vercel.app/?v=14, deployment `dpl_CM7j35rUqHvDcAYnQ6Xjq8zZtDMh` READY. 81 test passati localmente e nel build Vercel. Pagina pubblica caricata, revisione 14 e toggle Cammina verificati, nessun errore console. Percorso completo e campioni dei raccordi verificati nella fixture locale con gli stessi moduli e asset della produzione; nessuna nuova prova fisica su iPhone. Restano cambi discreti di sagoma e raccordi da valutare con Nicola. Dati, hash e limiti in `releases/ascent-v14.json`. La successiva revisione deve preservare lo standard e gli appoggi approvati.
