const { SlashCommandBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Mette in pausa la canzone in riproduzione'),

    async execute(interaction) {
        const queue = useQueue(interaction.guild.id);

        if (!queue || !queue.isPlaying()) {
            return interaction.reply({
                content: '❌ Non c\'è nessuna canzone in riproduzione!',
                ephemeral: true,
            });
        }

        if (queue.node.isPaused()) {
            return interaction.reply({
                content: '⚠️ La musica è già in pausa! Usa `/resume` per riprenderla.',
                ephemeral: true,
            });
        }

        queue.node.pause();
        return interaction.reply(`⏸️ Messa in pausa: **${queue.currentTrack.title}**\nUsa \`/resume\` per riprendere.`);
    },
};
