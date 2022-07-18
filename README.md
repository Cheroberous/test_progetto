# test_progetto
Prove git e programmi con api

#Scopo del progetto :

L'applicazione è sviluppata per essere eseguita in ambienti NodeJS, che si occupa di gestire sia contenuti statici che dinamici.
Questo Web/Application Server ha lo scopo di offfrire all'utente la possibilità di gestire con facilità i profili social
( in questo caso di twitter e youtube); granzie infatti ai vari servizi offerti , dopo un opportuno l'login e la richiesta
di accesso alle risorse (requisiti 2-3-4), l'app consente di fare l'upload di un video sul propio canale youtube, vedere l'elenco dei contenuti del canale ,
eliminare singolarmente i video, fare un nuovo post sul proprio profilo twitter e tenere (grazie ad un db) la lista delle azioni 
svolte grazie all'app (divise per id utente).

Le api sono documentato in api.txt nella repo  (1)


Architettura:



![hhh](https://user-images.githubusercontent.com/102479391/179608526-cbbd380b-0304-48fd-8284-6c6f57e35e77.jpg)




#Tecnologie

Nginx:
  - sicurezza (9) , supporta connessoni http e https verso i client con certificati self-sign
  - parla http con le istanze di node
  - si comporta da revers proxy e fa load balancing del traffico
  
Node:
  - 3 istanze presenti
  - usa le websocket per comunicare con il db  (5)
    
Couch:
  - mantiene lo storico delle azioni eseguite
     
     
#GitHub e GitHub Actions (7-8)
  - il progetto è stato sviluppato interamente su github in una public repository
     
  - per quanto riguarda il CI/CD grazie alle github action ogni volta che c'è un push/pull
    l'istanza di docker viene buildata , caricata sui github packages e su dockerhub
       
       
       
  #Installazione:     (6)
  
     git clone https://github.com/Cheroberous/test_progetto
     docker-compose build
     
  #Avvio
  
     docker-compose up
  
     
     
     
     
     
     
     
     
     
     
     
