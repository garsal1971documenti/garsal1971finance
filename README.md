# Garsal Finance

Webapp responsive per gestire la finanza personale da desktop e smartphone.

## Stato iniziale

Questa prima versione contiene una dashboard responsive con:

- saldo disponibile
- entrate e uscite mensili
- movimenti recenti
- budget per categoria
- obiettivi di risparmio
- login email/password tramite Supabase Auth
- salvataggio movimenti su database Supabase
- sezione patrimonio con portafogli e titoli
- prezzo giornaliero cercato online per simbolo

## Come provarla

Apri `index.html` nel browser.

## Configurazione Supabase

1. Crea un progetto su Supabase.
2. Apri SQL Editor ed esegui il contenuto di `supabase-schema.sql`.
3. Copia `config.sample.js` in `config.js`.
4. In `config.js` inserisci:
   - Project URL
   - anon public key
5. Su Netlify, assicurati che anche `config.js` sia pubblicato insieme agli altri file.

La anon key di Supabase puo stare nel frontend, ma la sicurezza dipende dalle policy RLS. Lo schema incluso permette a ogni utente autenticato di leggere e modificare solo i propri movimenti, portafogli e titoli.

## Patrimonio e titoli

La sezione Patrimonio permette di:

- creare un portafoglio mentre inserisci il primo titolo
- inserire simbolo, data acquisto, quantita e prezzo di carico
- cercare il prezzo giornaliero tramite servizio pubblico Stooq
- calcolare investito, valore attuale e risultato

Esempi simboli:

- `AAPL.US`
- `MSFT.US`
- `TSLA.US`
- `ENEL.IT`

Se il prezzo online non viene trovato, l'app usa il prezzo di carico come fallback e continua a salvare il titolo.

## Prossimi passi

1. Aggiungere modifica ed eliminazione dei movimenti.
2. Aggiungere modifica ed eliminazione titoli.
3. Separare entrate, uscite, budget e obiettivi in viste dedicate.
4. Aggiungere esportazione CSV.
5. Valutare migrazione a React/Next.js quando serve un backend piu strutturato.
