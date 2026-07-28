const { SlashCommandBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Regola il volume del bot (0-100)')
        .addIntegerOption(option =>
            option.setName('valore')
                .setDescription('Volume da impostare (0 = muto, 100 = massimo)')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(100)),

    async execute(interaction) {
        const queue = useQueue(interaction.guild.id);

        if (!queue || !queue.isPlaying()) {
            return interaction.reply({
                content: '❌ Non c\'è nessuna canzone in riproduzione!',
                ephemeral: true,
            });
        }

        const volume = interaction.options.getInteger('valore', true);
        queue.node.setVolume(volume);

        const emoji = volume === 0 ? '🔇' : volume < 30 ? '🔈' : volume < 70 ? '🔉' : '🔊';
        const bar = '█'.repeat(Math.floor(volume / 10)) + '░'.repeat(10 - Math.floor(volume / 10));

        return interaction.reply(`${emoji} Volume impostato a **${volume}%**\n\`${bar}\``);
    },
};
