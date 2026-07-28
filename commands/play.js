const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useMainPlayer } = require('discord-player');

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

        const query = interaction.options.getString('query', true);
        await interaction.deferReply();

        try {
            const { track } = await player.play(channel, query, {
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
                },
                requestedBy: interaction.user,
            });

            const embed = new EmbedBuilder()
                .setColor(0xFF0000) // Rosso YouTube
                .setTitle('✅ Canzone aggiunta!')
                .setDescription(`**[${track.title}](${track.url})**`)
                .addFields(
                    { name: '👤 Artista', value: track.author || 'Sconosciuto', inline: true },
                    { name: '⏱️ Durata', value: track.duration || 'N/A', inline: true },
                    { name: '🎵 Fonte', value: track.source || 'N/A', inline: true },
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
