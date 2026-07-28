const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useMainPlayer } = require('discord-player');
const YouTube = require('youtube-sr').default;
const ytdl = require('@distube/ytdl-core');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Riproduce una canzone da YouTube o Spotify')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Nome della canzone, URL YouTube o link Spotify')
                .setRequired(true)),

    async execute(interaction) {
        const player = useMainPlayer();
        const channel = interaction.member?.voice?.channel;

        if (!channel) {
            return interaction.reply({
                content: '❌ Devi essere in un canale vocale per usare questo comando!',
                ephemeral: true,
            });
        }

        let query = interaction.options.getString('query', true).trim();
        await interaction.deferReply();

        try {
            let targetQuery = query;

            // Se è un link YouTube o una ricerca testuale (non Spotify), usiamo youtube-sr per trovare l'URL pulito
            if (!query.includes('spotify.com')) {
                try {
                    const ytVideo = await YouTube.searchOne(query);
                    if (ytVideo && ytVideo.url) {
                        targetQuery = ytVideo.url;
                    }
                } catch (srErr) {
                    console.warn('[YouTube Search Warning]', srErr.message);
                }
            }

            const { track } = await player.play(channel, targetQuery, {
                nodeOptions: {
                    metadata: {
                        channel: interaction.channel,
                        requestedBy: interaction.user,
                    },
                    leaveOnEmptyCooldown: 30000,
                    leaveOnEmpty: true,
                    leaveOnEnd: false,
                    bufferingTimeout: 3000,
                    volume: 80,
                    async onBeforeCreateStream(track, source, _queue) {
                        try {
                            let streamUrl = track.url;
                            if (!streamUrl.includes('youtube.com') && !streamUrl.includes('youtu.be')) {
                                const searchRes = await YouTube.searchOne(`${track.title} ${track.author}`);
                                if (searchRes && searchRes.url) streamUrl = searchRes.url;
                            }
                            return ytdl(streamUrl, {
                                filter: 'audioonly',
                                highWaterMark: 1 << 25,
                                quality: 'highestaudio',
                            });
                        } catch (err) {
                            console.error('[Stream Extraction Error]', err);
                            return null;
                        }
                    },
                },
                requestedBy: interaction.user,
            });

            const embed = new EmbedBuilder()
                .setColor(0x1DB954)
                .setTitle('✅ Canzone aggiunta!')
                .setDescription(`**[${track.title}](${track.url})**`)
                .addFields(
                    { name: '👤 Artista', value: track.author || 'Sconosciuto', inline: true },
                    { name: '⏱️ Durata', value: track.duration || 'N/A', inline: true },
                )
                .setThumbnail(track.thumbnail)
                .setFooter({ text: `Richiesto da ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();

            return interaction.followUp({ embeds: [embed] });

        } catch (e) {
            console.error('[Play Error]', e);
            return interaction.followUp({
                content: `❌ Impossibile riprodurre: **${e.message}**\nVerifica che la canzone esista o prova con un altro link.`,
            });
        }
    },
};
