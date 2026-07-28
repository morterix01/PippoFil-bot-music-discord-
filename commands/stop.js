const { SlashCommandBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Ferma la musica, svuota la coda e disconnette il bot'),

    async execute(interaction) {
        const queue = useQueue(interaction.guild.id);

        if (!queue) {
            return interaction.reply({
                content: '❌ Non c\'è nessuna sessione musicale attiva!',
                ephemeral: true,
            });
        }

        queue.delete();
        return interaction.reply('⏹️ Musica fermata e coda svuotata! Alla prossima 👋');
    },
};
