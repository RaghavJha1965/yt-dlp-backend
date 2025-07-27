const express = require('express');
const ytdlp = require('yt-dlp-exec');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 5000;

// 🔍 Search YouTube
app.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Missing query' });

    try {
        const stdout = await ytdlp(`ytsearch10:${query}`, {
            dumpSingleJson: false,
            flatPlaylist: true,
            print: "%(id)s|%(title)s|%(duration_string)s|%(thumbnail)s"
        });

        const lines = stdout.trim().split('\n');
        const results = lines.map(line => {
            const [id, title, duration, thumbnail] = line.split('|');
            return { id, title, duration, thumbnail };
        });

        res.json(results);
    } catch (err) {
        console.error("Search error:", err);
        res.status(500).json({ error: "Search failed" });
    }
});

// ⬇️ Download video/audio
app.get('/download', async (req, res) => {
    const { id, type } = req.query;
    if (!id || !['mp3', 'mp4'].includes(type)) {
        return res.status(400).json({ error: 'Missing or invalid parameters' });
    }

    const filename = `${id}.${type}`;
    const filepath = path.join(__dirname, filename);

    // If file already exists, just serve it
    if (fs.existsSync(filepath)) {
        return res.download(filepath);
    }

    try {
        await ytdlp(`https://www.youtube.com/watch?v=${id}`, {
            format: type === 'mp3' ? 'bestaudio' : 'best',
            extractAudio: type === 'mp3',
            audioFormat: type === 'mp3' ? 'mp3' : undefined,
            output: filename
        });

        res.download(filepath, () => {
            setTimeout(() => fs.unlinkSync(filepath), 10000);
        });
    } catch (err) {
        console.error("Download error:", err);
        res.status(500).json({ error: "Download failed" });
    }
});

app.listen(PORT, () => console.log(`Backend running at http://localhost:${PORT}`));
