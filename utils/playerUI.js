const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * Genera l'interfaccia ricca "Now Playing" con pulsanti interattivi stilizzati
 */
function createNowPlayingUI(queue, track) {
    if (!queue || !track) return { embeds: [], components: [] };

    const isPaused = queue.node.isPaused();
    const volume = queue.node.volume;
    const queueLength = queue.tracks.size;
    const progress = queue.node.createProgressBar() || '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬';
    const timestamp = queue.node.getTimestamp();

    const loopModes = ['Off', '🔂 Brano', '🔁 Coda', '♾️ Autoplay'];
    const loopStatus = loopModes[queue.repeatMode] || 'Off';

    const embed = new EmbedBuilder()
        .setColor(0x1DB954)
        .setAuthor({ 
            name: queue.guild.name, 
            iconURL: queue.guild.iconURL() || undefined 
        })
        .setTitle('🎵 In Riproduzione')
        .setDescription(`**[${track.title}](${track.url})**\n*di ${track.author || 'Artista Sconosciuto'}*\n\n${progress}\n\`${timestamp?.current?.label || '0:00'} / ${track.duration || '0:00'}\``)
        .addFields(
            { name: '⏱️ Durata', value: `\`${track.duration || 'N/A'}\``, inline: true },
            { name: '📜 In Coda', value: `\`${queueLength} brani\``, inline: true },
            { name: '🔊 Volume', value: `\`${volume}%\``, inline: true },
            { name: '🔁 Loop Mode', value: `\`${loopStatus}\``, inline: true },
            { name: '🎤 Richiesto da', value: track.requestedBy?.toString() || 'N/A', inline: true },
        )
        .setThumbnail(track.thumbnail)
        .setFooter({ text: `Fonte: ${track.source || 'YouTube'} • PippoFil Bot` })
        .setTimestamp();

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('music_prev')
            .setEmoji('⏮️')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('music_pause_resume')
            .setEmoji(isPaused ? '▶️' : '⏸️')
            .setStyle(isPaused ? ButtonStyle.Success : ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('music_skip')
            .setEmoji('⏭️')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('music_stop')
            .setEmoji('⏹️')
            .setStyle(ButtonStyle.Danger)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('music_shuffle')
            .setEmoji('🔀')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('music_loop')
            .setEmoji('🔁')
            .setStyle(queue.repeatMode > 0 ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('music_voldown')
            .setEmoji('🔉')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('music_volup')
            .setEmoji('🔊')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('music_queue')
            .setEmoji('📜')
            .setStyle(ButtonStyle.Secondary)
    );

    return { embeds: [embed], components: [row1, row2] };
}

module.exports = { createNowPlayingUI };
