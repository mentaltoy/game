# Appoggio fermo e scala standard — V13

Nicola approva il carattere del movimento V12 e chiede di eliminare lo slittamento del piede portante. Per tutte le scale del gioco stabilisce gradini uniformi: il ciclo deve essere preparato una volta per questa geometria, senza adattare ogni passo a una scala diversa.

La pedata di riferimento è 30 unità e l’alzata 21, con il personaggio alto 266 unità. Sono rapporti di scena, non centimetri: in altri livelli si ridimensionano insieme personaggio e ambiente. Il passo mantiene 0,45 secondi per gradino. Il primo raccordo del vecchio fondale è irregolare e richiederà una transizione dedicata; non fa parte di questi due gradini centrali.

Il renderer ancora la figura intera allo stesso punto sotto l’avampiede, misurato venti pixel sorgente dietro il bordo anteriore della suola; la sua quota Y segue il contorno locale della suola. La posizione di riferimento viene traslata di 10,64 unità per conservare la collocazione del personaggio. I metadati precedenti restano archiviati e i disegni non vengono cambiati. I disegni originali V12, la calibrazione dei colori e lo scenario rimangono identici. Non sono applicati morph, rig, deformazioni, dissolvenze o compensazioni della camera. Le pose hanno scostamenti statici precalcolati; non si cerca più la posizione del busto a ogni istante. Il ciclo usa i tempi V12 visibili e trasferisce il peso alla fine del passo, sulla posa di contatto. Le pose 1/9, che prima apparivano soltanto per istanti inferiori al millisecondo, sono escluse.

## Codice e riproduzione

- Player: `../../dist/stair-study/index.html` (servire il repository o la cartella dist).
- Standard e renderer: `../../dist/stair-study/stair-standard.mjs`, `support-locked-v13.mjs`.
- Atlante e metadati storici: `../stairs-two-steps-v12/`.
- Regressioni: `../../tests/stair-study-support.test.mjs`, incluse scale traslate e riproduzione a 30/60/120 Hz.

Il provino resta distinto dal gioco completo: non implementa ingresso, raccolta sul pianerottolo, arresto del gioco o inversione. La discesa pubblicata conserva il comportamento già giudicato accettabile.

## Limiti visivi

Un appoggio fermo non rende identiche le sagome delle scarpe dipinte. La continuità del piede libero e i cambi di disegno vanno ancora giudicati nel player; i test delle coordinate non certificano la fluidità. Il vincolo esatto riguarda il piede che sostiene il peso; quello uscente viene rilasciato al trasferimento. I punti del piede libero conservano il vecchio criterio di misura: non usarli per certificare un doppio appoggio con il nuovo riferimento. La punta resta registrata orizzontalmente; i contorni dei talloni variano ancora di 4,26 / 3,19 unità fra i disegni, perché le scarpe dipinte hanno lunghezze leggermente diverse.
