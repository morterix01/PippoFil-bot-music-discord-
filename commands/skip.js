const { SlashCommandBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Salta la canzone attuale')
        .addIntegerOption(option =>
            option.setName('numero')
                .setDescription('Salta N canzoni (default: 1)')
                .setMinValue(1)),

    async execute(interaction) {
        const queue = useQueue(interaction.guild.id);

        if (!queue || !queue.isPlaying()) {
            return interaction.reply({
                content: '❌ Non c\'è nessuna canzone in riproduzione!',
                ephemeral: true,
            });
        }

        const n = interaction.options.getInteger('numero') ?? 1;
        const current = queue.currentTrack;

        if (n === 1) {
            queue.node.skip();
            return interaction.reply(`⏭️ Saltata: **${current.title}**`);
        }

        // Salta N canzoni rimuovendo dalla coda
        const tracks = queue.tracks.toArray();
        const toRemove = Math.min(n - 1, tracks.length);
        for (let i = 0; i < toRemove; i++) {
            queue.node.remove(0);
        }
        queue.node.skip();

        return interaction.reply(`⏭️ Saltate **${n}** canzoni!`);
    },
};
