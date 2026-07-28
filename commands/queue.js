const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Mostra la coda musicale attuale')
        .addIntegerOption(option =>
            option.setName('pagina')
                .setDescription('Numero di pagina della coda (default: 1)')
                .setMinValue(1)),

    async execute(interaction) {
        const queue = useQueue(interaction.guild.id);

        if (!queue || !queue.currentTrack) {
            return interaction.reply({
                content: '❌ Non c\'è nessuna canzone in riproduzione!',
                ephemeral: true,
            });
        }

        const page = interaction.options.getInteger('pagina') ?? 1;
        const pageSize = 10;
        const tracks = queue.tracks.toArray();
        const totalPages = Math.max(1, Math.ceil(tracks.length / pageSize));

        if (page > totalPages) {
            return interaction.reply({
                content: `❌ La pagina ${page} non esiste! Ci sono solo ${totalPages} pagine.`,
                ephemeral: true,
            });
        }

        const start = (page - 1) * pageSize;
        const pageTracks = tracks.slice(start, start + pageSize);

        const current = queue.currentTrack;
        const progress = queue.node.createProgressBar() || '▬▬▬▬▬▬▬▬▬▬';

        let queueList = '';
        if (pageTracks.length === 0) {
            queueList = '*Nessun\'altra canzone in coda.*';
        } else {
            queueList = pageTracks
                .map((t, i) => `\`${start + i + 1}.\` **${t.title}** — ${t.duration}`)
                .join('\n');
        }

        const embed = new EmbedBuilder()
            .setColor(0x5865F2) // Viola Discord
            .setTitle('🎶 Coda Musicale')
            .addFields(
                {
                    name: '▶️ In Riproduzione',
                    value: `**[${current.title}](${current.url})** — ${current.duration}\n${progress}`,
                },
                {
                    name: `📋 Prossime canzoni (Pagina ${page}/${totalPages})`,
                    value: queueList,
                },
            )
            .setThumbnail(current.thumbnail)
            .setFooter({ text: `Totale: ${tracks.length} canzoni in coda • Volume: ${queue.node.volume}%` })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};
