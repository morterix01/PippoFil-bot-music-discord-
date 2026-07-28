const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Mostra le informazioni sulla canzone in riproduzione'),

    async execute(interaction) {
        const queue = useQueue(interaction.guild.id);

        if (!queue || !queue.currentTrack) {
            return interaction.reply({
                content: '❌ Non c\'è nessuna canzone in riproduzione!',
                ephemeral: true,
            });
        }

        const track = queue.currentTrack;
        const progress = queue.node.createProgressBar() || '▬▬▬▬▬▬▬▬▬▬';
        const timestamp = queue.node.getTimestamp();

        const embed = new EmbedBuilder()
            .setColor(0x1DB954)
            .setTitle('🎵 In Riproduzione Ora')
            .setDescription(`**[${track.title}](${track.url})**`)
            .addFields(
                { name: '👤 Artista', value: track.author || 'Sconosciuto', inline: true },
                { name: '🎵 Fonte', value: track.source || 'N/A', inline: true },
                { name: '🔊 Volume', value: `${queue.node.volume}%`, inline: true },
                {
                    name: '⏱️ Progresso',
                    value: `${progress}\n\`${timestamp?.current?.label ?? '0:00'} / ${track.duration}\``,
                },
                {
                    name: '🔁 Loop',
                    value: queue.repeatMode === 0 ? 'Disattivo' :
                           queue.repeatMode === 1 ? '🔂 Canzone' :
                           queue.repeatMode === 2 ? '🔁 Coda' : 'N/A',
                    inline: true,
                },
                {
                    name: '📋 Coda',
                    value: `${queue.tracks.size} canzoni rimaste`,
                    inline: true,
                },
                {
                    name: '🎤 Richiesto da',
                    value: track.requestedBy?.toString() ?? 'N/A',
                    inline: true,
                },
            )
            .setThumbnail(track.thumbnail)
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};
