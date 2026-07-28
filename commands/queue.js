const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Mostra la lista d\'attesa (coda musicale)')
        .addIntegerOption(option =>
            option.setName('pagina')
                .setDescription('Numero di pagina della coda (default: 1)')
                .setMinValue(1)),

    async execute(interaction) {
        const queue = useQueue(interaction.guild.id);

        if (!queue || (!queue.currentTrack && queue.tracks.size === 0)) {
            const emptyEmbed = new EmbedBuilder()
                .setColor(0x1DB954)
                .setTitle('📜 Lista d\'Attesa Vuota')
                .setDescription('Non c\'è nessuna canzone in riproduzione o in coda al momento.\nAggiungi una canzone usando `/play`!')
                .setTimestamp();

            return interaction.reply({ embeds: [emptyEmbed], ephemeral: true });
        }

        const page = interaction.options?.getInteger('pagina') ?? 1;
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
        const progress = queue.node.createProgressBar() || '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬';
        const coverUrl = current?.thumbnail || current?.raw?.thumbnail || current?.raw?.album?.images?.[0]?.url;

        let queueList = '';
        if (pageTracks.length === 0) {
            queueList = '*Nessun\'altra canzone in coda dopo questa.*';
        } else {
            queueList = pageTracks
                .map((t, i) => `\`${start + i + 1}.\` **[${t.title}](${t.url})** — \`${t.duration}\` | *Richiesto da ${t.requestedBy?.username || 'Sconosciuto'}*`)
                .join('\n\n');
        }

        const embed = new EmbedBuilder()
            .setColor(0x1DB954)
            .setTitle(`📜 Lista d'Attesa (Coda Musicale)`)
            .setDescription(`**▶️ In Riproduzione Ora:**\n**[${current.title}](${current.url})**\n*di ${current.author}*\n${progress}\n\n─── **PROSSIMI BRANI IN CODA** (Pagina ${page}/${totalPages}) ───\n\n${queueList}`)
            .setFooter({ text: `Brani in coda: ${tracks.length} • Questo bot é stato creato da Luissrome in memoria di un suo caro amico` })
            .setTimestamp();

        if (coverUrl) {
            embed.setThumbnail(coverUrl);
        }

        return interaction.reply({ embeds: [embed] });
    },
};
