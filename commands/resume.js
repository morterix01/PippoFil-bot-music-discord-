const { SlashCommandBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Riprende la canzone messa in pausa'),

    async execute(interaction) {
        const queue = useQueue(interaction.guild.id);

        if (!queue) {
            return interaction.reply({
                content: '❌ Non c\'è nessuna sessione musicale attiva!',
                ephemeral: true,
            });
        }

        if (!queue.node.isPaused()) {
            return interaction.reply({
                content: '⚠️ La musica non è in pausa! Usa `/pause` per metterla in pausa.',
                ephemeral: true,
            });
        }

        queue.node.resume();
        return interaction.reply(`▶️ Ripresa: **${queue.currentTrack.title}**`);
    },
};
