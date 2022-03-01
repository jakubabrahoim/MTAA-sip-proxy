## [MTAA] Zadanie SIP PROXY 

Zadanie 1 z predmetu MTAA. Vypracované pomocou knižnice sip.js (nie SIP.js).

### Prerekvizity
 - Node.js
 - npm

### Spustenie
```
> cd 'Zadanie 1'
> npm install
> npm start
```

### Tracy

1. **trace1.pcapng** - obsahuje registráciu účastníka, vytočenie hovoru a zvonenie na druhej strane, prijatie hovoru a ukončenie prijatého hovoru
2. **trace2.pcapng** - obsahuje ukončenie neprijatého hovoru
3. **trace3.pcapng** - video hovor
4. **trace4.pcapng** - hovor na neexistujúceho používateľa (404)
5. **trace5.pcapng** - konferenčný hovor
6. **trace6.pcapng** - obsadený hovor (Busy here)
7. **trace7.pcapng** - presmerovanie hovoru

### Poznámky

Pri testovaní programu v škole som musel nastaviť eduroam ako súkromnu sieť.

### Odkazy

- https://github.com/kirm/sip.js