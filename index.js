// ─── OPTIMIZATION: V8 Memory Limit per Hosting Low-RAM ─────────────────────
const v8 = require('v8');
v8.setFlagsFromString('--max_old_space_size=256');

// ─── POLYFILL: Web Crypto API per Node 18 ───────────────────────────────────
if (!globalThis.crypto) {
    globalThis.crypto = require('crypto').webcrypto;
}

require('dotenv').config();

const ffmpeg = require('ffmpeg-static');
if (ffmpeg) {
    process.env.FFMPEG_PATH = ffmpeg;
}

const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
const { Player, useQueue } = require('discord-player');
const { DefaultExtractors } = require('@discord-player/extractor');
const { createNowPlayingUI } = require('./utils/playerUI');
const fs = require('fs');
const path = require('path');

// Crea il client Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
    ],
});

const youtubeDl = require('youtube-dl-exec');

// Inizializza discord-player (stream override avviene dopo registrazione estrattore)
const player = new Player(client);

// ─── EVENTI DISCORD ────────────────────────────────────────────────────────────

client.once('clientReady', () => {
    console.log(`\n✅ Bot online! Loggato come ${client.user.tag}`);
    console.log(`📋 Comandi caricati: ${client.commands.size}`);
    client.user.setActivity('Questo bot é stato creato da Luissrome in memoria di un suo caro amico');
});

client.on('interactionCreate', async interaction => {
    // Gestione Pulsanti Interattivi del Lettore Musicale
    if (interaction.isButton()) {
        const queue = useQueue(interaction.guildId);
        const voiceChannel = interaction.member?.voice?.channel;

        if (!voiceChannel) {
            return interaction.reply({
                content: '❌ Devi essere nello stesso canale vocale per usare i controlli!',
                ephemeral: true
            });
        }

        if (!queue || !queue.currentTrack) {
            return interaction.reply({
                content: '❌ Nessuna riproduzione attiva al momento.',
                ephemeral: true
            });
        }

        const customId = interaction.customId;

        try {
            switch (customId) {
                case 'music_prev': {
                    if (!queue.history.previousTrack) {
                        return interaction.reply({ content: '⏮️ Nessun brano precedente nella cronologia.', ephemeral: true });
                    }
                    await queue.history.back();
                    return interaction.reply({ content: '⏮️ Torno al brano precedente!', ephemeral: true });
                }
                case 'music_pause_resume': {
                    const wasPaused = queue.node.isPaused();
                    if (wasPaused) {
                        queue.node.resume();
                    } else {
                        queue.node.pause();
                    }
                    const ui = createNowPlayingUI(queue, queue.currentTrack);
                    return interaction.update(ui);
                }
                case 'music_skip': {
                    queue.node.skip();
                    return interaction.reply({ content: '⏭️ Brano saltato!', ephemeral: true });
                }
                case 'music_stop': {
                    queue.delete();
                    return interaction.reply({ content: '⏹️ Riproduzione fermata e coda cancellata.', ephemeral: true });
                }
                case 'music_shuffle': {
                    queue.tracks.shuffle();
                    return interaction.reply({ content: '🔀 Coda mescolata!', ephemeral: true });
                }
                case 'music_loop': {
                    const nextMode = (queue.repeatMode + 1) % 4;
                    queue.setRepeatMode(nextMode);
                    const ui = createNowPlayingUI(queue, queue.currentTrack);
                    return interaction.update(ui);
                }
                case 'music_voldown': {
                    const newVol = Math.max(0, queue.node.volume - 10);
                    queue.node.setVolume(newVol);
                    const ui = createNowPlayingUI(queue, queue.currentTrack);
                    return interaction.update(ui);
                }
                case 'music_volup': {
                    const newVol = Math.min(100, queue.node.volume + 10);
                    queue.node.setVolume(newVol);
                    const ui = createNowPlayingUI(queue, queue.currentTrack);
                    return interaction.update(ui);
                }
                case 'music_queue': {
                    const tracks = queue.tracks.toArray();
                    const current = queue.currentTrack;
                    const pageTracks = tracks.slice(0, 10);
                    const trackList = pageTracks
                        .map((t, i) => `\`${i + 1}.\` **[${t.title}](${t.url})** — \`${t.duration}\` | *${t.requestedBy?.username || 'Sconosciuto'}*`)
                        .join('\n\n');

                    const coverUrl = current?.thumbnail || current?.raw?.thumbnail || current?.raw?.album?.images?.[0]?.url;

                    const embed = new EmbedBuilder()
                        .setColor(0x1DB954)
                        .setTitle('📜 Lista d\'Attesa (Coda Musicale)')
                        .setDescription(`**▶️ In Riproduzione:**\n**[${current.title}](${current.url})**\n\n─── **PROSSIMI BRANI** ───\n\n${trackList || '*Nessun altro brano in coda.*'}`)
                        .setFooter({ text: `Brani totali in coda: ${tracks.length} • Volume: ${queue.node.volume}%` });

                    if (coverUrl) embed.setThumbnail(coverUrl);

                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }
            }
        } catch (err) {
            console.error('[Button Error]', err);
            return interaction.reply({ content: `❌ Si è verificato un errore: ${err.message}`, ephemeral: true });
        }
    }

    if (!interaction.isChatInputCommand()) return;

    // Restrizione canale musicale (opzionale)
    const musicChannelId = process.env.MUSIC_CHANNEL_ID;
    if (musicChannelId && interaction.channelId !== musicChannelId) {
        return interaction.reply({
            content: `❌ I comandi musicali funzionano solo in <#${musicChannelId}>!`,
            ephemeral: true,
        });
    }

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction, player);
    } catch (error) {
        console.error(`[Error] Comando /${interaction.commandName}:`, error);
        const msg = { content: '❌ Si è verificato un errore nell\'eseguire il comando!', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(msg);
        } else {
            await interaction.reply(msg);
        }
    }
});

// ─── EVENTI PLAYER ─────────────────────────────────────────────────────────────

player.events.on('playerStart', (queue, track) => {
    const channel = queue.metadata?.channel;
    if (!channel) return;

    const ui = createNowPlayingUI(queue, track);
    channel.send(ui);
});

player.events.on('audioTrackAdd', (queue, track) => {
    const channel = queue.metadata?.channel;
    if (!channel) return;
    if (queue.isPlaying() || queue.tracks.size > 0) {
        channel.send(`📥 Aggiunto in coda: **${track.title}** (posizione #${queue.tracks.size})`);
    }
});

player.events.on('disconnect', (queue) => {
    const channel = queue.metadata?.channel;
    if (channel) channel.send('👋 Disconnesso dal canale vocale. Alla prossima!');
});

player.events.on('emptyQueue', (queue) => {
    const channel = queue.metadata?.channel;
    if (channel) channel.send('✅ La coda è terminata! Aggiungi altre canzoni con `/play`.');
});

player.events.on('emptyChannel', (queue) => {
    const channel = queue.metadata?.channel;
    if (channel) channel.send('⚠️ Canale vocale vuoto, mi disconnetto...');
});

player.events.on('error', (queue, error) => {
    console.error(`[PlayerError] ${error.message}`);
    console.error(`[PlayerError] Stack:`, error.stack);
    const channel = queue.metadata?.channel;
    if (channel && error.message !== 'Aborted') {
        channel.send(`❌ Errore del player: ${error.message}`);
    }
});

player.events.on('playerError', (queue, error, track) => {
    console.error(`[PlayerError - Audio] ${error.message}`);
    console.error(`[PlayerError - Audio] Track: ${track?.title}`);
    console.error(`[PlayerError - Audio] Stack:`, error.stack);
    const channel = queue.metadata?.channel;
    if (channel) {
        channel.send(`❌ Errore audio: ${error.message}`);
    }
});

player.events.on('playerStart', (queue, track) => {
    console.log(`[DEBUG] playerStart: ${track.title} | source: ${track.source} | extractor: ${track.extractor?.identifier}`);
});

player.events.on('playerFinish', (queue, track) => {
    console.log(`[DEBUG] playerFinish: ${track.title}`);
});

player.events.on('playerSkip', (queue, track) => {
    console.log(`[DEBUG] playerSkip: ${track.title} - reason: track could not be streamed`);
    const channel = queue.metadata?.channel;
    if (channel) {
        channel.send(`⏭️ Canzone saltata (non riproducibile): **${track.title}**`);
    }
});

player.events.on('debug', (queue, message) => {
    console.log(`[Player-Debug] ${message}`);
});

// ─── INIZIALIZZAZIONE E LOGIN SEQUENZIALE ──────────────────────────────────────
(async () => {
    try {
        // Carica i comandi
        client.commands = new Collection();
        const commandsPath = path.join(__dirname, 'commands');
        if (!fs.existsSync(commandsPath)) fs.mkdirSync(commandsPath);

        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
                console.log(`[Commands] Caricato: /${command.data.name}`);
            } else {
                console.warn(`[WARNING] Il comando ${filePath} manca di 'data' o 'execute'.`);
            }
        }

        // Carica dinamicamente YoutubeiExtractor (modulo ESM)
        const { YoutubeiExtractor } = await import('discord-player-youtubei');
        await player.extractors.register(YoutubeiExtractor, {
            overrideBridgeMode: 'yt'
        });
        console.log('[Player] Estrattore YouTube (youtubei) caricato.');

        // Carica estrattori di default (Spotify, SoundCloud, ecc.)
        await player.extractors.loadMulti(DefaultExtractors);
        console.log('[Player] Estrattori di default caricati.');

        // ── OVERRIDE STREAM: usa yt-dlp per TUTTI gli estrattori (YouTube, Spotify, SoundCloud) ──
        for (const [id, extractor] of player.extractors.store) {
            const originalStream = extractor.stream.bind(extractor);
            extractor.stream = async function(track, options) {
                try {
                    console.log(`[YT-DLP] Avvio stream (${id}) per: ${track.title} - ${track.author}`);
                    const isExternal = track.url?.includes('spotify.com') || track.url?.includes('soundcloud.com') || track.source !== 'youtube';
                    const target = isExternal ? `ytsearch:${track.title} ${track.author}` : track.url;

                    // Ripristina la copertina HD se è il fallback generico di Spotify
                    if (!track.thumbnail || track.thumbnail.includes('twitter_card-default.jpg')) {
                        try {
                            const meta = await youtubeDl(target, { dumpSingleJson: true, noCheckCertificates: true, noWarnings: true });
                            const entry = meta.entries ? meta.entries[0] : meta;
                            if (entry && entry.thumbnail) {
                                track.thumbnail = entry.thumbnail;
                            }
                        } catch (e) {}
                    }

                    const ytdlp = youtubeDl.exec(target, {
                        output: '-',
                        format: 'bestaudio',
                        noCheckCertificates: true,
                        noWarnings: true,
                        quiet: true,
                    });

                    ytdlp.stdout.on('error', () => {});
                    ytdlp.on('error', (err) => console.error('[YT-DLP Error]', err.message));

                    console.log(`[YT-DLP] ✅ Stream avviato con successo per: ${track.title}`);
                    return {
                        stream: ytdlp.stdout,
                        type: 'arbitrary'
                    };
                } catch (err) {
                    console.error('[YT-DLP] Errore, fallback a estrattore originale:', err.message);
                    return originalStream(track, options);
                }
            };
        }
        console.log('[Player] ✅ Override stream yt-dlp attivato per TUTTI gli estrattori (YouTube, Spotify, SoundCloud).');

        // Esegui login solo DOPO che gli estrattori e i comandi sono pronti
        await client.login(process.env.DISCORD_TOKEN);
    } catch (err) {
        console.error('[Initialization Error]', err);
    }
})();
