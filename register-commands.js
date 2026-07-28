const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });
const { REST, Routes } = require('discord.js');
const fs = require('fs');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');

if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        } else {
            console.log(`[WARNING] Il comando ${filePath} non ha 'data' o 'execute'.`);
        }
    }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`Iniziato il refresh di ${commands.length} comandi (slash).`);

        // Aggiorna globalmente i comandi (può richiedere fino a 1 ora per aggiornarsi su tutti i server discord, ma è globale).
        // Se vuoi aggiornare immediatamente per test, usa Routes.applicationGuildCommands(clientId, guildId)
        if (!process.env.CLIENT_ID) {
            console.error("ERRORE: Inserisci il CLIENT_ID nel file .env");
            return;
        }

        let data;
        if (process.env.GUILD_ID) {
            console.log(`Registrazione immediata nel server (Guild ID: ${process.env.GUILD_ID})...`);
            data = await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                { body: commands },
            );
            console.log(`Comandi registrati nel server con successo: ${data.length}`);
        } else {
            console.log("Registrazione globale in corso (può richiedere fino a 1 ora)...");
            data = await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands },
            );
            console.log(`Comandi registrati globalmente con successo: ${data.length}`);
        }
    } catch (error) {
        console.error(error);
    }
})();
