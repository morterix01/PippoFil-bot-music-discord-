const { SlashCommandBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Rimuove una canzone dalla coda tramite posizione')
        .addIntegerOption(option =>
            option.setName('posizione')
                .setDescription('Posizione nella coda (usa /queue per vedere i numeri)')
                .setRequired(true)
                .setMinValue(1)),

    async execute(interaction) {
        const queue = useQueue(interaction.guild.id);

        if (!queue || !queue.isPlaying()) {
            return interaction.reply({
                content: '❌ Non c\'è nessuna canzone in riproduzione!',
                ephemeral: true,
            });
        }

        const pos = interaction.options.getInteger('posizione', true);
        const tracks = queue.tracks.toArray();

        if (pos > tracks.length) {
            return interaction.reply({
                content: `❌ Posizione non valida! Ci sono solo **${tracks.length}** canzoni in coda.`,
                ephemeral: true,
            });
        }

        const removed = tracks[pos - 1];
        queue.node.remove(pos - 1);

        return interaction.reply(`🗑️ Rimossa dalla coda: **${removed.title}**`);
    },
};
