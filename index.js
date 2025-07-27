const express = require('express');
const ytdlp = require('yt-dlp-exec');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 5000;

// Input validation helpers
const validateVideoId = (id) => {
    return /^[a-zA-Z0-9_-]{11}$/.test(id);
};

const validateQuery = (query) => {
    return query && query.trim().length > 0 && query.trim().length <= 100;
};

// 🔍 Search YouTube
app.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!validateQuery(query)) {
        return res.status(400).json({ error: 'Invalid or missing query (max 100 characters)' });
    }

    try {
        const stdout = await ytdlp(`ytsearch10:${query}`, {
            flatPlaylist: true,
            print: '%(id)s|%(title)s|%(duration_string)s|%(thumbnail)s'
        });

        const lines = stdout.trim().split('\n');
        const results = lines.map(line => {
            const [id, title, duration, thumbnail] = line.split('|');
            return { id, title, duration, thumbnail };
        }).filter(result => result.id && result.title); // Filter invalid results

        res.json(results);
    } catch (err) {
        console.error('Search error:', err.message || err);
        res.status(500).json({ error: 'Search failed' });
    }
});

// ⬇️ Download video or audio
app.get('/download', async (req, res) => {
    const { id, type } = req.query;
    if (!id || !['mp3', 'mp4'].includes(type)) {
        return res.status(400).json({ error: 'Missing or invalid parameters' });
    }

    // Security: Validate video ID format
    if (!validateVideoId(id)) {
        return res.status(400).json({ error: 'Invalid video ID format' });
    }

    const ext = type === 'mp3' ? 'mp3' : 'mp4';
    const filename = `${id}.${ext}`;
    const filepath = path.join(__dirname, filename);

    if (fs.existsSync(filepath)) {
        const contentType = type === 'mp3' ? 'audio/mpeg' : 'video/mp4';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.download(filepath, err => {
            if (err) console.error('File download error:', err);
        });
    }

    const downloadOptions = {
        output: filename
    };

    if (type === 'mp3') {
        downloadOptions.extractAudio = true;
        downloadOptions.audioFormat = 'mp3';
    } else {
        downloadOptions.format = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4';
    }

    try {
        await ytdlp(`https://www.youtube.com/watch?v=${id}`, downloadOptions);

        // Verify file was created
        if (!fs.existsSync(filepath)) {
            throw new Error('File was not created after download');
        }

        const contentType = type === 'mp3' ? 'audio/mpeg' : 'video/mp4';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        res.download(filepath, err => {
            if (err) {
                console.error('File download error:', err);
                return;
            }

            // ⏱️ Delete file after 10 seconds
            setTimeout(() => {
                fs.unlink(filepath, err => {
                    if (err) console.error(`Error deleting ${filename}:`, err);
                    else console.log(`✅ Cleaned up: ${filename}`);
                });
            }, 10_000);
        });
    } catch (err) {
        console.error('Download error:', err.message || err);
        
        // Clean up partial file if it exists
        try {
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
                console.log(`🧹 Cleaned up partial file: ${filename}`);
            }
        } catch (cleanupErr) {
            console.error('Failed to clean up partial file:', cleanupErr);
        }
        
        res.status(500).json({ error: 'Download failed' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        endpoints: ['/search', '/download', '/health']
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`🚀 yt-dlp backend running at http://localhost:${PORT}`);
});
