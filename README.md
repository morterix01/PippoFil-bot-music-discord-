# 🎵 Gratis — Discord Music Bot

Bot musicale per Discord con supporto **YouTube**, **Spotify** e **SoundCloud**.

---

## ⚙️ Setup

### 1. Clona il repo e installa le dipendenze
```bash
npm install
```

### 2. Configura il file `.env`
Copia `.env.example` in `.env` e inserisci i tuoi valori:
```env
DISCORD_TOKEN=il_tuo_token_discord
CLIENT_ID=il_tuo_client_id
```
> Ottieni il token e il CLIENT_ID dal [Discord Developer Portal](https://discord.com/developers/applications).

### 3. Registra i comandi slash
```bash
npm run register
```

### 4. Avvia il bot
```bash
npm start
```

> Per sviluppo con auto-reload:
> ```bash
> npm run dev
> ```

---

## 🎛️ Comandi

| Comando | Descrizione |
|---------|-------------|
| `/play <query>` | Riproduce una canzone da YouTube, Spotify o per nome |
| `/search <query>` | Cerca una canzone e mostra 5 risultati da scegliere |
| `/pause` | Mette in pausa la riproduzione |
| `/resume` | Riprende la riproduzione |
| `/skip [numero]` | Salta 1 o N canzoni |
| `/stop` | Ferma la musica e disconnette il bot |
| `/queue [pagina]` | Mostra la coda con paginazione |
| `/nowplaying` | Mostra info dettagliate sulla canzone corrente |
| `/volume <0-100>` | Regola il volume |
| `/loop <modalità>` | Imposta loop: off / canzone / coda / autoplay |
| `/shuffle` | Mescola la coda |
| `/remove <posizione>` | Rimuove una canzone dalla coda |

---

## 📦 Dipendenze principali
- [`discord.js`](https://discord.js.org/) v14
- [`discord-player`](https://discord-player.js.org/) v7
- [`@discord-player/extractor`](https://github.com/Androz2091/discord-player) v7
- `ffmpeg-static`
- `sodium-native` (audio encryption ottimizzata)

---

## ⚠️ Note
- Spotify richiede l'estrattore Spotify di `@discord-player/extractor` (incluso in `loadMulti(DefaultExtractors)`).
- YouTube richiede `yt-dlp` oppure l'estrattore interno (incluso automaticamente).
- Il bot si disconnette automaticamente se il canale vocale è vuoto per **30 secondi**.
