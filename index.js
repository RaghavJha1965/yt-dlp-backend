const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = 5000;

// 🔍 Search YouTube
app.get('/search', (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Missing query' });

    exec(`yt-dlp "ytsearch10:${query}" --print "%(id)s|%(title)s|%(duration_string)s|%(thumbnail)s"`, (err, stdout, stderr) => {
        if (err) return res.status(500).json({ error: stderr });

        const results = stdout
            .trim()
            .split('\n')
            .map(line => {
                const [id, title, duration, thumbnail] = line.split('|');
                return { id, title, duration, thumbnail };
            });

        res.json(results);
    });
});

// ⬇️ Download video/audio
app.get('/download', (req, res) => {
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

    const format = type === 'mp3' ? 'bestaudio' : 'best';
    const ext = type;

    const cmd = `yt-dlp -f ${format} --extract-audio --audio-format ${type} -o "${filename}" https://www.youtube.com/watch?v=${id}`;

    exec(cmd, (err) => {
        if (err) return res.status(500).json({ error: 'Download failed' });
        res.download(filepath, () => {
            // Optional: delete file after sending
            setTimeout(() => fs.unlinkSync(filepath), 10000);
        });
    });
});

app.listen(PORT, () => console.log(`Backend running at http://localhost:${PORT}`));
