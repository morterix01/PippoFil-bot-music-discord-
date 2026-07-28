const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useMainPlayer, QueryType } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Cerca una canzone e scegli tra i risultati')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Nome della canzone da cercare')
                .setRequired(true)),

    async execute(interaction) {
        const player = useMainPlayer();
        const channel = interaction.member?.voice?.channel;

        if (!channel) {
            return interaction.reply({
                content: '❌ Devi essere in un canale vocale!',
                ephemeral: true,
            });
        }

        const query = interaction.options.getString('query', true);
        await interaction.deferReply();

        try {
            const searchResult = await player.search(query, {
                requestedBy: interaction.user,
            });

            if (!searchResult || !searchResult.tracks.length) {
                return interaction.followUp('❌ Nessun risultato trovato!');
            }

            const tracks = searchResult.tracks.slice(0, 5);

            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle(`🔍 Risultati per: "${query}"`)
                .setDescription(
                    tracks.map((t, i) =>
                        `**${i + 1}.** [${t.title}](${t.url}) — ${t.duration || 'N/A'} — *${t.author || 'Sconosciuto'}*`
                    ).join('\n\n')
                )
                .setFooter({ text: 'Rispondi con il numero (1-5) per scegliere, o "annulla" per uscire.' })
                .setTimestamp();

            await interaction.followUp({ embeds: [embed] });

            const filter = m => m.author.id === interaction.user.id &&
                ((!isNaN(m.content) && +m.content >= 1 && +m.content <= tracks.length) || m.content.toLowerCase() === 'annulla');

            const collector = interaction.channel.createMessageCollector({ filter, time: 30_000, max: 1 });

            collector.on('collect', async (msg) => {
                if (msg.content.toLowerCase() === 'annulla') {
                    return msg.reply('❌ Ricerca annullata.');
                }

                const chosen = tracks[parseInt(msg.content) - 1];
                try {
                    await player.play(channel, chosen.url, {
                        nodeOptions: {
                            metadata: {
                                channel: interaction.channel,
                                requestedBy: interaction.user,
                            },
                            leaveOnEmptyCooldown: 30000,
                            leaveOnEmpty: true,
                            leaveOnEnd: false,
                            volume: 80,
                        },
                        requestedBy: interaction.user,
                    });
                    msg.reply(`✅ Aggiunto: **${chosen.title}**`);
                } catch (e) {
                    msg.reply(`❌ Errore: ${e.message}`);
                }
            });

            collector.on('end', (collected) => {
                if (collected.size === 0) {
                    interaction.channel.send('⏰ Tempo scaduto per la selezione.');
                }
            });

        } catch (e) {
            console.error('[Search Error]', e);
            return interaction.followUp(`❌ Errore nella ricerca: ${e.message}`);
        }
    },
};
