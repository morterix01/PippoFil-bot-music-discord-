// ─── OPTIMIZATION: V8 Memory Limit per Hosting Low-RAM ─────────────────────
const v8 = require('v8');
v8.setFlagsFromString('--max_old_space_size=256');

// ─── POLYFILL: Web Crypto API per Node 18 ───────────────────────────────────
if (!globalThis.crypto) {
    globalThis.crypto = require('crypto').webcrypto;
}

require('dotenv').config();

const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
const { Player } = require('discord-player');
const { DefaultExtractors } = require('@discord-player/extractor');
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

// Inizializza discord-player
const player = new Player(client, {
    skipFFmpeg: false,
});

// Carica gli estrattori (YouTube, Spotify, SoundCloud, ecc.)
(async () => {
    // Carica dinamicamente YoutubeiExtractor (modulo ESM)
    const { YoutubeiExtractor } = await import('discord-player-youtubei');
    await player.extractors.register(YoutubeiExtractor, {
        overrideBridgeMode: 'yt'
    });
    console.log('[Player] Estrattore YouTube (youtubei) caricato.');

    // Poi registra gli estrattori di default (Spotify, SoundCloud, Apple Music, ecc.)
    await player.extractors.loadMulti(DefaultExtractors);
    console.log('[Player] Estrattori di default caricati.');
})().catch(err => {
    console.error('[Player] Errore nel caricamento estrattori:', err);
});

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

// ─── EVENTI DISCORD ────────────────────────────────────────────────────────────

client.once('ready', () => {
    console.log(`\n✅ Bot online! Loggato come ${client.user.tag}`);
    console.log(`📋 Comandi caricati: ${client.commands.size}`);
    client.user.setActivity('🎵 /play per la musica', { type: 2 });
});

client.on('interactionCreate', async interaction => {
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

    const embed = new EmbedBuilder()
        .setColor(0x1DB954)
        .setTitle('🎵 In Riproduzione')
        .setDescription(`**[${track.title}](${track.url})**`)
        .addFields(
            { name: '👤 Artista', value: track.author || 'Sconosciuto', inline: true },
            { name: '⏱️ Durata', value: track.duration || 'N/A', inline: true },
            { name: '🔊 Richiesto da', value: track.requestedBy?.toString() || 'N/A', inline: true },
        )
        .setThumbnail(track.thumbnail)
        .setFooter({ text: `Fonte: ${track.source || 'N/A'}` })
        .setTimestamp();

    channel.send({ embeds: [embed] });
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
    const channel = queue.metadata?.channel;
    if (channel && error.message !== 'Aborted') {
        channel.send(`❌ Errore del player: ${error.message}`);
    }
});

player.events.on('playerError', (queue, error) => {
    console.error(`[PlayerError - Audio] ${error.message}`);
});

// Esegui login
client.login(process.env.DISCORD_TOKEN);
