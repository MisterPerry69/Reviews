# Reel — Setup

## 1. Google Sheet "Reviews DB"

Crea un nuovo Sheet con un tab chiamato esattamente `reviews` (minuscolo).

Colonne (senza header obbligatorio, ma utile aggiungerlo):
```
A: id | B: data | C: titolo | D: categoria | E: rating | F: commento | G: image_url | H: riassunto | I: metadata | J: pros | K: cons | L: raw_text
```

> `L: raw_text` = testo grezzo originale scritto dall'utente. Viene salvato per le nuove recensioni e serve alla funzione "Rigenera". Le recensioni migrate/esistenti possono averlo vuoto: per quelle il tasto Rigenera non è disponibile.

**Migrazione dati**: copia le righe dal tab "REVIEWS" del Sheet LifeOS → tab `reviews` del nuovo Sheet. Le colonne sono identiche.

## 2. Google Apps Script

1. Vai su script.google.com → Nuovo progetto → chiama "Reel"
2. Copia i file da `Reviews/backend/`:
   - `Code.gs` → rimpiazza il file `Code.gs` default
   - Crea file separati per `Reviews.gs`, `AI.gs`, `Util.gs`
3. In `Code.gs` sostituisci `YOUR_SPREADSHEET_ID_HERE` con l'ID del tuo Sheet
   (l'ID è nell'URL del Sheet: `docs.google.com/spreadsheets/d/ID_QUI/edit`)
4. Esegui `setupSecrets()` una volta dall'editor GAS, inserendo le chiavi reali:
   - `GEMINI_API_KEY` — da Google AI Studio
   - `TMDB_KEY` — da themoviedb.org (gratuito)
   - `RAWG_KEY` — da rawg.io (gratuito)
5. Deploy → Nuova distribuzione → Tipo: App Web
   - Esegui come: Me
   - Accesso: Chiunque
6. Copia l'URL del deploy

## 3. Frontend

In `Reviews/js/api.js` sostituisci `YOUR_GAS_URL_HERE` con l'URL del deploy GAS.

## 4. GitHub Pages

Pusha la cartella `Reviews/` su un repo GitHub e abilita GitHub Pages dal branch main.

## 5. PWA

Installa l'app dallo Share menu del browser su iOS/Android.
