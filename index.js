const express = require('express');
const ytdlp = require('yt-dlp-exec');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 5000;

// Rate limiting - simple in-memory store
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 120000; // 2 minutes (increased)
const MAX_REQUESTS_PER_WINDOW = 3; // Reduced further for cloud hosting

const checkRateLimit = (ip) => {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;
    
    if (!requestCounts.has(ip)) {
        requestCounts.set(ip, []);
    }
    
    const requests = requestCounts.get(ip);
    const validRequests = requests.filter(time => time > windowStart);
    requestCounts.set(ip, validRequests);
    
    if (validRequests.length >= MAX_REQUESTS_PER_WINDOW) {
        return false;
    }
    
    validRequests.push(now);
    return true;
};

// Input validation helpers
const validateVideoId = (id) => {
    return /^[a-zA-Z0-9_-]{11}$/.test(id);
};

const validateQuery = (query) => {
    return query && query.trim().length > 0 && query.trim().length <= 100;
};

// YouTube cookies (you'll need to update these periodically)
// For production, use environment variables instead of hardcoding
const YOUTUBE_COOKIES = {
    'CONSENT': process.env.YT_CONSENT || 'YES+cb.20231231-07-p0.en+FX+{}',
    'LOGIN_INFO': process.env.YT_LOGIN_INFO || '',
    'SID': process.env.YT_SID || '',
    'HSID': process.env.YT_HSID || '',
    'SSID': process.env.YT_SSID || '',
    'APISID': process.env.YT_APISID || '',
    'SAPISID': process.env.YT_SAPISID || '',
    '__Secure-1PSID': process.env.YT_SECURE_1PSID || '',
    '__Secure-3PSID': process.env.YT_SECURE_3PSID || ''
};

// Convert cookies object to string format
const getCookieString = () => {
    const validCookies = Object.entries(YOUTUBE_COOKIES)
        .filter(([key, value]) => value && value !== '')
        .map(([key, value]) => `${key}=${value}`);
    
    return validCookies.length > 0 ? validCookies.join('; ') : null;
};

// Create cookies file for yt-dlp
const createCookiesFile = () => {
    const validCookies = Object.entries(YOUTUBE_COOKIES)
        .filter(([key, value]) => value && value !== '');
    
    if (validCookies.length === 0) {
        return null;
    }
    
    const cookiesContent = validCookies
        .map(([key, value]) => `youtube.com\tTRUE\t/\tTRUE\t1735689600\t${key}\t${value}`)
        .join('\n');
    
    const cookiesFile = path.join(__dirname, 'cookies.txt');
    fs.writeFileSync(cookiesFile, cookiesContent);
    return cookiesFile;
};

// 🔍 Search YouTube
app.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!validateQuery(query)) {
        return res.status(400).json({ error: 'Invalid or missing query (max 100 characters)' });
    }

    // Rate limiting
    const clientIP = req.ip || req.connection.remoteAddress;
    if (!checkRateLimit(clientIP)) {
        return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }

    // Try primary search method
    try {
        const searchOptions = {
            flatPlaylist: true,
            print: '%(id)s|%(title)s|%(duration_string)s|%(thumbnail)s',
            // Simplified but effective anti-detection
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            referer: 'https://www.youtube.com/',
            // Minimal but effective headers
            addHeader: [
                'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language: en-US,en;q=0.5',
                'Accept-Encoding: gzip, deflate',
                'Connection: keep-alive'
            ],
            // Add cookies if available
            ...(getCookieString() && { cookies: getCookieString() }),
            // Conservative retry settings
            retries: 1,
            sleepInterval: 2
        };

        const stdout = await ytdlp(`ytsearch10:${query}`, searchOptions);

        const lines = stdout.trim().split('\n');
        const results = lines.map(line => {
            const [id, title, duration, thumbnail] = line.split('|');
            return { id, title, duration, thumbnail };
        }).filter(result => result.id && result.title);

        if (results.length > 0) {
            return res.json(results);
        }

        // If no results, try fallback method
        throw new Error('No results found, trying fallback');

    } catch (err) {
        console.error('Primary search failed:', err.message);
        
        // Try fallback search method
        try {
            console.log('Trying fallback search method...');
            
            const fallbackOptions = {
                flatPlaylist: true,
                print: '%(id)s|%(title)s|%(duration_string)s|%(thumbnail)s',
                // Even simpler options
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                // No additional headers
                retries: 0,
                noCheckCertificates: true
            };

            const stdout = await ytdlp(`ytsearch5:${query}`, fallbackOptions);

            const lines = stdout.trim().split('\n');
            const results = lines.map(line => {
                const [id, title, duration, thumbnail] = line.split('|');
                return { id, title, duration, thumbnail };
            }).filter(result => result.id && result.title);

            if (results.length > 0) {
                return res.json(results);
            }

            throw new Error('Fallback search also failed');

        } catch (fallbackErr) {
            console.error('Fallback search failed:', fallbackErr.message);
            
            // Handle specific YouTube errors
            if (err.message && err.message.includes('429')) {
                res.status(429).json({ error: 'YouTube rate limit exceeded. Please try again later.' });
            } else if (err.message && err.message.includes('Sign in to confirm')) {
                res.status(503).json({ error: 'YouTube requires authentication. Please try again later.' });
            } else if (err.message && err.message.includes('Failed to parse JSON')) {
                res.status(503).json({ error: 'YouTube search temporarily unavailable. Please try again later.' });
            } else {
                res.status(500).json({ error: 'Search failed - YouTube may be blocking requests' });
            }
        }
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

    // Rate limiting
    const clientIP = req.ip || req.connection.remoteAddress;
    if (!checkRateLimit(clientIP)) {
        return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
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

    // Try multiple download strategies
    const downloadStrategies = [
        // Strategy 1: Standard approach with cookies file
        {
            name: 'Standard with Cookies',
            options: {
                output: filename,
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                referer: 'https://www.youtube.com/',
                addHeader: [
                    'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language: en-US,en;q=0.5',
                    'Accept-Encoding: gzip, deflate',
                    'Connection: keep-alive'
                ],
                retries: 1,
                fragmentRetries: 1,
                sleepInterval: 3,
                maxSleepInterval: 5
            }
        },
        // Strategy 2: Minimal approach
        {
            name: 'Minimal',
            options: {
                output: filename,
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                retries: 0,
                noCheckCertificates: true,
                noWarnings: true
            }
        },
        // Strategy 3: Mobile approach
        {
            name: 'Mobile',
            options: {
                output: filename,
                userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
                referer: 'https://m.youtube.com/',
                addHeader: [
                    'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language: en-US,en;q=0.5',
                    'Accept-Encoding: gzip, deflate',
                    'Connection: keep-alive'
                ],
                retries: 1,
                sleepInterval: 2
            }
        },
        // Strategy 4: Invidious approach (alternative frontend)
        {
            name: 'Invidious',
            options: {
                output: filename,
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                referer: 'https://invidious.projectsegfau.lt/',
                addHeader: [
                    'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language: en-US,en;q=0.5',
                    'Accept-Encoding: gzip, deflate',
                    'Connection: keep-alive'
                ],
                retries: 1,
                sleepInterval: 2
            }
        }
    ];

    // Add cookies file to strategies that might benefit from it
    const cookiesFile = createCookiesFile();
    if (cookiesFile) {
        downloadStrategies[0].options.cookies = cookiesFile; // Standard strategy
        downloadStrategies[3].options.cookies = cookiesFile; // Invidious strategy
    }

    if (type === 'mp3') {
        downloadStrategies.forEach(strategy => {
            strategy.options.extractAudio = true;
            strategy.options.audioFormat = 'mp3';
            strategy.options.audioQuality = '192K';
        });
    } else {
        downloadStrategies.forEach(strategy => {
            strategy.options.format = 'best[height<=720]/best[ext=mp4]/best';
        });
    }

    // Try each strategy
    for (let i = 0; i < downloadStrategies.length; i++) {
        const strategy = downloadStrategies[i];
        
        try {
            console.log(`Trying download strategy ${i + 1}: ${strategy.name}`);
            
            await ytdlp(`https://www.youtube.com/watch?v=${id}`, strategy.options);

            // Verify file was created
            if (!fs.existsSync(filepath)) {
                throw new Error('File was not created after download');
            }

            console.log(`✅ Download successful with strategy: ${strategy.name}`);

            // Clean up cookies file if it exists
            const cookiesFile = path.join(__dirname, 'cookies.txt');
            if (fs.existsSync(cookiesFile)) {
                fs.unlinkSync(cookiesFile);
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

            return; // Success, exit the function

        } catch (err) {
            console.error(`Strategy ${strategy.name} failed:`, err.message);
            
            // Clean up partial file if it exists
            try {
                if (fs.existsSync(filepath)) {
                    fs.unlinkSync(filepath);
                    console.log(`🧹 Cleaned up partial file from ${strategy.name}: ${filename}`);
                }
            } catch (cleanupErr) {
                console.error('Failed to clean up partial file:', cleanupErr);
            }

            // If this is the last strategy, return error
            if (i === downloadStrategies.length - 1) {
                console.error('All download strategies failed');
                
                // Clean up cookies file if it exists
                const cookiesFile = path.join(__dirname, 'cookies.txt');
                if (fs.existsSync(cookiesFile)) {
                    fs.unlinkSync(cookiesFile);
                }
                
                // Handle specific YouTube errors
                if (err.message && err.message.includes('429')) {
                    res.status(429).json({ 
                        error: 'YouTube rate limit exceeded. Please try again later.',
                        note: 'This is common with cloud hosting. Consider using a VPN or proxy.',
                        solutions: [
                            'Add valid YouTube cookies via environment variables',
                            'Use a different hosting provider',
                            'Implement proxy rotation',
                            'Wait 2-3 minutes before retrying'
                        ]
                    });
                } else if (err.message && err.message.includes('Sign in to confirm')) {
                    res.status(503).json({ 
                        error: 'YouTube requires authentication. Please try again later.',
                        note: 'Add valid YouTube cookies to improve success rate.',
                        solutions: [
                            'Set YT_LOGIN_INFO, YT_SID, YT_HSID environment variables',
                            'Update cookies periodically (they expire)',
                            'Use a residential IP address',
                            'Consider using a different service'
                        ]
                    });
                } else {
                    res.status(500).json({ 
                        error: 'Download failed - YouTube may be blocking cloud server requests',
                        note: 'This is a known issue with cloud hosting providers.',
                        solutions: [
                            'Add YouTube cookies via environment variables',
                            'Use a VPN or proxy service',
                            'Host on a residential IP address',
                            'Consider alternative video sources'
                        ]
                    });
                }
            } else {
                // Wait before trying next strategy
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        endpoints: ['/search', '/download', '/health', '/status'],
        note: 'YouTube cookies may need to be updated periodically'
    });
});

// Status endpoint with more details
app.get('/status', (req, res) => {
    const activeRequests = Array.from(requestCounts.values()).reduce((sum, requests) => sum + requests.length, 0);
    
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        server: {
            nodeVersion: process.version,
            platform: process.platform,
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
            },
            uptime: Math.round(process.uptime()) + ' seconds'
        },
        rateLimiting: {
            activeRequests,
            maxRequestsPerWindow: MAX_REQUESTS_PER_WINDOW,
            windowSize: RATE_LIMIT_WINDOW / 1000 + ' seconds'
        },
        youtube: {
            cookiesConfigured: getCookieString() ? true : false,
            note: 'Cloud hosting IPs are often blocked by YouTube. Consider using a proxy or VPN.'
        },
        endpoints: {
            search: 'GET /search?q=<query>',
            download: 'GET /download?id=<video_id>&type=<mp3|mp4>',
            health: 'GET /health',
            status: 'GET /status'
        }
    });
});

// 404 handler - catch all unmatched routes
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`🚀 yt-dlp backend running at http://localhost:${PORT}`);
    console.log(`⚠️  Note: YouTube cookies may need to be updated for optimal performance`);
});
