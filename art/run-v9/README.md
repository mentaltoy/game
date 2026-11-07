# Corsa dipinta V9

La tavola `generated-run-right-raw.png` contiene dodici figure intere create con ImageGen a partire dalla camminata approvata. I prompt e gli originali restano in questa cartella. Il packing applica un unico fattore 1,20 a tutte le figure; non normalizza l'altezza variabile delle pose piegate o in volo. Il riferimento fisico del renderer è 495 px, corrispondente al cranio di circa 72 px della base approvata.

`dist/assets/run-painted-v9.png` è una griglia 4×3 di celle 420×560. La sequenza usa le celle `0,1,2,3,4,5,6,8,7,9,10,11`: l'ordine 8→7 corregge la regressione dell'appoggio presente nella tavola generata. I tempi dei contatti sono calibrati sulla falcata di 1,10 altezze. Le celle 4,5,10,11 conservano il sollevamento dipinto e non producono un'ombra di appoggio.

`transitions/` contiene tre raccordi originali, dei quali soltanto i primi due sono utilizzati. La terza figura si abbassa oltre la corsa e resta esclusa. Le due figure valide condividono il fattore 0,62; `run-transitions-v9.png` contiene due celle 420×560. Il renderer sceglie una figura intera usando `runLevel` (con fallback `runWeight`), senza dissolvenze o deformazioni.

Il grading cromatico in `run-grade.js` porta camicia, pantaloni, capelli e viso verso i riferimenti della camminata approvata. Opera una sola volta al caricamento, conserva alpha e pennellate e protegge stivali, braccia e dispositivo. I PNG dipinti restano immutati. Le piccole tavole `run-device-hidden-v9.png` e `run-transitions-device-hidden-v9.png` restaurano soltanto la zona del dispositivo quando il fianco destro è nascosto. Le maschere cambiano RGB nella zona cintura; alpha e pixel al di fuori della zona rimangono invariati. Gli originali ad alta risoluzione sono conservati qui; le copie runtime sono ridotte alla dimensione effettivamente usata.

API: `createRunRenderer({runImage, devicePatchAtlas, transitionImage, transitionDevicePatchAtlas, groundRenderer})`; restituisce `draw`, `getFootprints` e `source`. Posa ferma e inversione completa delegano alla camminata approvata. Il riflesso usa la stessa variante cromatica e del dispositivo.

Verifiche: quattro test del renderer; audit cromatico su dodici pose; audit alpha e zona dispositivo su quattordici pose in entrambi i versi; verifica indipendente a H266 di cranio 38–39 px e suola a y299 con pavimento y300. I raccordi riducono il salto verticale della sommità della testa da un cambio diretto 34→60 px a 34→45→54→60 px.

Limiti: sono disegni a posa intera, non una rotoscopia acquisita da un filmato. La calibrazione dei tempi rende coerenti gli appoggi ai fotogrammi chiave, ma non elimina ogni salto fra figure. In particolare, nell'avvio la suola cambia ancora posizione orizzontale rispetto al root (+1,85→−14,51→−21,49→+4,57 px a H266). Il raccordo del busto non è stato ottenuto facendo galleggiare i piedi. Alcune pose dell'ultima riga mostrano il viso leggermente più ruotato verso la camera.

Nessuna figura della camminata approvata è stata rigenerata. SHA-256 di `walk-approved-v4.png`: `7eaeb5963a0056f596c106dbd6a51d0bf52876b07df83d9bf4dde0ce280897ba`.
