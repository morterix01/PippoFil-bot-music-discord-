const { SlashCommandBuilder } = require('discord.js');
const { useQueue, QueueRepeatMode } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Imposta la modalità di ripetizione')
        .addStringOption(option =>
            option.setName('modalita')
                .setDescription('Scegli la modalità di loop')
                .setRequired(true)
                .addChoices(
                    { name: '🚫 Disattivo', value: 'off' },
                    { name: '🔂 Ripeti canzone', value: 'track' },
                    { name: '🔁 Ripeti coda', value: 'queue' },
                    { name: '🔀 Autoplay (canzoni simili)', value: 'autoplay' },
                )),

    async execute(interaction) {
        const queue = useQueue(interaction.guild.id);

        if (!queue || !queue.isPlaying()) {
            return interaction.reply({
                content: '❌ Non c\'è nessuna canzone in riproduzione!',
                ephemeral: true,
            });
        }

        const mode = interaction.options.getString('modalita', true);

        const modeMap = {
            off:      { value: QueueRepeatMode.OFF,      label: '🚫 Loop disattivato' },
            track:    { value: QueueRepeatMode.TRACK,    label: '🔂 Loop canzone attivato' },
            queue:    { value: QueueRepeatMode.QUEUE,    label: '🔁 Loop coda attivato' },
            autoplay: { value: QueueRepeatMode.AUTOPLAY, label: '🔀 Autoplay attivato (canzoni simili)' },
        };

        const selected = modeMap[mode];
        queue.setRepeatMode(selected.value);

        return interaction.reply(`${selected.label}!`);
    },
};
