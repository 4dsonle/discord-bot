const { Client, GatewayIntentBits } = require('discord.js');
const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const http = require('http');

// سيرفر بسيط لحفظ البوت شغال بدون توقف
http.createServer((req, res) => {
    res.write("Bot is online 24/7");
    res.end();
}).listen(process.env.PORT || 3000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const distube = new DisTube(client, {
    emitNewSongOnly: true,
    plugins: [new YtDlpPlugin()]
});

const PREFIX = '!';

client.on('ready', () => {
    console.log(`تم تشغيل البوت: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if (command === 'play' || command === 'p') {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.reply('ادخل روم صوتي أولاً!');

        const query = args.join(' ');
        if (!query) return message.reply('اكتب اسم الأغنية أو الرابط!');

        distube.play(voiceChannel, query, {
            textChannel: message.channel,
            member: message.member
        });
    }

    if (command === 'stop' || command === 'leave') {
        const queue = distube.getQueue(message);
        if (!queue) return message.reply('ما فيه تشغيل حالياً.');
        distube.stop(message);
        message.reply('تم إيقاف التشغيل والخروج.');
    }

    if (command === 'skip' || command === 's') {
        const queue = distube.getQueue(message);
        if (!queue) return message.reply('ما فيه أغنية شغالة.');
        try {
            await distube.skip(message);
            message.reply('تم التخطي.');
        } catch (e) {
            message.reply('ما فيه أغنية ثانية بالقائمة.');
        }
    }
});

distube.on('playSong', (queue, song) => {
    queue.textChannel.send(`🎶 شغال الحين: **${song.name}** - \`${song.formattedDuration}\``);
});

client.login(process.env.TOKEN);
