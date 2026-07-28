const { SlashCommandBuilder } = require('discord.js');
const { useQueue } = require('discord-player');
const { createNowPlayingUI } = require('../utils/playerUI');

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

        const ui = createNowPlayingUI(queue, queue.currentTrack);
        return interaction.reply(ui);
    },
};
