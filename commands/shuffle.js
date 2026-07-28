const { SlashCommandBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Mescola casualmente le canzoni nella coda'),

    async execute(interaction) {
        const queue = useQueue(interaction.guild.id);

        if (!queue || !queue.isPlaying()) {
            return interaction.reply({
                content: '❌ Non c\'è nessuna canzone in riproduzione!',
                ephemeral: true,
            });
        }

        if (queue.tracks.size < 2) {
            return interaction.reply({
                content: '⚠️ Ci vogliono almeno 2 canzoni in coda per mescolare!',
                ephemeral: true,
            });
        }

        queue.tracks.shuffle();
        return interaction.reply(`🔀 Coda mescolata! **${queue.tracks.size}** canzoni riordinate casualmente.`);
    },
};
