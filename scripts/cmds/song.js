// song.js
// 🎵 Play or download YouTube songs
// Author: Helal (Credit Locked 🔒)

const axios = require('axios');
const yts = require("yt-search");

// 🔒 Credit Lock Setup
const LOCKED_AUTHOR = "Helal";

// Function to fetch API URL
const baseApiUrl = async () => {
    try {
        const response = await axios.get(
            'https://raw.githubusercontent.com/Mostakim0978/D1PT0/main/baseApiUrl.json'
        );
        return response.data.api;
    } catch (error) {
        throw new Error('Failed to fetch API URL.');
    }
};

// Global API setup
(async () => {
    global.apis = {
        diptoApi: await baseApiUrl()
    };
})();

// Helper: get stream data and save file
async function getStreamFromURL(url, pathName) {
    try {
        const response = await axios.get(url, {
            responseType: "stream"
        });
        response.data.path = pathName;
        return response.data;
    } catch (err) {
        throw err;
    }
}

// Global utility function setup
global.utils = {
    ...global.utils,
    getStreamFromURL: global.utils?.getStreamFromURL || getStreamFromURL
};

// Helper: extract YouTube video ID
function getVideoID(url) {
    const checkurl = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;
    const match = url.match(checkurl);
    return match ? match[1] : null;
}

// Command config
const config = {
    name: "play",
    author: "Helal", // 🔒 Must stay Helal
    version: "1.3.0",
    role: 0,
    hasPermssion: 0,
    description: "Play or download YouTube songs",
    usePrefix: true,
    category: "music",
    cooldowns: 5
};

// Command execution
async function onStart({ api, args, event }) {
    try {
        // 🔒 Credit Lock Check
        if (config.author !== LOCKED_AUTHOR) {
            return api.sendMessage(
                "🚫 This command is credit-locked and cannot run because the author name was modified.",
                event.threadID
            );
        }

        let videoID;
        const url = args[0];
        let waitingMsg;

        if (url && (url.includes("youtube.com") || url.includes("youtu.be"))) {
            videoID = getVideoID(url);
            if (!videoID) {
                return api.sendMessage("❌ Invalid YouTube URL.", event.threadID, event.messageID);
            }
        } else {
            const songName = args.join(' ');
            waitingMsg = await api.sendMessage(`🔎 Searching for "${songName}"...`, event.threadID);
            const searchResult = await yts(songName);
            const videos = searchResult.videos.slice(0, 50);

            if (videos.length === 0) {
                return api.sendMessage("❌ No videos found for that search term.", event.threadID, event.messageID);
            }

            const videoData = videos[Math.floor(Math.random() * videos.length)];
            videoID = videoData.videoId;
        }

        const { data: { title, quality, downloadLink } } = await axios.get(`${global.apis.diptoApi}/ytDl3?link=${videoID}&format=mp3`);

        if (waitingMsg?.messageID) {
            api.unsendMessage(waitingMsg.messageID);
        }

        const shortenedLink = (await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(downloadLink)}`)).data;

        await api.sendMessage({
            body: `🎶 Title: ${title}\n📡 Quality: ${quality}\n\n📥 Download: ${shortenedLink}`,
            attachment: await global.utils.getStreamFromURL(downloadLink, `${title}.mp3`)
        }, event.threadID, event.messageID);

    } catch (e) {
        api.sendMessage(`❌ ${e.message || "An unexpected error occurred."}`, event.threadID, event.messageID);
    }
}

// Export
module.exports = {
    config,
    onStart,
    run: onStart
};