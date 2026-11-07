# Direzione approvata da Nicola — V10 pubblicata, 7 novembre 2026

## Progetto e stile

- Avventura per iPhone con inquadratura laterale e ispirazione cinematic platformer anni Novanta. «Interno 01» e `painted-walk-study` sono nomi di lavoro; titolo del gioco, nome del protagonista e storia definitiva restano da definire.
- La resa illustrata/dipinta dell'interno e del personaggio è approvata come possibile resa finale. Preservare texture, palette, luce, proporzioni e composizione. Non sostituire con pixel art, grafica vettoriale semplificata o 3D lucido.
- Mondo assolutamente terrestre: isola del Pacifico, architettura brutalista e alta tecnologia. Il riferimento a Jurassic Park riguarda soltanto gli edifici. Nessun dinosauro.
- Il protagonista è uno scienziato con intraprendenza da esploratore e ingegno tecnico. Si ritrova in un mondo sconosciuto, vuole capire dove si trova e tornare a casa; il motivo dell'arrivo è ancora aperto.
- Questa è una prova browser per validare personaggio, ambiente, comandi e movimento. Xcode e TestFlight sono una fase successiva; DONE è il riferimento per quel flusso.

## Base approvata da preservare

- Usare realmente `dist/assets/walk-approved-v4.png`, copia esatta della tavola scelta da Nicola (`work/walk-v3.png` nel workspace). SHA-256: `7eaeb5963a0056f596c106dbd6a51d0bf52876b07df83d9bf4dde0ce280897ba`. Non sostituirla silenziosamente con un altro personaggio o con il vecchio rig.
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

## Pubblicazione corrente e lavoro rimandato

- V10 online su Vercel: https://isola-prototipo.vercel.app/; progetto `prj_sL6enHn7Dtc1LOvua2OlDV3RRk21`, team `team_Qz7eQFBIblAjAZwmQP67tlJV`, deployment `dpl_GJyi9PbkFN9cNsXHfNojeVznPFsK` READY. Upload diretto, senza GitHub. La V10 sostituisce soltanto il ciclo di corsa e ne imposta il periodo a 0,8 s. Camminata e scale V9 sono preservate; le scale sono ancora respinte da Nicola e in ricostruzione separata. Verificati link pubblico, revisione 10, comandi a metà schermo e Cammina a 844×390, senza errori console; 55 test superati. Il feedback di Nicola sulla nuova corsa è ancora atteso.
- Il 7 novembre Nicola è tornato a casa e ha esplicitamente ripreso GitHub. Repository pubblico: https://github.com/mentaltoy/game . Il caricamento iniziale conserva i sorgenti V10 e i materiali sperimentali separati; verificare sempre il commit remoto prima di dichiarare concluso un aggiornamento. I file sono salvati localmente e negli ZIP V8, V9 e V10. Il precedente link Sites rimane V7 privato.
- Prima di pubblicare nuove modifiche, verificare questo deployment Vercel e i sorgenti locali V10; non sostituirli con il vecchio stato Sites V7.

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
